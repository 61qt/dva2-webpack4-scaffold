import _ from 'lodash';
import { isSearchRuleString, formatFilterValue, getFilterKey, getFilterMethod, searchMethodMap } from './build_filter_helpers';
import buildFilterBySearchRuleString from './build_filter_by_search_rule_string';
import { searchFormat } from '../build_list_search_filter';

export default function buildFilterByColumn({
  searchFormColumn = [],
  searchFormValues = {},
  formFilterNameMap = {},
}) {
  let filters = [];
  _.each(_.entries(searchFormValues), ([searchKey, searchValue]) => {
    const searchColumn = _.find(searchFormColumn, { dataIndex: searchKey }) || {};

    if (isSearchRuleString(searchKey)) {
      const ruleFilters = buildFilterBySearchRuleString(searchKey, searchValue);
      if (0 < ruleFilters.length) {
        filters = filters.concat(ruleFilters);
      }
    }
    else if (!_.isEmpty(searchColumn)) { // 处理定义在 searchColumn 里面
      // if ('function' === typeof searchColumn.filterFunc) {
      //   searchColumn.filterFunc({
      //     filters,
      //     elem: searchColumn,
      //     value: searchValue,
      //   });
      // }
      // else
      if (['date_range', 'number_range'].includes(searchColumn.type)) { // date_range 这种单独处理
        _.each(searchValue, (rangeValue, rangeKey) => {
          const formatedValue = formatFilterValue(searchColumn, rangeKey, rangeValue);
          if ('' !== formatedValue) {
            filters.push([
              getFilterKey(searchColumn, formFilterNameMap),
              getFilterMethod(searchColumn, rangeKey, formatedValue),
              formatedValue,
            ]);
          }
        });
      }
      else if ('date' === searchColumn.type) {
        const dataIndex = _.get(searchColumn, 'dataIndex');
        const formatedValue = formatFilterValue(searchColumn, dataIndex, searchValue);
        if ('' !== formatedValue) {
          filters.push([
            getFilterKey(searchColumn, formFilterNameMap),
            getFilterMethod(searchColumn, dataIndex, formatedValue),
            formatedValue,
          ]);
        }
      }
      else {
        const dataIndex = _.get(searchColumn, 'dataIndex');
        const formatedValue = formatFilterValue(searchColumn, dataIndex, searchValue);
        if ('' !== formatedValue) {
          filters.push([
            getFilterKey(searchColumn, formFilterNameMap),
            getFilterMethod(searchColumn, dataIndex, formatedValue),
            formatedValue,
          ]);
        }
      }
    }
    else if ('' !== searchValue) { // 处理 非 searchRuleString，也没有定义在 searchColumns 的 key
      const formatedValue = searchFormat(searchValue);
      filters.push([
        getFilterKey({ dataIndex: searchKey }, formFilterNameMap),
        getFilterMethod(searchColumn, searchKey, formatedValue),
        formatedValue,
      ]);
    }
  });

  if (__DEV__) {
    _.each(filters, (filter) => {
      const filterHasNotUndefinedValue = _.every(filter, (value) => {
        if (_.isNumber(value) && !_.isNaN(value)) {
          return true;
        }

        return value;
      });
      if (!filterHasNotUndefinedValue) {
        const str = JSON.stringify(filter);
        window.console.error(`buildFilterByColumn 构建 filter 出错了，检查下是否配置有问题， 出错的 filter ${str}`);

        const filterMethod = _.get(filter, '1');
        if (!filterMethod) {
          window.console.error(`${str} filter 方法找不到，检查 method 是否存在 ${_.keys(searchMethodMap).join(',')} 当中`);
        }
      }
    });
  }

  // window.console.table(filters);

  return filters;
}
