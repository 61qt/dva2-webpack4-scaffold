import _ from 'lodash';
import Qs from 'qs';
import validatorMutation from '@/utils/mutation_validator';
import http, {
  OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL,
  API_DOMAIN_WITH_PREFIX_AND_PROTOCOL,
} from '@/utils/http';
import CONSTANTS from '@/constants';
import { getApiConfig } from '@/utils/get_api_config';
import { getState } from '@/utils/get_app';
import { buildMinifyAuthScheme } from '@/utils/graphql';
import ServiceCommon from '@/services/common';
import { undershoot as sentryUndershoot } from '@/utils/dva-sentry';

export {
  http,
  OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL,
  API_DOMAIN_WITH_PREFIX_AND_PROTOCOL,
};

// 创建提交的数据的 format 桥
export function buildFormDataObj(values = {}, mutationName) {
  let newValues = { ...values };
  if (mutationName && DEFINE_VALIDATOR_MUTATION_MODULES.includes(DEFINE_MODULE)) {
    newValues = validatorMutation(mutationName, values);
  }
  const valueObj = {};
  for (const [key, value] of _.entries(newValues)) {
    if (!value && /(password|password_confirmation)/.test(key)) {
      // ignore this value
    }
    else if (/_{3,4}/.test(key)) {
      // ignore this value
    }
    else if (/phone/.test(key)) {
      valueObj[key] = `${value || ''}`;
    }
    // else if (/_id$/.test(key) && !['app_id', 'merchant_id', 'house_deed_id'].includes(key)) {
    //   if (_.isArray(value)) {
    //     valueObj[key] = [];
    //     _.each(value, (elem) => {
    //       valueObj[key].push(elem * 1 || 0);
    //     });
    //   }
    //   else {
    //     valueObj[key] = value * 1 || 0;
    //   }
    // }
    else if (/gender/.test(key)) {
      valueObj[key] = value * 1 || 0;
    }
    else {
      valueObj[key] = value;
    }
  }
  return valueObj;
}

export function getFields({
  queryName,
}) {
  const state = getState();
  if (state && state.graphql && state.graphql.query && state.graphql.query[queryName] && state.graphql.query[queryName].fields) {
    return state.graphql.query[queryName].fields;
  }
  return false;
}

export function getArgsType({
  queryName,
  attrName,
}) {
  const state = getState();
  const fields = _.get(state, 'graphql.queryObject.fields', []);

  const queryFields = fields.find((item) => {
    return item.name === queryName;
  });

  const args = _.get(queryFields, 'args');
  if (args && _.isArray(args)) {
    const argInfo = args.find((item) => {
      return item.name === attrName;
    });

    if (_.get(argInfo, 'type.name')) {
      return _.get(argInfo, 'type.name');
    }
    else if (_.get(argInfo, 'type.ofType.name')) {
      return _.get(argInfo, 'type.ofType.name');
    }
  }
  // if (state && state.graphql && state.graphql.query && state.graphql.query[queryName] && state.graphql.query[queryName].args && state.graphql.query[queryName].argsObj[attrName]) {
  //   return state.graphql.query[queryName].argsObj[attrName];
  // }
  return 'Int';
}
// window.getFields = getFields;
// window.getArgsType = getArgsType;

export function getInputType({
  mutationName,
}) {
  const state = getState();
  if (state && state.graphql && state.graphql.mutation && state.graphql.mutation[mutationName] && state.graphql.mutation[mutationName].inputType) {
    return state.graphql.mutation[mutationName].inputType;
  }
  return false;
}
// window.getInputType = getInputType;

// 获取查询语法，并且缓存掉
const getInnerServiceSchemeCache = {};
export function getInnerServiceScheme({
  name,
  auth,
  ...option
}) {
  // 已兼容多个路由auth
  // test ["%u827A%u4F53%u751F%u8003%u8BD5%u6210%u7EE9%u7BA1%u7406", "123232"]
  // newAuth = 艺体生考试成绩管理,123232   //对于后面match resource不影响
  // 解码auth
  const newAuth = unescape(auth);

  const key = `name_${name}_auth_${newAuth}`;

  if (getInnerServiceSchemeCache[key]) {
    return getInnerServiceSchemeCache[key];
  }

  try {
    let innerServiceScheme = '';
    const {
      scheme,
      resource,
    } = buildMinifyAuthScheme({
      name,
      auth: newAuth,
      ...option,
    });

    if (__DEV__ && __PROD__) {
      window.console.log('getInnerServiceScheme resource', resource, 'scheme', scheme);
    }

    if (scheme && scheme.fields && scheme.fields.length) {
      innerServiceScheme = scheme.fields.join('\n');
    }
    // 增加到缓存内部
    getInnerServiceSchemeCache[key] = innerServiceScheme;
    return innerServiceScheme;
  }
  catch (error) {
    window.console.error(error);

    sentryUndershoot.capture(error, {
      ...error,
      name,
      auth: newAuth,
    });
  }
}
// window.getInnerServiceScheme = getInnerServiceScheme;
const openBFS = (serviceBFS) => {
  let bfs = false;
  if (undefined === serviceBFS || null === serviceBFS) {
    bfs = CONSTANTS.SERVICE_SCHEME_BFS_MODULES.includes(DEFINE_MODULE);
  }
  else {
    bfs = serviceBFS;
  }
  return bfs;
};

export default function actionFactory({
  model,
  PAGE_SIZE = CONSTANTS.PAGE_SIZE,
  PAGE_SIZE_MAX = CONSTANTS.PAGE_SIZE_MAX,
  ...rest
}) {
  const selectCustom = rest.select;
  const service = {
    filterTotal: (options = {}) => {
      let select = _.get(selectCustom, 'list');

      if (!select) {
        select = options.select || '';
      }

      let filter = [];
      if (options.filter) {
        filter = options.filter;
        if (_.isString(filter)) {
          try {
            filter = JSON.parse(options.filter);
          }
          catch (e) {
            filter = [];
          }
          if (!_.isArray(filter)) {
            filter = [];
          }
        }
      }
      if ('function' === typeof rest.graphqlListFilter) {
        filter = rest.graphqlListFilter(options.filter);
      }

      const mutationName = getApiConfig({ model, key: 'mutation.list.name' });

      const extraListSchemeParams = _.get(options, 'extraListSchemeParams') || {};

      const listParamsObj = {
        $filter: 'filterInput',
      };

      let schemeParams = '';
      const schemeParamsObj = _.assign({
        filterInput: '$filter',
      }, extraListSchemeParams);
      _.each(_.entries(schemeParamsObj), ([k, v]) => {
        if (listParamsObj[`$${k}`] && !v.startsWith('$')) {
          delete listParamsObj[`$${k}`];
        }
        schemeParams = `${schemeParams}${schemeParams ? ',' : ''} ${k}: ${v}`;
      });

      let listParams = '';
      _.each(_.entries(listParamsObj), ([k, v]) => {
        listParams = `${listParams}${listParams ? ',' : ''} ${k}: ${v}`;
      });

      function buildSchema({
        content,
      }) {
        return `query List(${listParams}) {
          ${mutationName} (${schemeParams}) {
            ${content}
          }
        }`;
      }

      let schema = '';

      // 检查是否 service 内部能够直接根据权限进行判断获取最小的查询语法

      // 如果有传输 select 参数（一般在 foreign select graphql 那边）

      schema = buildSchema({
        content: `
          total
        `,
      });


      const modelDefaultFilter = getApiConfig({ model, key: 'modelDefaultFilter' }) || [];
      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'List',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          filter: {
            filter: [].concat(filter || []).concat(modelDefaultFilter),
          },
        },
      }, {
        model,
        ...options.config,
      }).then((res) => {
        // 直接返回 转换后的 data 数据。
        const data = _.get(res, `data.${mutationName}`);
        const returnData = {};
        returnData.data = {
          ...data,
        };
        return returnData;
      });
    },
    // graphql 列表
    graphqlList: (options = {}) => {
      let select = _.get(selectCustom, 'list');

      if (!select) {
        select = options.select || '';
      }

      let filter = [];
      if (options.filter) {
        filter = options.filter;
        if (_.isString(filter)) {
          try {
            filter = JSON.parse(options.filter);
          }
          catch (e) {
            filter = [];
          }
          if (!_.isArray(filter)) {
            filter = [];
          }
        }
      }
      if ('function' === typeof rest.graphqlListFilter) {
        filter = rest.graphqlListFilter(options.filter);
      }

      const mutationName = getApiConfig({ model, key: 'mutation.list.name' });

      const extraListSchemeParams = _.get(options, 'extraListSchemeParams') || {};

      const listParamsObj = {
        $page: 'Int',
        $take: 'Int',
        $filter: 'filterInput',
        $orderBy: 'String',
        $sort: 'String',
      };

      let schemeParams = '';
      const schemeParamsObj = _.assign({
        page: '$page',
        take: '$take',
        filterInput: '$filter',
        orderBy: '$orderBy',
        sort: '$sort',
      }, extraListSchemeParams);
      _.each(_.entries(schemeParamsObj), ([k, v]) => {
        if (listParamsObj[`$${k}`] && !v.startsWith('$')) {
          delete listParamsObj[`$${k}`];
        }
        schemeParams = `${schemeParams}${schemeParams ? ',' : ''} ${k}: ${v}`;
      });

      let listParams = '';
      _.each(_.entries(listParamsObj), ([k, v]) => {
        listParams = `${listParams}${listParams ? ',' : ''} ${k}: ${v}`;
      });

      function buildSchema({
        content,
      }) {
        return `query List(${listParams}) {
          ${mutationName} (${schemeParams}) {
            ${content}
          }
        }`;
      }

      let schema = '';

      const fields = getFields({
        queryName: mutationName,
      });

      // 检查是否 service 内部能够直接根据权限进行判断获取最小的查询语法
      let innerServiceScheme = '';
      if (_.includes(CONSTANTS.SERVICE_SCHEME_OPTIMIZE_MODULES, DEFINE_MODULE)) {
        innerServiceScheme = getInnerServiceScheme({
          name: mutationName,
          auth: _.get(Qs.parse(window.location.search.replace(/^\?/, '')), 'auth', ''),
          bfs: openBFS(rest.bfs), // 是否开启广度遍历
          complexity: rest.complexity, // 指定复杂度
          deep: rest.deep, // 语法构建的层级
        });
      }

      // 如果有传输 select 参数（一般在 foreign select graphql 那边）
      if (_.isString(select) && !_.isEmpty(select)) {
        schema = buildSchema({
          content: `
            items {
              ${select}
            }
            perPage
            total
            currentPage
          `,
        });
      }
      else if (_.includes(CONSTANTS.SERVICE_SCHEME_OPTIMIZE_MODULES, DEFINE_MODULE) && _.isString(innerServiceScheme) && !_.isEmpty(innerServiceScheme)) {
        schema = buildSchema({
          content: innerServiceScheme,
        });
      }
      else if (fields && fields.length) {
        schema = buildSchema({
          content: fields.join('  '),
        });
      }
      //
      else {
        schema = buildSchema({
          content: `
            items {
              id
            }
            perPage
            total
            currentPage
          `,
        });
      }

      const modelDefaultFilter = getApiConfig({ model, key: 'modelDefaultFilter' }) || [];
      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'List',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          filter: {
            filter: [].concat(filter || []).concat(modelDefaultFilter),
          },
          page: options.page || 1,
          take: options.pageSize || PAGE_SIZE,
          orderBy: options.orderBy || 'id',
          sort: options.sort || 'desc',
        },
      }, {
        model,
        ...options.config,
      }).then((res) => {
        // 直接返回 转换后的 data 数据。
        const data = _.get(res, `data.${mutationName}`);
        const returnData = {
          ...res,
        };
        // const { items, ...restData } = data;
        const items = _.get(data, 'items', []);
        const restData = {
          ...data,
        };
        delete restData.items;

        returnData.data = {
          ...restData,
          data: items,
        };
        return returnData;
      });
    },
    // graphql 详情
    graphqlDetail: (options) => {
      let select = _.get(selectCustom, 'detail');
      if (!select) {
        select = options.select || '';
      }

      const mutationName = getApiConfig({ model, key: 'mutation.detail.name' });

      const idType = getArgsType({
        queryName: mutationName,
        attrName: 'id',
      });

      function buildSchema({
        content,
      }) {
        return `query Detail($id: ${idType}!) {
          ${mutationName} (id: $id) {
            ${content}
          }
        }`;
      }

      let schema = buildSchema({
        content: select,
      });

      const fields = getFields({
        queryName: mutationName,
      });

      // 检查是否 service 内部能够直接根据权限进行判断获取最小的查询语法
      let innerServiceScheme = '';
      if (_.includes(CONSTANTS.SERVICE_SCHEME_OPTIMIZE_MODULES, DEFINE_MODULE)) {
        innerServiceScheme = getInnerServiceScheme({
          name: mutationName,
          auth: _.get(Qs.parse(window.location.search.replace(/^\?/, '')), 'auth', ''),
          bfs: openBFS(rest.bfs), // 是否开启广度遍历
          complexity: rest.complexity, // 指定复杂度
          deep: rest.deep, // 语法构建的层级
        });
      }
      if (_.includes(CONSTANTS.SERVICE_SCHEME_OPTIMIZE_MODULES, DEFINE_MODULE) && _.isString(innerServiceScheme) && !_.isEmpty(innerServiceScheme)) {
        schema = buildSchema({
          content: innerServiceScheme,
        });
      }
      else if (fields && fields.length) {
        schema = buildSchema({
          content: fields.join('  '),
        });
      }

      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'Detail',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          id: options.id * 1 || options.id,
        },
      }, {
        model,
        ...options.config,
      }).then((res) => {
        // 直接返回 转换后的 data 数据。
        const data = _.get(res, `data.${mutationName}`);
        const returnData = {
          ...res,
        };

        returnData.data = data;
        return returnData;
      });
    },
    // graphql 批量删除
    graphqlPatchRemove: ({ ids, extraData } = { ids: [], extraData: {} }, options = {}) => {
      const mutationName = getApiConfig({ model, key: 'mutation.patchRemove.name' });

      const schema = `mutation patchRemoveMutation($input: ${getInputType({ mutationName })}) {
        ${mutationName} (input: $input) {
          id
        }
      }`;

      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'patchRemoveMutation',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          input: {
            ids: _.map(ids, (elem) => {
              return 1 * elem;
            }),
            ...extraData,
          },
        },
      }, {
        model,
        ...options.config,
      });
    },

    // graphql 删除
    graphqlRemove: (id, values, options = {}) => {
      const mutationName = getApiConfig({ model, key: 'mutation.remove.name' });
      const schema = `mutation removeMutation($id: Int) {
        ${mutationName} (id: $id) {
          id
        }
      }`;

      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'removeMutation',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          id: id * 1,
        },
      }, {
        model,
        ...options.config,
      });
    },
    // graphql 编辑
    graphqlUpdate: (id, values = {}, options = {}) => {
      const mutationName = getApiConfig({ model, key: 'mutation.update.name' });
      const schema = `mutation updateMutation($id: Int, $input: ${getInputType({ mutationName })}) {
        ${mutationName} (id: $id, input: $input) {
          id
        }
      }`;
      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'updateMutation',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          id: id * 1,
          input: {
            ...buildFormDataObj(values, mutationName),
          },
        },
      }, {
        model,
        ...options.config,
      });
    },
    // graphql 新增
    graphqlCreate: (values = {}, options = {}) => {
      const mutationName = getApiConfig({ model, key: 'mutation.create.name' });
      const schema = `mutation createMutation($input: ${getInputType({ mutationName })}) {
        ${mutationName} (input: $input) {
          id
        }
      }`;
      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'createMutation',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          input: {
            ...buildFormDataObj(values, mutationName),
          },
        },
      }, {
        model,
        ...options.config,
      }).then((res) => {
        // 直接返回 转换后的 data 数据。
        const data = _.get(res, `data.${mutationName}`);
        const returnData = {
          ...res,
        };

        returnData.data = data;
        return returnData;
      });
    },

    // graphql 新增
    graphqlPatchUpdate: (mutationType, id, values = {}, options = {}) => {
      const mutationName = getApiConfig({ model, key: `mutation.${mutationType}.name` });
      const schema = `mutation patchUpdateMutation($id: Int, $input: ${getInputType({ mutationName })}) {
        ${mutationName} (id: $id, input: $input) {
          id
        }
      }`;
      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'patchUpdateMutation',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          id,
          input: {
            ...buildFormDataObj(values, mutationName),
          },
        },
      }, {
        model,
        ...options.config,
      });
    },


    graphqlPatch: (mutationType, ids, values = {}, options = {}) => {
      const mutationName = getApiConfig({ model, key: `mutation.${mutationType}.name` });
      const schema = `mutation ${mutationName}($filter: filterInput, $input: ${getInputType({ mutationName })}) {
        ${mutationName} (filterInput: $filter, input: $input) {
          id
        }
      }`;

      // eslint-disable-next-line prefer-const
      let { filter, ...param } = values;

      if ('function' === typeof rest.graphqlListFilter) {
        filter = rest.graphqlListFilter(filter);
      }

      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: mutationName,
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables: {
          filter: { filter: filter || [] },
          input: {
            ...param,
          },
        },
      }, {
        model,
        ...options.config,
      });
    },

    // graphql 查询全部
    graphqlAll: (options = {}) => {
      let select = _.get(selectCustom, 'all') || _.get(selectCustom, 'list');
      if (!select) {
        select = options.select || '';
      }

      const mutationName = getApiConfig({ model, key: 'mutation.all.name' });

      function buildSchema({
        content,
      }) {
        return `query All($all: Boolean, ${options.orderBy ? '$orderBy: String, ' : ''} ${options.sort ? '$sort: String, ' : ''} $filter: filterInput) {
          ${mutationName} (all: $all, ${options.orderBy ? 'orderBy: $orderBy, ' : ''} ${options.sort ? 'sort: $sort, ' : ''} filterInput: $filter) {
            ${content}
          }
        }`;
      }

      let schema = buildSchema({
        content: select,
      });

      const fields = getFields({
        queryName: mutationName,
      });

      // 检查是否 service 内部能够直接根据权限进行判断获取最小的查询语法
      let innerServiceScheme = '';
      if (_.includes(CONSTANTS.SERVICE_SCHEME_OPTIMIZE_MODULES, DEFINE_MODULE)) {
        innerServiceScheme = getInnerServiceScheme({
          name: mutationName,
          auth: _.get(Qs.parse(window.location.search.replace(/^\?/, '')), 'auth', ''),
          bfs: openBFS(rest.bfs), // 是否开启广度遍历
          complexity: rest.complexity, // 指定复杂度
          deep: rest.deep, // 语法构建的层级
        });
      }

      if (_.includes(CONSTANTS.SERVICE_SCHEME_OPTIMIZE_MODULES, DEFINE_MODULE) && _.isString(innerServiceScheme) && !_.isEmpty(innerServiceScheme)) {
        schema = buildSchema({
          content: innerServiceScheme,
        });
      }
      else if (fields && fields.length) {
        schema = buildSchema({
          content: fields.join('  '),
        });
      }
      else if (!select && (!fields || !fields.length)) {
        window.console.error(`mutationName: ${mutationName} 没有查询字段`);
        return Promise.reject({
          code: 1000,
          data: [],
          msg: '没有查询字段，需要配置相关权限',
        });
      }

      const modelDefaultFilter = getApiConfig({ model, key: 'modelDefaultFilter' }) || [];
      const variables = {
        all: _.get(options, 'all', true),
        filter: {
          filter: [].concat(options.filter || []).concat(modelDefaultFilter),
        },
      };
      if (options.orderBy) {
        variables.orderBy = options.orderBy;
      }
      if (options.sort) {
        variables.sort = options.sort;
      }

      return http.post(`${DEFINE_GRAPHQL_PATH}?f=${model}`, {
        operationName: 'All',
        // query: schema.replace(/\n/ig, ' '),
        query: schema,
        variables,
      }, {
        model,
        ...options.config,
      }).then((res) => {
        // 直接返回 转换后的 data 数据。
        const data = _.get(res, `data.${mutationName}`);
        const returnData = {
          ...res,
        };
        returnData.data = data;
        return returnData;
      });
    },
  };

  // 最大列表
  service.graphqlMaxList = (options = {}) => {
    return service.graphqlList({
      ...options,
      pageSize: _.get(options, 'pageSize', PAGE_SIZE_MAX),
      isMaxList: true,
    });
  };

  service.mutationFactory = ({ id, values, name }) => {
    const mutationName = getApiConfig({ model, key: `mutation.${name}.name` }) || name;
    const variableTypes = [];
    const variableParameters = [];
    const variableValues = {
      input: {
        ...buildFormDataObj(values),
      },
    };
    if (id) {
      variableValues.id = id;
      variableTypes.push('$id: Int');
      variableParameters.push('id: $id');
    }

    variableTypes.push(`$input: ${getInputType({ mutationName })}`);
    variableParameters.push('input: $input');
    const schema = `mutation ${mutationName} (${variableTypes.join(', ')}) {
      ${mutationName} (${variableParameters.join(', ')}) {
        id
      }
    }`;

    return ServiceCommon.graphqlNormal({
      schema,
      variables: variableValues,
    }).then((res) => {
      const data = _.get(res, `data.${mutationName}`);
      return {
        ...res,
        data,
      };
    });
  };

  return service;
}
