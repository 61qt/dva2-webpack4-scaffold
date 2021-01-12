import _ from 'lodash';
import moment from 'moment';

import { searchFormat } from '../build_list_search_filter';
import {
  getFilterKey,
  getMomentStartDayUnix,
  getMomentEndDayUnix,
  searchMethodMap,
  andRegExp,
} from './build_filter_helpers';

const ruleSeperator = '-';
/**
 *
 * @param {string} rule
 * @param {number | any[] | string | boolean} searchValue
 */
export default function buildFilterBySearchRuleString(rule, searchValue) {
  const formatedSearchValue = searchFormat(searchValue);
  const filters = [];
  if ('' === formatedSearchValue) {
    return filters;
  }

  const ruleArray = _.split(rule, ruleSeperator);
  if (1 === ruleArray.length) {
    // 只有一个，不走这里处理，走配置 elem config
  }
  else if (2 === ruleArray.length) {
    const [methodStr, dataIndex] = ruleArray;
    const filterKey = getFilterKey({ dataIndex });

    if ('dayRange' === methodStr) {
      const momentObj = moment.unix(formatedSearchValue);
      filters.push(
        [
          filterKey,
          searchMethodMap.gte,
          getMomentStartDayUnix(momentObj),
        ],
        [
          filterKey,
          searchMethodMap.lte,
          getMomentEndDayUnix(momentObj),
        ],
      );
    }
    else {
      filters.push([
        filterKey,
        searchMethodMap[methodStr],
        formatedSearchValue,
      ]);
    }
  }
  else if (3 === ruleArray.length) {
    const [andConditon, methodStr, dataIndex] = ruleArray;
    if (andRegExp.test(andConditon)) {
      filters.push([
        getFilterKey({ dataIndex }),
        searchMethodMap[methodStr],
        formatedSearchValue,
      ]);
    }
  }

  return filters;
}
