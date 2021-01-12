// 这是基础的配置

const config = {
  // 生成nginx配置模板时候被替换的东西，如果没填两个，都不进行替换
  NGINX_REPLACE_FROM: '/Users/Shared/Relocated Items/Security/www/',
  // 生成nginx配置模板时候替换成的东西，如果没填两个，都不进行替换
  NGINX_REPLACE_TO: '',

  // state 是否应该缓存到本地存储上面。
  SHOULD_SAVE_STATE: true,

  HAS_HTTPS_SERVER: true,

  CONST_TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',

  // HTTP 端口，默认 80
  PORT_HTTP: 80,
  // HTTPS 端口，默认 443
  PORT_HTTPS: 443,

  ROOT_DOMAIN: '',
  // 统一认证平台的信息设定
  UNION_DOMAIN: '',
  API_DOMAIN: '',
  OPENAPI_DOMAIN: '',

  // 上传相关
  UPLOAD_PREFIX: '',
  UPLOAD_PATH: '',

  SENTRY_BASE_DOMAIN: 'sentry.example.cn',
  SENTRY_PROJECT_TOKEN: 'aaa',
  SENTRY_PEOJECT_ID: '1',

  // 百度统计的key
  BAIDU_TONGJI_KEY: '',

  // umeng统计的所需ID
  UMENG_ID: '',
  UMENG_WEB_ID: '',


  // 开发阶段的时候的 /sockjs-node/info 的前缀，端口会自动拼接，该配置只适合开发阶段
  DEV_SOCKET_PREFIX: '/socket',

  // 是否使用阿里云的 oss 存储
  USE_ALIYUN_OSS: false,
  // 阿里云的 oss 相关数据配置
  ALIYUN_OSS_BUCKET: 'demo-uploads',
  ALIYUN_OSS_REGION: 'oss-cn-shenzhen',

  // 调试的相关的域名，需要鉴定是不是 ip host 绑定错误了
  DETECT_DOMAIN: [
    'demo.example.cn',
    'demo-api.example.cn',
    'demo-openapi.example.cn',
  ],

  PAGE_TITLE_TEXT: '管理平台脚手架',
  FAVICON_ICO: '',
  GLOBAL_SHOW_ERUDA: true,
};

module.exports = config;
