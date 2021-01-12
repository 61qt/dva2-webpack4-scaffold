import _ from 'lodash';

import http from '../utils/http';
import CONSTANTS from '../constants';

export default function actionFactory({
  model,
  PAGE_SIZE = CONSTANTS.PAGE_SIZE,
  PAGE_SIZE_MAX = CONSTANTS.PAGE_SIZE_MAX,
  ...rest
}) {
  const selectCustom = rest.select;
  const service = {
    // 列表
    list: (options = {}) => {
      let select = _.get(selectCustom, 'list');
      if (!select) {
        select = options.select || ['id'].join(',');
      }

      const searchArr = [
        `page=${options.page || 1}`,
        `per_page=${options.pageSize || PAGE_SIZE}`,
        `filter=${JSON.stringify(options.filter || [])}`,
        `select=${select}`,
        `ignore_filter=${options.ignoreFilter || 0}`,
        `order_by=${options.orderBy || ''}`,
        `sort=${options.sort || ''}`,
        `${options.query ? '&' : ''}${options.query}`,
      ];
      return http.get(`/${model}?${searchArr.join('&')}`, options.config || '');
    },
    // 详情
    detail: (options) => {
      const select = _.get(selectCustom, 'detail') || options.select || ['admin.name'].join(',');
      return http.get(`/${model}/${options.id}?select=${select}`, options.config);
    },
    // 删除
    remove: (id, values = {}, config = {}) => {
      return http.delete(`/${model}/${id}`, values, config);
    },
    // 编辑
    update: (id, values = {}, config = {}) => {
      return http.put(`/${model}/${id}`, values, config);
    },
    // 新增
    create: (values, config) => {
      return http.post(`/${model}`, values, config);
    },
  };

  // 最大列表
  service.maxList = (options = {}) => {
    return service.list({
      ...options,
      pageSize: PAGE_SIZE_MAX,
      isMaxList: true,
    });
  };

  return service;
}
