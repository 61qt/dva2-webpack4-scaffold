
function numberToChinese({
  num,
  isMoney = true,
}) {
  // 汉字的数字
  const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  // 基本单位
  const cnIntRadice = ['', '拾', '佰', '仟'];
  // 对应整数部分扩展单位
  const cnIntUnits = ['', '万', '亿', '兆'];
  // 对应小数部分单位
  const cnDecUnits = ['角', '分', '毫', '厘'];
  // 整数金额时后面跟的字符
  const cnInteger = '整';
  // 整型完以后的单位
  const cnIntLast = '元';
  // 最大处理的数字
  const maxNum = 9999999999999999.9999;
  // 金额整数部分
  let IntegerNum;
  // 金额小数部分
  let DecimalNum;
  // 输出的中文金额字符串
  let ChineseStr = '';
  // 分离金额后用的数组，预定义
  let parts;
  if ('' === num) {
    return '';
  }
  let money = parseFloat(num);
  if (money >= maxNum) {
    // eslint-disable-next-line
    alert('价格数目过大，无法显示大写金额(超出最大处理数字)');
    return '';
  }
  if (0 === money) {
    if (isMoney) {
      return cnNums[0] + cnIntLast + cnInteger;
    }
    else {
      return cnNums[0];
    }
  }
  // 转换为字符串
  money = money.toString();
  if (-1 === money.indexOf('.')) {
    IntegerNum = money;
    DecimalNum = '';
  }
  else {
    parts = money.split('.');
    IntegerNum = parts[0];
    DecimalNum = parts[1].substr(0, 4);
  }
  // 获取整型部分转换
  if (0 < parseInt(IntegerNum, 10)) {
    let zeroCount = 0;
    const IntLen = IntegerNum.length;
    for (let i = 0; i < IntLen; i += 1) {
      const n = IntegerNum.substr(i, 1);
      const p = IntLen - i - 1;
      const q = p / 4;
      const m = p % 4;
      if ('0' === n) {
        zeroCount += 1;
      }
      else {
        if (0 < zeroCount) {
          ChineseStr += cnNums[0];
        }
        // 归零
        zeroCount = 0;
        ChineseStr += cnNums[parseInt(n, 10)] + cnIntRadice[m];
      }
      if (0 === m && 4 > zeroCount) {
        ChineseStr += cnIntUnits[q];
      }
    }
    if (isMoney) {
      ChineseStr += cnIntLast;
    }
    // 整型部分处理完毕
  }
  // 小数部分
  if ('' !== DecimalNum) {
    const decLen = DecimalNum.length;
    for (let i = 0; i < decLen; i += 1) {
      const n = DecimalNum.substr(i, 1);
      if ('0' !== n) {
        ChineseStr += cnNums[Number(n)] + cnDecUnits[i];
      }
    }
  }
  if ('' === ChineseStr) {
    if (isMoney) {
      ChineseStr += cnNums[0] + cnIntLast + cnInteger;
    }
  }
  else if ('' === DecimalNum) {
    if (isMoney) {
      ChineseStr += cnInteger;
    }
  }
  return ChineseStr;
}

export default numberToChinese;
