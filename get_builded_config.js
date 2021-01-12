const git = require('git-rev-sync');
const moment = require('moment');

const { getProjectConfig } = require('./get_config');

const buildModule = process.env.RELEASE_MODULE || 'app';
const proj = process.env.proj || 'tianshui';
const port = process.env.PORT || '9000';
// NODE_ENV 不要了，改成 mode 。
// const isProd = 'production' === process.env.NODE_ENV ? true : ('production' === process.env.mode ? true : false);
const isProd = 'production' === process.env.mode;

function getReleaseHash() {
  let releaseHash = '';
  if (isProd) {
    try {
      releaseHash = git.long();
    }
    catch (e) {
      // do nothing
    }
  }
  return releaseHash;
}

const projConfig = getProjectConfig({
  module: buildModule,
  proj,
});

const publicPath = projConfig.CURRENT_CDN;

// 这个是自动生成属性的 define 对象。
const defineObj = {};
// eslint-disable-next-line array-callback-return
Object.entries(projConfig).map((elem) => {
  defineObj[`DEFINE_${elem[0]}`] = elem[1];
});
Object.assign(defineObj, {
  __DEFINE_PROD__: isProd,
  __DEFINE_DEV__: !isProd,

  // 项目工具类的配置
  DEFINE_SENTRY_BASE_DOMAIN: projConfig.SENTRY_BASE_DOMAIN || '自己的 sentry 路径域名', // sentry.example.cn 或者 sentry.example.cn:8689
  DEFINE_SENTRY_PROJECT_TOKEN: projConfig.SENTRY_PROJECT_TOKEN || '自己的 sentry 统计 token', // 'c20ad4d76fe97759aa27a0c99bff6710'
  DEFINE_SENTRY_PEOJECT_ID: projConfig.SENTRY_PEOJECT_ID || '自己的 sentry 统计 id', // '3'
  DEFINE_BAIDU_TONGJI_KEY: projConfig.BAIDU_TONGJI_KEY || '自己的百度统计key', // 'c20ad4d76fe97759aa27a0c99bff6710'
  DEFINE_UMENG_ID: projConfig.UMENG_ID || '', // '自己的友盟统计id'
  DEFINE_UMENG_WEB_ID: projConfig.UMENG_WEB_ID || '', // '自己的友盟统计web_id'
  DEFINE_RELEASE_VERSION: getReleaseHash(),
  DEFINE_RELEASE_DATE: moment().format('YYYY-MM-DD--HH:mm:DD'),
  DEFINE_RELEASE_ENV: process.env.RELEASE_ENV || 'DEV',
  DEFINE_HOTJAR_KEY: projConfig.HOTJAR_KEY || '你的 HOTJAR key',

  // 系统配置
  // 系统当前的静态资源 cdn
  DEFINE_PUBLIC_PATH: publicPath,
  // 当前的系统名称
  DEFINE_MODULE: buildModule,
  // 系统当前 path name 的前缀， url 前缀
  DEFINE_WEB_PREFIX: projConfig.CURRENT_WEB_PREFIX,
  // 系统 graphql 请求路径， 项目的 api graphql 的路径
  DEFINE_GRAPHQL_PATH: projConfig.CURRENT_GRAPHQL_PATH,
  // 系统当前 path name 的前缀
  DEFINE_API_MODULE: projConfig.CURRENT_API_MODULE,
  // 是否是手机站点。
  DEFINE_IS_MOBILE: projConfig.CURRENT_IS_MOBILE,
  // 左侧边栏默认的宽度。
  DEFINE_SIDER_WIDTH: projConfig.CURRENT_SIDER_WIDTH,
  // 左侧边栏是否自动动画滚动，默认不滚动。
  DEFINE_SIDER_NEED_TRANSITION: projConfig.CURRENT_SIDER_NEED_TRANSITION,
});

const theme = {
  '@module': `'${buildModule}'`, // "'less-string-variable'",
  '@spriteImgPath': `'../.sprites/${buildModule}/sprites.png'`,
  '@spriteLessPath': `'../.sprites/${buildModule}/sprites.less'`,
};


module.exports = {
  SOCKET_SERVER: process.env.SOCKET_SERVER,
  projConfig,
  publicPath,
  theme,
  isProd,
  proj,
  port,
  buildModule,
  defineObj,
};
