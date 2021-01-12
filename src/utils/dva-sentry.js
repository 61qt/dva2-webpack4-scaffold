// 参考 https://github.com/jaredleechn/dva-sentry ,由于传输的数据敏感及过大，所以自己改造了一番。
import Raven from 'raven-js';
import _ from 'lodash';
import jQuery from 'jquery';
import moment from 'moment';
import User from '../utils/user';
import { getState } from '../utils/get_app';

// eslint-disable-next-line prefer-const
let catchError = !!__PROD__;
// catchError = true;

let ipInfo = {};
if (catchError) {
  jQuery.getScript('//pv.sohu.com/cityjson?ie=utf-8').then((res) => {
    ipInfo = {
      ...res,
      ..._.get(window, 'returnCitySN'),
    };
    if (!Raven || !_.get(Raven, 'setTagsContext')) {
      return;
    }
    Raven.setTagsContext({
      userIp: _.get(window.returnCitySN, 'cip'),
    });
  });
}

const undershoot = {
  init: () => {
    if (!Raven || !_.get(Raven, 'setTagsContext')) {
      return;
    }
    Raven.setTagsContext({
      location: 'frontend',
      env: __DEV__ ? 'dev' : 'prod',
      releadeDtae: DEFINE_RELEASE_DATE,
      releaseEnv: DEFINE_RELEASE_ENV,
    });
  },
  state: {},
  globalState: (newState) => {
    undershoot.state = {
      ...undershoot.state,
      ...newState,
    };
    if (!Raven || !_.get(Raven, 'setTagsContext')) {
      return;
    }
    Raven.setExtraContext({
      ...undershoot.state,
    });
  },
  setUserContent: (user) => {
    if (!Raven || !_.get(Raven, 'setTagsContext')) {
      return;
    }
    Raven.setUserContext(user);
  },
  config: (dsn, config) => {
    if (catchError) {
      if (!Raven || !_.get(Raven, 'setTagsContext')) {
        return;
      }
      Raven.config(dsn, { ...config }).install();
    }
  },
  capture: (errorArgs, state = {}) => {
    const error = errorArgs || {};
    try {
      error.message = _.get(errorArgs, 'message') || _.get(errorArgs, 'msg') || _.get(errorArgs, 'statusText') || _.get(errorArgs, 'files[0].error');
    }
    catch (err) {
      // do nothing
      window.console.error(err);
    }
    const newState = {
      ...state,
    };
    if (newState.headers && newState.headers.Authorization) {
      delete newState.headers.Authorization;
    }

    if (catchError) {
      const globalState = getState() || {};
      // const user = User.info;
      const user = {
        ..._.get(globalState, 'visitor.current') || {},
        menus: undefined,
      };
      const tokenInfo = User.decodeToken();
      const resource = _.get(globalState, 'visitor.resource') || {};
      if (!Raven || !_.get(Raven, 'setTagsContext')) {
        return;
      }
      Raven.captureException(error, {
        extra: {
          state: {
            module: DEFINE_MODULE,
            ipInfo,
            resource,
            ...newState,
            tokenInfo,
            tokenInfoId: _.get(tokenInfo, 'id') || '',
            tokenExp: moment.unix(_.get(tokenInfo, 'exp') || '').format('YYYY-MM-DD HH:mm:ss'),
            user,
            userId: _.get(user, 'id') || '',
            time: moment().format('YYYY-MM-DD HH:mm:ss'),
          },
        },
        logger: 'javascript.action',
      });
    }
  },
};

undershoot.init();

export {
  undershoot,
};

export default function createMiddleware(options) {
  const {
    dsn,
    config = {},
  } = options;

  undershoot.config(dsn, { ...config });

  return {
    onAction: () => {
      return (next) => {
        return (action) => {
          try {
            next(action);
          }
          catch (error) {
            undershoot.capture(error, {
              file: 'src/utils/dva-sentry.js',
            });
            throw error;
          }
        };
      };
    },
  };
}
