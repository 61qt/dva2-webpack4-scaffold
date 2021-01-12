import _ from 'lodash';
import jQuery from 'jquery';
import moment from 'moment';
import NP from 'number-precision';

import ServicesCommon from '@/services/common';
import CONSTANTS from '@/constants';
import User, { IS_OPERATIONS_PLATFORM } from '@/utils/user';
import formErrorMessageShow from '@/utils/form_error_message_show';
import {
  NetworkRequestFailedError,
  NetworkRequestOfflineError,
} from '@/utils/error_class';

// max_complexity 这个为 graphql 的最大查询复杂度，可以指定。最大1000，后端设置的。需要增加配置，get 或者 post 都行。

// 遍历对象，去掉浮点不精确的数值
function eachAttrFormatFloat(formatElem) {
  if ('number' === typeof formatElem) {
    if (_.isInteger(formatElem)) {
      return formatElem;
    }

    const match = `${formatElem}`.match(/\.(\d+)/);

    // 小数点后有大于8位(不包含8)就不要
    if (match && match[1] && match[1].length && 8 < match[1].length) {
      return NP.strip(formatElem);
    }

    // 总体长度超过16(不包含16)也不要了
    if (16 < `${formatElem}`.length) {
      return NP.strip(formatElem);
    }

    return formatElem;
  }

  if (_.isArray(formatElem)) {
    return _.map(formatElem, (elem) => {
      return eachAttrFormatFloat(elem);
    });
  }

  if (_.isObject(formatElem)) {
    const newObj = {};
    _.each(_.entries(formatElem), ([k, v]) => {
      newObj[k] = eachAttrFormatFloat(v);
    });
    return newObj;
  }

  return formatElem;
}

const networkDetection = {
  // 单个请求超过多少秒之后，显示当前网络有点慢。
  xhrTooSlowTimeoutConfig: 3 * 1000,
  // 是否太慢的标志。
  isTooSlow: false,
  // // 太慢了之后，计算开始快起来的速度的问题。
  // afterTooSlowCount: 0,
  // 用于存储每次请求的 timeout 的 promise ，用完之后清空。
  timeoutDetection: {},
  resetTooSlowToFalseTimeoutSave: {},
  // 若置为太慢，就多少秒之后自动变回不显示。
  resetTooSlowToFalseTimeout: 3 * 1000,
  tip: jQuery('<div class="network-too-slow-tip" id="network-too-slow-tip" style="display: none;position: fixed; bottom: 1.5rem; right: 50%; margin-right: -7em; z-index: 1; border-radius: 5px; padding: 6px 1rem; font-weight: lighter; background: rgba(0,0,0,.75); color: white; font-size: 13px;">正在加载中，请耐心等候...</div>'),
  // 延迟队列。
  deferredArr: [],
  // 延迟队列标志，更新状态。
  inRefreshingFlag: false,
};
// window.networkDetection = networkDetection;

if (!DEFINE_IS_MOBILE) {
  // 增加到 页面
  jQuery(document.body).append(networkDetection.tip);
}


function uuidFunc() {
  return `uuid_${moment().unix()}_${String(Math.random()).substr(2)}`;
}

// 请求完毕之后，延时处理优化显示网络过慢的内容。。
function cleanDetectTimeout(uuid) {
  const { resetTooSlowToFalseTimeoutSave, timeoutDetection } = networkDetection;
  resetTooSlowToFalseTimeoutSave[uuid] = setTimeout(() => {
    clearTimeout(resetTooSlowToFalseTimeoutSave[uuid]);
    delete resetTooSlowToFalseTimeoutSave[uuid];
    if (1 > Object.keys(resetTooSlowToFalseTimeoutSave || {}).length && 1 > Object.keys(timeoutDetection || {}).length) {
      networkDetection.isTooSlow = false;
      networkDetection.tip.hide();
    }
  }, networkDetection.resetTooSlowToFalseTimeout);
}

// 开始清空显示网络过慢的问题。
function clearNetworkTimeout(uuid) {
  const { timeoutDetection } = networkDetection;
  clearTimeout(timeoutDetection[uuid]);
  delete timeoutDetection[uuid];
  cleanDetectTimeout(uuid);
  return true;
}

// 创建时间处理的延时函数。
function makeTimeoutDetection(uuid) {
  const { timeoutDetection } = networkDetection;
  timeoutDetection[uuid] = setTimeout(() => {
    // window.console.log('timeoutDetection[uuid]', uuid, timeoutDetection[uuid]);
    networkDetection.isTooSlow = true;
    networkDetection.tip.show();
  }, networkDetection.xhrTooSlowTimeoutConfig);
}


export function responseSuccessInterceptor(response) {
  clearNetworkTimeout(response.uuid || _.get(response, 'config.uuid'));
  const { data } = response;

  jQuery(window).trigger('request', response);
  jQuery(window).trigger('httpFinish', response);

  const code = _.get(response, 'data.code');
  // 这个是图片上传那边的错误的。
  if (DEFINE_UPLOAD_PATH === _.get(response, 'config.url')) {
    if (_.get(data, 'files[0].error')) {
      // sentryUndershoot.capture(new UserRequestError(response), {
      //   ...response,
      // });
      return Promise.reject(data);
    }
    else if (0 !== code && undefined !== code) {
      return Promise.reject(data);
    }
    else {
      return data;
    }
  }
  else if (0 === code) {
    return data;
  }

  // 这个是没有定义 code 那边的，例如其他额外的接口。
  if (undefined === code) {
    return data;
  }

  if (401 === code) {
    // 未授权，需要授权的
    jQuery(window).trigger(CONSTANTS.EVENT.CAS_AUTH_401, data);
  }
  else if (403 === code) {
    // 无权限的，需要额外处理。
    jQuery(window).trigger(CONSTANTS.EVENT.CAS_AUTH_403, data);
  }

  else if (1000 === code) {
    // 无权限的，需要额外处理。
    window.console.log('response', response);
    // 接口返回错误 由页面提示，不需要记录sentry
    // sentryUndershoot.capture(new ServerRequestError(response), response);
    formErrorMessageShow({
      ...response.data,
      title: _.get(response, 'data.msg'),
    });
  }

  // sentryUndershoot.capture(new UserRequestError(response), {
  //   ...response,
  // });

  return Promise.reject(response.data);
}

export function responseFailInterceptor(config = {}) {
  clearNetworkTimeout(_.get(config, 'uuid') || _.get(config, 'config.uuid'));

  const duration = new Date() * 1 - config.startTime;
  const status = config.status;
  // if (404 === status) {
  //   return sentryUndershoot.capture(new NotFoundError(config), {
  //     ...config,
  //   });
  // }

  // 进行错误捕抓忽略判断。
  const ignoreStrArr = [
    'Token has expired and can no longer be refreshed',
  ];
  let retJsonString = '';
  let findFlag = false;
  if (config) {
    retJsonString = `${config.responseText || ''}`;
    _.each(ignoreStrArr, (elem) => {
      if (-1 < retJsonString.indexOf(elem)) {
        window.console.log('elem', elem);
        findFlag = true;
      }
    });
    if (findFlag) {
      window.console.log('findFlag', findFlag);
      return;
    }
  }

  if (400 <= status && 500 > status) {
    if (config.url.endsWith('/login')) {
      // 登录错误的 ，不处理。
    }
    else {
      try {
        const exp = User.decodeToken().exp;
        const now = moment().unix();
        if (window.console && window.console.log) {
          window.console.log('request ', status, ', config is', JSON.stringify(config), 'document.cookie is', document.cookie, ' . token is ', User.token, 'now is', now, 'exp is', exp, 'offset (exp - now) is', exp - now);
        }
      }
      catch (e) {
        // nothing to do
      }
      // sentryUndershoot.capture(new UserRequestError(config), config);
    }
  }
  else if (500 <= status && 600 > status) {
    // sentryUndershoot.capture(new ServerRequestError(config), config);
  }
  else if (0 === status) {
    if (window.console && window.console.log) {
      // 输出请求的时间。
      window.console.log('request status === 0, duration is ', duration);
    }

    if (50 > duration) {
      const newError = new NetworkRequestOfflineError(config);
      newError.title = '网络连接已经断开，请检查网络。';
      setTimeout(() => {
        formErrorMessageShow(newError, {
          capture: false,
        });
      }, 100);
      // sentryUndershoot.capture(newError, config);
    }
    else {
      const newError = new NetworkRequestFailedError(config);
      newError.title = '网络繁忙，请稍后重试';
      setTimeout(() => {
        formErrorMessageShow(newError, {
          capture: false,
        });
      }, 100);
      // sentryUndershoot.capture(newError, config);
    }
  }
  // else {
  //   // 未知的错误。
  //   sentryUndershoot.capture(new RequestUncatchError(config), config);
  // }

  return Promise.reject(_.get(config, 'response.data') || _.get(config, 'response') || {
    msg: config.message,
    ...config,
  });
}

export function requestInterceptor(config) {
  // eslint-disable-next-line no-param-reassign
  config.uuid = uuidFunc();
  // eslint-disable-next-line no-param-reassign
  config.startTime = new Date() * 1;
  let url = `${config.url || ''}`;

  let configDataStr = '';
  if (_.isString(config.data)) {
    configDataStr = config.data;
  }
  else if (_.isObject(config.data)) {
    configDataStr = JSON.stringify(config.data);
  }
  if (configDataStr && 'post' === config.method && _.includes(url, DEFINE_GRAPHQL_PATH) && _.includes(configDataStr, '"query":"')) {
    const match = configDataStr.match(/"query":"([^\s]+)\s[^{]+{(\\n)?\s+([^\s]+)\s/);
    const graphqlType = _.get(match, '1');
    const graphqlTypeScheme = _.get(match, '3');
    if (match && graphqlType && graphqlTypeScheme) {
      const query = `gc=${graphqlTypeScheme}&gt=${graphqlType}`;
      if (_.includes(url, '?')) {
        url = `${url}&${query}`;
      }
      else {
        url = `${url}?${query}`;
      }
    }
  }

  // form表单全局数字精度修复
  if (_.isObject(config.data)) {
    // eslint-disable-next-line no-param-reassign
    config.data = eachAttrFormatFloat(config.data);
  }
  else if (config.data && _.isString(config.data)) {
    try {
      const formatData = JSON.parse(config.data);
      const newFormatObject = eachAttrFormatFloat(formatData);
      // eslint-disable-next-line no-param-reassign
      config.data = JSON.stringify(newFormatObject);
    }
    // eslint-disable-next-line no-empty
    catch (error) { }
  }
  // ---- end ----

  // eslint-disable-next-line no-param-reassign
  config.url = url
    .replace(/\/+/ig, '/')
    .replace(/\/([?#])/ig, '$1')
    .replace(/\/$/ig, '')
    .replace(/^([^:]+):\/+/, '$1://')
    .replace(/^\//, /^\/\/[^/]/.test(url) ? '//' : '/');

  const noTokenMsgData = {
    msg: '没有密钥，用户已经退出',
    data: {},
    status_code: 0,
    code: 9000,
  };

  // const noTokenRejData = {
  //   ...config,
  //   config,
  //   data: {
  //     data: noTokenMsgData,
  //   },
  // };

  if (config.headers && 'Content-Type' in config.headers) {
    // eslint-disable-next-line no-param-reassign
    config.headers['Content-Type'] = config.headers['Content-Type'];
    if (!config.headers['Content-Type']) {
      // eslint-disable-next-line no-param-reassign
      delete config.headers['Content-Type'];
    }
  }
  else {
    // eslint-disable-next-line no-param-reassign
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  let configData = {};
  try {
    if (_.isObject(config.data)) {
      configData = config.data;
    }
    else if (_.isString(config.data)) {
      configData = JSON.parse(config.data);
    }
    if (!_.isEmpty(configData) && !configData.max_complexity) {
      if (__DEV__) {
        // 开发模式，设置最大300的请求
        configData.max_complexity = 500;
        // eslint-disable-next-line no-param-reassign
        config.data = JSON.stringify(configData);
      }
      else {
        // 生产模式，设置最大1000的请求
        configData.max_complexity = 1000;
        // eslint-disable-next-line no-param-reassign
        config.data = JSON.stringify(configData);
      }
    }
  }
  catch (error) {
    // do nothing
  }

  if (User.token && !config.skipAuthorization) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${User.token}`;
  }
  else if (!User.token && !config.skipAuthorization) {
    // 这里应该退出了，应该跳到登录页面
    if (window.console && window.console.error) {
      window.console.error('没有 token 的 http 请求，也没有配置跳过权限');
      window.console.log('config', JSON.stringify(config));
    }

    // return Promise.reject(noTokenRejData);
    return Promise.reject();
  }

  // 调试强制
  if (window.forceRejectRequest) {
    window.forceRejectRequest = false;
    // return Promise.reject(noTokenRejData);
    return Promise.reject(noTokenMsgData);
  }

  // 判断，写多几个，方便阅读。
  if (!User.token || config.skipAuthorization || config.skipExpireCheck) {
    // 不需要更新 token 或者不需要带上 token 。直接请求。
    makeTimeoutDetection(config.uuid);
    return Promise.resolve(config);
  }

  function makeDeferRequest() {
    makeTimeoutDetection(config.uuid);
    return new Promise((resolve, reject) => {
      const deferRequest = (newConfig) => {
        setTimeout(() => {
          resolve(newConfig);
          _.defaultsDeep(newConfig, config);
        }, 50);
      };

      // 全局存储已经暂缓的 xhr
      networkDetection.deferredArr.push({
        config,
        deferRequest,
        deferRequestReject: reject,
      });
    });
  }

  // 刷新中，需要暂缓处理 xhr
  if (networkDetection.inRefreshingFlag) {
    // 需要更新 token ，队列延迟
    if (window.console && window.console.log) {
      window.console.log('in refresh ing', User.token);
    }
    return makeDeferRequest();
  }

  // 需要先判断是不是需要更新 token 。
  if (window.forceRefreshToken || !User.validToken()) {
    networkDetection.inRefreshingFlag = true;
    // 需要更新 token
    if (window.console && window.console.log) {
      window.console.log('need to refresh token, token is', User.token);
    }

    let refreshToken = ServicesCommon.refreshToken;

    if (IS_OPERATIONS_PLATFORM) {
      refreshToken = ServicesCommon.refreshOperationsToken;
    }

    refreshToken().then((res) => {
      window.forceRefreshToken = false;
      const { data } = res;
      // 使用新的 token 覆盖 headers 原本的 token。
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${data.token}`;
      // let tokenOffset = User.getTokenOffset(data);
      // if (data.timestamps) {
      //   tokenOffset = User.getTokenOffset({ ...data });
      // }
      User.token = data.token;
      networkDetection.inRefreshingFlag = false;
      setTimeout(() => {
        while (0 < networkDetection.deferredArr.length) {
          const { deferRequest } = networkDetection.deferredArr.shift();
          if ('function' === typeof deferRequest) {
            deferRequest({
              headers: {
                Authorization: `Bearer ${data.token}`,
              },
            });
          }
        }
      }, 1);
    }).catch((rej) => {
      networkDetection.inRefreshingFlag = false;
      setTimeout(() => {
        while (networkDetection.deferredArr.length) {
          const deferRequestElem = networkDetection.deferredArr.shift();
          if ('function' === typeof deferRequestReject) {
            deferRequestElem.deferRequestReject({
              ...deferRequestElem.config,
              data: rej,
            });
          }
        }
      }, 1);
      formErrorMessageShow(rej);
      // 切换回登录页面。
      setTimeout(() => {
        if (IS_OPERATIONS_PLATFORM) {
          return jQuery(window).trigger(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_JUMP_AUTH);
        }
        jQuery(window).trigger(CONSTANTS.EVENT.CAS_JUMP_AUTH);
      }, 2000);
      return rej;
    });
    return makeDeferRequest();
  }

  // 最终情况。直接请求
  makeTimeoutDetection(config.uuid);
  return Promise.resolve(config);
}

