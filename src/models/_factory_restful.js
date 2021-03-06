import _ from 'lodash';
import CONSTANTS from '../constants';
import defaultService from '../services/common';

let initialState = {};
if (DEFINE_SHOULD_SAVE_STATE) {
  try {
    initialState = JSON.parse(sessionStorage.getItem(CONSTANTS.STORE_SAVE_KEY));
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
    query: '',
    expand: false,
    searchValues: {},
    filter: '',
  };

  let savedState = _.get(initialState, `${modelName}`) || {};
  if (!_.isPlainObject(savedState)) {
    savedState = {};
  }

  const initState = {
    start: savedState.start || 0,
    end: savedState.end || 0,
    list: [],
    data: [],
    detail: {},
    total: null,
    all: [],
    allLoaded: false,
    page: savedState.page || 1,
    pageSize: savedState.pageSize || PAGE_SIZE,
    pageMaxSize: PAGE_SIZE_MAX,
    listState: savedState.listState || defaultListState,
    summary: {},
  };

  const extendInitState = _.defaultsDeep(modelExtend.state || {}, initState);

  const modelTemplate = _.defaultsDeep(modelExtend, {
    namespace: modelName,
    state: _.cloneDeep(extendInitState),
    reducers: {
      saveReset() {
        return _.cloneDeep({
          ...extendInitState,
          listState: defaultListState,
        });
      },
      saveSummary(state, { payload: { data: summary } }) {
        return { ...state, summary };
      },
      saveDetail(state, { payload }) {
        const detail = {
          ...state.detail,
          ...payload,
        };
        return { ...state, detail };
      },

      saveList(state, { payload: { data: list, total, page, pageSize, start, end } }) {
        return { ...state, list, total, page, pageSize, start, end };
      },

      saveMaxList(state, { payload: { data: list, total, page, pageMaxSize, start, end } }) {
        return { ...state, list, total, page, pageMaxSize, start, end };
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

      saveAll(state, { payload: { data: all } }) {
        return { ...state, allLoaded: true, all };
      },
    },
    effects: {
      *list({ payload: { page = 1, pageSize: pageSizeArgs, query = '', filter = '', orderBy = '', sort = '', config = {} } }, { call, put, select }) {
        let pageSize;
        if (pageSizeArgs) {
          pageSize = pageSizeArgs;
        }
        else {
          pageSize = yield select(state => state[modelName].pageSize);
        }
        try {
          const data = yield call(Service.list, { page, filter, query, pageSize, orderBy, sort, config });
          const start = data.data.per_page * 1 * (data.data.current_page * 1 - 1) * 1 + 1;
          const length = _.get(data, 'data.data.length') * 1 || 0;
          yield put({
            type: 'saveList',
            payload: {
              data: data.data.data,
              total: data.data.total,
              pageSize: data.data.per_page * 1,
              page: data.data.current_page,
              start,
              end: start + length - 1,
            },
          });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *maxList({ payload: { page = 1, filter = '', query = '', orderBy = '', sort = '', config = {} } }, { call, put, select }) {
        const pageMaxSize = yield select(state => state[modelName].pageMaxSize);
        try {
          const data = yield call(Service.list, { page, filter, query, orderBy, sort, pageSize: pageMaxSize, config });
          const start = data.data.per_page * 1 * (data.data.current_page * 1 - 1) * 1 + 1;
          const length = _.get(data, 'data.data.length') * 1 || 0;
          yield put({
            type: 'saveMaxList',
            payload: {
              data: data.data.data,
              total: data.data.total,
              pageMaxSize: data.data.per_page * 1,
              page: data.data.current_page,
              start,
              end: start + length,
            },
          });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *remove({ payload: id }, { call, put }) {
        try {
          const data = yield call(Service.remove, id);
          yield put({ type: 'reload' });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *update({ payload: { id, values } }, { call, put }) {
        try {
          const data = yield call(Service.update, id, values);
          yield put({ type: 'reload' });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *create({ payload: { values } }, { call, put }) {
        try {
          const data = yield call(Service.create, values);
          yield put({ type: 'reload' });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *detail({ payload: values }, { call, put }) {
        try {
          const data = yield call(Service.detail, values);
          yield put({
            type: 'saveDetail',
            payload: data.data,
          });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *reload(action, { put, select }) {
        const page = yield select(state => state[modelName].page);
        const data = yield put({ type: 'list', payload: { page } });
        return data;
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

      *summary({ payload: { filter = '', query = '', id = '' } }, { call, put }) {
        try {
          const data = yield call(Service.summary, { id, filter, query });
          yield put({
            type: 'saveSummary',
            payload: {
              data: data.data,
            },
          });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },

      *all({ payload: { ignoreFilter = 1 } }, { call, put }) {
        try {
          const data = yield call(Service.list, { ignoreFilter });
          yield put({
            type: 'saveAll',
            payload: {
              data: data.data,
            },
          });
          return data;
        }
        catch (e) {
          return Promise.reject(e);
        }
      },
      *reset(action, { put }) {
        const newState = _.cloneDeep(initState);
        yield put({
          type: 'saveReset',
          payload: {
            ...newState,
          },
        });
        return newState;
      },
    },
    subscriptions: {},
  });
  return modelTemplate;
}
