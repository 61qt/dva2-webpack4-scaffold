import _ from 'lodash';
import jQuery from 'jquery';
import moment from 'moment';
import NP from 'number-precision';
import { API_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '@/utils/http';

export const CONST_DICT_TOKEN_KEY = `CONST_DICT_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;
export const EDITABLE_DICT_TOKEN_KEY = `EDITABLE_DICT_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;
export const AREA_CACHE_KEY = `AREA_CACHE_V3_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;
export const STORE_SAVE_KEY = `STORE_SAVE_KEY_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;

window.NP = NP;

function buildDictProp(dict) {
  if (_.isArray(dict)) {
    _.each(dict, (elem) => {
      if (elem && elem.key) {
        Object.defineProperty(dict, elem.key, {
          value: elem.value,
          enumerable: false,
          configurable: false,
          writable: false,
        });
      }
    });
  }
  else if (_.isObject(dict)) {
    _.each(_.entries(dict), (elem) => {
      buildDictProp(elem[1]);
    });
  }
}

function buildDict() {
  if (!window.CONST_DICT) {
    let CONST_DICT = {};
    try {
      CONST_DICT = JSON.parse(localStorage.getItem(CONST_DICT_TOKEN_KEY));
    }
    catch (err) {
      CONST_DICT = {};
    }
    window.CONST_DICT = CONST_DICT;
  }
  else {
    try {
      localStorage.setItem(CONST_DICT_TOKEN_KEY, JSON.stringify(window.CONST_DICT));
    }
    catch (err) {
      // do nothing
    }
  }

  if (!window.EDITABLE_DICT) {
    let EDITABLE_DICT = {};
    try {
      EDITABLE_DICT = JSON.parse(localStorage.getItem(EDITABLE_DICT_TOKEN_KEY));
    }
    catch (err) {
      EDITABLE_DICT = {};
    }
    window.EDITABLE_DICT = EDITABLE_DICT;
  }
  else {
    try {
      localStorage.setItem(EDITABLE_DICT_TOKEN_KEY, JSON.stringify(window.EDITABLE_DICT));
    }
    catch (err) {
      // do nothing
    }
  }

  // window.console.log('CONST_DICT', CONST_DICT);
  if ('undefined' !== typeof window.CONST_DICT) {
    buildDictProp(window.CONST_DICT);
  }

  // window.console.log('EDITABLE_DICT', EDITABLE_DICT);
  if ('undefined' !== typeof window.EDITABLE_DICT) {
    buildDictProp(window.EDITABLE_DICT);
  }
}
buildDict();

function getAreas() {
  if (window.AREAS && _.isArray(window.AREAS) && window.AREAS.length) {
    try {
      sessionStorage.setItem(AREA_CACHE_KEY, JSON.stringify(window.AREAS));
    }
    catch (e) {
      // do nothing
    }
  }
}
setTimeout(() => {
  getAreas();
}, 1.5 * 1000);

// 每五分钟请求下字典更新
setInterval(() => {
  if (DEFINE_DICT_PATH) {
    jQuery.getScript(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${DEFINE_DICT_PATH}`).done(() => {
      setTimeout(() => {
        buildDict();
      }, 0.1 * 1000);
    });
  }
  if (DEFINE_EDITABLE_DICT_PATH) {
    jQuery.getScript(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${DEFINE_EDITABLE_DICT_PATH}`).done(() => {
      setTimeout(() => {
        buildDict();
      }, 0.1 * 1000);
    });
  }
  setTimeout(() => {
    buildDict();
  }, 10 * 1000);
}, 5 * 60 * 1000);

window.CONST_TIME = window.CONST_TIME || moment().format(DEFINE_CONST_TIME_FORMAT);
window.CONST_CURRENT_YEAR = moment(CONST_TIME, DEFINE_CONST_TIME_FORMAT).year();
