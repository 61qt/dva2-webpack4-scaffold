import _ from 'lodash';
// import { notification } from 'antd';

export default function translator(msg = '', translateDict = [], options = {}) {
  if (__DEV__ && __PROD__) {
    window.console.log('options', options);
  }

  let translatedMsg = `${msg}`;
  // 先判断去掉横线的

  const translateDictIndex = {};

  _.map(_.range(0, 500), (index) => {
    translateDictIndex[`.${index}.`] = `【第${index + 1}项】`;
  });

  const translateDictExtendIndex = {
    ...translateDictIndex,
    ...translateDict,
  };

  const dictArr = _.entries(translateDictExtendIndex).sort((a, b) => {
    return _.get(b, '[0].length') - _.get(a, '[0].length');
  });


  // 再判断全匹配
  _.each(dictArr, ([key, value]) => {
    const regStr = key.replace(/[_-]/g, ' ').replace(/\./ig, '\\.');
    const regexp0 = new RegExp(`\\b${regStr}\\b`, 'g');
    const regexp1 = new RegExp(`\\b${key.replace(/\./ig, '\\.')}\\b`, 'g');
    // eslint-disable-next-line no-useless-escape
    const regexp2 = new RegExp(`\\b${key.replace(/([\[\]])/ig, '\\$1').replace(/\./ig, '\\.')}\\b`, 'g');
    // eslint-disable-next-line no-useless-escape
    const regexp3 = new RegExp(`${key.replace(/([\[\]])/ig, '\\$1').replace(/\./ig, '\\.')}`, 'g');
    if (undefined !== value) {
      translatedMsg = translatedMsg.replace(regexp0, value);
      translatedMsg = translatedMsg.replace(regexp1, value);
      translatedMsg = translatedMsg.replace(regexp2, value);
      translatedMsg = translatedMsg.replace(regexp3, value);
    }
  });

  translatedMsg = translatedMsg.replace(/^[:：]/, '');

  return translatedMsg;
}

// if (__DEV__) {
//   const msg = translator(`id_number: id number 不能为空
//     M2: id number 不能为空。
//     type: type 不能为空, title: title 不能为空`, {
//     type: '类型',
//     title: '标题',
//     id_number: '身份证号',
//     id: '编号',
//   });
//   window.console.log(msg);
// }
