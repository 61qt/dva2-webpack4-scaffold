开发文档
===

# 框架架构
主要使用采用 (dva2)[https://github.com/dvajs/dva] 和 [antd](https://ant.design/index-cn) 进行框架的搭建，结合 redux 和 dva/redux 的 model 进行数据的存储(内存存储)，路由器采用 dva/router ，打包工具采用 dva 默认采用的 roadhog 。

因此需要掌握整个框架的思想，需要了解的内容有 React / React Router 4 / dva 全套 + roadhog / redux / antd 。

网站入口， `src/modules/*/index.js` ，为 dva 的规则编写的。主要就是定义 model 及引入 router* （还有拦截器、插件之类的，需要了解的话自行深入 dva 进行探索），之后所有的页面都基本上根据 router 进行加载，各个页面解耦分离，定于在 components_* 中。

主路由器放在 `src/modules/*/router*` 中，每一个 modules 都能打包出一个独立运行的项目。所以 modules 里面有多少个就能打包出多少个项目。（需要在 `get_config.js` 的 buildModules 增加项目名，以及在 `config.example.js` 填写初始化打包的字段，不然可能会打包出错）

# package.json script

- yarn start*: 跑单个的开发模式
- yarn start: 全部模块的开发模式一起启
- yarn release: 打包发布每个模块
- yarn release --modules pm,snom,app: 类似的指令，打包指定的模块
- yarn nginx: 生成 nginx 文件
- yarn lint / yarn precommit: husky 包集成的一些 git 相关的操作，提交之前强制检查 eslint 。
- yarn gitlab: 发布代码到 gitlab 环境。

# 开发指南

- clone
- yarn // 安装依赖
- 自行安装 nginx
- 安装 node，版本自行测试，我的版本是 9.6.1
- yarn nginx // 生成 nginx conf
- 配置到 nginx ，可查看下面配置 nginx 部分
- 安装 yarn 包。 1, 在项目目录运行 yarn install 。 2, 在 src 目录下面运行 yarn qtinstall 。


## 如何增加一个模块
修改 config.base.js  、 get_config.js 、生成 nginx、 重新运行服务，之后进行组件之类的开发。

# 配置 nginx
在 nginx 程序的配置(mac os 上的路径基本为`/usr/local/etc/nginx/nginx.conf`)上 include 这个文件。例如
```
http{
  ...
  # projectRoot 为项目路径
  include ${projectRoot}/nginx/*.conf;
  ...
}
```
重启 nginx

## 本地配置。
复制 `config.demo.js` 为 `config.js` ，修改里面的域名及 api 接口信息，默认开发环境不用配置，然后就开始下一步。

因为 首页(website) 不在该项目中，需要配置自己这边 `WEBSITE_ROOT`

## 运行
目前的模块 (moduleNames) 有 `[example]`, 运行的时候，
- yarn start （这个运行全部的）
- yarn start -- --modules example (逗号分隔，可打开多个的开发模式)

本地绑定 host (nginx 中定义的文件)，本地开发域名为查看 `nginx/nginx.union.conf` 的 server_name ，绑定 host 访问。
然后打开 ${域名}/{moduleName} 中对应的路径即可。
如果现实 404 ，可能是访问了其他的没用的路径了。例如目前首页会指向到 website 那边的。

## 发布
yarn release -- --proj demo
这个时候 `prod/` 开头的文件夹就是对应不同模块的打包文件。

## 发布演示系统

`yarn release -- --proj demo`

单个发布
`yarn release -- --module example --proj --demo`

这个时候 `prod/` 开头的文件夹就是对应不同模块的打包文件。
目前基本上直接一次发布全部。


