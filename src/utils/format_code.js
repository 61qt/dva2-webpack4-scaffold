export const convert26 = (params) => {
  let str = '';
  let num = params;
  while (0 <= num) {
    const m = num % 26;
    str = String.fromCharCode(m + 65) + str;
    num = parseInt(num / 26, 10) - 1;
  }
  return str;
};

export default {};

