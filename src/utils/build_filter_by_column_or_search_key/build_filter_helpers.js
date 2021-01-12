import moment from 'moment';
import _ from 'lodash';
import NP from 'number-precision';
import { searchFormat } from '../build_list_search_filter';

export const searchMethodMap = {
  lt: '<',
  gt: '>',
  lte: '<=',
  gte: '>=',
  not: '!=',
  equal: '=',
  in: 'in',
  notIn: 'notIn',
  like: 'like',
  leftLike: 'leftLike',
  rightLike: 'rightLike',
  isNull: 'isNull',
  notNull: 'notNull',
};

export const andRegExpStr = 'and[\\d*]?';
export const andRegExp = new RegExp(`^${andRegExpStr}`); // /^and[\d*]?/
/**
 * - case1: in-student_ids
 * - case2: and-in-node_department_id
 * - case3: and2-in-node_department_id and\d
 * - case4: dayRange-birthday [['birthday', '>=', 当天零点unix time], ['birthday', '<=', 当天23:59 的 unix time],]
 */
export function isSearchRuleString(ruleStr) {
  const methodStr = _.keys(searchMethodMap).join('|');
  const regExpStrArr = [
    '^',
    '(?:',
    methodStr,
    '|dayRange',
    '|numberRange',
    `|${andRegExpStr}`,
    ')',
    '-.*',
  ].join('');
  const reg = new RegExp(regExpStrArr);
  return reg.test(ruleStr);
  // return /^(?:not|gt|lt|lte|gte|in|dayRange|and[\d*])-.*/.test(ruleStr);
}

/**
 * @param {moment} momentObj
 */
export function getMomentStartDayUnix(momentObj) {
  return momentObj.unix();
}

/**
 * @param {moment} momentObj
 */
export function getMomentEndDayUnix(momentObj) {
  return momentObj.unix() + ((24 * 60 * 60) - 1);
}

/**
 * @param {{
 *   dataIndex: string,
 *   filterName: string
 *   } elem
 * @param {{}} formFilterNameMap
 */
export function getFilterKey(elem = {}, formFilterNameMap = {}) {
  if (elem.filterName) { // 最初的配置 || date_range 也从这里配置
    return elem.filterName;
  }

  const dataIndex = elem.dataIndex;
  if (formFilterNameMap[dataIndex]) { // formFilterMap 配置
    return formFilterNameMap[dataIndex];
  }

  if (/\w+\$.*/.test(dataIndex)) { // 联表查询的，只允许一个 $ 符号 student$name
    return dataIndex.replace(/\$/g, '.');
  }

  return dataIndex;
}

/**
 * @param {{
 *   type: 'input'|'select'|'foreign'|'date_range'|'area'|'year',
 *   method: string,
 *   } elem
 * @param {string} originFilterKey
 * @param {number|boolean|string} searchFormFormatedValue
 */
export function getFilterMethod(elem = {}, originFilterKey, searchFormFormatedValue) {
  if (elem.method) { // 配置的优先
    return searchMethodMap[elem.method];
  }

  let method = searchMethodMap.equal; // '=';
  const type = _.toLower(elem.type);
  if (!type) {
    if (_.isNumber(searchFormFormatedValue)) {
      method = searchMethodMap.equal; // =;
    }
    else if (_.isArray(searchFormFormatedValue)) {
      method = searchMethodMap.in; // in;
    }
    else {
      method = searchMethodMap.equal; // 默认精确查询;
    }
  }
  else if ('input' === type) {
    method = searchMethodMap.equal; // 默认精确查询;
  }
  else if (['date_range', 'number_range'].includes(type)) {
    if (_.endsWith(originFilterKey, 'start')) {
      method = searchMethodMap.gte; // '>=';
    }
    else if (_.endsWith(originFilterKey, 'end')) {
      method = searchMethodMap.lte; // '<=';
    }
  }
  else if (['area', 'foreign', 'select', 'year'].includes(type)) {
    if (_.isArray(searchFormFormatedValue)) {
      method = searchMethodMap.in; // 'in';
    }
    else {
      method = searchMethodMap.equal; // '=';
    }
  }

  return method;
}

function formatNumberRange(elem = {}, originFilterKey, searchValue) {
  const times = _.get(elem, 'times') || 0;
  if (_.isNumber(times)) {
    if (_.endsWith(originFilterKey, 'start') && _.isFinite(searchValue)) {
      return NP.times(searchValue, 10 ** times);
    }
    else if (_.endsWith(originFilterKey, 'end') && _.isFinite(searchValue)) {
      return NP.times(searchValue, 10 ** times);
    }
  }
}

/**
 * @param {{
 *   type: 'input'|'select'|'foreign'|'date_range'|'area'|'year',
 *   } elem
 * @param {string} originFilterKey
 * @param {number|boolean|string} searchValue
 */
export function formatFilterValue(elem = {}, originFilterKey, searchValue) {
  let returnValue;
  const type = _.toLower(elem.type);
  if ('date_range' === type) {
    const format = 'YYYY-MM-DD';
    const momentObj = moment(moment(searchValue).format(format), format);

    if (_.endsWith(originFilterKey, 'start')) {
      returnValue = getMomentStartDayUnix(momentObj);
    }
    else if (_.endsWith(originFilterKey, 'end')) {
      returnValue = getMomentEndDayUnix(momentObj);
    }
  }
  else if ('number_range' === type) {
    returnValue = formatNumberRange(elem, originFilterKey, searchValue);
  }
  else if ('date' === type) {
    const format = _.get(elem, 'format', 'YYYY-MM-DD');
    returnValue = moment(searchValue).format(format);
  }
  else if (!type || ['input', 'area', 'foreign', 'select', 'year'].includes(type)) {
    returnValue = searchValue;
  }

  if (_.isFunction(elem.formatValue)) {
    returnValue = elem.formatValue(elem, originFilterKey, searchValue);
  }

  return searchFormat(returnValue);
}
