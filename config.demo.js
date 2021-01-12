// 这是演示环境的配置，会根据 base 进行拓展
const _ = require('lodash');

const ROOT_DOMAIN = 'example.cn';
const UNION_DOMAIN = `demo.${ROOT_DOMAIN}`;
const API_DOMAIN = `demo-api.${ROOT_DOMAIN}`;
const OPENAPI_DOMAIN = `demo-openapi.${ROOT_DOMAIN}`;

// 上传的域名，不过没啥用。
let UPLOAD_PREFIX = `//demo-fs.${ROOT_DOMAIN}/`; // 必须是 / 结尾，而且带有协议。完全的访问路径，避免拼接时候出错。

// 上传服务的域名+前缀+后缀，用于生成上传后的文件的访问地址
UPLOAD_PREFIX = `${UPLOAD_PREFIX.replace(/\/+?$/, '')}/`;
// 文件上传服务的上传路径
const UPLOAD_PATH = `${UPLOAD_PREFIX}upload`;

const config = {
  // 根域名，用于设置 cookies
  ROOT_DOMAIN,
  // 统一认证平台的信息设定
  UNION_DOMAIN,
  API_DOMAIN,
  OPENAPI_DOMAIN,
  // 上传相关
  UPLOAD_PREFIX,
  UPLOAD_PATH,
  // 是否使用阿里云的 oss 存储
  USE_ALIYUN_OSS: false,
};

module.exports = config;
