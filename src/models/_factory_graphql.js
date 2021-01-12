import _ from 'lodash';
import CONSTANTS from '../constants';
import defaultService from '../services/common';

import {
  deepObjMomentFormat,
} from './_factory_util_func';

let initialState = {};
if (DEFINE_SHOULD_SAVE_STATE) {
  try {
    initialState = JSON.parse(sessionStorage.getItem(CONSTANTS.STORE_SAVE_KEY));
    for (const [model, value] of _.entries(initialState)) {
      if (__DEV__ && __PROD__) {
        window.console.log('model', model);
      }

      const searchValues = _.get(value, 'listState.searchValues') || {};

      _.set(value, 'listState.searchValues', deepObjMomentFormat(searchValues));
    }
  }
  catch (e) {
    initialState = {};
  }
}

export default function modelFactory({
  Service = defaultService,
  PAGE_SIZE = CONSTANTS.PAGE_SIZE,
  PAGE_SIZE_MAX = CONSTANTS.PAGE_SIZE_MAX,
  modelName = 'model',
  modelExtend = {},
}) {
  const defaultListState = {
    path: '',
    query: '',
    expand: false,
    searchValues: {},
    filter: [],
    siderExpanded: [],
    siderOrigin: [],
    siderValues: {},
    orderBy: '',
    sort: '',
  };

  let savedState = _.get(initialState, `${modelName}`) || {};
  if (!_.isPlainObject(savedState)) {
    savedState = {};
  }

  const initState = {
    start: savedState.start || 0,
    end: savedState.end || 0,
    list: [],
    listLoad: false,
    data: [],
    detail: {},
    total: null,
    hasMorePages: true,
    page: savedState.page || 1,
    pageSize: savedState.pageSize || PAGE_SIZE,
    pageMaxSize: PAGE_SIZE_MAX,
    listState: savedState.listState || defaultListState,
    summary: {},
    filterTotal: 0,
  };

  const extendInitState = _.defaultsDeep(modelExtend.state || {}, initState);

  const modelTemplate = _.defaultsDeep(modelExtend, {
    namespace: modelName,
    state: _.cloneDeep(extendInitState),
    reducers: {
      saveReset(state) {
        // reset 的时候，会进行除 tree 之外的数据信息的 reset 。
        const newState = {
          ...state,
          // 旧的 extend 的 state
          ..._.cloneDeep(modelExtend.state || {}),
          // 当前的 tree 相关的 state
          // 当前初始化的 state
          ..._.cloneDeep(initState),
          listState: defaultListState,
          pageSize: PAGE_SIZE,
          pageMaxSize: PAGE_SIZE_MAX,
          page: 1,
          expand: false,
        };

        // 部门树之类的。
        if (state.tree) {
          newState.tree = state.tree;
          newState.allList = state.allList;
          newState.allLoaded = state.allLoaded;
          newState.key = state.key;
        }

        // 部门当前的树之类的。
        if (state.currentTree) {
          newState.currentTree = state.currentTree;
          newState.currentAllList = state.currentAllList;
          newState.currentAllLoaded = state.currentAllLoaded;
          newState.currentKey = state.currentKey;
        }
        if (__DEV__ && __PROD__) {
          window.console.log('newState', JSON.stringify(newState));
        }

        return newState;
      },
      saveResetListState(state) {
        return {
          ...state,
          listState: _.cloneDeep(defaultListState),
          pageSize: PAGE_SIZE,
          pageMaxSize: PAGE_SIZE_MAX,
          page: 1,
          expand: false,
        };
      },
      saveDetail(state, { payload }) {
        const detail = {
          // ...state.detail,
          ...payload,
        };
        return { ...state, detail };
      },

      saveList(state, { payload }) {
        const { data: list, total, page, pageSize, start, end, hasMorePages } = payload;
        return {
          ...state,
          list,
          total,
          page,
          pageSize,
          start,
          end,
          listLoad: true,
          hasMorePages: !!hasMorePages,
          hasData: 0 < _.get(list, 'length', 0),
        };
      },

      saveMaxList(state, { payload: { data: maxList, total, page, pageMaxSize, start, end, hasMorePages } }) {
        return {
          ...state,
          maxList,
          total,
          page,
          pageMaxSize,
          start,
          end,
          listLoad: true,
          hasMorePages: !!hasMorePages,
          hasData: 0 < _.get(maxList, 'length', 0),
        };
      },

      saveListState(state, { payload: { filter = '', searchValues = {}, query = '', expand = false, ...rest } }) {
        const listState = {
          filter,
          searchValues,
          query,
          expand,
          ...rest,
        };
        return { ...state, listState };
      },

      // saveAll(state, { payload: { data: all } }) {
      //   return { ...state, allLoaded: true, all };
      // },
      saveSummary(state, { payload: { data: summary } }) {
        return { ...state, summary };
      },
      saveFilterTotal(state, { payload: { total: filterTotal } }) {
        return { ...state, filterTotal };
      },
    },
    effects: {
      *summary({ payload: { filter = '', query = '', id = '', ...rest } }, { call, put }) {
        if (!Service.graphqlSummary) {
          return Promise.resolve({});
        }

        try {
          const data = yield call(Service.graphqlSummary, { id, filter, query, ...rest });
          yield put({
            type: 'saveSummary',
            payload: {
              data: data.data,
            },
          });
          return data;
        }
        catch (e) {
          yield put({
            type: 'saveSummary',
            payload: {
              data: {},
            },
          });
          return Promise.reject(e);
        }
      },
      *list({ payload: { page = 1, pageSize: pageSizeArgs, query = '', filter = '', orderBy = '', sort = '', extraListSchemeParams = {}, ...rst } }, { call, put, select }) {
        let pageSize;
        if (pageSizeArgs) {
          pageSize = pageSizeArgs;
        }
        else {
          pageSize = yield select(state => state[modelName].pageSize);
        }
        try {
          const data = yield call(Service.graphqlList, { page, filter, query, pageSize, orderBy, sort, extraListSchemeParams, ...rst });
          const modelData = _.get(data, 'data');
          const start = modelData.perPage * 1 * (modelData.currentPage * 1 - 1) * 1 + 1;
          const length = _.get(modelData, 'data.length') * 1 || 0;
          yield put({
            type: 'saveList',
            payload: {
              ...modelData,
              pageSize: modelData.perPage * 1,
              page: modelData.currentPage,
              start,
              end: start + length - 1,
            },
          });
          return data;
        }
        catch (e) {
          yield put({
            type: 'saveList',
            payload: {
              data: [],
              pageSize,
              total: 0,
              hasMorePages: false,
              page: 1,
              start: 0,
              end: 0,
            },
          });
          return Promise.reject(e);
        }
      },

      *filterTotal({ payload: { filter = '' } }, { call, put }) {
        try {
          const data = yield call(Service.filterTotal, { filter });
          const modelData = _.get(data, 'data');
          const total = _.get(modelData, 'total') * 1 || 0;
          yield put({
            type: 'saveFilterTotal',
            payload: {
              total,
            },
          });
          return data;
        }
        catch (e) {
          yield put({
            type: 'saveFilterTotal',
            payload: {
              total: 0,
            },
          });
          return Promise.reject(e);
        }
      },

      *maxList({ payload: { page = 1, filter = '', query = '', ...rst } }, { call, put, select }) {
        const pageMaxSize = yield select(state => state[modelName].pageMaxSize);
        try {
          const data = yield call(Service.graphqlMaxList, { page, filter, query, pageSize: pageMaxSize, ...rst });
          const modelData = _.get(data, 'data');
          const start = modelData.perPage * 1 * (modelData.currentPage * 1 - 1) * 1 + 1;
          const length = _.get(modelData, 'data.length') * 1 || 0;
          yield put({
            type: 'saveMaxList',
            payload: {
              ...modelData,
              pageMaxSize: modelData.perPage * 1,
              page: modelData.currentPage,
              start,
              end: start + length - 1,
            },
          });
          return data;
        }
        catch (e) {
          yield put({
            type: 'saveMaxList',
            payload: {
              data: [],
              pageMaxSize,
              total: 0,
              hasMorePages: false,
              page: 1,
              start: 0,
              end: 0,
            },
          });
          return Promise.reject(e);
        }
      },

      *remove({ payload: { id, values = {} } }, { call }) {
        try {
          const data = yield call(Service.graphqlRemove, id, values);
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *patchRemove({ payload: { ids, extraData = {} } }, { call }) {
        try {
          const data = yield call(Service.graphqlPatchRemove, { ids, extraData });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *patchUpdate({ payload: { mutationType, id, values } }, { call }) {
        try {
          const data = yield call(Service.graphqlPatchUpdate, mutationType, id, values);
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *patch({ payload: { mutationType, ids, values } }, { call }) {
        try {
          const data = yield call(Service.graphqlPatch, mutationType, ids, values);
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *update({ payload: { id, values } }, { call }) {
        try {
          const data = yield call(Service.graphqlUpdate, id, values);
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *create({ payload: { values } }, { call }) {
        try {
          const data = yield call(Service.graphqlCreate, values);
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *detail({ payload: values }, { call, put }) {
        try {
          const data = yield call(Service.graphqlDetail, values);
          const detail = _.get(data, 'data');
          if (!detail) {
            return Promise.reject('找不到该资源');
          }
          yield put({
            type: 'saveDetail',
            payload: detail,
          });
          return detail;
        }
        catch (e) {
          yield put({
            type: 'saveDetail',
            payload: {},
          });
          return Promise.reject(e);
        }
      },

      // 存储 index 的搜索状态的。
      *listState({ payload }, { put, select }) {
        const listState = yield select(state => state[modelName].listState);
        yield put({
          type: 'saveListState',
          payload: {
            ...listState,
            ...payload,
          },
        });
        return true;
      },

      *reset(payload, { put }) {
        yield put({
          type: 'saveReset',
          payload: {},
        });
        return {};
      },
      *resetListState(payload, { put }) {
        yield put({
          type: 'saveResetListState',
          payload: {},
        });
      },
      *mutationFactory({ payload: { id, values, name } }, { call }) {
        try {
          const data = yield call(Service.mutationFactory, {
            id,
            values,
            name,
          });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },
    },
    subscriptions: {},
  });
  return modelTemplate;
}
