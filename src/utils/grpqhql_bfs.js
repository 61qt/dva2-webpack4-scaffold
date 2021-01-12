import pluralize from 'pluralize';
import CONSTANTS from '../constants';
import {
  GRAPH_LEVEL_MAX_DEEP,
  getPageBlackFileds,
  autoSchemeTreeBlackList,
  autoSchemeTreeWhiteList,
  GRAPHQL_LIST_TYPE_LEVEL_WHITELIST_MIN_DEEP,
  modelTableMap,
  checkIsConfigAuthNotWithAutoMap,
  teacherTablesMap,
  noAuthFieldArr,
  noAuthObjArr,
  hasAuthResource,
} from './graphql';

import {
  toUnderlineCamelCase,
} from '../utils/letter_case_up_lower';

function buildFileds({
  queue,
  types,
  name,
  // 目前这个默认都是 OBJECT 了，可能存在的参数是 UNION ，不过目前有这个接口，但是还没时间去弄。用了个暴力点的手段解决。
  kind = 'OBJECT',
  // typeName,
  resource,
  args = [],
  parentFieldTypeIsList = false,
  fieldObject,
  fields,
}) {
  // const fields = [];

  // window.console.info('fieldObject', fieldObject, 'typeName', typeName, 'name', name);
  // if (!fieldObject) {
  //   window.console.info('fieldObject', fieldObject, 'typeName', typeName, 'name', name);
  // }
  // 当前对象字段的复杂度
  let currentComplexity = 0;
  const typeName = _.get(fieldObject, 'name');
  const fieldObjectFields = _.get(fieldObject, 'fields') || [];
  const fieldObjectPossibleTypes = _.get(fieldObject, 'possibleTypes') || [];
  const fieldObjectMapFields = [...fieldObjectFields, ...fieldObjectPossibleTypes];
  // if (_.get(fieldObject, 'possibleTypes')) {
  //   window.console.log('fieldObjectMapFields', fieldObjectMapFields);
  // }

  // 获取该页面需要拉黑的字段集合
  const pageBlackFileds = getPageBlackFileds();

  if (fieldObject && fieldObjectMapFields.length) {
    _.map(fieldObjectMapFields, (field) => {
      // const childBranch = [].concat(branch).concat(field.name);
      // const childBranchStr = childBranch.join('.');
      const childBranchStr = `${fieldObject.parentName}.${field.name}`;
      const childBranch = childBranchStr.split('.');

      // let childKeyBranch = [].concat(keyBranch).concat(field.name);
      // if ('LIST' === _.get(field, 'type.kind')) {
      //   childKeyBranch = [].concat(keyBranch).concat(`${field.name}[i]`);
      // }

      // window.console.log(childBranch.join('.'), 'field check black');
      // window.console.log(childKeyBranch.join('.'), 'field check key black');
      if (autoSchemeTreeBlackList.includes(childBranchStr)) {
        // window.console.log('field blacked SCALAR', childBranch.join('.'));
        // 已经到了多重冗余，不查询了
        // 已经到了黑名单，不查询了
        return false;
      }
      // 页面级别拉黑
      else if (pageBlackFileds.includes(childBranchStr)) {
        return false;
      }
      else if (autoSchemeTreeWhiteList.includes(childBranchStr)) {
        // 这里是白名单，不进行特殊的处理，直接下一步进行优化处理了。
      }
      else if (!['SCALAR', 'NON_NULL'].includes(_.get(field, 'type.kind'))) {
        // 判断是不是特定的嵌套，去掉重复的循环嵌套

        // 需要进行特殊的处理。
        const formatedChildBranchStr = childBranchStr.replace(/(\.items|Pagination)/ig, '');
        const formatedChildBranch = _.split(formatedChildBranchStr, '.');

        // 当前 1，直接放行
        if (1 === formatedChildBranch.length) {
          // 直接放行
        }
        // 直接判断是不是重复的。
        else if (_.uniq([].concat(formatedChildBranch)).length !== formatedChildBranch.length) {
          if (__DEV__) {
            // 这里的 siteSpecial 有父级的，所以可能死循环，也报错。但是不管他，让他输出吧。
            // 其他类型的父级是同类型的，都可能这样子。
            // window.console.log('不转换直接重复了', _.get(field, 'type.kind'), formatedChildBranchStr, 'childBranchStr', childBranchStr);
          }
          return false;
        }
        else {
          // 判断复数重复
          const pluralizeFormatedChildBranch = _.map(formatedChildBranch, (elem) => {
            return pluralize(elem);
          });
          if (_.uniq([].concat(pluralizeFormatedChildBranch)).length !== pluralizeFormatedChildBranch.length) {
            if (__DEV__) {
              // 这里的 siteSpecial 有父级的，所以可能死循环，也报错。但是不管他，让他输出吧。
              // 其他类型的父级是同类型的，都可能这样子。
              // window.console.log('复数直接重复了', _.get(field, 'type.kind'), formatedChildBranchStr, 'childBranchStr', childBranchStr);
            }
            return false;
          }
        }
        // window.console.log(_.get(field, 'type.kind'), formatedChildBranchStr, childBranchStr);
        // window.console.log(_.get(field, 'type.kind'), formatedChildBranchStr);
      }

      // 父级 field 是 LIST 类型时，检查父级下的 OBJECT field 在不在白名单内 TODO parentFieldTypeIsList
      if (CONSTANTS.CURRENT_MODULE_PAGINATION_QUERY_SHOULD_OPTIMIZE && parentFieldTypeIsList) {
        const isPaginationSchema = _.endsWith(childBranch[0], 'Pagination');
        if (
          // 分页类型语法深度要超过 GRAPH_LEVEL_MAX_DEEP，才需要进行白名单校验
          isPaginationSchema && childBranch.length > GRAPH_LEVEL_MAX_DEEP
          // 非分页类型语法深度要超过 GRAPHQL_LIST_TYPE_LEVEL_WHITELIST_MIN_DEEP，才需要进行白名单校验
          || !isPaginationSchema && childBranch.length > GRAPHQL_LIST_TYPE_LEVEL_WHITELIST_MIN_DEEP
        ) {
          const fieldTypeIsObject = 'OBJECT' === _.get(field, 'type.kind');
          // 对象类型是不是不在白名单内
          if (fieldTypeIsObject && !_.includes(autoSchemeTreeWhiteList, childBranchStr)) {
            return false;
          }
        }
      }

      // 已经是原子字段了。
      if ('SCALAR' === _.get(field, 'type.kind') || 'SCALAR' === _.get(field, 'type.ofType.kind')) {
        if (__DEV__) {
          let checkIsConfigAuthNotWithAutoMapName = `${['items'].includes(name) ? typeName : name}`.replace(/(Export|List|Tree)$/, '');
          // 看看是不是前端已知映射字段
          checkIsConfigAuthNotWithAutoMapName = modelTableMap[checkIsConfigAuthNotWithAutoMapName] || checkIsConfigAuthNotWithAutoMapName;
          // 判断如果没权限，就进行记录，方便查看调试。
          if (!checkIsConfigAuthNotWithAutoMap({
            name: checkIsConfigAuthNotWithAutoMapName,
            resource,
            // typeName,
            fieldName: field.name,
          })) {
            // // 先看看是不是表和挂载名相同，如果不同，才增加。
            // if (pluralize(toUnderlineCamelCase(checkIsConfigAuthNotWithAutoMapName)) !== pluralize(toUnderlineCamelCase(typeName))) {
            //   // 再看看是不是直接教师忽略的那些表。
            //   if (teacherTablesMap[toUnderlineCamelCase(checkIsConfigAuthNotWithAutoMapName)]) {
            //     // 这里是教师的特殊表
            //   }
            //   else {
            //     // 这里存储下那些 尚未配置权限的字段
            //     noAuthObjArr.push(checkIsConfigAuthNotWithAutoMapName);
            //     noAuthFieldArr.push(`${checkIsConfigAuthNotWithAutoMapName}.${field.name}`);
            //   }
            // }

            // 判断是不是存在该权限。这种情况下面，不同角色下面，应该经常的出现
            // 再看看是不是直接教师忽略的那些表。
            if (teacherTablesMap[toUnderlineCamelCase(checkIsConfigAuthNotWithAutoMapName)]) {
              // 这里是教师的特殊表
            }
            else {
              // 这里存储下那些 尚未配置权限的字段
              noAuthObjArr.push(checkIsConfigAuthNotWithAutoMapName);
              noAuthFieldArr.push(`${checkIsConfigAuthNotWithAutoMapName}.${field.name}`);
            }
          }
        }

        if (hasAuthResource({
          // name,
          resource,
          typeName,
          fieldName: field.name,
        })) {
          // fieldKeys.push({
          //   type: _.get(field, 'type.ofType.name') || _.get(field, 'type.name'),
          //   key: childKeyBranch.slice(1).join('.'),
          // });
          currentComplexity += 1;
          if (fieldObject.childFilds) {
            fieldObject.childFilds.push(field.name);
          }
          else {
            fields.push(field.name);
          }
          return true;
        }
        return false;
      }

      if (fieldObject.union && 'OBJECT' === _.get(field, 'kind')) {
        // debugger
        // if (!hasAuthResource({
        //   // name,
        //   resource,
        //   typeName,
        //   fieldName: field.name,
        //   type: 'object',
        // })) {
        //   return false;
        // }

        currentComplexity += 1;
        const childFilds = [];
        const childTypeName = _.get(field, 'name');
        const childObject = _.cloneDeep(_.find(types, {
          kind: _.get(field, 'kind'),
          name: childTypeName,
        }));
        // console.log('unionunion', field.name, fieldObject.deep + 1)
        // 字段的path，例如：classesPagination.items.department
        childObject.parentName = `${fieldObject.parentName}.${childTypeName}`;
        childObject.childFilds = childFilds;
        // 层级
        childObject.deep = fieldObject.deep + 1;
        const childInfo = {
          key: `...on ${field.name}`,
          value: childFilds,
        };

        if (fieldObject.childFilds) {
          fieldObject.childFilds.push(childInfo);
        }
        else {
          fields.push(childInfo);
        }
        queue.push(childObject);

        return true;
      }

      // 对象类型的语法 build
      if ('OBJECT' === _.get(field, 'type.kind') || 'OBJECT' === _.get(field, 'type.ofType.kind')) {
        // window.console.info('field.name', field.name);

        // 如果是object类型，先判断当前object有没权限再进行递归
        // if ('items' !== field.name && !hasAuthResource({
        //   // name,
        //   resource,
        //   typeName,
        //   fieldName: field.name,
        //   type: 'object',
        // })) {
        //   return false;
        // }

        currentComplexity += 1;
        const childFilds = [];
        const childTypeName = _.get(field, 'type.ofType.name') || _.get(field, 'type.name');
        const childObject = _.cloneDeep(_.find(types, {
          kind,
          name: childTypeName,
        }));

        // 字段的path，例如：classesPagination.items.department
        childObject.parentName = `${fieldObject.parentName}.${field.name}`;
        childObject.childFilds = childFilds;
        // 层级
        childObject.deep = fieldObject.deep + 1;
        const childInfo = {
          key: field.name,
          value: childFilds,
        };

        if (fieldObject.childFilds) {
          fieldObject.childFilds.push(childInfo);
        }
        else {
          fields.push(childInfo);
        }
        queue.push(childObject);

        return true;
      }

      if ('UNION' === _.get(field, 'type.kind')) {
        const unionName = _.get(field, 'name');
        const unionTypeName = _.get(field, 'type.name');

        const unionFieldObject = _.cloneDeep(_.find(types, {
          kind: 'UNION',
          name: unionTypeName,
        }));

        currentComplexity += 1;

        const childFilds = [];

        unionFieldObject.parentName = `${fieldObject.parentName}.${unionName}`;
        unionFieldObject.childFilds = childFilds;
        unionFieldObject.union = true;
        // 层级
        unionFieldObject.deep = fieldObject.deep;
        // console.log('union', field.name, fieldObject.deep)
        const childInfo = {
          key: unionName,
          value: childFilds,
        };

        if (fieldObject.childFilds) {
          fieldObject.childFilds.push(childInfo);
        }
        else {
          fields.push(childInfo);
        }
        queue.push(unionFieldObject);

        return true;
      }
      return false;
    });
  }

  const argsObj = {};

  _.each(args, (elem) => {
    const type = _.get(elem, 'type.ofType.name') || _.get(elem, 'type.name') || '';
    if (elem.name && type) {
      argsObj[elem.name] = type;
    }
  });

  if (__DEV__ && __PROD__ && _.get(noAuthObjArr, 'length')) {
    window.console.log('部分权限不存在，请查看是否已经配置。', '查阅 _.uniq(debugAddSave.noAuthObjArr) 和 _.uniq(debugAddSave.noAuthFieldArr)');
  }

  return {
    argsObj,
    fields,
    currentComplexity,
  };
}

function buildSchemeStr(fields, deep = 1) {
  let scheme = '';
  for (let i = 0; i < fields.length; i += 1) {
    const prefixSpace = _.map(_.range(0, deep), '').join('  ');
    const field = fields[i];
    if ('object' === typeof field) {
      if (_.isEmpty(field.value)) {
        fields.splice(i, 1);
        i -= 1;
        // eslint-disable-next-line no-continue
        continue;
      }
      scheme += `\n${prefixSpace}${field.key} {\n  ${prefixSpace}${buildSchemeStr(field.value, deep + 1)}\n${prefixSpace}}`;
    }
    else {
      scheme += `${field} `;
    }
  }
  return scheme;
}

export default function buildSchemeBFS({
  types,
  name,
  typeName,
  deep,
  maxDeep,
  resource,
  args = [],
  parentFieldTypeIsList = false,
  maxComplexity = CONSTANTS.MAX_COMPLEXITY,
}) {
  const queue = [];
  const fields = [];
  let complexity = 0;
  const firstObject = _.find(types, {
    kind: 'OBJECT',
    name: typeName,
  });
  firstObject.parentName = typeName;
  firstObject.deep = deep;
  queue.push(firstObject);
  for (let i = 0; i < queue.length; i += 1) {
    const fieldObject = queue[i];
    const currentDeep = fieldObject.deep;
    // 层数判断
    if (currentDeep > maxDeep) {
      break;
    }

    const {
      currentComplexity,
    } = buildFileds({
      queue,
      types,
      name,
      // typeName,
      resource,
      args,
      parentFieldTypeIsList,
      fieldObject,
      fields,
    });

    // 总的复杂度计算
    complexity += currentComplexity;
    if (complexity >= maxComplexity) {
      break;
    }
  }

  const scheme = `\n${typeName} {${buildSchemeStr(fields)}}`.replace(/\s+\n/ig, '\n');
  const newFields = [];
  for (let i = 0; i < fields.length; i += 1) {
    if ('string' === fields[i]) {
      newFields.push(fields[i]);
    }
    else {
      newFields.push(buildSchemeStr([fields[i]]));
    }
  }

  return {
    scheme,
    fields: newFields,
  };
}
