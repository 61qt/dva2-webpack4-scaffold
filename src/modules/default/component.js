import { Route } from '@/components_atom/router';
import _ from 'lodash';
import moment from 'moment';
import jQuery from 'jquery';
import Cookies from 'js-cookie';
import { message } from 'antd';
import Qs from 'qs';
import { biz, ready, env } from 'dingtalk-jsapi';
import getUserTypeLabel, { getUserAddrInfo } from '@/utils/get_user_type_label';
import formErrorMessageShow from '@/utils/form_error_message_show';
import ServiceVisitor from '@/services/visitor';
import ServicesCommon from '@/services/common';
import CONSTANTS from '@/constants';
import User, { IS_OPERATIONS_PLATFORM } from '@/utils/user';

import styles from './component.less';

// import { undershoot as sentryUndershoot } from '../../utils/dva-sentry';

let prolongingInterval = '';
const PROLONGING_SAVE_KEY = `prolonging_${DEFINE_PROJ}_${DEFINE_UNION_DOMAIN}`;

// 这个 class 会被 component_operation_platform 同时继承改造，记得修改的时候看看新修改的需求是否满足运营平台那边的需求。
export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    prolongingInterval = '';
    this.state = {
      // 是否获取帮助中心文档url
      shouldGetSupportDocumentUrl: true,
      userId: User.id,
      pending: true,
      logged: false,
      error: false,
      // 是否验证ticker来登录
      checkTicketLogin: true,
      initBuildAreaTree: true,
    };
    window.addEventListener('unload', () => {
      document.cookie = `${PROLONGING_SAVE_KEY}=false;path=/`;
    });

    jQuery(window).on('focus', () => {
      this.handleGlobalClick({});
    });
    debugAdd('defaultComp', this);
  }

  componentWillMount() {
    this.onEnter();
    // jQuery(window).on(CONSTANTS.EVENT.CAS_TICKET_LOGIN, showNewestAnnouncement);
  }

  componentDidMount = () => {
    const random = Math.random() * 10;
    if (__PROD__ && __DEV__) {
      prolongingInterval = window.setInterval(this.setLiving, (10 + random) * 1000);
    }
    else {
      prolongingInterval = window.setInterval(this.setLiving, (4 * 60 + random) * 1000);
    }

    if (this.state.initBuildAreaTree) {
      this.props.dispatch({
        type: 'area/tree',
      }).then((res) => {
        window.console.log('area tree', res);
      });
    }

    if (env && env.platform && 'notInDingTalk' !== env.platform) {
      ready(() => {
        biz.navigation.setRight({
          show: false,
        });
      });
    }

    this.componentDidMountExtend();
  }

  componentWillUnmount = () => {
    window.clearInterval(prolongingInterval);
    document.cookie = `${PROLONGING_SAVE_KEY}=false;path=/`;
  }

  onEnter() {
    // 应该来说，这个好像没影响。因为运营平台是不会有 ticket 的。但是就是加多个判断而已，避免问题。
    if (this.state.checkTicketLogin) {
      const query = Qs.parse(window.location.search.replace(/^\?/, ''));
      if (query.ticket) {
        return this.ticketToken(query.ticket);
      }
    }

    if (!CONST_DICT || _.isEmpty(CONST_DICT)) {
      formErrorMessageShow('系统初始化字典出错，请联系管理员');
      this.setState({
        error: true,
        pending: false,
        logged: false,
      });
      return;
    }

    // 初始化，从本地存储读取登录信息。
    if (!User.token) {
      if (IS_OPERATIONS_PLATFORM) {
        return jQuery(window).trigger(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_JUMP_AUTH);
      }
      return jQuery(window).trigger(CONSTANTS.EVENT.CAS_JUMP_AUTH);
    }

    this.getVisitorInfo();
  }

  // getAuthInfo = () => {
  //   ServicesCommon.loginToken().then((res) => {
  //     const random = Math.random() * 10;
  //     prolongingInterval = window.setInterval(this.setLiving, (4 * 60 + random) * 1000);
  //     return this.loginTokenSuccess({ res });
  //   }).catch((rej) => {
  //     this.loginTokenFail({ rej });
  //     return Promise.reject(rej);
  //   });
  // }

  getAuthedComp = () => {
    return (<div>授权成功</div>);
  }

  getVisitorInfoType = () => {
    return 'visitor/current';
  }

  getAdminType = () => {
    return [
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER'),
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_CITY'),
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_DISTRICT'),
      _.get(CONST_DICT, 'users.user_type.USER_TYPE_SCHOOL'),
    ];
  }

  getVisitorInfo = () => {
    return this.props.dispatch({
      type: this.getVisitorInfoType(),
    }).catch((rej) => {
      jQuery(window).trigger(CONSTANTS.EVENT.CAS_AUTH_401, rej);
    }).then((res) => {
      if (this.getAdminType().includes(_.get(res, 'user_type'))) {
        User.isAdminCache = true;
      }
      else {
        User.isAdminCache = false;
      }

      if (this.state.shouldGetSupportDocumentUrl) {
        this.getSupportDocumentUrl();
      }

      return this.props.dispatch({
        type: 'graphql/info',
      }).then(async () => {
        await this.getVisitorInfoSuccess(res);
        this.pageSuccess();
      }).catch((rej) => {
        const duration = 9999;
        if (window && window.console && window.console.log) {
          window.console.log('查询 GraphQl 语法出错', duration, rej);
        }

        // message.error('查询 GraphQl 语法出错', duration);

        // formErrorMessageShow(rej, {
        //   duration,
        // });

        this.pageFail();
      });
    });
  }

  getSupportDocumentUrl=() => {
    this.props.dispatch({
      type: 'visitor/supportDocumentUrl',
      payload: {},
    });
  }

  getVisitorInfoSuccess = (res) => {
    if (__DEV__ && __PROD__) {
      window.console.log('getVisitorInfoSuccess res', res);
    }
    if (__DEV__) {
      window.console.log('[getVisitorInfoSuccess] 如果需要配置表单列，需要在子类重新定义该方法');
    }
  }

  setLiving = (options = {}) => {
    const prolonging = (document.cookie || '').includes(`${PROLONGING_SAVE_KEY}=true`);

    if (!prolonging || options.force) {
      if (window.console && window.console.log) {
        window.console.log('prolonging document.cookie', document.cookie, 'token is', User.token);
      }
      document.cookie = `${PROLONGING_SAVE_KEY}=true;path=/`;

      ServiceVisitor.info().then((res) => {
        this.loginTokenSuccess({ res });
        setTimeout(() => {
          document.cookie = `${PROLONGING_SAVE_KEY}=false;path=/`;
        }, 30 * 1000);
      }).catch(() => {
        setTimeout(() => {
          document.cookie = `${PROLONGING_SAVE_KEY}=false;path=/`;
        }, 30 * 1000);
      });
    }
  }

  pageSuccess = () => {
    this.setState({
      pending: false,
      logged: true,
    });
    return true;
  }

  pageFail = () => {
    this.setState({
      error: true,
      pending: false,
      logged: false,
    });
    return false;
  }

  componentDidMountExtend = () => {
    if (__DEV__) {
      window.console.log('[componentDidMountExtend] 可以在子类重新定义该方法');
    }
  }

  statistics = () => {
    const isFromLoginView = Cookies.get('LOGIN_FROM_LOGIN_VIEW');
    if (!isFromLoginView) {
      return;
    }
    // 登录时间统计
    const timeCategory = `3-系统登录-登录时间(24小时)-${getUserTypeLabel()}`;
    const loginTimeEvent = ['_trackEvent', timeCategory, moment().format('YYYY-MM-DD')];
    'undefined' !== typeof _czc && _czc.push && _czc.push(loginTimeEvent); // 发到友盟统计
    'undefined' !== typeof _hmt && _hmt.push && _hmt.push(loginTimeEvent); // 发到百度统计

    // 登录人数统计
    const countCategory = `3-系统登录-登录人数-${getUserTypeLabel()}`;
    const loginCountEvent = ['_trackEvent', countCategory, '登录人数'];
    'undefined' !== typeof _czc && _czc.push && _czc.push(loginCountEvent); // 发到友盟统计
    'undefined' !== typeof _hmt && _hmt.push && _hmt.push(loginCountEvent); // 发到百度统计

    // 登录地区统计
    // eslint-disable-next-line no-underscore-dangle
    const areaCategory = `3-系统登录-登录地区-${getUserTypeLabel()}`;
    const city = getUserAddrInfo('city_id');
    const district = getUserAddrInfo('district_id');
    const loginAreaEvent = ['_trackEvent', areaCategory, `${city || ''}${district || ''}`];
    'undefined' !== typeof _czc && _czc.push && _czc.push(loginAreaEvent); // 发到友盟统计
    'undefined' !== typeof _hmt && _hmt.push && _hmt.push(loginAreaEvent); // 发到百度统计
    Cookies.set('LOGIN_FROM_LOGIN_VIEW', false, {
      // 五分钟
      expires: 1 / 24 / 60 * 5,
      path: '/',
    });
  }

  ticketToken = (ticket) => {
    return ServicesCommon.ticketToken(ticket).then((res) => {
      const data = res.data || {};
      User.token = data.token;

      return this.getVisitorInfo().then(() => {
        message.success('登录成功');

        this.statistics();

        const url = window.location.href.replace(/&*ticket=[^&]*/, '').replace(/#$/, '').replace(/\?$/, '');
        jQuery(window).trigger(CONSTANTS.EVENT.CAS_TICKET_LOGIN);
        window.history.replaceState({}, {}, url);
      });
    }).catch((rej) => {
      formErrorMessageShow(rej);
      const jumpUrl = window.location.href.replace(/&*ticket=[^&]*/, '').replace(/#$/, '').replace(/\?$/, '');
      window.location.replace(jumpUrl);
      message.success('无效 ticket');
      this.setState({
        pending: false,
        logged: false,
      });
    });
  }

  loginTokenFail({ rej }) {
    document.cookie = 'isLogout=true;path=/';
    if (rej && undefined !== rej.status) {
      if (rej && 401 === rej.status) {
        message.error('授权已经过期，需要重新登录');
      }
      else {
        const tips = '系统出现错误，请联系管理员，错误信息查看控制台';
        window.console.error('系统出现错误，请联系管理员，错误信息查看控制台', tips, rej);
        formErrorMessageShow(rej);
      }
    }
    this.setState({
      pending: false,
      logged: false,
    });
  }

  loginTokenSuccess = ({ res }) => {
    // const data = _.get(res, 'data') || {};

    // sentryUndershoot.setUserContent(data.user);

    return res;
  }

  handleGlobalClick() {
    // 检测其他网页已经切换了用户
    const userId = User.id;
    if (userId && this.state.userId !== userId) {
      this.setState({
        userId,
      }, () => {
        this.setLiving({
          force: true,
        });
      });
    }
  }

  render() {
    const render = () => {
      // 显示加载中的数据
      if (this.state.pending) {
        let loadingHtml = '加载中';
        // eslint-disable-next-line no-underscore-dangle
        if ('string' === typeof window.____loadingHtml) {
          // eslint-disable-next-line no-underscore-dangle
          loadingHtml = window.____loadingHtml;
        }
        const loadingHtmlProps = {
          dangerouslySetInnerHTML: { __html: loadingHtml },
        };
        return (<div>
          <div {...loadingHtmlProps} />
        </div>);
      }

      // 显示登录成功的数据
      if (this.state.logged) {
        return this.getAuthedComp();
      }

      if (!this.state.pending && this.state.error) {
        return (<div className={styles.errorTip}>
          <div>系统出现错误，请联系管理员，错误信息查看控制台</div>
        </div>);
      }

      if (!this.state.pending && !this.state.logged) {
        setTimeout(() => {
          return jQuery(window).trigger(CONSTANTS.EVENT.CAS_JUMP_AUTH);
        }, 1000);
        return (<div className={styles.errorTip}>
          <div>授权中。。。</div>
        </div>);
      }
    };

    return (
      <Route {...this.props} render={render} />
    );
  }
}
