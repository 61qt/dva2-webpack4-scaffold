import React from 'react';
import _ from 'lodash';
import { TabBar } from 'antd-mobile';

import Filters from '../../filters';
import styles from './index.less';

export default class Component extends React.PureComponent {
  static defaultProps = {
    current: '',
    unselectedTintColor: '#B3B3B3',
    tintColor: '#108EE9',
    tabsConfig: [
      {
        title: '消息',
        key: 'my_message',
        urlName: 'my_message',
        sp: 'sp sp-asset-m-tab-icon-my-message',
        selectedSp: 'sp sp-asset-m-tab-icon-my-message-active',
      },
      {
        title: '我的',
        key: 'user',
        urlName: 'user',
        sp: 'sp sp-asset-m-tab-icon-user',
        selectedSp: 'sp sp-asset-m-tab-icon-user-active',
      },
    ],
  }
  constructor(props) {
    super(props);
    debugAdd('tabbar', this);
    this.state = {
      selectedTab: undefined,
    };
  }

  renderTabBar = () => {
    const items = [];
    const current = _.get(this.props, 'current', '');
    _.each(this.props.tabsConfig, (tab) => {
      const title = _.get(tab, 'title', '');
      const key = _.get(tab, 'key', '');
      const urlName = _.get(tab, 'urlName', 'my_asset');
      const sp = _.get(tab, 'sp', '');
      const selectedSp = _.get(tab, 'selectedSp', '');
      const onPress = () => {
        this.setState({
          selectedTab: key,
        });
        const path = Filters.path(urlName, {});

        if ('function' === typeof _.get(this.props, 'history.replace', false)) {
          this.props.history.replace(path);
        }
        else {
          window.console.log('请配置 history 到 TabBar props');
        }
      };

      items.push(<TabBar.Item
        title={title}
        key={key}
        icon={
          <span className={sp} />
          }
        selectedIcon={
          <span className={selectedSp} />
          }
        selected={key === (this.state.selectedTab || current)}
        onPress={onPress}>
        {this.props.children}
      </TabBar.Item>);
    });
    return (
      <TabBar
        unselectedTintColor={this.props.unselectedTintColor}
        tintColor={this.props.tintColor}>
        {
          items
        }
      </TabBar>
    );
  }

  render() {
    return (
      <div className={styles.baseWrap}>
        {this.renderTabBar()}
      </div>
    );
  }
}
