import _ from 'lodash';
import pluralize from 'pluralize';

import { DICT } from '../constants';

import {
  toCamelCase,
} from '../utils/letter_case_up_lower';

// window.toCamelCase = toCamelCase;

function getObjValue({
  dictObj,
  way,
  valueToString = false,
}) {
  // format 好看点
  // 先获取后端字段的复数，再获取后端字段复数的大写

  const toCamelCaseStr = toCamelCase(way);

  const findDictObj = ''
    || _.get(dictObj, `${pluralize(way) || ''}`)
    || _.get(dictObj, `${pluralize(way) || ''}`.toUpperCase())
    || _.get(dictObj, `${pluralize(toCamelCaseStr) || ''}`)
    || _.get(dictObj, `${pluralize(toCamelCaseStr) || ''}`.toUpperCase())
    || _.get(dictObj, `${pluralize.singular(way) || ''}`)
    || _.get(dictObj, `${pluralize.singular(way) || ''}`.toUpperCase())
    || _.get(dictObj, `${pluralize.singular(toCamelCaseStr) || ''}`)
    || _.get(dictObj, `${pluralize.singular(toCamelCaseStr) || ''}`.toUpperCase())
    || _.get(dictObj, `${way || ''}`)
    || _.get(dictObj, `${way || ''}`.toUpperCase())
    || {};

  if (valueToString && _.isArray(findDictObj) && undefined !== _.get(findDictObj, '[0].value')) {
    _.map(findDictObj, (elem) => {
      if (undefined !== elem.value) {
        _.assign(elem, {
          value: `${elem.value}`,
        });
      }
    });
  }

  return findDictObj;
}
window.getObjValue = getObjValue;

function backendDictFilter(options) {
  // 获取参数字典，默认为全局常量 DICT 。
  const constantObj = options.dict;

  // 获取读取字段的参数，参数值，用于查询参数名 。
  const { value, path, getList, valueToString = false } = options;

  // 查询字典。
  let dictObj = constantObj;
  _.each(path, (way) => {
    if (way) {
      dictObj = getObjValue({
        dictObj,
        way,
        valueToString,
      });
    }
  });

  const dict = [];

  if (_.isArray(dictObj)) {
    _.each(dictObj, (elem) => {
      const elemDict = {
        value: elem.value,
        label: elem.label,
      };

      dict.push(elemDict);
    });
  }
  else {
    for (const [k, v] of _.entries(dictObj)) {
      if (__DEV__ && __PROD__) {
        window.console.log('k', k);
      }
      if (v && v.value && v.label) {
        dict.push({
          label: v.label,
          value: v.value,
        });
      }
    }
  }


  if (getList) {
    return dict;
  }

  const item = _.find(dict, { value }) || _.find(dict, { value: window.parseInt(value) });
  return item ? item.label : value;
}

function dictFilter(options) {
  // 获取参数字典，默认为全局常量 DICT 。
  const constantObj = options.dict || DICT;

  // 获取读取字段的参数，参数值，用于查询参数名 。
  const { value, path, getList } = options;

  // 查询字典。
  let dictObj = constantObj;
  _.each(path, (way) => {
    if (way) {
      dictObj = getObjValue({
        dictObj,
        way,
      });
    }
  });

  const dict = [];

  for (const [k, v] of _.entries(dictObj)) {
    if (!k.startsWith('___')) {
      let text = dictObj[`___${k}`];
      if (!text) {
        text = k;
      }

      dict.push({
        label: text,
        value: v,
      });
    }
  }

  if (getList) {
    return dict;
  }

  const item = _.find(dict, { value }) || _.find(dict, { value: window.parseInt(value) });
  return item ? item.label : value;
}

export {
  backendDictFilter,
  dictFilter,
};

export default function (...args) {
  const path = args[0];
  let value = args[1];

  if (1 < args.length && undefined === value) {
    value = '';
  }

  let result = '';

  result = dictFilter({
    path,
    value,
    getList: value === undefined,
    dict: DICT,
  }) || '';

  // 健康管理部分，隶属学年 的那个字段，生成的时候，是通过需要的，所以需要进行排序，按照年份的降序排列。
  if (!value && path && path.includes && _.includes(path, 'year_range') && _.includes(path, 'health') && _.isArray(result)) {
    result = _.reverse(_.sortBy(result, 'value'));
  }

  if (!result || _.isEmpty(result) || result === value) {
    result = backendDictFilter({
      path,
      value,
      valueToString: false,
      getList: value === undefined,
      dict: EDITABLE_DICT,
    });
  }

  if (!result || _.isEmpty(result) || result === value) {
    result = backendDictFilter({
      path,
      value,
      getList: value === undefined,
      dict: CONST_DICT,
    });
  }

  return result || '';
}
