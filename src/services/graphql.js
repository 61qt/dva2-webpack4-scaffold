import _ from 'lodash';
import ServiceCommon from '../services/common';
import formErrorMessageShow from '../utils/form_error_message_show';
import { http, API_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '../services/_factory';

// import { getApiConfig } from '../utils/get_api_config';

// const model = 'graphql';

const cacheKey = `graphql__schema_cache_for_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}_${DEFINE_MODULE}`;
const Service = {};
Service.info = () => {
  const mutationName = '__schema';
  const schema = `query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        ...FullType
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    fields(includeDeprecated: true) {
      name
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
    }
    inputFields {
      ...InputValue
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    type { ...TypeRef }
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }`;

  const getCacheData = () => {
    let cacheObj = {};
    try {
      let data = '';
      if (__DEV__) {
        data = localStorage.getItem(cacheKey);
      }
      else {
        data = sessionStorage.getItem(cacheKey);
      }
      cacheObj = JSON.parse(data);
    }
    catch (e) {
      cacheObj = {};
    }
    return cacheObj;
  };

  const forceXhr = () => {
    const httpConfig = {
      skipAuthorization: true,
      skipExpireCheck: true,
    };
    return ServiceCommon.graphqlNormal({
      schema,
      variables: {},
    }, {}, httpConfig).then((res) => {
      const data = _.get(res, `data.${mutationName}`);
      const returnData = {
        ...res,
        data,
      };

      if (__DEV__) {
        localStorage.setItem(cacheKey, JSON.stringify(returnData));
      }
      else {
        sessionStorage.setItem(cacheKey, JSON.stringify(returnData));
      }

      return returnData;
    }).catch((rej) => {
      formErrorMessageShow(rej);
      if (window.console && window.console.log) {
        window.console.error('查询 graphql 语法出错，现在从缓存直接读取数据');
        window.console.log('rej', rej);
      }

      const cacheObj = getCacheData();
      if (!_.isEmpty(cacheObj)) {
        return Promise.resolve(cacheObj);
      }
      else {
        return Promise.reject(rej);
      }
    });
  };

  const getJson = (createdAt) => {
    return Service.getModuleGraphql().then((res) => {
      const data = _.get(res, `data.${mutationName}`);
      const returnData = {
        ...res,
        data,
      };

      if (__DEV__) {
        localStorage.setItem(cacheKey, JSON.stringify(returnData));
      }
      else {
        sessionStorage.setItem(cacheKey, JSON.stringify(returnData));
      }

      if (createdAt && createdAt !== _.get(returnData, 'create_at')) {
        window.location.reload();
      }

      return returnData;
    }).catch((rej) => {
      // 这里先不弹错误提示，接下来再从接口获取graphQL语法，如果有错误再提醒
      if (window.console && window.console.log) {
        window.console.error('从json文件获取graphql语法失败');
        window.console.log('rej', rej);
      }
      // json获取失败，从接口获取
      return forceXhr();
    });
  };

  const cacheObj = getCacheData();

  if (__DEV__ && !_.isEmpty(cacheObj) && !_.isEmpty(_.get(cacheObj, 'data', {}))) {
    // 异步更新存储
    forceXhr();
    return Promise.resolve(cacheObj);
  }
  else if (__PROD__ && !_.isEmpty(cacheObj) && !_.isEmpty(_.get(cacheObj, 'data', {}))) {
    const createdAt = _.get(cacheObj, 'create_at');
    getJson(createdAt);
    return Promise.resolve(cacheObj);
  }
  else if (__PROD__ && (_.isEmpty(cacheObj) || _.isEmpty(_.get(cacheObj, 'data', {})))) {
    return getJson();
  }
  else {
    return forceXhr();
  }
};

Service.getModuleGraphql = () => {
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/json/${DEFINE_API_MODULE}_schema.json`, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};

export default Service;

// const schema = `query IntrospectionQuery {
//   __schema {
//     queryType { name }
//     mutationType { name }
//     subscriptionType { name }
//     types {
//       ...FullType
//     }
//     directives {
//       name
//       description
//       locations
//       args {
//         ...InputValue
//       }
//     }
//   }
// }

// fragment FullType on __Type {
//   kind
//   name
//   description
//   fields(includeDeprecated: true) {
//     name
//     description
//     args {
//       ...InputValue
//     }
//     type {
//       ...TypeRef
//     }
//     isDeprecated
//     deprecationReason
//   }
//   inputFields {
//     ...InputValue
//   }
//   interfaces {
//     ...TypeRef
//   }
//   enumValues(includeDeprecated: true) {
//     name
//     description
//     isDeprecated
//     deprecationReason
//   }
//   possibleTypes {
//     ...TypeRef
//   }
// }

// fragment InputValue on __InputValue {
//   name
//   description
//   type { ...TypeRef }
//   defaultValue
// }

// fragment TypeRef on __Type {
//   kind
//   name
//   ofType {
//     kind
//     name
//     ofType {
//       kind
//       name
//       ofType {
//         kind
//         name
//         ofType {
//           kind
//           name
//           ofType {
//             kind
//             name
//             ofType {
//               kind
//               name
//               ofType {
//                 kind
//                 name
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }`;
