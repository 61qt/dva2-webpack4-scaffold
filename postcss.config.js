const autoprefixer = require('autoprefixer');
const pxtorem = require('postcss-pxtorem');
const postcssPresetEnv = require('postcss-preset-env');
const postcssFlexbugsFixesPlugin = require('postcss-flexbugs-fixes');

const { projConfig } = require('./get_builded_config');

const postCSSPlugins = [
  postcssPresetEnv,
  autoprefixer,
  postcssFlexbugsFixesPlugin({
    flexbox: 'no-2009',
  }),
];

if (projConfig.CURRENT_IS_MOBILE) {
  postCSSPlugins.push(
    pxtorem({
      rootValue: 32,
      // rootValue: 16,
      // rootValue: 8,
      propWhiteList: [],
    })
  );
}

module.exports = {
  plugins: postCSSPlugins,
};
