// import React from 'react';
import _ from 'lodash';
// import jQuery from 'jquery';
// import moment from 'moment';
import store from 'store';
// import Qs from 'qs';
import dva from 'dva';
import createHistory from 'history/createBrowserHistory';
import createLoading from 'dva-loading';

import 'blueimp-canvas-to-blob';

import '@/modules/default/first';

import CONSTANTS, { DICT } from '@/constants';
import Filters from '@/filters';
import { http } from '@/services/_factory';
import User from '@/utils/user';
import print from '@/utils/print';
import ComponentsForm from '@/components_form';
import '@/services';
import formErrorMessageShow from '@/utils/form_error_message_show';
import getRenderStr from '@/utils/get_render_str';
import getBiMenu from '@/utils/get_bi_menu';
// import '@/utils/hotjar';
import '@/utils/ctrl_d';
import '@/utils/debug_add';
import '@/utils/system_event_listener';
import createSentry from '@/utils/dva-sentry';
import models from '@/models';
import { addMountedModels } from '@/modules/default/router';

import './index.less';

const dvaSentryPlugin = createSentry({
  dsn: `https://${DEFINE_SENTRY_PROJECT_TOKEN}@${DEFINE_SENTRY_BASE_DOMAIN}/${DEFINE_SENTRY_PEOJECT_ID}`,
  config: {
    release: DEFINE_RELEASE_VERSION,
  },
});

export default function appFactory({
  extraModel = [],
  routerConfig,
}) {
  const browserHistory = createHistory();
  window.browserHistory = browserHistory;

  // 1. Initialize
  const app = dva({
    history: browserHistory,
    onStateChange: (state) => {
      if (DEFINE_SHOULD_SAVE_STATE) {
        const searchValuesStoreSave = {};
        if (window.sessionStorage && sessionStorage.setItem) {
          for (const [key, value] of _.entries(state)) {
            if (_.isPlainObject(value) && 'listState' in value) {
              searchValuesStoreSave[key] = {
                listState: value.listState || {},
                page: value.page || 1,
                start: value.start || 0,
                end: value.end || 0,
                pageSize: value.pageSize || CONSTANTS.PAGE_SIZE,
              };
            }
          }
          sessionStorage.setItem(CONSTANTS.STORE_SAVE_KEY, JSON.stringify(searchValuesStoreSave));
        }
      }
    },
  });

  // 2. Plugins
  app.use(createLoading({
    effects: true,
    // 不使用loading监听
    except: [
      'student_register/filterTotal',
    ],
  }));
  app.use(dvaSentryPlugin);

  [].concat(models).concat(extraModel).forEach((model) => {
    app.model(model);
    addMountedModels(model.namespace);
  });


  try {
    // 4. Router
    app.router(routerConfig);
    // 5. Start
    app.start('#root');
  }
  catch (error) {
    window.console.log('app start error', error);
  }

  window.app = app;
  return app;
}

const APP_NAME = _.get(CONSTANTS, `SYSTEM_CONFIG.CONFIG.${`${DEFINE_MODULE || ''}`.toUpperCase()}.APP_NAME`) || '';
if (APP_NAME) {
  try {
    document.title = APP_NAME;
  }
  catch (error) {
    // do nothing
  }
}

// 全局变量挂载，方便调试使用。
window.dva = dva;
window.DICT = DICT;
window.CONSTANTS = CONSTANTS;
window.Filters = Filters;
window.ComponentsForm = ComponentsForm;
window.User = User;
window.formErrorMessageShow = formErrorMessageShow;
window.http = http;
window.store = store;
window.getRenderStr = getRenderStr;
// eslint-disable-next-line no-underscore-dangle
window.____print = print;
