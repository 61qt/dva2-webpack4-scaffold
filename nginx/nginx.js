const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const handlebars = require('handlebars');

const { getProjectConfig, buildModules } = require('../get_config');

const ROOT_PATH = process.cwd();
const DEV_PATH_TMPL_FILE = path.join(ROOT_PATH, 'nginx/_nginx.union_dev_path.conf.hbs');
const DEV_PATH_TMPL_FILE_OUTPUT = path.join(ROOT_PATH, 'nginx/nginx.union_dev_path.conf.part');

const PROD_PATH_TMPL_FILE = path.join(ROOT_PATH, 'nginx/_nginx.union_prod_path.conf.hbs');
const PROD_PATH_TMPL_FILE_OUTPUT = path.join(ROOT_PATH, 'nginx/nginx.union_prod_path.conf.part');

const SSL_TMPL_FILE = path.join(ROOT_PATH, 'nginx/_nginx.union_ssl.conf.hbs');
const SSL_TMPL_FILE_OUTPUT = path.join(ROOT_PATH, 'nginx/nginx.union_ssl.conf.part');

const PROJ_TMPL_FILE = path.join(ROOT_PATH, `nginx/_nginx_${argv.proj}.union.conf.hbs`);
const TMPL_FILE = path.join(ROOT_PATH, 'nginx/_nginx.union.conf.hbs');
const TMPL_FILE_OUTPUT = path.join(ROOT_PATH, 'nginx/nginx.union.conf');

// 生成的配置文件信息
const inputArray = [];
let projConfig;
let lastModule;
_.each(buildModules, (elem) => {
  const MODULE = elem.toUpperCase();

  projConfig = getProjectConfig({
    module: elem,
    proj: argv.proj,
  });

  if (lastModule) {
    lastModule.nextModuleName = elem;
  }

  const moduleWebPrefix = projConfig[`${MODULE}_WEB_PREFIX`].replace(/^\/+/ig, '');
  lastModule = {
    devRoot: ROOT_PATH,
    moduleName: elem,
    modulePort: projConfig.CURRENT_DEV_PORT,
    moduleWebPrefix,
    moduleWebPrefixRewrite: `/${moduleWebPrefix}/index.html?#$1`,
  };

  inputArray.push(lastModule);
});

function replaceFormat(str) {
  let newStr = str;
  if (projConfig.NGINX_REPLACE_FROM && projConfig.NGINX_REPLACE_TO) {
    newStr = _.replace(newStr, new RegExp(projConfig.NGINX_REPLACE_FROM, 'g'), projConfig.NGINX_REPLACE_TO);
  }

  return newStr;
}

const defaultModule = inputArray[0].moduleName;
const websiteRoot = projConfig.WEBSITE_ROOT;
const portHttp = (projConfig.PORT_HTTP * 1 && 80 === projConfig.PORT_HTTP * 1) ? '' : projConfig.PORT_HTTP;
const portHttps = (projConfig.PORT_HTTPS * 1 && 443 === projConfig.PORT_HTTPS * 1) ? '' : projConfig.PORT_HTTPS;

const compileOptions = {
  devRoot: ROOT_PATH,
  modules: inputArray,
  defaultModule,
  websiteRoot,
  portHttp,
  portHttps,
};

const devPathHbCompile = handlebars.compile(fs.readFileSync(DEV_PATH_TMPL_FILE, 'utf-8'));
const devPathSource = devPathHbCompile(compileOptions);
fs.ensureDir(DEV_PATH_TMPL_FILE_OUTPUT.replace(path.basename(DEV_PATH_TMPL_FILE_OUTPUT), ''));
fs.writeFileSync(DEV_PATH_TMPL_FILE_OUTPUT, replaceFormat(devPathSource));

const prodPathHbCompile = handlebars.compile(fs.readFileSync(PROD_PATH_TMPL_FILE, 'utf-8'));
const prodPathSource = prodPathHbCompile(compileOptions);
fs.ensureDir(PROD_PATH_TMPL_FILE_OUTPUT.replace(path.basename(PROD_PATH_TMPL_FILE_OUTPUT), ''));
fs.writeFileSync(PROD_PATH_TMPL_FILE_OUTPUT, replaceFormat(prodPathSource));

const sslHbCompile = handlebars.compile(fs.readFileSync(SSL_TMPL_FILE, 'utf-8'));
const sslSource = sslHbCompile(compileOptions);
fs.ensureDir(SSL_TMPL_FILE_OUTPUT.replace(path.basename(SSL_TMPL_FILE_OUTPUT), ''));
fs.writeFileSync(SSL_TMPL_FILE_OUTPUT, replaceFormat(sslSource));

let bold = '';
try {
  bold = fs.readFileSync(PROJ_TMPL_FILE, 'utf-8');
}
catch (error) {
  bold = fs.readFileSync(TMPL_FILE, 'utf-8');
}
const hbCompile = handlebars.compile(bold);
const source = hbCompile({
  ...compileOptions,
  devPathSource,
  prodPathSource,
  sslSource,
});
fs.ensureDir(TMPL_FILE_OUTPUT.replace(path.basename(TMPL_FILE_OUTPUT), ''));
fs.writeFileSync(TMPL_FILE_OUTPUT, replaceFormat(source));
