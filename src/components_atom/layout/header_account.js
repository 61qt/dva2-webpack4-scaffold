import React from 'react';
import jQuery from 'jquery';
import { connect } from 'dva';
import _ from 'lodash';
// import { NavLink } from '@/components_atom/router';
// import Cookies from 'js-cookie';
// import Qs from 'qs';
import { Avatar, Badge } from 'antd';
import styles from './header_account.less';
import CONSTANTS from '../../constants';
import Filters from '../../filters';
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
    debugAdd('header_account', this);
  }

  componentDidMount = () => {
    // this.getUnreadMessage();
    // 监听toggle
    jQuery(window).on(CONSTANTS.EVENT.TOGGLE_HEADER_ACCOUNT_LAYOUT, (e, flag) => {
      this.handleVisibleChange(flag);
    });
  }

  componentWillReceiveProps = () => {
  }

  componentWillUnmount = () => {}

  // getUnreadMessage = () => {
  //   const { dispatch } = this.props;
  //   dispatch({
  //     type: 'sys_message/unreadCount',
  //     payload: {},
  //   });
  // }

  handleVisibleChange = (flag) => {
    this.setState({ visible: flag });
  }

  handleMenuClick = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    this.setState({ visible: false });
  }

  goLogin = () => {
    jQuery(window).trigger(CONSTANTS.EVENT.CAS_JUMP_AUTH);
  }

  render() {
    const unreadCount = _.get(this.props, 'sysMessageState.unreadCount') || 0;
    if (!_.get(this.props, 'visitorState.current.id')) {
      return (<div onClick={this.goLogin}>请先登录</div>);
    }

    let avatar = (<Avatar style={{ backgroundColor: '#fff', color: '#3398dc' }}>
      {_.get(this.props, 'visitorState.current.name[0]') || _.get(this.props, 'visitorState.current.username[0]') || '用户'}
    </Avatar>);
    if (_.get(this.props, 'visitorState.current.avatar')) {
      avatar = (<Avatar src={Filters.cdnFile(_.get(this.props, 'visitorState.current.avatar'), { width: 80, height: 80 })} />);
    }

    const districtId = _.get(this.props, 'visitorState.current.district_id');
    const area = Filters.area(districtId);
    return (
      <div className={`${styles.normal} visitor-current-name`}>
        <div className="text-white">
          &nbsp;
          {avatar}
          &nbsp;
          <span className={styles.accountName}>
            <span className={768 > window.innerWidth ? 'ant-hide' : ''}>
              { _.get(this.props, 'visitorState.current.name') || _.get(this.props, 'visitorState.current.username') }
            </span>
            {
              768 < window.innerWidth && _.get(this.props, 'visitorState.current.user_type') ? <span className="header-account-role">
                &nbsp;&nbsp;
                ({ Filters.dict(['user', 'user_type'], _.get(this.props, 'visitorState.current.user_type')) || '' })
                { districtId !== area && _.get(CONST_DICT, 'users.user_type.USER_TYPE_PARENT') === _.get(this.props, 'visitorState.current.user_type') ? `(${area})` : ''}
              </span> : null
            }

          </span>
          { this.state.visible ? null : <Badge count={unreadCount} /> }
        </div>
      </div>
    );
  }
}
