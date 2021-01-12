import _ from 'lodash';
import { notification } from 'antd';

import translator from './translate';

let notificationKey = '';

notification.config({
  placement: 'topRight',
  top: 64,
  duration: 10,
});

function formatMessage(msgArgs) {
  const msg = _.get(msgArgs, 'msg') || msgArgs;
  return (_.isString(msg) && 'Expired token' === msg) ? '密钥已过期' : msg;
}

function getMsgArr(errDataArgs, treeKeyArr = [], showKey = false) {
  let msgArr = [];
  for (const [k, v] of _.entries(errDataArgs)) {
    if (k && v) {
      const kTree = /^\d$/.test(k) ? `${_.join(treeKeyArr, '.')}[${k}]` : _.join(_.concat(treeKeyArr, k), '.');
      let tips = v;
      if (v && _.get(v, 'errors.length') && _.isArray(v.errors)) {
        tips = v.errors.map((elem) => {
          return elem.message || JSON.stringify(elem);
        }).join(';');
      }
      else if (_.isArray(tips)) {
        // 可能是深层次的嵌套，这种比较坑爹
        if (_.every(_.compact(tips), (elem) => {
          return _.isObject(_.get(elem, 'errors'));
        })) {
          msgArr = msgArr.concat(getMsgArr(tips, _.concat(treeKeyArr, k), showKey));
          tips = '';
        }
        else {
          tips = tips[0];
        }
      }

      if ('object' === typeof tips) {
        msgArr = msgArr.concat(getMsgArr(tips, _.concat(treeKeyArr, k), showKey));
      }
      else if (kTree && tips && __DEV__) {
        msgArr = msgArr.concat(`${kTree}: ${tips}`);
      }
      else if (kTree && tips && showKey) {
        msgArr = msgArr.concat(`${kTree}: ${tips}`);
      }
      else if (tips) {
        msgArr = msgArr.concat(tips);
      }
    }
  }
  return msgArr;
}

function transformErrorToStrArr({
  errors,
  keyTree,
  showKey,
}) {
  return _.map(errors, (elem) => {
    const message = elem.message || JSON.stringify(elem);
    return `${showKey ? `${keyTree || elem.field}: ` : ''}${message}`;
  });
}

// 获取从表单的错误提示的
function getMsgArrFromForm(errDataArgs, treeKeyArr = [], showKey = false) {
  let msgArr = [];
  for (const [k, v] of _.entries(errDataArgs)) {
    if (!k || !v) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const keyTree = _.join(_.concat(treeKeyArr, k), '.');
    let tips = v;
    if (_.get(v, 'errors.length') && _.isArray(v.errors)) {
      tips = transformErrorToStrArr({ errors: tips.errors, keyTree, showKey });
      msgArr = msgArr.concat(tips);
    }
    else if (_.isPlainObject(v)) {
      msgArr = msgArr.concat(getMsgArrFromForm(v, [keyTree], showKey));
    }
    else if (_.isArray(v)) {
      // 数组已经是 错误信息 的了
      const isInErrorInfo = _.some(v, (errDataArg) => {
        const errors = _.get(errDataArg, 'errors');
        if (errors && _.isArray(errors) && _.get(errors, '0.message')) {
          return true;
        }

        return false;
      });

      let args;
      if (isInErrorInfo) {
        args = _.map(v, (errDataArg, index) => {
          if (errDataArg) {
            return transformErrorToStrArr({ errors: errDataArg.errors, keyTree: `${keyTree}[${index}]`, showKey });
          }
        });
      }
      else {
        args = _.map(tips, (errDataArg, index) => {
          if (errDataArg) {
            return getMsgArrFromForm(errDataArg, [`${keyTree}.${index}`], showKey);
          }
        });
      }

      msgArr = msgArr.concat(_.flatten(args));
    }
  }

  return _.compact(msgArr);
}

function formErrorMessageShow(rej, options = {}) {
  const ignoreModuleArrOfMobile = ['cas'];
  if (/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent) && !_.includes(ignoreModuleArrOfMobile, DEFINE_MODULE)) {
    return;
    // console.info("移动端");
    // window.location.href = "app/index.html";
  }

  notification.close(notificationKey);

  let { duration = 10 } = options;
  const { translateDict = {}, showKey = false } = options;
  _.assign(translateDict, {
    'Network Error': '网络已断开',
  });

  if (__DEV__) {
    duration = 120;
  }

  const key = `${Math.random}`;
  notificationKey = key;

  if (_.isString(rej)) {
    notification.warning({
      message: translator(formatMessage(rej), translateDict),
      key,
      duration,
    });
    return false;
  }

  if (_.isError(rej)) {
    let title = '系统语法错误';
    if (__DEV__) {
      title = '系统语法错误，请查看控制台';
    }
    if (_.get(rej, 'title')) {
      title = _.get(rej, 'title');
    }
    if (window.console && window.console.error) {
      window.console.error(rej);
    }
    notification.warning({
      message: translator(formatMessage(title), translateDict),
      key,
      description: (<div style={{ maxHeight: '100vh', overflow: 'auto' }}><pre>{translator(rej.stack || rej.message, translateDict)}</pre></div>),
      duration,
    });
    return false;
  }

  let errData = _.get(rej, 'data.errors[0]') || _.get(rej, 'data') || {};
  if (_.get(rej, 'data.errors[0].debugMessage')) {
    try {
      errData = JSON.parse(_.get(rej, 'data.errors[0].debugMessage'));
    }
    catch (e) {
      // do nothing
    }
  }

  let msgArr;
  // 有 rej code 就认为是服务器端的错误
  if (_.isNumber(_.get(rej, 'code'))) {
    msgArr = getMsgArr(errData, [], showKey);
  }
  else {
    msgArr = getMsgArrFromForm(errData, [], showKey);
  }

  let title = errData.message || _.isString(rej.msg) ? rej.msg : '系统提示';
  // 前端系统提示而且没有提示语，就不弹窗了
  if (0 === msgArr.length && '系统提示' === title) {
    notificationKey = '';
    return null;
  }
  // // TODO: 这个等周五演示完毕，就要删除
  // if (__PROD__ && _.includes(title, 'SQLSTATE')) {
  //   window.console.log('为了掩饰，去掉了这个警告');
  //   return;
  // }

  // if (__PROD__ && _.includes(title, '暂无权限')) {
  //   window.console.log('为了掩饰，去掉了这个警告');
  //   return;
  // }
  // // TODO: 这个等周五演示完毕，就要删除 end

  if (_.isString(title)) {
    title = title.substring(0, 10000);
  }

  const description = _.get(msgArr, 'length', '') ? (<div style={{ maxHeight: '100vh', overflow: 'auto' }}>
    <ol style={{ listStyle: 'decimal' }}>
      {
        msgArr.map((elem, index) => {
          return (<li key={index}>{translator(elem, translateDict)}</li>);
        })
      }
    </ol>
  </div>) : null;
  notification.warning({
    message: translator(formatMessage(title), translateDict),
    key,
    description,
    duration,
  });

  return false;
}

export const notificationClose = () => {
  notification && notification.close(notificationKey);
};

export default formErrorMessageShow;
