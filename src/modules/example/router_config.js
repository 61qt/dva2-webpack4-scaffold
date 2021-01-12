import routerConfigFactory from '../default/router_config_factory';

// 已经授权的模块，非精确匹配
import Component from './component';

export default routerConfigFactory({
  baseUrl: DEFINE_WEB_PREFIX,
  Component,
});
