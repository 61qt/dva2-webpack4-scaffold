import _ from 'lodash';

// 这个是最基础的 model ，只带有 reset 方法，

export default function modelFactory({
  modelName = 'model',
  modelExtend = {},
}) {
  const initState = {};

  const extendInitState = _.defaultsDeep(modelExtend.state || {}, initState);

  const modelTemplate = _.defaultsDeep(modelExtend, {
    namespace: modelName,
    state: _.cloneDeep(extendInitState),
    reducers: {
      saveReset() {
        return _.cloneDeep({
          ...extendInitState,
        });
      },
    },
    effects: {
      *reset(action, { put }) {
        const newState = _.cloneDeep(extendInitState);
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
