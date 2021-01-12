
export function compareClass(isBoolean, trueName, falseName = '') {
  return isBoolean ? trueName : falseName;
}

// test
// const str = composeClass('test',[true, 'true'], [false, 'true2', 'false2'], 'yes')
// console.log(str)
// test true false2 yes
/**
 * @param  {...any} args 字符串，数组[true, trueClassNameStr, falseClassNameStr]
 * @return {string} className集合
 */
export function composeClass(...args) {
  let className = '';
  args.forEach((item) => {
    if ('string' === typeof item) {
      className = `${className} ${item}`;
    }
    else if (item instanceof Array) {
      className = `${className} ${compareClass(...item)}`;
    }
  });
  return className;
}

