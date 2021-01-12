import menuConfig from './menu_config';
import modelFactory from '../../models/_factory';
import appFactory from '../default/index';

import './index.less';

const app = appFactory({
  extraModel: [
    modelFactory({
      modelName: 'menu_config',
      modelExtend: {
        state: {
          menu: menuConfig,
        },
      },
    }),
  ],
  routerConfig: require('./router_config').default,
});

export default app;
