import modelFactory from './_factory';
import Service from '../services/post';

const modelExtend = {};

const modelName = 'post';
export default modelFactory({
  modelName,
  Service,
  modelExtend,
});
