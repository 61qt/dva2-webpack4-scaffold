import Qs from 'qs';
import _ from 'lodash';
import jQuery from 'jquery';

import moment from 'moment';
import { Modal } from 'antd';
import Cookies from 'js-cookie';
import User, { RootDomain, cookieOption, TOKEN_REMOVE_TOKEN_KEY, USER_IS_ADMIN_CACHE_NAME, IS_OPERATIONS_PLATFORM, BASE_TOKEN_NAME, OPERATION_PLATFORM_TOKEN_NAME } from '@/utils/user';

import formErrorMessageShow from '@/utils/form_error_message_show';
import CONSTANTS from '@/constants';
import download from '@/utils/download';
import { API_DOMAIN_WITH_PREFIX_AND_PROTOCOL, OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '@/services/_factory';

// 运营平台没有对应Admin登录入口，所以不用添加运营平台admin userType
const isAdminUser = [
  _.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER'),
  _.get(CONST_DICT, 'users.user_type.USER_TYPE_CITY'),
  _.get(CONST_DICT, 'users.user_type.USER_TYPE_DISTRICT'),
  _.get(CONST_DICT, 'users.user_type.USER_TYPE_SCHOOL'),
].includes(_.get(User.decodeToken(), 'user_type'));

// 清空本域下面的所有存储的信息
function cleanStorage() {
  const pre = User.pre;
  // 前缀为important_的storage，将不会被此代码清除
  const cacheForImportant = [];
  if (window.localStorage && localStorage.clear) {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (/important_/.test(key)) {
        cacheForImportant.push({
          key,
          value: window.localStorage.getItem(key),
        });
      }
    }
    localStorage.clear();
    // 执行恢复
    _.each(cacheForImportant, (item) => {
      window.localStorage.setItem(item.key, item.value);
    });
  }

  if (window.sessionStorage && sessionStorage.clear) {
    sessionStorage.clear();
  }

  for (const [k] of _.entries(Cookies.get())) {
    const CAN_NOT_REMOVE_TOKEN_KEY = IS_OPERATIONS_PLATFORM ? BASE_TOKEN_NAME : OPERATION_PLATFORM_TOKEN_NAME;
    if (![
      USER_IS_ADMIN_CACHE_NAME,
      CAN_NOT_REMOVE_TOKEN_KEY,
    ].includes(k)) {
      Cookies.remove(k, {
        path: '/',
      });
      Cookies.remove(k, {
        path: '/',
        domain: RootDomain,
      });
    }
  }

  if (pre) {
    User.pre = pre;
  }
  Cookies.set(TOKEN_REMOVE_TOKEN_KEY, moment().format('YYYY-MM-DD HH:mm:ss'), cookieOption);
}

function getClient() {
  let client = 'cas';

  const query = Qs.parse(window.location.search.replace(/^\?/, ''));
  if (query.client) {
    client = query.client;
  }
  else if (/DingTalk/ig.test(navigator.userAgent)) {
    client = 'dingtalk';
  }
  else if (/boardDebug/ig.test(navigator.userAgent)) {
    client = 'board_student';
  }

  return client;
}

// 监听全局提示请求状态 401 的事件，此时直接提醒是否重新授权
let modal401;
jQuery(window).on(CONSTANTS.EVENT.CAS_AUTH_401, (e, data) => {
  formErrorMessageShow(data);
  const closeModel = () => {
    if (modal401 && modal401.destroy) {
      modal401.destroy();
    }
  };

  closeModel();

  const onOk = () => {
    if (IS_OPERATIONS_PLATFORM) {
      return jQuery(window).trigger(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_LOGOUT);
    }
    jQuery(window).trigger(CONSTANTS.EVENT.CAS_LOGOUT);
  };

  const onCancel = () => {
    closeModel();
  };

  const refreshAuth = () => {
    if (IS_OPERATIONS_PLATFORM) {
      return jQuery(window).trigger(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_JUMP_AUTH);
    }
    jQuery(window).trigger(CONSTANTS.EVENT.CAS_JUMP_AUTH);
  };

  modal401 = Modal.confirm({
    title: '登录失效',
    content: (<div>
      <div>当前登录状态已经失效，请重新登录。</div>
      <div className={`ant-form-extra ${__DEV__ || User.pre ? '' : 'ant-hide'}`}>
        或者
        <a onClick={refreshAuth}>重新授权</a>
      </div>
    </div>),
    footer: null,
    okText: '重新登录',
    cancelText: '关闭',
    onOk,
    onCancel,
  });
});

// query example
// { code: 'cdoe', user_type: '1' }
jQuery(window).on(CONSTANTS.EVENT.CAS_THIRD_JUMP_AUTH_DINGDING, (e, query) => {
  const code = query.code;
  const thirdLogin = '/openLogin/dingding';
  // const callbackHref = window.location.search.replace(/&$/, '');
  if (!code) {
    // eslint-disable-next-line no-alert
    window.alert('必须传输 code 才能登录钉钉');
    return;
  }

  const restQuery = {
    ...Qs.parse(window.location.search.replace(/^\?/, '')),
    ...Qs.parse(query),
    client: getClient(),
  };

  // eslint-disable-next-line no-alert
  // window.alert(`event code: ${query.code}`);

  // const jumpUrl = `${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${thirdLogin}${callbackHref}&code=${code}`;
  const jumpUrl = `${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${thirdLogin}?${Qs.stringify(restQuery)}`;
  // eslint-disable-next-line no-alert
  // window.alert(`钉钉登录接口 CONSTANTS.EVENT.CAS_THIRD_JUMP_AUTH_DINGDING jumpUrl: ${jumpUrl}, OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL: ${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}`);
  // window.console.log(`CONSTANTS.EVENT.CAS_THIRD_JUMP_AUTH_DINGDING jumpUrl: ${jumpUrl}, OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL: ${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}`);

  // eslint-disable-next-line no-alert
  // alert(`jumpUrl: ${jumpUrl}`);
  return window.location.replace(jumpUrl);
});

jQuery(window).on(CONSTANTS.EVENT.CAS_THIRD_JUMP_AUTH, (e, data) => {
  let thirdLogin = '';
  if (_.get(CONST_DICT, 'socialites.type.TYPE_WECHAT') === data) {
    thirdLogin = '/openLogin/wechat_auth_redirect';
  }
  if (_.get(CONST_DICT, 'socialites.type.TYPE_QQ') === data) {
    thirdLogin = '/openLogin/qq_auth_redirect';
  }

  const callbackHref = window.location.search;
  const jumpUrl = `${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${thirdLogin}${callbackHref}&client=${getClient()}&operate=login`;
  return window.location.replace(jumpUrl);
});

// 监听全局提示需要授权的事件
jQuery(window).on(CONSTANTS.EVENT.CAS_JUMP_AUTH, () => {
  cleanStorage();

  let callbackHref = window.location.href;
  callbackHref = callbackHref.replace(/#*?&*?ctrl_d=([\d-]+)/ig, '').replace(/#$/ig, '').replace(/\?$/ig, '');
  let userType = 'user';
  if (isAdminUser && DEFINE_CAS_AUTO_JUMP_ADMIN_LOGIN_IF_IS_ADMIN_CACHE) {
    userType = 'admin';
  }
  // 管理员，就使用管理员登录
  else if ('app' === DEFINE_MODULE) {
    userType = 'admin';
  }

  // eslint-disable-next-line camelcase
  const redirect_uri = encodeURIComponent(callbackHref);
  // eslint-disable-next-line camelcase
  const jumpUrl = `${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${/\/$/.test(API_DOMAIN_WITH_PREFIX_AND_PROTOCOL) ? '' : '/'}redirect?client=${getClient()}&type=${userType}&redirect_uri=${redirect_uri}`;
  return window.location.replace(jumpUrl);
});

// 监听全局提示授权成功的事件
jQuery(window).on(CONSTANTS.EVENT.CAS_CALLBACK, () => {
  const jumpUrl = `${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${/\/$/.test(OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL) ? '' : '/'}authorize?client=${getClient()}&${window.location.search.replace(/^\?/, '')}`;
  return window.location.replace(jumpUrl);
});

// 监听全局退出的事件
jQuery(window).on(CONSTANTS.EVENT.CAS_LOGOUT, () => {
  cleanStorage();
  const origin = _.replace(window.location.origin, /\/$/, '');
  // 退出的时候，跳转到该系统的首页;如果是管理员，则强制条回admin_login登录界面
  const callbackHref = `${origin}/${DEFINE_WEB_PREFIX.replace(/^\/*/, '')}`;

  // eslint-disable-next-line camelcase
  const redirect_uri = encodeURIComponent(callbackHref);
  // eslint-disable-next-line camelcase
  const jumpUrl = `${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${/\/$/.test(API_DOMAIN_WITH_PREFIX_AND_PROTOCOL) ? '' : '/'}logout/redirect?client=${getClient()}&redirect_uri=${redirect_uri}`;

  if (DEFINE_LOGOUT_METHOD_POST_WITH_TOKEN_AUTH) {
    return download(jumpUrl, {
      token: User.token,
      api_token: User.token,
      format: 'api',
    }, {
      target: '_self',
    });
  }
  return window.location.replace(jumpUrl);
});

// 监听全局更新部门树的事件
jQuery(window).on(CONSTANTS.EVENT.DEPARTMENT_TREE_BUILD_FORCE, (e, options = { force: false }) => {
  const force = options.force;
  if (options && options.dispatch) {
    options.dispatch({
      type: 'department/tree',
      payload: { force },
    });
  }
});

// 监听全局更新组织架构树的事件
jQuery(window).on(CONSTANTS.EVENT.EDU_ARCHITECTURE_TREE_BUILD_FORCE, (e, options) => {
  if (options && options.dispatch) {
    options.dispatch({
      type: 'edu_architecture/tree',
      payload: { force: true },
    });
  }
});

// 监听全局更新书架的事件
jQuery(window).on(CONSTANTS.EVENT.BOOKSHELF_TREE_BUILD_FORCE, (e, options) => {
  if (options && options.dispatch) {
    options.dispatch({
      type: 'bookshelf/tree',
      payload: { force: true },
    });
  }
});

// 监听全局更新书类型的事件
jQuery(window).on(CONSTANTS.EVENT.BOOK_CATEGORY_TREE_BUILD_FORCE, (e, options) => {
  if (options && options.dispatch) {
    if (__DEV__ && __PROD__) {
      options.dispatch({
        type: 'book_category/tree',
        payload: { force: true },
      });
    }
  }
});


// 监听全局更新填报学校的事件
jQuery(window).on(CONSTANTS.EVENT.WISH_SCHOOL_TREE_BUILD_FORCE, (e, options) => {
  if (options && options.dispatch) {
    options.dispatch({
      type: 'wish_school/tree',
      payload: { force: true },
    });
  }
});

// 监听全局更新填报科目的事件
jQuery(window).on(CONSTANTS.EVENT.SUBJECT_TREE_BUILD_FORCE, (e, options) => {
  if (options && options.dispatch) {
    options.dispatch({
      type: 'subject/tree',
      payload: { force: true },
    });
  }
});

// fixme: 后面 download_task 完善后删除这个事件
// 监听全局下载的东西
jQuery(window).on(CONSTANTS.EVENT.DOWNLOAD_ASYNC, (e, options) => {
  const jobId = options.jobId;
  const remark = options.remark;
  const value = {
    t: moment().format('YYYY-MM-DD HH:mm:ss'),
    remark,
    jobId,
  };

  // 设置这个 job id ，有效期一天
  const key = `download_async_${jobId}`;
  Cookies.set(key, jobId, {
    path: '/',
    expires: 1,
  });
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  catch (error) {
    // do nothing
  }
});

// fixme: 后面 download_task 完善后删除这个事件
// 监听全局下载的东西进度更新
jQuery(window).on(CONSTANTS.EVENT.DOWNLOAD_ASYNC_PROCESS, (e, options) => {
  // window.console.log('CONSTANTS.EVENT.DOWNLOAD_ASYNC_PROCESS', CONSTANTS.EVENT.DOWNLOAD_ASYNC_PROCESS, 'options', options);
  const jobId = options.jobId;
  const key = `download_async_${jobId}`;
  let oldValue = {};
  try {
    oldValue = _.assign({}, JSON.parse(sessionStorage.getItem(key)));
  }
  catch (error) {
    // do nothing
  }

  const value = {
    ...oldValue,
    progress: options.progress,
    status: options.status,
    downloadUrl: options.download_url,
  };

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  catch (error) {
    // do nothing
  }
});

export default 'system_event_listener';
