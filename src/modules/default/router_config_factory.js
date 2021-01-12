import React from 'react';
import _ from 'lodash';
import { Empty, locales, ConfigProvider } from 'antd';
import { Router, Switch, Route, Redirect } from '@/components_atom/router';

import styles from './empty.less';

// 已经授权的模块，非精确匹配
const zhCN = _.get(locales, 'zh_CN');

export function renderEmpty(props) {
  return <Empty className={styles.empty} description={_.get(props, 'description', '暂无数据')} />;
}

function routerConfigFactory({
  baseUrl,
  Component,
}) {
  const routerConfig = ({ history }) => {
    return (<ConfigProvider locale={zhCN} renderEmpty={renderEmpty}>
      <Router history={history}>
        <Switch>
          <Route path={`${baseUrl}`} component={Component} />
          <Redirect to={`${baseUrl}`} />
        </Switch>
      </Router>
    </ConfigProvider>);
  };

  return routerConfig;
}

export default routerConfigFactory;
