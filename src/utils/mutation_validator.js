import { getState, getStore } from './get_app';

export const ignoreCheckKey = [];

export const intType = ['Int', 'bigint'];

export const stringType = ['String'];

export function validatorMethod(value, type) {
  if (_.includes(intType, type)) {
    return _.isNumber(value);
  }
  else if (_.includes(stringType, type)) {
    return _.isString(value);
  }
  // 开发环境为false，怕后端有其他类型
  return !__DEV__;
}

/**
 * 类型校验和字段校验，由于有可选字段还有兼容以往的情况，所以以提交的values为主体作为校验
 */
export function valueTypeValueValidator(values, validator, preFix = '') {
  let typeErrors = [];
  let diffErrors = [];
  if (!values) {
    return {
      typeErrors,
      diffErrors,
      values,
    };
  }

  const validatorKeys = [..._.keys(validator), ...ignoreCheckKey];
  _.forIn(values, (value, key) => {
    if (!_.includes(validatorKeys, key) && !_.includes(ignoreCheckKey, key)) {
      diffErrors.push(`${preFix}${key}`);
    }
    if (!_.includes(ignoreCheckKey, key) && value) {
      const types = _.get(validator, key);
      if (_.isString(types)) {
        if (!validatorMethod(value, types)) {
          typeErrors.push(`提交字段${preFix}${key}类型错误,应为${types}类型`);
        }
      }
      else if ('LIST' === _.get(types, 'type')) {
        const listType = _.get(types, 'value');
        if (_.isString(listType)) {
          if (!_.isArray(value) || !value.every(item => validatorMethod(item, listType))) {
            typeErrors.push(`提交字段${preFix}${key}数组类型错误,应为${types}类型`);
          }
        }
        else {
          _.each(value, (ele, index) => {
            const errorObj = valueTypeValueValidator(ele, listType, `${key}.${index}.`);
            diffErrors = diffErrors.concat(_.get(errorObj, 'diffErrors'));
            typeErrors = typeErrors.concat(_.get(errorObj, 'typeErrors'));
          });
        }
      }
      else if ('INPUT_OBJECT' === _.get(types, 'type')) {
        const listType = _.get(types, 'value');
        const errorObj = valueTypeValueValidator(value, listType, `${key}.`);
        diffErrors = diffErrors.concat(_.get(errorObj, 'diffErrors'));
        typeErrors = typeErrors.concat(_.get(errorObj, 'typeErrors'));
      }
    }
  });

  return {
    diffErrors,
    typeErrors,
    values,
  };
}


export function buildMutation(typesObj, inputType) {
  const inputFields = _.get(typesObj, `${inputType}.inputFields`);
  if (!inputFields) {
    return null;
  }
  const valuesType = {};
  _.each(inputFields, (item) => {
    let valueType = '';
    const typeKind = _.get(item, 'type.kind');
    if ('SCALAR' === typeKind) {
      valueType = _.get(item, 'type.name');
    }
    else if ('LIST' === typeKind) { // 当你没有多重数组
      if ('SCALAR' === _.get(item, 'type.ofType.kind')) {
        valueType = { type: 'LIST', value: _.get(item, 'type.ofType.name') };
      }
      else {
        valueType = { type: 'LIST', value: buildMutation(typesObj, _.get(item, 'type.ofType.name')) };
      }
    }
    else if ('INPUT_OBJECT' === typeKind) {
      valueType = { type: 'INPUT_OBJECT', value: buildMutation(typesObj, _.get(item, 'type.name')) };
    }
    valuesType[item.name] = valueType;
  });

  return valuesType;
}

function getCacheInGraphqlValidator(mutationName) {
  const state = getState();
  const store = getStore();
  const mutation = _.get(state, 'graphql.mutation');
  if (!mutation || !_.get(mutation, mutationName) || !mutationName) {
    return false;
  }
  // 不是undefined就是有构建过
  if (_.get(mutation, `${mutationName}.validator`) !== undefined) {
    return _.get(mutation, `${mutationName}.validator`);
  }
  const payload = {};
  let typesObjectHash = _.get(state, 'graphql.typesObjectHash');
  if (!typesObjectHash) {
    const typesObject = _.get(state, 'graphql.typesObject');
    typesObjectHash = typesObject.reduce((sum, n) => {
      // eslint-disable-next-line
      sum[n.name] = n;
      return sum;
    }, {});
    payload.typesObjectHash = typesObjectHash;
  }
  const validator = buildMutation(typesObjectHash, _.get(mutation, `${mutationName}.inputType`));
  mutation[mutationName].validator = validator;
  payload.mutation = mutation;
  store.dispatch({
    type: 'graphql/save',
    payload,
  });
  return validator;
}


function validatorMutation(mutationName, values) {
  const validator = getCacheInGraphqlValidator(mutationName);
  if (!validator || _.isEmpty(validator)) {
    return values;
  }
  let newValues = { ...values };
  const errorsObj = valueTypeValueValidator(values, validator);
  const typeErrors = _.get(errorsObj, 'typeErrors', []);
  const diffErrors = _.get(errorsObj, 'diffErrors', []);
  if (_.get(typeErrors, 'length')) {
    window.console.error(`mutation: ${typeErrors.join('\n')}`);
  }
  if (_.get(diffErrors, 'length')) {
    window.console.error(`mutation: 多余字段${diffErrors.join('、')}`);
  }
  try {
    _.each(diffErrors, (item) => {
      if (_.isString(item)) {
        const keys = item.split('.');
        //
        if (1 >= keys.length) {
          delete newValues[item];
        }
        else {
          const key = keys.splice(keys.length - 1, 1);
          // 获取上一层的引用，删除那个key
          const appoint = _.get(newValues, keys.join('.'));
          delete appoint[key];
        }
      }
    });
  }
  catch (error) {
    newValues = { ...values };
    window.console.log(error);
  }
  return newValues;
}


export default validatorMutation;
