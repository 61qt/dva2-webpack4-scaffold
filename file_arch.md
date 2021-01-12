# 文件结构说明

```
├── *.md  // 各种说明文档
├── config.example.js  // 例子配置文件
├── config.js  // 当前环境的配置文件，本地开发可以为无（如果路径啥的各种都对的话），部署环境因为部署的问题，必须有一份才能打包出来。
├── get_config.js  // 获取 config 的信息，从上面 `config.example.js` 和 `config.js` 中读取的。
├── nginx  // nginx 相关文件，用于生成 nginx 的配置
│   ├── _nginx.union.conf.hbs
│   ├── nginx.js
│   └── nginx.union.conf
├── package.json  // 仓库依赖说明等等
├── prod_*  // 打包之后会存在的一个文件夹，用于静态文件服务器。
│   ├── favicon.ico
│   ├── index.1c3c4174.css  // 打包之后的主 css
│   ├── index.68c883b8.js  // 打包之后的主 js
│   ├── index.html  // 打包之后的网站入口
│   └── static  // 静态文件
│       ├── global_bg.f959ebb9.png
│       ├── home_bg.792f61a5.png
│       ├── logo_app_text_white.601baa5e.png
│       └── sprite.d5b5628e.svg
├── public  // dva 结构下面的静态文件服务
│   └── favicon.ico
├── roadhog.js  // 系统运行或者打包的的批处理 js
├── src  // 基本上业务开发都在这个文件夹下面
│   ├── assets  // 系统静态文件存储的文章
│   │   ├── global_bg.png
│   │   ├── home_bg.png
│   │   └── logo  // 存放 logo 相关的文件的文件夹
│   ├── components_app  // app 模块的相关组件，统一管理平台
│   │   ├── admin_city  // admin city 的列表页面的容器
│   │   ├── admin_city_add  // admin city 的编辑新增页面的容器
│   │   ├── admin_city_detail  // admin city 的详情页面的容器
│   │   ├── term  // 学期页面，这个包含弹窗的新增和编辑，一个页面有增删改查，没有详情。
│   │   ├── ...
│   ├── components_atom  // 这个是基础的元素，跟外部的区别除了 redux 就没联系的组件，里面基本上每个都会有 readme.md ，欢迎查看
│   │   ├── access
│   │   ├── area
│   │   ├── ...
│   ├── components_cas  // 统一登录平台，用于登录，为全部系统的基础登录模块
│   │   ├── auto  // 自动登录，目前没有
│   │   ├── forget  // 忘记密码的操作页面，用于修改密码
│   │   ├── login  // 主页面，登录页面，登录之后会跳转回系统 api，后跳转回应用 api ，之后一般跳回应用获取 token 进行接口访问
│   │   └── reg  // 注册页面，目前只有家长注册。
│   ├── components_common  // 这个是通用组件的存放路径，例如 404 / home / 修改密码之类的，都放在这里，前提是通用
│   │   ├── exception  // 404,5** 等页面的容器
│   │   ├── home  // 首页的容器
│   │   ├── loading  // 加载中的容器，目前一般用于导入数据成功之后，重置当前 start 之后跳转回的中间状态页面容器
│   ├── components_default  // 这个是管理后台的增删改查等基础页面的通用页面，实例中，继承这些类即可
│   │   ├── page_add  // 新增编辑页面的容器，有充足的 submit 以及错误提示方法
│   │   ├── page_add_modal  // 新增编辑弹窗的容器，继承于 page_add ，模式改成弹窗
│   │   ├── page_detail  // 详情页面的通用例子
│   │   └── page_list  // 列表页面的通用例子
│   ├── components_example  // 这个是很旧的例子页面，目前只有 sprite 这个有用
│   │   ├── news  // restful 年代的列表页面，已经废弃
│   │   ├── news_add  // restful 年代的编辑页面，已经废弃
│   │   └── sprite  // 系统的 svg+png 的雪碧图的例子
│   ├── components_form  // 这个是 form 基本组建的存放位置，部分文件的文档正在补充中。如果没有补充完毕文档，可以参考下文件里面的 static defaultProps 来直接调用一下，部分组件会有必填 props 。写这些组件的时候，需要按照 antd 的规范来编写。
│   │   ├── area_select  // 地区选择组件
│   │   ├── ...
│   ├── components_hse  // hse 模块的组件存放位置，高中招生系统
│   │   ├── ...
│   ├── components_pm  // pm 模块的组件存放位置，人事管理系统
│   │   ├── teacher
│   │   └── teacher_detail
│   ├── components_snom  // snom 模块的组件存放位置，学籍管理系统
│   │   ├── student
│   │   ├── student_add
│   │   └── student_detail
│   ├── constants  // 常量存放位置，跟后端 api 的字段相关
│   │   ├── api_config.js  // 这个包含语法、导入导出权限及路径，只定义那些特殊的，能用通用形式生成的部分都在 `./utils/get_api_config.js` 中统一生成
│   │   ├── dict.js  // 部分不在后端字典自动生成的字典的定义的地方，如果后期字典接口已经把数据给填充了，需要把这里定义的字典数据给删除了。避免混淆
│   │   ├── index.js  // 常量的入口文件，定义一些杂乱的常量，可能跟后端配置有关，可能跟前端的部分通用数据有关
│   │   └── teacher_io_info.js  // 这个是教师那三十多个导入导出的配置信息，因为数据太多，直接抽出来放在常量里面定义。
│   ├── filters  // 系统的部分 filters
│   │   ├── age.js
│   │   ├── chinese_money.js
│   │   ├── chinese_number.js
│   │   ├── datetime.js
│   │   ├── dict.js  // 这个 filters 最常用，用于输出字典的值，避免程序内部的魔术数字问题。输出的时候会查询 `constans/dict.js` 中定义的字典，如果找不到，会查询后端的 api 接口的字典。优先级为本地字典优先。
│   │   ├── index.js  // 入口，会挂载全部的 filters 进来，外面访问就直接在这里使用就行。
│   │   ├── path.js  // 生成系统的页面 url 的 filters ，目前页面内部的跳转的 url 都不是写死的，而是通过这个生成的。
│   │   └── qiniuImage.js  // 这个是生成 cdn 文件路径的 filters
│   ├── global_styles  // 系统的全局 style
│   │   ├── _variables.less  // 系统的 less 变量名
│   │   ├── ...
│   ├── index.ejs  // 系统的 html 入口模板，打包时候会追加 css 和 js 进去，里面也定义了部分的基础 js ，方便 externals 的处理。
│   ├── models  // 系统的通用 model ，基本上每个表对应一个 model，如果一个表会有多个类型，会根据后端的 scheme 来进行 model 的拆分。另外还有一些监听的 utils model。
│   │   ├── _factory.js  // 基础 model 的定义的地方。最小的 model 工厂
│   │   ├── _factory_graphql.js  // graphql 增删改查的 model 工厂，给每个 model 自动生成 list/detail/tree/reset 等基本 effect 。
│   │   ├── _factory_restful.js  // 同上，不过是 restful 版本的。
│   │   ├── _factory_util_func.js  // 组件 model 时候的一些重复的方法，后面抽出来这里定义，方便复用以及引用。
│   │   ├── addition.js  // 一个常见的 graphql model 。
│   │   ├── ...
│   ├── modules  // 系统各个模块的入口，每个都继承 default
│   │   ├── example  // 例子管理平台
│   │   |   ├── component.js  // 系统的页面初始化组件
│   │   |   ├── index.js  // 系统的 js 入口组件，结合 html 入口组件，就能运行程序。
|   │   │   ├── menu_config.js  // 左侧导航菜单
|   │   │   ├── router.js  // router 定义，结合 `router_config.js` 生成 dva 需要的 router 配置，同时创建 router 配置给 filters.path 使用。
|   │   │   └── router_config.js // 创建 dva router 的方法。
│   │   ├── default  // 系统默认的入口，其他都会继承这个组件来进行每个模块的运行
│   ├── services  // 系统的 services 。有一般的 service ，有 graphql 组装的 services
│   │   ├── _factory.js  // services 工厂，会自动生成 list/graphqlList 等语法。
│   │   ├── _intercept.js  // 目前 http 的拦截器。
│   │   ├── addition.js  // 一个例子 services，里面的 scheme 语法，会通过 state.graphql.query/mutation 进行组装， _factor.js 里面会自动生成的。
│   │   ├── visitor.js
│   │   ├── ...
│   ├── sprites  // 雪碧图存放的位置
│   │   ├── png  // png 雪碧图元素
│   │   └── svg  // sng 雪碧图元素
│   └── utils  // 系统的工具类方法。
│       ├── build_column_form_item.js  // 通过数组创建表单数据，能方便的通过显示和隐藏的规则处理每一个元素。默认行为输出 input 和 inputNumber 之类的操作。
│       ├── build_class_name.js  // 生成班级名称的函数，之前由于没有冗余生成班级名称，就通过这个生成，目前这个在班级编辑那边页面生成显示使用。
│       ├── build_list_search_filter.js  // 通过一个对象生成一个后端 filter 查询的数组。
│       ├── build_tree_by_arr.js  // 通过一个数组生成一棵树，返回好多的东西，这个数组需要存在 pid ，如果没有，也不会报错的。
│       ├── ctrl_d.js  // 收藏夹相关有用的函数
│       ├── debug_add.js  // 将调试变量加载到内存中，方便调试
│       ├── download.js  // 创建一个 form 来提交数据，用于下载数据。
│       ├── dva-sentry.js  // sentry 相关的的操作，会把错误数据发送到 sentry ，也提供接口手动发送。
│       ├── error_class.js  // 错误类，大部分供上面 sentry 使用
│       ├── file_uploader.js  // 文件上传的方法。目前暴露出来的方法在 `components_form/file_upload` 中使用了。
│       ├── form_error_message_show.js  // 错误信息提示的方法，全局统一的。
│       ├── format_form_value.js  // form 表单提交之前的统一 format 操作。
│       ├── get_api_config.js  // 结合上面的 `constants/api_config.js` 进行后端的某些字段的配置读取，如果没定义，会自动根据后端的规则生成结果来返回。
│       ├── get_app.js  // 获取系统的 app 、state 、store 等等 ，因为可能在系统中可能会突然间又这种 hack ，为了方便维护，放在这里处理，等以后有方法，就直接通过这里改造。
│       ├── get_render_str.js  // 没啥用的，本来是打算根据前端的模板，生成个模板给后端，生成导出的数据。
│       ├── hotjar.js  // hotjar 的相关配置及启动文件
│       ├── http.js  // 生成 http ，但是不要直接用，应该从 services/_factory 导出来使用，那边会做了改造
│       ├── letter_case_up_lower.js  // 英文字母的大小写驼峰等操作
│       ├── print.js  // 打印操作，目前系统暂时没用上，打印的时候直接传输内容进去，会触发打印。
│       ├── qiniu_img_uploader.js  // 目前没啥卵用的一个上传，替代文件是 file_uploader 。
│       ├── system_event_listener.js  // 目前系统的通用的事件的监听，全局的监听目前都写在这里了。
│       ├── tree.js  // 树相关的操作，用于生成或者创建或者组装 model 等。
│       └── user.js  // user 相关， token 、id 等操作。
├── webpack.config.js  // 系统打包拓展
└── yarn.lock  // package.json 版本固化
```
