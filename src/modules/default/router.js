import React from 'react';
import _ from 'lodash';
import { Spin, message } from 'antd';
import { Switch, Route } from '@/components_atom/router';
import modelFactory from '@/models/_default';
import { configRouteObj } from '../../filters/path';

import getApp from '../../utils/get_app';
import formErrorMessageShow from '../../utils/form_error_message_show';
import exceptionRouteArr from '../../components_common/exception/route';
import Filters from '../../filters';

function configRouterArr({
  routeArr,
  baseUrl,
}) {
  const routeObj = {};
  const configedRouterArr = [];
  let newRouteArr = [].concat(routeArr).concat(exceptionRouteArr);

  _.each(newRouteArr, (elem) => {
    const newRouer = {
      ...elem,
      url: `${baseUrl}${elem.path}`,
    };
    configedRouterArr.push(newRouer);
    routeObj[elem.name] = newRouer;
  });

  configRouteObj(routeObj);
  return {
    configedRouterArr,
  };
}

export {
  configRouterArr,
};

function getDebugInfo({
  error,
  info,
}) {
  return (<div style={{ margin: '2em', padding: '1em', border: '1px solid red' }}>
    <div>系统发生错误，请联系管理员</div>
    <pre>error: {error.toString()}</pre>
    <pre>info: {JSON.stringify(info, 2, 2).replace(/\\n/g, '\n')}</pre>
  </div>);
}

const mountedModels = [];
export function addMountedModels(namespace) {
  if (namespace) {
    mountedModels.push(namespace);
  }
}
// window.mountedModels = mountedModels;

// todo, fix if need to add props args
// 参考 https://gist.github.com/acdlite/a68433004f9d6b4cbc83b5cc3990c194
function asyncComponent(getComponent, props = {}) {
  return class AsyncComponent extends React.Component {
    static Component = null;
    state = {
      pathname: '',
      error: false,
      info: null,
      Component: AsyncComponent.Component,
    };

    componentWillMount() {
      const app = getApp();
      if (_.isArray(_.get(props, 'elem.models'))) {
        _.each(_.get(props, 'elem.models'), (elem) => {
          let namespace = '';
          let modelElem = null;
          if (_.isString(elem)) {
            namespace = elem;
            modelElem = modelFactory(elem);
          }
          else {
            namespace = _.get(elem, 'namespace');
            modelElem = elem;
          }

          if (namespace && modelElem && !_.includes(mountedModels, namespace)) {
            mountedModels.push(namespace);
            app.model(modelElem);
          }
        });
      }
      // checkAuth 要求 返回一个 Object
      // { auth: true/false, redirect }
      // auth指定check结果，redirect为特殊指定的失败跳转路径，不指定则跳转到home
      if (props.checkAuth && _.isFunction(props.checkAuth)) {
        // 判断是否checkAuth通过
        const result = props.checkAuth() || {};
        if (!result.auth) {
          const path = result.redirect || Filters.path('home');
          if (path) {
            props.history.replace(path);
          }
          return;
        }
      }
      if (!this.state.Component) {
        getComponent().then((res) => {
          let component = res;
          if (res.default) {
            component = res.default;
          }

          AsyncComponent.Component = component;
          this.setState({ Component: component });
        }).catch((rej) => {
          formErrorMessageShow(rej);
          message.error('页面获取失败');
          return false;
        });
      }
    }

    render() {
      const { Component } = this.state;
      const componentPorps = { ...props, ...this.props };
      // 优化：如果想跳当前路由不用加new Date(),当前路由也重新渲染就加newDate()
      if (Component) {
        return (<Component {...componentPorps} key={`${_.get(this.props, 'location.pathname')}${new Date()}`} />);
      }

      return (<Spin spinning>
        <div className="text-center">
          <br />
          <br />
          <br />
          <div>加载中</div>
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
      </Spin>);
    }
  };
}

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    debugAdd('default_router', this);
    this.state = {
      pathname: '',
      error: false,
      info: null,
      routeArr: [],
      routeArrElem: [],
    };
  }

  componentDidMount = () => {
    const routeArrElem = _.map(this.state.routeArr, (elem) => {
      const props = {
        key: new Date().getTime(),
        exact: elem.exact || false,
        strict: elem.strict || false,
        checkAuth: elem.checkAuth,
      };

      if (elem.getComponent) {
        props.component = asyncComponent(elem.getComponent, { elem, ...props, ...this.props });
      }
      else if (elem.component) {
        props.component = elem.component;
        const app = getApp();
        if (app) {
          _.map(_.get(elem, 'models'), (el) => {
            const namespace = el.namespace;
            if (!mountedModels.includes(namespace)) {
              mountedModels.push(namespace);
              app.model(el);
            }
          });
        }
      }

      if (404 !== elem.name) {
        props.path = elem.url;
      }

      return (<Route {...props} />);
    });

    this.setState({
      routeArrElem,
    });
  }

  componentDidCatch = (error, info) => {
    this.setState({
      pathname: _.get(window, 'location.pathname', ''),
      error,
      info,
    });
    if (window.console && window.console.log) {
      window.console.log('\n\n\n\n\ncomponentDidCatch\n', '\nerror\n', error, '\ninfo\n', info);
    }
  }

  render() {
    if (this.state.error && this.state.pathname === _.get(window, 'location.pathname', '')) {
      return getDebugInfo({
        error: this.state.error,
        info: this.state.info,
      });
    }

    return (<Switch key="defaput_router">{this.state.routeArrElem}</Switch>);
  }
}
