import React from 'react';
import _ from 'lodash';
import { NavLink } from '@/components_atom/router';
import Qs from 'qs';

import DetailView from '@/npm/@edu_components_atom/detail_view';
import Filters from '@/filters';
import Access from '@/npm/@edu_components_atom/access';
import PageLayout from '@/components_atom/page_layout';
import formErrorMessageShow from '@/utils/form_error_message_show';
import { getApiConfig } from '@/utils/get_api_config';
import { defineUnenumerableProperty } from '../page_list';

import './index.less';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // detailView 展示的多少列 , 默认是判断为 1 或者 2
      detailViewCol: undefined,
      // detail view 中的 label 宽度
      detailViewLabelWidth: '10em',
      // detail view 中的 展示行数
      detailViewExpand: 9999,
      // 当前页面的展示的表(service 或者是 schema)的名称。
      model: 'admin_city',
      // 当前页面的展示的表(service 或者是 schema)的中文可读名称。
      modeLabel: '市级管理员',
      canGoBackList: true,
      canGoEdit: true,
      backListText: '返回列表',
      editText: '编辑',
      // 是否显示单纯的表单信息，不需要 PageLayout 包裹。默认否。
      renderPureView: false,
      // 是否显示面包屑
      hideBreadcrumb: false,

      detailViewMode: 'DetailView', // Multiple
    };
    debugAdd('page_detail', this);
    const query = Qs.parse(window.location.search.replace(/^\?/, ''));
    const hash = Qs.parse(window.location.hash.replace(/^#/, ''));
    this.query = query;
    this.hash = hash;
  }

  componentDidMount = () => {
    const payload = this.getPageDetailPayload();
    this.getPageDetail({ payload });
    this.componentDidMountExtend();
  }

  getPageDetailPayload = () => {
    const payload = {
      id: _.get(this.props, 'match.params.id'),
    };

    return payload;
  }

  getPageDetail = ({ payload }) => {
    if (!this.shouldGetPageDetail()) {
      return Promise.reject({
        msg: '不能获取详情',
        code: 11009,
        data: {},
      });
    }

    const promise = this.props.dispatch({
      type: `${this.state.model}/detail`,
      payload,
    });

    if (promise && promise.then && promise.catch) {
      promise.then((res) => {
        this.handlePageDetailSuccess(res);
      }).catch((rej) => {
        this.handlePageDetailFail(rej);
      });
      return promise;
    }
    else {
      return Promise.reject({
        msg: '还没配置该 dispatch',
        data: {
          type: `${this.state.model}/${this.state.isMaxList ? 'maxList' : 'list'}`,
          payload,
        },
      });
    }
  }

  getPageTitleName = () => {
    const dataSource = this.getDataSource();
    return _.get(dataSource, 'name') || _.get(dataSource, 'username') || _.get(dataSource, 'user.name') || '';
  }

  getPageTitle = () => {
    if (__DEV__) {
      window.console.log('[getPageTitle] 如果需要配置页面标题，需要在子类重新定义该方法');
    }
    return (<h2>{this.getPageTitleName()} - {this.state.modeLabel}详情</h2>);
  }

  getGoBackCurrentModel=() => {
    return true;
  }

  getDetailViewTitleActionList = () => {
    const list = [];
    let back = null;
    if (this.state.canGoBackList) {
      back = (this.renderBackLink());
    }
    list.push(back);
    defineUnenumerableProperty(list, 'back', back);

    let edit = null;
    if (this.state.canGoEdit) {
      edit = (<Access key="edit" auth={`${getApiConfig({ model: this.state.model, key: 'mutation.update.name' })}`}>
        <NavLink to={Filters.path(`${this.state.model}_edit`, { id: _.get(this.props, 'match.params.id') })} activeClassName="link-active">{this.state.editText}</NavLink>
      </Access>);
    }
    list.push(edit);
    defineUnenumerableProperty(list, 'edit', edit);

    return list;
  }

  getDetailViewTitleAction = () => {
    return this.getDetailViewTitleActionList();
  }

  getDetailViewTitle = () => {
    return (<div>
      <span>{ `${this.state.modeLabel}（${this.getPageTitleName()}） 详情` }</span>
      <span className="float-right page-detail-well-title-right">
        { this.getDetailViewTitleAction() }
      </span>
    </div>);
  }

  getDetailColumn = () => {
    if (__DEV__) {
      window.console.log('[getDetailColumn] 如果需要配置页面详情列，需要在子类重新定义该方法');
    }
    return [];
  }

  getDataSource = () => {
    return this.props.pageDetail;
  }

  getPageFooter = () => {
    return null;
  }

  shouldGetPageDetail = () => {
    return true;
  }

  handlePageDetailSuccess = (res) => {
    if (__DEV__ && __PROD__) {
      window.console.log('res', res);
    }
    return true;
  }

  handlePageDetailFail = (rej) => {
    if (__DEV__ && __PROD__) {
      window.console.log('rej', rej);
    }
    formErrorMessageShow(rej);
    return true;
  }

  handleGoBack=() => {
    this.props.history.go(-1);
  }

  componentDidMountExtend = () => {
    if (__DEV__) {
      window.console.log('[componentDidMountExtend] 如果需要配置导航条，需要在子类重新定义该方法');
      window.console.log('[componentDidMountExtend] 如果需要获取页面详情，需要在子类重新定义该方法');
    }
  }

  innerRenderDetailView = (columns = this.getDetailColumn()) => {
    if ('DetailView' === this.state.detailViewMode) {
      return (
        columns && columns.length ? (<DetailView
          col={this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
          labelWidth={this.state.detailViewLabelWidth || '10em'}
          expand={this.state.detailViewExpand || 99999}
          loading={this.props.loading || false}
          dataSource={this.getDataSource()}
          columns={this.getDetailColumn()}
          title={this.getDetailViewTitle()} />) : null
      );
    }
    else if ('Multiple' === this.state.detailViewMode) {
      return _.map(columns, (info, index) => {
        return columns && columns.length ? (<DetailView
          key={info.key || info.title || `mutilple_detail_view_${index}`}
          col={info.detailViewCol || this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
          labelWidth={this.state.detailViewLabelWidth || '10em'}
          expand={this.state.detailViewExpand || 99999}
          loading={this.props.loading || false}
          dataSource={info.dataSource || this.getDataSource()}
          columns={info.columns || []}
          title={info.title || this.getDetailViewTitle()} />) : null;
      });
    }
    else if (__DEV__) {
      window.console.warn('page_detail 目前只支持 DetailView / Multiple detailViewMode');
    }
  }

  renderBackLink = (backListText = this.state.backListText) => {
    return (<Access key="back" auth={`${getApiConfig({ model: this.state.model, key: 'indexAuth' })}`}>
      {this.getGoBackCurrentModel() ? <NavLink to={Filters.path(`${this.state.model}`, {})} activeClassName="link-active">{backListText}</NavLink> : <a onClick={this.handleGoBack}>{backListText}</a> }
    </Access>);
  }

  renderDetailView = () => {
    return (<div className="page-detail-content">
      {this.getPageTitle()}
      {this.innerRenderDetailView()}
      {this.getPageFooter()}
    </div>);
  }

  renderView = () => {
    return (<PageLayout
      hideBreadcrumb={this.state.hideBreadcrumb}>
      { this.renderDetailView() }
    </PageLayout>);
  }

  renderPureView = () => {
    return this.renderDetailView();
  }

  render() {
    return this.state.renderPureView ? this.renderPureView() : this.renderView();
  }
}
