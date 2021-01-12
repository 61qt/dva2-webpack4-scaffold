import ModuleRouter, { configRouterArr } from '../default/router';

const routeArr = [];

/* eslint-disable import/first, import/newline-after-import */

routeArr.push({
  name: 'loading',
  path: '/loading',
  exact: true,
  getComponent: () => {
    return require.ensure([], (require) => {
      return require('@/components_common/loading').default;
    }, 'components_common/loading');
  },
});

routeArr.push({
  name: 'home',
  path: '/',
  exact: true,
  getComponent: () => {
    return require.ensure([], (require) => {
      return require('@/components_common/home').default;
    }, 'components_common/home');
  },
});

routeArr.push({
  name: 'sprite',
  path: '/sprite',
  exact: true,
  getComponent: () => {
    return require.ensure([], (require) => {
      return require('@/components_example/sprite').default;
    }, 'components_example/sprite');
  },
});

routeArr.push({
  name: 'news_add',
  path: '/news/add',
  exact: true,
  getComponent: () => {
    return require.ensure([], (require) => {
      return require('@/components_example/news_add').default;
    }, 'components_example/news_add');
  },
});

routeArr.push({
  name: 'news',
  path: '/news',
  exact: true,
  getComponent: () => {
    return require.ensure([], (require) => {
      return require('@/components_example/news').default;
    }, 'components_example/news');
  },
});

const {
  configedRouterArr,
} = configRouterArr({
  routeArr,
  baseUrl: DEFINE_WEB_PREFIX,
});


/* eslint-enable */

export default class Component extends ModuleRouter {
  constructor(props) {
    super(props);
    debugAdd('example_router', this);
    _.assign(this.state, {
      routeArr: configedRouterArr,
    });
  }
}
