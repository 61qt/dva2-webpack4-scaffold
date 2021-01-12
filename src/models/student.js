import { DICT } from '@/constants';
import graphqlModelFactory from './_factory_graphql';
import Service from '../services/student';

const modelName = 'student';

const modelExtend = {
  state: {
    studentFormValue: {},
    current: {},
  },
  reducers: {
    saveAudit(state, { payload: { values } }) {
      return {
        ...state,
        saveAudit: values,
      };
    },
  },
  effects: {
    *audit({ payload: { ids = [] } }, { call }) {
      try {
        const data = yield call(Service.enrollDelete, {
          ids,
        });
        return data;
      }
      catch (e) {
        return Promise.reject(e);
      }
    },
  },
};

export default graphqlModelFactory({
  modelName,
  Service,
  modelExtend,
});
