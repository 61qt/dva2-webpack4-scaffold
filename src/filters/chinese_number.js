import _ from 'lodash';

const numArr = '零一二三四五六七八九十'.split('');

function chineseNumber(key = '') {
  if (10 === key * 1) {
    return numArr[key] || key;
  }

  const keyStrArr = _.split(key, '');
  const numberStrArr = [];
  _.each(keyStrArr, (elemKey) => {
    numberStrArr.push(numArr[elemKey] || elemKey);
  });
  return numberStrArr.join('');
}


export default chineseNumber;
