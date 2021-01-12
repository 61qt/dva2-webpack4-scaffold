const bmiRegex = /(\bbmi[-_]|[-_]bmi\b|\bbmi\b|[-_]bmi[-_])/ig;
function isBmi(str) {
  // 判断是多了， replace 错了，不管了
  return 'health' === DEFINE_MODULE && bmiRegex.test(str);
  // return /\bbmi[-_]/ig.test(str) || /[-_]bmi\b/ig.test(str) || /\bbmi\b/ig.test(str) || /[-_]bmi[-_]/ig.test(str);
}

// 创建双驼峰的变量名。
function toBothCamelCase(str = '') {
  let transferedStr = `${str || ''}`.replace(/[-_]\w/ig, (match) => {
    return match.charAt(1).toUpperCase();
  }).replace(/^[a-z]/, (match) => {
    return match.charAt(0).toUpperCase();
  });

  if (isBmi(str)) {
    transferedStr = transferedStr.replace(/bmi/ig, 'BMI');
  }

  return transferedStr;
}

// 创建单驼峰的变量名。
function toCamelCase(str = '') {
  let transferedStr = `${str || ''}`.replace(/[-_]\w/ig, (match) => {
    return match.charAt(1).toUpperCase();
  });

  if (isBmi(str)) {
    transferedStr = transferedStr.replace(/bmi/ig, 'BMI');
  }

  return transferedStr;
}

// 创建单驼峰的变量名。
function toUnderlineCamelCase(str = '') {
  let transferedStr = `${str || ''}`;
  if (/BMI/g.test(str)) {
    transferedStr = transferedStr.replace(/BMI/g, 'Bmi');
  }

  transferedStr = `${transferedStr || ''}`.replace(/[A-Z]/g, (match) => {
    return `_${match.charAt(0).toLocaleLowerCase()}`;
  });

  return transferedStr;
}
// window.toUnderlineCamelCase = toUnderlineCamelCase;
export {
  toCamelCase,
  toBothCamelCase,
  toUnderlineCamelCase,
};
