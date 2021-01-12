// 这里是 copy array-move ^2.1.0 包的源代码
// 因为原来的包的源代码是 commonjs 规范
// 这里复制转换成 es 模块语法
const arrayMoveMutate = (array, from, to) => {
  // eslint-disable-next-line yoda
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
};

const arrayMove = (array, from, to) => {
  // eslint-disable-next-line no-param-reassign
  array = array.slice();
  arrayMoveMutate(array, from, to);
  return array;
};

export default arrayMove;
export const mutate = arrayMoveMutate;

