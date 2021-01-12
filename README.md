管理系统脚手架
===

# 重要说明
node 推荐使用版本 8.11.2 版本（目前服务器上面的版本就是这个）。
经过测试，10.16.0 也可以使用。> 10 的版本，如果出现问题，需要进行兼容处理。

# 怎么部署
- 配置变量，创建个`config.js` ，参考 config.base.js， 在里面配置想要的目录路径。如修改 WEBSITE_ROOT 为 '/www/edu/dva4/dist/'
- *_PATH 就是域名，目前是 http://ip:port/*_WEB_PREFIX 形式，暂时没用。
- *_CDN 就是静态资源的前缀，也可以说是 cdn
- *_WEB_PREFIX 就是访问的路径的 pathname 的前缀
- UNION_DOMAIN 为 统一的域名，方便生成 nginx 的。
- WEBSITE_ROOT 为 首页那边的配置，不同仓库，所以必须配置下，不然访问会有毛病。
- 运行 yarn release
- 配置 nginx
- 访问 配置好的域名。

# 项目说明

## 其他未说明到的文件
这个属于高阶操作，这里面部分基础空间为http/业务/小功能组件相关，需要自己看懂。

## proj 说明
demo: 演示环境


## 分支说明

- master: 正常版本。

## 其他开发说明
查看 `DEV.md`

## 文件结构说明
查看 `file_arch.md`
