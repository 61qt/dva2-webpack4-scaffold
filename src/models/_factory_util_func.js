import _ from 'lodash';
import moment from 'moment';
import buildTreeByArr from '../utils/build_tree_by_arr';

export const deepObjMomentFormat = (obj) => {
  const momentRegex = new RegExp(moment().format().replace(/\d/ig, '\\d').replace(/\+/ig, '\\+'));
  const momentRegexDay = new RegExp(moment().format('YYYY-MM-DD').replace(/\d/ig, '\\d').replace(/\+/ig, '\\+'));
  const newObj = {};
  for (const [k, v] of _.entries(obj)) {
    if (_.isArray(v)) {
      newObj[k] = [];
      _.each(v, (elem) => {
        newObj[k].push(deepObjMomentFormat(elem));
      });
    }
    else if (_.isObject(v)) {
      newObj[k] = deepObjMomentFormat(v);
    }
    else if (momentRegex.test(v)) {
      if (moment(v).isValid()) {
        // eslint-disable-next-line no-param-reassign
        newObj[k] = moment(v);
      }
      else {
        newObj[k] = undefined;
      }
    }
    else if (momentRegexDay.test(v)) {
      if (moment(v).isValid()) {
        // eslint-disable-next-line no-param-reassign
        newObj[k] = moment(v);
      }
      else {
        newObj[k] = undefined;
      }
    }
    else {
      newObj[k] = v;
    }
  }
  return newObj;
};

export function saveTreeReducers(state, { payload: { allList, tree, key } }) {
  return { ...state, allList, tree, key, allLoaded: true };
}

export function treeEffects({ modelName, Service, isBuildDownIds = false, eachCallback, ...options }) {
  return function *treeEffectsAsync({ payload = {} }, { call, put, select }) {
    if ('area' === modelName) {
      window.console.log('area tree run');
    }
    // payload { force: true } , 表示强制更新这棵树
    let data = [];
    const allLoaded = yield select(state => state[modelName].allLoaded);
    if (allLoaded && !payload.force) {
      const oldState = yield select(state => state[modelName]);
      return Promise.resolve(oldState);
    }

    try {
      const resData = yield call(Service.graphqlAll, {
        ...options.payload,
        ...payload,
      });
      data = resData.data;
    }
    catch (e) {
      return Promise.reject(e);
    }

    const buildTreeByArrOptions = {
      arr: data,
      isBuildDownIds,
      eachCallback: eachCallback || function eachCallbackFunc(elem) {
        return elem;
      },
    };

    // 增加的追加属性的方法，这个是一个不好的操作，目前只在图书分类那里使用到。
    if ('function' === typeof options.addAttrFunc) {
      buildTreeByArrOptions.addAttrFunc = options.addAttrFunc;
    }
    const buildedTreeObj = buildTreeByArr(buildTreeByArrOptions);

    const savePayload = {
      key: buildedTreeObj.key,
      allList: buildedTreeObj.allList,
      tree: buildedTreeObj.tree,
    };

    yield put({
      type: 'saveTree',
      payload: savePayload,
    });

    return savePayload;
  };
}
