// import _ from 'lodash';

// 先加载全部的那个 model
const modelsAll = [
  {
    model: require('./student').default, // 学生
    module: ['example'],
  },
  {
    model: require('./post').default, // 文章
    module: [],
    isBaseModel: true, // 基础模块
  },
];

const models = [];

// 检查没加入模块中
function checkAndPush(model = {}) {
  if (model && model.namespace) {
    models.push(model);
  }
  else if (__DEV__) {
    window.console.error('model 添加失败');
    window.console.log('model', model);
  }
}
// 设置，识别是不是应该加载
_.map(modelsAll, (model) => {
  if (model.isBaseModel) {
    checkAndPush(model.model);
  }
  else if (model.module && model.module.includes && _.includes(model.module, DEFINE_MODULE)) {
    checkAndPush(model.model);
  }
  // else if (__PROD__) {
  //   checkAndPush(model.model);
  // }
});

export function modelReset(dispatch) {
  models.forEach((model) => {
    dispatch({
      type: `${model.namespace}/reset`,
    });
  });
}

// export function modelResetListState(dispatch) {
//   // window.console.log('modelResetListState', models.length);
//   models.forEach((model) => {
//     dispatch({
//       type: `${model.namespace}/resetListState`,
//     });
//   });
// }

export default models;
