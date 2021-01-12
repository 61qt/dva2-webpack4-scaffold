const _ = require('lodash');
const { buildModules } = require('./get_modules');

function getTargetDefineConfig(name) {
  let projectConfig = {};
  try {
    // eslint-disable-next-line import/no-dynamic-require
    projectConfig = require(name);
  }
  catch (e1) {
    projectConfig = {};
  }

  return projectConfig;
}


function checkConfig(baseConfig, allConfig) {
  const childPropsArr = [];
  _.map(allConfig, (elem) => {
    childPropsArr.push(getTargetDefineConfig(elem));
  });

  const allChildProps = childPropsArr.reduce((result, current) => {
    return result.concat(Object.getOwnPropertyNames(current));
  }, []);

  const baseConfigObj = getTargetDefineConfig(baseConfig);

  const diffArr = _.xor(Object.getOwnPropertyNames(baseConfigObj), allChildProps);
  const errorProps = [];
  _.forEach(diffArr, (diffProp) => {
    const isBaseProp = diffProp in baseConfigObj;

    if (!isBaseProp) {
      let isChildCommonProp = true;
      _.map(childPropsArr, (elem) => {
        if (!(diffProp in elem)) {
          isChildCommonProp = false;
        }
      });
      if (!isChildCommonProp) {
        errorProps.push(diffProp);
      }
    }
  });

  if (0 !== errorProps.length) {
    // eslint-disable-next-line no-console
    console.log(`配置错误，以下字段不在 config.base.js 或者不是不同项目的共有字段：\n${errorProps.join('\n')}\n`);
    process.exit();
  }
}

const allConfigArr = [
  'demo',
];

const allPortConfigArr = [
  'demo',
];

function getModulePort(buildedProjectConfig, proj, module) {
  const projIndex = _.indexOf(allPortConfigArr, proj);
  const modulesPort = buildedProjectConfig[`${module}_DEV_POST`].replace(/\/+?$/, '');
  let countPort = modulesPort;
  if (0 === projIndex || -1 === projIndex) {
    // 默认情况，不进行人和操作
    countPort = modulesPort;
  }
  else if (0 < projIndex && 6 > projIndex) {
    countPort = `${projIndex}${modulesPort}`;
  }
  else if (10 > projIndex) {
    countPort = `${modulesPort * 1 + projIndex * 1000}`;
  }
  else if (19 > projIndex) {
    countPort = `${projIndex * 1000 - modulesPort * 1}`;
  }
  // 20多个项目了，不少了吧。。。。再多就切项目了，框架发展成另外一套了
  return countPort;
}

function getBuildedProjectConfig(proj) {
  const buildedProjectConfig = _.defaults(getTargetDefineConfig('./config.modules.js'), getTargetDefineConfig('./config.js'), getTargetDefineConfig(`./config.${proj}.js`), getTargetDefineConfig('./config.base.js'));
  return buildedProjectConfig;
}

// 获取项目配置
function getProjectConfig(options) {
  const module = options.module;

  if (!module) {
    // eslint-disable-next-line no-console
    console.log('必须传入 module，参考');
    process.exit();
  }

  if (0 > buildModules.indexOf(module)) {
    // eslint-disable-next-line no-console
    console.log('传入 RELEASE_MODULE 出错，必须为', JSON.stringify(buildModules), ' 中的一个');
    process.exit();
  }

  checkConfig('./config.base.js', allConfigArr.map((elem) => {
    return `./config.${elem}.js`;
  }));


  // 运行判断之后的配置
  let buildedProjectConfig = {};
  if (allConfigArr.includes(options.proj)) {
    buildedProjectConfig = getBuildedProjectConfig(options.proj);
  }
  else {
    // eslint-disable-next-line no-console
    console.log('没有指定是发布那个环境的项目，必须传输。');
    process.exit();
  }

  if (1 > Object.keys(buildedProjectConfig).length) {
    // eslint-disable-next-line no-console
    console.log('导入配置出错，请重试，具体为 config.js 或者 config.js');
    process.exit();
  }

  const MODULE = module.toUpperCase();

  const modulePort = getModulePort(buildedProjectConfig, options.proj, MODULE);
  // 当前的设置
  buildedProjectConfig.CURRENT_DEV_PORT = `${modulePort || ''}`.replace(/\/+?$/, '');
  buildedProjectConfig.CURRENT_API_MODULE = buildedProjectConfig[`${MODULE}_API_MODULE`].replace(/\/+?$/, '');
  buildedProjectConfig.CURRENT_WEB_PREFIX = buildedProjectConfig[`${MODULE}_WEB_PREFIX`].replace(/\/+?$/, '');
  buildedProjectConfig.CURRENT_GRAPHQL_PATH = buildedProjectConfig[`${MODULE}_GRAPHQL_PATH`].replace(/\/+?$/, '');
  buildedProjectConfig.CURRENT_CDN = buildedProjectConfig[`${MODULE}_CDN`].replace(/\/+?$/, '/');
  buildedProjectConfig.CURRENT_IS_MOBILE = buildedProjectConfig[`${MODULE}_IS_MOBILE`] || false;
  buildedProjectConfig.CURRENT_SIDER_WIDTH = buildedProjectConfig[`${MODULE}_SIDER_WIDTH`] || 160;
  buildedProjectConfig.CURRENT_SIDER_NEED_TRANSITION = buildedProjectConfig[`${MODULE}_SIDER_NEED_TRANSITION`] || false;

  buildedProjectConfig.PROJ = options.proj;

  const portHttpWithPrefix = buildedProjectConfig.PORT_HTTP * 1 ? `:${buildedProjectConfig.PORT_HTTP}` : '';
  const portHttpsWithPrefix = buildedProjectConfig.PORT_HTTPS * 1 ? `:${buildedProjectConfig.PORT_HTTPS}` : '';

  // 带有 http 的 网站 全量前缀
  buildedProjectConfig.FULL_UNION_DOMAIN_WITH_HTTP_PREFIX = `http://${buildedProjectConfig.UNION_DOMAIN}${(80 === buildedProjectConfig.PORT_HTTP * 1) ? '' : portHttpWithPrefix}`;
  // 带有 http 的 api 全量前缀
  buildedProjectConfig.FULL_API_DOMAIN_WITH_HTTP_PREFIX = `http://${buildedProjectConfig.API_DOMAIN}${(80 === buildedProjectConfig.PORT_HTTP * 1) ? '' : portHttpWithPrefix}`;
  // 带有 http 的 openapi 全量前缀
  buildedProjectConfig.FULL_OPENAPI_DOMAIN_WITH_HTTP_PREFIX = `http://${buildedProjectConfig.OPENAPI_DOMAIN}${(80 === buildedProjectConfig.PORT_HTTP * 1) ? '' : portHttpWithPrefix}`;

  // 带有 https 的 网站 全量前缀
  buildedProjectConfig.FULL_UNION_DOMAIN_WITH_HTTPS_PREFIX = `https://${buildedProjectConfig.UNION_DOMAIN}${(443 === buildedProjectConfig.PORT_HTTPS * 1) ? '' : portHttpsWithPrefix}`;
  // 带有 https 的 api 全量前缀
  buildedProjectConfig.FULL_API_DOMAIN_WITH_HTTPS_PREFIX = `https://${buildedProjectConfig.API_DOMAIN}${(443 === buildedProjectConfig.PORT_HTTPS * 1) ? '' : portHttpsWithPrefix}`;
  // 带有 https 的 api 全量前缀
  buildedProjectConfig.FULL_OPENAPI_DOMAIN_WITH_HTTPS_PREFIX = `https://${buildedProjectConfig.OPENAPI_DOMAIN}${(443 === buildedProjectConfig.PORT_HTTPS * 1) ? '' : portHttpsWithPrefix}`;

  // 给 ejs 使用的，这样不用进行判断。
  buildedProjectConfig.EJS_SOURCE_PREFIX = buildedProjectConfig.HAS_HTTPS_SERVER ? buildedProjectConfig.FULL_API_DOMAIN_WITH_HTTPS_PREFIX : buildedProjectConfig.FULL_API_DOMAIN_WITH_HTTP_PREFIX;


  return buildedProjectConfig;
}

module.exports = {
  buildModules,
  getProjectConfig,
  getModulePort,
  getBuildedProjectConfig,
};
