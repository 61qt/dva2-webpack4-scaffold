function makeFilePrefix(fn) {
  return (fileName) => {
    return fn(`./${fileName}`);
  };
}

// require.context 路径参数只能为字符串字面量
// doc: https://webpack.js.org/guides/dependency-management/#require-with-expression
export const requireAssetLogo = makeFilePrefix(require.context('../assets/logo', false, /\.png$/));
export const requireSpritesSvg = makeFilePrefix(require.context('../sprites/svg', false, /\.svg$/));
