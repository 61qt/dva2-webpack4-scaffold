const routeArr = [];

// if (_.includes(DEFINE_HAS_SUPPORT_DOCUMENT_MODULES, DEFINE_MODULE)) {
//   routeArr.push({
//     name: 'help_center',
//     path: '/help_center',
//     exact: true,
//     getComponent: () => {
//       return require.ensure([], (require) => {
//         return require('../../components_common/support_document/list').default;
//       }, 'components_common/support_document/list');
//     },
//   });
//   routeArr.push({
//     name: 'help_center_detail',
//     path: '/help_center/:id',
//     exact: true,
//     getComponent: () => {
//       return require.ensure([], (require) => {
//         return require('../../components_common/support_document/detail').default;
//       }, 'components_common/support_document/detail');
//     },
//   });
// }

routeArr.push({
  name: 'user_info',
  path: '/user_info',
  exact: true,
  component: require('../../components_common/user_info').default,
});

routeArr.push({
  name: '403',
  path: '/403',
  exact: true,
  getComponent: () => {
    return import(/* webpackChunkName: "components_common/exception/403" */ '../../components_common/exception/403');
  },
});
routeArr.push({
  name: '500',
  path: '/500',
  exact: true,
  getComponent: () => {
    return import(/* webpackChunkName: "components_common/exception/500" */ '../../components_common/exception/500');
  },
});
routeArr.push({
  name: '502',
  path: '/502',
  exact: true,
  getComponent: () => {
    return import(/* webpackChunkName: "components_common/exception/502" */ '../../components_common/exception/502');
  },
});

routeArr.push({
  name: '404',
  path: '*',
  getComponent: () => {
    return import(/* webpackChunkName: "components_common/exception/404" */ '../../components_common/exception/404');
  },
});


export default routeArr;
