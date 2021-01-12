import _ from 'lodash';
import {
  STORE_SAVE_KEY,
  AREA_CACHE_KEY,
} from '@/modules/default/first';
import DICT from './dict';


const CODE = {
  NOT_MODIFY_PASSWORD_ERROR: 10000,
};

const EVENT = {
  CAS_AUTH_401: 'CAS_AUTH_401',
  CAS_AUTH_403: 'CAS_AUTH_403',
  CAS_JUMP_AUTH: 'CAS_JUMP_AUTH',
  CAS_CALLBACK: 'CAS_CALLBACK',
  CAS_LOGOUT: 'CAS_LOGOUT',
};

const CONSTANTS = {
  ID_NUMBER_REGEX: /^\d{6}(\d{8})\d{3}[\dXx]$/, // 身份证号
  PHONE_REGEX: /^1[3-9]\d{9}$/, // 手机号
  ACCOUNT_REGEX: /^\d{8}$/, // 8位数字账号
  EVENT,
  DICT,
  STORE_SAVE_KEY,
  AREA_CACHE_KEY,
  PAGE_SIZE: 20,
  PAGE_SIZE_OPTION: ['20', '50', '100'],
  // 直接获取全部数据，会使用到。
  PAGE_SIZE_MAX: 9999,
  NOTIFICATION_DURATION: 10,
  CODE,
  MAX_COMPLEXITY: 300,
  INIT_COUNTDOWN: 60,
};

export { DICT };

export default CONSTANTS;
