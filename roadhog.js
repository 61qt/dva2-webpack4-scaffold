#!/usr/bin/env node

const argv = require('yargs').argv;
const _ = require('lodash');
// eslint-disable-next-line no-unused-vars
const shell = require('shelljs');
const fs = require('fs');

let fileProjEnv = false;
try {
  fileProjEnv = `${fs.readFileSync('./.proj_env').toString()}`.trim();
}
catch (e) {
  // do nothing
}
// eslint-disable-next-line no-console
console.log('\n\n');
// eslint-disable-next-line no-console
console.log('argv', argv);
// eslint-disable-next-line no-console
console.log('argv.force', `'${argv.force || ''}'`);
// eslint-disable-next-line no-console
console.log('process.env.SMART_PC_PROJ', `'${process.env.SMART_PC_PROJ || ''}'`);
// eslint-disable-next-line no-console
console.log('fileProjEnv:', `'${fileProjEnv || ''}'`);
// eslint-disable-next-line no-console
console.log('\n\n');

if (process.env.SMART_PC_PROJ && fileProjEnv && fileProjEnv !== process.env.SMART_PC_PROJ) {
  if (!argv.force) {
    // eslint-disable-next-line no-console
    console.log('process.env.SMART_PC_PROJ 和 fileProjEnv 同时存在而且不相等，不能发布');
    // eslint-disable-next-line no-console
    console.log('如果一定要发布这个环境的项目，需要使用 --force 指令');
    // eslint-disable-next-line no-console
    console.log(`process.env.SMART_PC_PROJ:'${process.env.SMART_PC_PROJ}' ，fileProjEnv: '${fileProjEnv}'`);
    process.exit();
  }
}

// 优先判断这个环境变量
if (!argv.mergeBranch && fileProjEnv) {
  if (!argv.force && argv.proj !== fileProjEnv) {
    if (!argv.force) {
      // eslint-disable-next-line no-console
      console.log('当前发布的环境与服务器预计的发布环境不一致，不能发布。');
      // eslint-disable-next-line no-console
      console.log('如果一定要发布这个环境的项目，需要使用 --force 指令');
      // eslint-disable-next-line no-console
      console.log(`(fileProjEnv)当前环境应该为: ${fileProjEnv} ，实际传输为: ${argv.proj}`);
      process.exit();
    }
  }
}

//
if (!argv.mergeBranch && process.env.SMART_PC_PROJ) {
  if (!argv.force && argv.proj !== process.env.SMART_PC_PROJ) {
    if (!argv.force) {
      // eslint-disable-next-line no-console
      console.log('当前发布的环境与服务器预计的发布环境不一致，不能发布。');
      // eslint-disable-next-line no-console
      console.log('如果一定要发布这个环境的项目，需要使用 --force 指令');
      // eslint-disable-next-line no-console
      console.log(`(process.env.SMART_PC_PROJ)当前环境应该为: ${process.env.SMART_PC_PROJ} ，实际传输为: ${argv.proj}`);
      process.exit();
    }
  }
}

const {
  buildModules,
  getProjectConfig,
} = require('./get_config');

// eslint-disable-next-line no-unused-vars
const shells = [];
const parallelShells = [];

const normalEnv = 'TSLINT=none ESLINT=none BROWSER=none';

let isValid = false;

if (argv.mergeBranch) {
  const baseBr = argv.base;
  const releaseBr = argv.release;
  // 这里是进行测试分支的处理操作，需要合并当前优化的分支
  const shellsTemp = [];
  shellsTemp.push('git reset --hard HEAD');
  shellsTemp.push('git checkout master');
  // 先运行基础指令
  shell.exec(shellsTemp.join(' && '));
  try {
    // 进行删除分支，如果有的话。
    shell.exec(`git branch -D ${baseBr}`);
  }
  catch (e) {
    // do nothing
  }
  try {
    // 进行删除分支，如果有的话。
    shell.exec(`git branch -D ${releaseBr}`);
  }
  catch (e) {
    // do nothing
  }

  // 运行接下来的分支
  shells.push('git remote update');
  shells.push(`git checkout ${baseBr}`);
  shells.push(`git checkout -b pre-test-${releaseBr}-${new Date() * 1}`);
  // // 这个是不进行 commit 的
  // shells.push(`git merge --no-commit --no-edit origin/${baseBr} -X theirs`);
  // 这个是进行 commit 的
  shells.push(`git merge --no-edit origin/${releaseBr} -X theirs`);
  isValid = true;
}
else if (argv.watch) {
  isValid = true;

  let modules = buildModules;
  if (argv.modules && _.split(argv.modules, ',').length) {
    modules = _.split(argv.modules, ',');
  }

  _.each(modules, (buildModule) => {
    if (buildModules.includes(buildModule)) {
      const projConfig = getProjectConfig({
        module: buildModule,
        proj: argv.proj,
      });

      // const SOCKET_SERVER = `SOCKET_SERVER=${projConfig.DEV_SOCKET_PREFIX}:${projConfig.CURRENT_DEV_PORT}`;
      const SOCKET_SERVER = `SOCKET_SERVER=/${(projConfig.CURRENT_WEB_PREFIX.replace(/^\//, '')).replace(/\/$/, '')}/${((projConfig.DEV_SOCKET_PREFIX || '').replace(/^\//, '')).replace(/\/$/, '')}/sockjs-node`;
      // SOCKET_SERVER = SOCKET_SERVER.replace(/\/$/, '/');
      // SOCKET_SERVER = `${projConfig.CURRENT_WEB_PREFIX.replace(/^\//, '')}/${SOCKET_SERVER}/sockjs-node`;

      const shellStr = [
        'cross-env',
        `${SOCKET_SERVER}`,
        `PORT=${projConfig.CURRENT_DEV_PORT}`,
        `proj=${argv.proj}`,
        `RELEASE_MODULE=${buildModule}`,
        `${normalEnv}`,
        'RELEASE_ENV=DEV',
        `ASSET_PATH=/${buildModule}/`,
        'NODE_ENV=development',
        'mode=development',
      ];
      console.log(shellStr)
      shellStr.push('yarn w4start');

      parallelShells.push(shellStr.join(' '));
    }
    else {
      isValid = false;
    }
  });
}
else if (argv.build) {
  isValid = true;

  let modules = buildModules;

  if (argv.modules && _.split(argv.modules, ',').length) {
    modules = _.split(argv.modules, ',');
  }

  _.each(modules, (buildModule) => {
    // shells.push(`rimraf prod/${buildModule}`);
    const shellStr = [
      'cross-env',
      `RELEASE_MODULE=${buildModule}`,
      `${normalEnv}`,
      `proj=${argv.proj}`,
      `ASSET_PATH=/${buildModule}/`,
      'RELEASE_ENV=RELEASE',
      'NODE_ENV=production',
      'mode=production',
    ];
    shellStr.push('yarn w4build');

    shells.push(shellStr.join(' '));
    // 创建打包存放的目标文件夹。如果存在，那也不会报错。
    shells.push(`mkdir -p ./prod/${buildModule}`);
    // 将打包完毕的文件存储到
    shells.push(`cp -rf ./.prod_v2/${buildModule}/* ./prod/${buildModule}/`);
  });
}

if (!isValid) {
  // eslint-disable-next-line no-console
  console.warn('目前已有的模块', buildModules.join(','));
  // eslint-disable-next-line no-console
  console.warn('请传入参数');
  // eslint-disable-next-line no-console
  console.warn('开发模式 单个例子: yarn start -- --module app');
  // eslint-disable-next-line no-console
  console.warn('开发模式 多个个例子: yarn start -- --modules app,hse,cas');
  // eslint-disable-next-line no-console
  console.warn('开发模式 全部例子: yarn start');
  // eslint-disable-next-line no-console
  console.warn('打包模式 单个例子: yarn release -- --module app');
  // eslint-disable-next-line no-console
  console.warn('打包模式 全部例子:yarn release');
}

else {
  // // eslint-disable-next-line no-console
  // console.log(argv);

  // eslint-disable-next-line no-console
  console.log('\n\n');
  // eslint-disable-next-line no-console
  console.log(shells.join(' && '));
  // eslint-disable-next-line no-console
  console.log('\n\n');
  // eslint-disable-next-line no-console
  console.log(parallelShells.join(' | '));
  // eslint-disable-next-line no-console
  console.log('\n\n');

  if (shells && shells.length) {
    shell.exec(shells.join(' && '));
  }

  if (parallelShells && parallelShells.length) {
    shell.exec(parallelShells.join(' | '));
  }
}
