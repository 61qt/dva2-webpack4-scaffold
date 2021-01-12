import React from 'react';

import { connect } from 'dva';
import { NavLink } from '@/components_atom/router';
import { OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL, API_DOMAIN_WITH_PREFIX_AND_PROTOCOL, UNION_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '@/utils/http';
import { message } from 'antd';
import PageLayout from '@/components_atom/page_layout';
import Filters from '@/filters';
import { http } from '@/services/_factory';
import formErrorMessageShow from '@/utils/form_error_message_show';

import style from './index.less';

@connect((state) => {
  return {
    visitorState: state.visitor,
  };
})
export default class UserInfo extends React.Component {
  constructor(props) {
    super(props);
    debugAdd('user_info', this);
    this.state = {
      wechat: undefined,
      qq: undefined,
      auth: false,
      callbackHref: `${UNION_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/${DEFINE_MODULE}/user_info`,
      // callbackHref: `${'http://demo-dev.example.cn/library/user_info'}`,// 开发地址
    };
  }

  componentDidMount = () => {
    this.setState({ auth: this.isAuth() });
    this.props.dispatch({
      type: 'breadcrumb/current',
      payload: [{
        name: '个人资料',
        url: Filters.path('user_info', {}),
      }],
    });
    const that = this;
    http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/user/socialites`)
      .then((res) => {
        const data = _.get(res, 'data');
        const wechat = data.find((item) => {
          return _.get(CONST_DICT, 'socialites.type.TYPE_WECHAT') === item.type;
        });
        const qq = data.find((item) => {
          return _.get(CONST_DICT, 'socialites.type.TYPE_QQ') === item.type;
        });
        that.setState({ wechat, qq });
      });
  }

  isAuth=() => {
    const userType = _.get(this.props, 'visitorState.current.user_type');
    const userTypes = [
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER'),
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_CITY'),
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_DISTRICT'),
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_SCHOOL'),
    ];
    return !userTypes.includes(userType);
  }

  handleQQ =() => {
    const { qq } = this.state;
    const qqUrl = '/openLogin/qq_auth_redirect';
    if (!qq) {
      window.location.replace(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${qqUrl}?redirect_uri=${this.state.callbackHref}`);
    }
    else {
      http.delete(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/user/socialites/${_.get(CONST_DICT, 'socialites.type.TYPE_QQ')}`)
        .then(() => {
          message.success('解除绑定成功');
          this.setState({ qq: undefined });
        })
        .catch(() => {
          formErrorMessageShow({ msg: '解除绑定失败' });
        });
    }
  }

  handleWeChat=() => {
    const { wechat } = this.state;
    const wechatUrl = '/openLogin/wechat_auth_redirect';
    if (!wechat) {
      window.location.replace(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}${wechatUrl}?redirect_uri=${this.state.callbackHref}`);
    }
    else {
      http.delete(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/user/socialites/${_.get(CONST_DICT, 'socialites.type.TYPE_WECHAT')}`)
        .then(() => {
          message.success('解除绑定成功');
          this.setState({ wechat: undefined });
        })
        .catch(() => {
          formErrorMessageShow({ msg: '解除绑定失败' });
        });
    }
  }
  render() {
    const userInfo = _.get(this.props, 'visitorState.current');
    const { wechat, qq } = this.state;
    // const iconStyle = {
    //   color: '#00AAFF',
    //   marginRight: '10px',
    // };
    return (
      <PageLayout className={style.userInfo}>
        <div className={style.wrap} >
          <div className={style.header}>
              个人资料
          </div>
          <div className={style.content}>
            <div>
              <span className="sp sp-user" />姓名：{_.get(userInfo, 'name')}
            </div>
            <div>
              <span className="sp sp-org" />登录账号：{_.get(userInfo, 'username') || '未填写'}
            </div>
            <div>
              <span className="sp sp-sticker" />所属组织：{_.get(userInfo, 'department.name')}
            </div>
            {/* <div>
              <span className="sp sp-phone" />手机号：{_.get(userInfo, 'phone') || '未填写'}
            </div> */}
            {this.state.auth && <div>
              <span className="sp sp-star" />第三方账号：<span className={style.extra}>
                <span onClick={this.handleWeChat} style={{ color: '#00AAFF' }}>
                  <span className="sp sp-wechat2" />{ wechat ? '解除绑定' : '微信绑定'}
                </span>
                <span onClick={this.handleQQ} style={{ color: '#00AAFF' }}>
                  <span className="sp sp-qq" />{qq ? '解除绑定' : 'QQ绑定'}
                </span>
              </span>
            </div>}
          </div>
        </div>
      </PageLayout>
    );
  }
}
