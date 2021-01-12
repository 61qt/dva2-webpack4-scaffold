import jwtDecode from 'jwt-decode';
import moment from 'moment';
import Cookies from 'js-cookie';

// const TokenName = `jwtToken_${DEFINE_MODULE}`;
export const IS_OPERATIONS_PLATFORM = false;

export const BASE_TOKEN_NAME = `${DEFINE_PROJ}_jwtToken_${__DEFINE_DEV__ ? 'dev' : 'prod'}_edu_v1`;
export const OPERATION_PLATFORM_TOKEN_NAME = `operation_platform_${BASE_TOKEN_NAME}`;
export const TokenName = IS_OPERATIONS_PLATFORM ? OPERATION_PLATFORM_TOKEN_NAME : BASE_TOKEN_NAME;

// 这是 cookies 是后端用的，不能改动，只能是 pre
const PRE_DEBUG_NAME = 'pre';

const USER_IS_ADMIN_CACHE_NAME_SUBFIX = `USER_IS_ADMIN_CACHE_NAME_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;

export const USER_IS_ADMIN_CACHE_NAME = IS_OPERATIONS_PLATFORM ? `operation_platform_${USER_IS_ADMIN_CACHE_NAME_SUBFIX}` : `${USER_IS_ADMIN_CACHE_NAME_SUBFIX}`;

const TOKEN_SET_TIME_TOKEN_KEY_SUBFIX = `TokenSetTime_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;
export const TOKEN_SET_TIME_TOKEN_KEY = IS_OPERATIONS_PLATFORM ? `operation_platform_${TOKEN_SET_TIME_TOKEN_KEY_SUBFIX}` : `${TOKEN_SET_TIME_TOKEN_KEY_SUBFIX}`;

const TOKEN_REMOVE_TOKEN_KEY_SUBFIX = `tokenRemove_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;
export const TOKEN_REMOVE_TOKEN_KEY = IS_OPERATIONS_PLATFORM ? `operation_platform_${TOKEN_REMOVE_TOKEN_KEY_SUBFIX}` : `${TOKEN_REMOVE_TOKEN_KEY_SUBFIX}`;

const RootDomain = DEFINE_ROOT_DOMAIN;
// document.domain = RootDomain;
export {
  RootDomain,
};

const cookieOption = {
  expires: 300,
  path: '/',
};

if (RootDomain && -1 < document.domain.indexOf(RootDomain)) {
  cookieOption.domain = RootDomain;
}

const sessionCookieOption = {
  ...cookieOption,
};
delete sessionCookieOption.expires;

export {
  cookieOption,
};

// const UserInfoName = 'userInfo';

export class UserService {
  // get info() {
  //   if (this.id) {
  //     if (this.infoCache) {
  //       return this.infoCache;
  //     }
  //     return this.getInfo();
  //   }
  //   return {};
  // }

  // set info(info) {
  //   if (!this.setInfo(info)) {
  //     this.unsetInfo();
  //   }
  // }

  // 是否管理员的存储
  // eslint-disable-next-line class-methods-use-this
  get isAdminCache() {
    const flag = Cookies.get(USER_IS_ADMIN_CACHE_NAME) || false;
    return !!flag;
  }

  // eslint-disable-next-line class-methods-use-this
  set isAdminCache(value) {
    if (!value) {
      Cookies.remove(USER_IS_ADMIN_CACHE_NAME, sessionCookieOption);
    }
    else {
      Cookies.set(USER_IS_ADMIN_CACHE_NAME, value, sessionCookieOption);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  get pre() {
    const pre = Cookies.get(PRE_DEBUG_NAME) || false;
    return !!pre;
  }

  // eslint-disable-next-line class-methods-use-this
  set pre(value) {
    if (!value) {
      Cookies.remove(PRE_DEBUG_NAME, sessionCookieOption);
    }
    else {
      Cookies.set(PRE_DEBUG_NAME, value, sessionCookieOption);
    }
  }

  get token() {
    // if (this.tokenCache) {
    //   return this.tokenCache;
    // }
    return this.getToken(true);
  }

  set token(token) {
    if (null === token) {
      this.unsetToken();
    }
    else {
      this.setToken(token);
    }
  }

  get id() {
    const auth = this.decodeToken(this.token);
    return auth.id || '';
  }

  get openId() {
    const auth = this.decodeToken();
    return auth.openid || '';
  }

  get isAuthenticated() {
    return this.validTokenAuth();
  }

  getToken(force = false) {
    const token = Cookies.get(TokenName) || null;
    if (true === force) {
      return token;
    }

    if (this.validToken(token)) {
      return token;
    }

    return null;
  }

  setToken(token) {
    if ('string' === typeof token && token && true === this.validToken(token)) {
      // this.tokenCache = token;
      Cookies.set(TokenName, token, cookieOption);
      Cookies.set(TOKEN_SET_TIME_TOKEN_KEY, moment().format('YYYY-MM-DD HH:mm:ss'), cookieOption);
      Cookies.remove(TOKEN_REMOVE_TOKEN_KEY, cookieOption);
      return true;
    }

    return false;
  }

  unsetToken() {
    // this.tokenCache = null;
    Cookies.remove(TokenName, cookieOption);
    Cookies.set(TOKEN_REMOVE_TOKEN_KEY, moment().format('YYYY-MM-DD HH:mm:ss'), cookieOption);
    return true;
  }

  // getInfo() {
  //   const userInfoStr = Cookies.get(UserInfoName);
  //   let info = {};
  //   try {
  //     info = JSON.parse(userInfoStr);
  //   }
  //   catch (e) {
  //     info = {};
  //   }
  //   this.infoCache = info;
  //   return info;
  // }

  // setInfo(info) {
  //   if (info && info.id) {
  //     this.infoCache = info;
  //     Cookies.set(UserInfoName, JSON.stringify(info), {
  //       expires: 300,
  //       path: '/',
  //     });
  //     return true;
  //   }

  //   return false;
  // }

  // unsetInfo() {
  //   this.infoCache = null;
  //   Cookies.remove(UserInfoName);
  //   return true;
  // }

  decodeToken(token = this.token) {
    try {
      return jwtDecode(token);
    }
    catch (err) {
      return {};
    }
  }

  validToken(token = this.token, options = {}) {
    // offset 是提前了多久，默认提前 60 秒
    const offset = options.offset || 60;
    if (!token) {
      return false;
    }

    try {
      const { exp } = jwtDecode(token);
      const flag = moment().unix() < exp - offset;
      if (window.console && window.console.log && !flag) {
        window.console.log('try validToken flag', flag);
      }
      return flag;
    }
    catch (error) {
      if (window.console && window.console.log) {
        window.console.log('validToken false', error);
      }
      return false;
    }
  }

  validTokenAuth(token = this.token) {
    if (!this.validToken(token)) {
      return false;
    }

    const auth = this.decodeToken(token);
    return auth && 0 < auth.id;
  }

  getTokenOffset = ({ timestamps = moment().unix() }) => {
    return (timestamps - moment().unix());
  }

  clean() {
    // this.unsetInfo();
    this.unsetToken();
  }
}

export default new UserService();
