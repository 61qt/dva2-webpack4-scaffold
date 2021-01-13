/* eslint-disable no-console */

const _ = require('lodash');
// const fs = require('fs');
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');

// const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const os = require('os');

const babelrcConfig = require('./.babelrc');
const {
  SOCKET_SERVER,
  projConfig,
  publicPath,
  theme,
  isProd,
  proj,
  port,
  buildModule,
  defineObj,
} = require('./get_builded_config');

function formatDefine(obj) {
  const newObj = {};
  _.map(_.entries(obj), ([key, value]) => {
    newObj[key] = JSON.stringify(value);
  });
  return newObj;
}

const plugins = [
  // new InterpolateHtmlPlugin(HtmlWebpackPlugin, defineObj),
  // new webpack.ProvidePlugin(formatDefine(defineObj)),
  new webpack.DefinePlugin(formatDefine(defineObj)),
  new HtmlWebpackPlugin({
    inject: true,
    template: './src/index.ejs',
    filename: 'index.html',
    hash: false,
    compile: true,
    favicon: false,
    minify: false,
    cache: true,
    showErrors: true,
    chunks: 'all',
    excludeChunks: [],
    title: 'Webpack App',
    xhtml: false,
  }),
  isProd && new MiniCssExtractPlugin({
    ignoreOrder: true,
    filename: isProd ? '[name].[hash:8].css' : '[name].css',
  }),
  new CleanWebpackPlugin(),
  new CopyWebpackPlugin([
    {
      from: path.resolve(__dirname, 'public'),
    },
  ]),
  new OptimizeCssAssetsPlugin({
    assetNameRegExp: /\.css$/g,
    cssProcessor: require('cssnano'),
    cssProcessorOptions: { discardComments: { removeAll: true } },
    canPrint: true,
  }),
  new SpriteLoaderPlugin(),
  new SpritesmithPlugin({
    src: {
      cwd: path.resolve(__dirname, 'src/sprites/png'),
      glob: `{*,${buildModule}/*}.png`,
    },
    spritesmithOptions: {
      padding: 20,
    },
    target: {
      image: path.resolve(__dirname, `src/.sprites/${buildModule}/sprites.png`),
      css: path.resolve(__dirname, `src/.sprites/${buildModule}/sprites.less`),
    },
    apiOptions: {
      cssImageRef: isProd ? 'sprites.[hash:8].png' : 'sprites.png',
    },
  }),
  new webpack.HashedModuleIdsPlugin(),
].filter(item => !!item);

// scratch 相关包单独处理
if ('makerspace' === buildModule) {
  plugins.push(new CopyWebpackPlugin([{
    from: 'node_modules/scratch-render/dist/web/scratch-render.min.js',
    to: 'scratch-render/dist/web/',
  }, {
    from: 'node_modules/scratch-svg-renderer/dist/web/scratch-svg-renderer.js',
    to: 'scratch-svg-renderer/dist/web/',
  }, {
    from: 'vender/scratch-vm.min.js',
    to: 'scratch-vm/dist/web/',
  }]));
}

const moduleRules = [
  {
    test: /\.svg$/,
    use: [
      {
        loader: 'svg-sprite-loader',
        options: {
          extract: true,
          spriteFilename: isProd ? 'static/sprite.[hash:8].svg' : 'sprite.svg',
        },
      },
      {
        loader: 'svg-transform-loader',
        options: {},
      },
      {
        loader: 'svgo-loader',
        options: {
          plugins: [
            { removeTitle: true },
            { removeStyleElement: true },
          ],
        },
      },
    ],
  },
  {
    // test: /\.(woff|eot|ttf|svg|gif)$/,
    exclude: [
      /\.html|ejs$/,
      /\.json$/,
      /\.(js|jsx|ts|tsx)$/,
      /\.(css|less|scss|sass)$/,
      /\.svg$/,
    ],
    use: [{
      loader: 'url-loader',
      options: {
        limit: false,
        name: isProd ? 'static/[name].[hash:8].[ext]' : 'static/[name].[ext]',
      },
    }],
  },
  {
    test: /\.(js|jsx)$/,
    include: [
      path.resolve(__dirname, 'src'),
      /node_modules[\\/]scratch-[^\\/]+[\\/]src/,
      /node_modules[\\/]scratch-render[\\/]dist/,
      /node_modules[\\/]pify/,
      /node_modules[\\/]uri-js/,
      /node_modules[\\/]@vernier[\\/]godirect/,
    ],
    use: [
      'thread-loader',
      {
        loader: 'babel-loader',
        options: {
          ...babelrcConfig,
        },
      },
    ],
  },
  {
    test: /\.css$/,
    use: [
      isProd ? MiniCssExtractPlugin.loader : 'style-loader',
      'thread-loader',
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
        },
      },
      'postcss-loader',
    ],
  },
  {
    test: /\.less$/,
    use: [
      isProd ? MiniCssExtractPlugin.loader : 'style-loader',
      'thread-loader',
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          modules: true,
          localIdentName: '[name]_[local]-[hash:base64:5]',
        },
      },
      'postcss-loader',
      {
        loader: 'less-loader',
        options: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: theme,
          },
        },
      },
    ],
    exclude: /node_modules/,
  },
  {
    test: /\.less$/,
    use: [
      isProd ? MiniCssExtractPlugin.loader : 'style-loader',
      'thread-loader',
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
        },
      },
      'postcss-loader',
      {
        loader: 'less-loader',
        options: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: theme,
          },
        },
      },
    ],
    exclude: /src/,
  },
  // {
  //   test: /\.html$/,
  //   use: [{
  //     loader: 'file-loader',
  //     options: { name: '[name].[ext]' }
  //   }],
  // },
  // {
  //   test: /\.ejs$/,
  //   loader: 'ejs-loader',
  //   options: {
  //     variable: 'data',
  //     interpolate: '\\{\\{(.+?)\\}\\}',
  //     evaluate: '\\[\\[(.+?)\\]\\]'
  //   }
  // },
  // {
  //   test: /\.worker\.js$/,
  //   use: { loader: 'worker-loader' }
  // },
  // {
  //   test: /\.(png|svg|jpg|gif|ttf)$/,
  //   use: [
  //     {
  //       loader: 'url-loader',
  //       options: {
  //         limit: 8192,
  //         outputPath: './assets/',
  //       },
  //     },
  //   ],
  // },
];

const externals = {
  'js-cookie': 'Cookies',
  echarts: 'echarts',
  jquery: 'jQuery',
  'raven-js': 'Raven',
  lodash: '_',
  react: 'React',
  'react-dom': 'ReactDOM',
  antd: 'antd',
  'antd-mobile': 'window["antd-mobile"]',
  axios: 'axios',
  moment: 'moment',
  qs: 'Qs',
  'dingtalk-jsapi': 'dd',
  pluralize: 'pluralize',
  Viewer: 'Viewer',
  '@antv/data-set': 'DataSet',
  'scratch-render/dist/web/scratch-render.js': 'ScratchRender',
  'scratch-render': 'ScratchRender',
  'scratch-svg-renderer': 'ScratchSVGRenderer',
  'scratch-vm': 'VirtualMachine',
  'ali-react-table': 'window["ali-react-table"]',
};
const config = {
  externals,
  mode: isProd ? 'production' : 'development',
  entry: {
    index: path.resolve(__dirname, 'src', 'modules', buildModule, 'index.js'),
  },

  output: {
    filename: isProd ? '[name].[chunkhash:8].js' : '[name].js',
    // TODO .prod_v2
    path: path.resolve(__dirname, '.prod_v2', buildModule),
    publicPath,
    pathinfo: false,
    chunkFilename: isProd ? '[name].[chunkhash:8].js' : '[name].js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    // 路径别名配置
    alias: {
      src: path.resolve(__dirname, 'src/'),
      '@/': path.resolve(__dirname, 'src/'),
      '@': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: moduleRules,
  },
  stats: {
    children: false,
    warningsFilter: warn => -1 < warn.indexOf('Conflicting order between:'),
  },
  node: {
    fs: 'empty',
    module: 'empty',
  },
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       styles: {
  //         name: 'styles',
  //         test: /\.(css|less)/,
  //         chunks: 'all',
  //         enforce: true,
  //       },
  //       commons: {
  //         name: 'commons',
  //         chunks: 'initial',
  //         minChunks: 2,
  //       },
  //       vendors: {
  //         name: 'vendors',
  //         test: /[\\/]node_modules[\\/]/,
  //         priority: -10,
  //       },
  //     },
  //   },
  //   runtimeChunk: true,
  // },
  plugins,
};

if (!isProd) {
  config.devtool = 'eval-cheap-module-source-map';
}

if (!isProd) {
  config.devServer = {
    contentBase: [path.join(__dirname, 'public'), path.join(__dirname, 'static')],
    port,
    transportMode: 'ws',
    // http2: true,
    // https: {
    //   key: fs.readFileSync('./nginx/ssl.key'),
    //   cert: fs.readFileSync('./nginx/ssl.crt'),
    // },
    sockPath: SOCKET_SERVER,
    sockHost: 'demo-dev.example.cn',
    sockPort: 'location',
    watchContentBase: true,
    serveIndex: true,
    quiet: true,
    hot: true,
    publicPath,
    disableHostCheck: true,
  };
}

console.log('\n\n');
// console.log('config', config);
console.log('检查下面部分的配置是否出错。如果出错，就可能是打包传输的 proj 出错了。');
console.log('isProd', isProd);
console.log('proj', proj);
console.log('publicPath', publicPath);
console.log('buildModule', buildModule);
console.log('projConfig.CURRENT_IS_MOBILE', projConfig.CURRENT_IS_MOBILE);
console.log('projConfig.CURRENT_API_MODULE', projConfig.CURRENT_API_MODULE);
console.log('defineObj.DEFINE_PAGE_TITLE_TEXT', defineObj.DEFINE_PAGE_TITLE_TEXT);
console.log('defineObj.DEFINE_API_MODULE', defineObj.DEFINE_API_MODULE);

console.log('defineObj.DEFINE_FULL_API_DOMAIN_WITH_HTTP_PREFIX', defineObj.DEFINE_FULL_API_DOMAIN_WITH_HTTP_PREFIX);
console.log('defineObj.DEFINE_FULL_API_DOMAIN_WITH_HTTPS_PREFIX', defineObj.DEFINE_FULL_API_DOMAIN_WITH_HTTPS_PREFIX);

console.log('defineObj.DEFINE_FULL_OPENAPI_DOMAIN_WITH_HTTP_PREFIX', defineObj.DEFINE_FULL_OPENAPI_DOMAIN_WITH_HTTP_PREFIX);
console.log('defineObj.DEFINE_FULL_OPENAPI_DOMAIN_WITH_HTTPS_PREFIX', defineObj.DEFINE_FULL_OPENAPI_DOMAIN_WITH_HTTPS_PREFIX);
console.log('\n\n');

module.exports = config;
