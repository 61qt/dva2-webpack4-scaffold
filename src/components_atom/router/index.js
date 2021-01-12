import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Router, Redirect, NavLink, Link, Prompt, Route, Switch } from 'dva/router';

import './index.less';

class AuthSuffixLink extends React.PureComponent {
  static defaultProps = {
    to: '',
  }

  // 子组件声明自己需要使用 context
  static contextTypes = {
    auth: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount = () => {
  }

  componentDidMount() {
    debugAdd('AuthSuffixLink', this);
  }

  componentWillReceiveProps = () => {}

  componentWillUnmount = () => {}

  getToProps = () => {
    // const auth = this.context.auth || _.get(Qs.parse(window.location.search.replace(/^\?/, '')), 'auth', '');
    const auth = this.context.auth;
    let to = this.props.to;
    if ('string' === typeof auth && auth) {
      if (_.includes(to, '?')) {
        to = `${to}&auth=${escape(auth)}`;
      }
      else {
        to = `${to}?auth=${escape(auth)}`;
      }
    }

    return to;
  }

  render() {
    return (<Link {...this.props} to={this.getToProps()} />);
  }
}

class AuthSuffixNavLink extends AuthSuffixLink {
  componentDidMount() {
    debugAdd('AuthSuffixLink', this);
  }

  render() {
    return (<NavLink {...this.props} to={this.getToProps()} />);
  }
}

export {
  Router,
  Redirect,
  AuthSuffixLink as Link,
  AuthSuffixNavLink as NavLink,
  Prompt,
  Route,
  Switch,
};

export default 'router';
