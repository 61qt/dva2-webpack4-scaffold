import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'dva';
import styles from './index.less';

let addDebug = false;
if (__DEV__) {
  addDebug = true;
}
if (-1 < `${location.search || ''}`.indexOf('debug')) {
  addDebug = true;
}

const ignoreArr = [];
// 下面的不要删除，只允许注释，每次新增，都在这里新加，开发的时候不要同时改动同一行，避免冲突。
ignoreArr.push('某某系统的开发模式显示权限便于开发');
// ignoreArr.push('mse');
// ignoreArr.push('exam');
// ignoreArr.push('exam_m');
// ignoreArr.push('kde');
// ignoreArr.push('pse');
// ignoreArr.push('snom');
// ignoreArr.push('pm');
// ignoreArr.push('hse');
// ignoreArr.push('app');
// ignoreArr.push('cas');
// ignoreArr.push('library');
// ignoreArr.push('security');
// ignoreArr.push('duty');
// ignoreArr.push('duty_m');
// ignoreArr.push('asset');
// ignoreArr.push('asset_m');
// ignoreArr.push('payment');
// ignoreArr.push('health');
// ignoreArr.push('dict');
// ignoreArr.push('site_manage');
// ignoreArr.push('site_admin');
// ignoreArr.push('analysis');
// ignoreArr.push('message');
// ignoreArr.push('elective');
// ignoreArr.push('bi');
// ignoreArr.push('operation');
// ignoreArr.push('exam_alanysis');
// ignoreArr.push('board');
// ignoreArr.push('hse_enrollment');

export { ignoreArr };

const checkIsHasAuthCache = {};

export const AUTH_REG = new RegExp('[()（）0-9a-zA-Z./*_\u4e00-\u9fa5]+', 'g');

export function checkIsHasAuth({ auth = '', resource }) {
  if (!auth) {
    return false;
  }
  if (auth in checkIsHasAuthCache) {
    return checkIsHasAuthCache[auth];
  }

  if (_.isArray(auth) && 0 < auth.length) {
    const arrAuth = _.map(auth, ((item) => {
      return checkIsHasAuth({ auth: item, resource });
    }));

    return _.get(arrAuth, 'length') && arrAuth.every(item => !!item);
  }

  if (!_.isString(auth)) {
    return false;
  }

  // test H5配置管理 && account_applications.* && areas.pid && (createTeacherCourseRelation && abc) && true && false
  // currentAuth = true && true && true && (true && undefined) && true && false
  // test !H5配置管理 && abc
  // currentAuth = !true && undefined
  const currentAuth = auth.replace(AUTH_REG, (name) => {
    if ('true' === name || 'false' === name) {
      return name;
    }
    else {
      return `${_.get(resource, name)}`;
    }
  });
  let hasAccess = false;

  try {
    // eslint-disable-next-line
    hasAccess = new Function(`return !!(${currentAuth})`)();
  }
  catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('Access组件auth值不合法，请检查字符串是否符合判断表达式', auth, err);
    }
  }
  return hasAccess;

  // const replacedAuth = `${auth || ''}`.replace('!', '');
  // // 是否取反，不是的话就设置成 true。
  // let positiveAuth = true;
  // if (0 <= auth.indexOf('!')) {
  //   positiveAuth = false;
  // }

  // if (ignoreArr.includes(DEFINE_MODULE) && __DEV__) {
  //   // window.console.error('[@/npm/@edu_components_atom/access/index.js] 这里记得改回来！！！');
  //   if (auth.startsWith('!')) {
  //     checkIsHasAuthCache[auth] = false;
  //     return false;
  //   }
  //   else {
  //     checkIsHasAuthCache[auth] = true;
  //     return true;
  //   }
  // }

  // const hasAccess = _.get(resource, replacedAuth, false);

  // if ((hasAccess && positiveAuth) || (!hasAccess && !positiveAuth)) {
  //   // 情况一， 存在权限，而且是正权限。
  //   // 情况二，不存在权限，而且是反权限。
  //   checkIsHasAuthCache[auth] = true;
  //   return true;
  // }

  // // 非上面的情况，就是隐藏。
  // checkIsHasAuthCache[auth] = false;
  // return false;
}

@connect((state) => {
  return {
    resource: _.get(state, 'visitor.resource') || {},
  };
})
export default class Component extends React.PureComponent {
  static defaultProps = {
    // react props.children
    children: null,
    // 用户个人权限
    // resource: {},
    // 权限 key 或者 权限验证方法(目前丢弃了 权限验证方法 这个模式了，只能是 string 类型)
    auth: '',
    inlineElem: false,
  }

  // context 类型定义
  static childContextTypes = {
    auth: PropTypes.string,
  }

  constructor(props) {
    super(props);

    debugAdd('access', this);
    debugAdd(`access_${this.props.auth}`, this);
  }

  // react context 特定
  getChildContext() {
    return {
      auth: this.props.auth,
    };
  }

  render() {
    const { children, resource, auth = '' } = this.props;
    let isShow = false;

    if ('function' === typeof this.props.auth) {
      isShow = this.props.auth(resource) || false;
    }
    else {
      isShow = '!' !== auth && (!auth || checkIsHasAuth({ auth, resource }));
    }

    if (isShow) {
      if (React.isValidElement(children)) {
        if (this.props.inlineElem) {
          return <span data-auth={auth}>{ children }</span>;
        }
        return children;
      }

      if (!addDebug && _.isNull(children)) {
        return null;
      }

      return <span data-auth={auth}>{ children }</span>;
    }

    if (-1 < `${location.search || ''}`.indexOf('debug')) {
      addDebug = true;
    }

    if (!addDebug) {
      return null;
    }

    return (<span data-comment="auth-hide" className={`${__DEV__ ? styles.accessHiddenDev : styles.accessHidden}`} data-auth={auth}>{children}</span>);
  }
}
