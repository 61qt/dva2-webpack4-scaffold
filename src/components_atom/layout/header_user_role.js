import React from 'react';
// import jQuery from 'jquery';
import { connect } from 'dva';
import _ from 'lodash';
// import { NavLink } from '@/components_atom/router';
// import Cookies from 'js-cookie';
// import Qs from 'qs';
import { message, Menu, Dropdown, Icon } from 'antd';
import { USER_ROLE_SAVE_KEY } from '@/models/visitor';
import Filters from '@/filters';
import styles from './header_user_role.less';
// import CONSTANTS from '../../constants';

// import { DownloadProgress, DownloadProgressTask } from '../../components_atom/download';
// import User from '../../utils/user';

@connect((state) => {
  return {
    visitorState: state.visitor,
  };
})
export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
    debugAdd('header_user_role', this);
  }

  componentDidMount = () => {}

  componentWillReceiveProps = () => {}

  componentWillUnmount = () => {}

  handleVisibleChange = (flag) => {
    this.setState({ visible: flag });
  }

  handleMenuClick = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const key = e.key;
    this.setState({ visible: false });

    localStorage.setItem(USER_ROLE_SAVE_KEY, e.key * 1);

    if (__DEV__) {
      window.console.log('e', e, 'USER_ROLE_SAVE_KEY', USER_ROLE_SAVE_KEY, localStorage.getItem(USER_ROLE_SAVE_KEY), 'key', 1 * key);
    }

    message.success('切换用户角色成功，即将进行刷新');

    this.props.dispatch({
      type: 'visitor/reCountResource',
      payload: {},
    }).then(() => {
      // 默认回到首页
      this.props.history.push(Filters.path('home'));
      setTimeout(() => {
        location.reload();
      }, 3000);
    });
  }

  render() {
    if (!_.get(this.props, 'visitorState.current.id')) {
      return null;
    }

    const currentModuleUserRole = _.get(this.props.visitorState, 'currentModuleUserRole', []);
    const currentUserRole = _.get(this.props.visitorState, 'currentUserRole', {});

    const menu = (
      <Menu
        selectedKeys={[`${currentUserRole.id}`]}
        defaultSelectedKeys={[`${currentUserRole.id}`]}
        onClick={this.handleMenuClick}
        className={styles.accountDownMenu}>
        {
          _.map(currentModuleUserRole, (userRole) => {
            return (<Menu.Item key={`${userRole.id}`}>
              <div><span>{userRole.name}</span></div>
            </Menu.Item>);
          })
        }
      </Menu>
    );

    return (
      <div className={styles.normal}>
        {
          1 < _.get(currentModuleUserRole, 'length') ?
            <Dropdown
              overlay={menu}
              trigger={['click']}
              onVisibleChange={this.handleVisibleChange}
              visible={this.state.visible}>
              <div className="text-white">
                <span className={styles.accountName}>
                  <span className={768 > window.innerWidth ? 'ant-hide' : ''}>{`${currentUserRole.name}` }</span>
                </span>
                <span className={styles.headerDownIcon}><Icon type="down" /></span>
              </div>
            </Dropdown> : <div className="text-white">
              <span className={styles.accountName}>
                <span className={768 > window.innerWidth ? 'ant-hide' : ''}>{`${currentUserRole.name}` }</span>
              </span>

            </div>
        }

      </div>
    );
  }
}
