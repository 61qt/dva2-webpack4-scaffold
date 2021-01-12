import _ from 'lodash';
import pluralize from 'pluralize';

// import { DICT } from '../constants';
import API_CONFIG from '../constants/api_config';

import {
  toBothCamelCase,
  toCamelCase,
} from '../utils/letter_case_up_lower';

function buildApiConfigWithDefault({
  model,
  key,
}) {
  const autoApiConfig = {
    importDescriptionPath: '',
    exportableList: `${toCamelCase(model)}Export`,
    exportAction: `${toCamelCase(model)}Export`,
    indexAuth: `${pluralize(model)}.btn_show`,
    importAuth: `${pluralize(model)}.import`,
    importPath: `${DEFINE_API_MODULE}/import/${model}`,
    exportPath: DEFINE_GRAPHQL_PATH,
    downloadTempPath: `${DEFINE_API_MODULE}/download/${model}/template`,
    modelDefaultFilter: [],
    mutation: {
      list: {
        // 例如 department 下面，有层级的权限控制。
        name: `${toCamelCase(model)}Pagination`,
      },
      detail: {
        name: `${toCamelCase(model)}`,
      },
      delete: {
        name: `delete${toBothCamelCase(model)}`,
      },
      update: {
        name: `update${toBothCamelCase(model)}`,
      },
      create: {
        name: `create${toBothCamelCase(model)}`,
      },
      remove: {
        name: `delete${toBothCamelCase(model)}`,
      },
      patchRemove: {
        name: `delete${toBothCamelCase(pluralize(model))}`,
      },
      changeStatus: {
        name: `change${toBothCamelCase(model)}Status`,
      },
      all: {
        // 例如 department 下面，无层级的权限控制。可以看到整个树结构节点。
        name: `${toCamelCase(model)}List`,
      },
      currentAll: {
        // 例如 department 下面，有层级的权限控制。可以看到当前分之以下的节点。
        name: `${toCamelCase(model)}Tree`,
      },
    },
  };
  const apiConfig = _.defaultsDeep(API_CONFIG[model], autoApiConfig);

  let result;
  if ('all' === key) {
    result = apiConfig;
  }
  else {
    result = _.get(apiConfig, key);
  }

  return result;
}

function getApiConfig({
  model,
  key,
}) {
  return buildApiConfigWithDefault({
    model,
    key,
  });
}

window.API_CONFIG = API_CONFIG;
window.getApiConfig = getApiConfig;

export { getApiConfig };

export default 'getApiConfig';
