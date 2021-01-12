// import moment from 'moment';
import React from 'react';
import _ from 'lodash';
import { Modal } from 'antd';
// Spin
import PageDetail from '../../components_default/page_detail';
import DetailView from '@/npm/@edu_components_atom/detail_view';

import './index.less';

export default class Component extends PageDetail {
  constructor(props) {
    super(props);
    debugAdd('page_detail_modal', this);

    _.assign(this.state, {
      visible: false,
      canGoBackList: false,
      canGoEdit: false,
      modalWidth: '520px',
      detailViewMode: 'DetailView', // Multiple
      modalClassName: '',
      detailViewCol: 1,
    });
  }

  getDataSource = () => {
    return this.props.dataSource;
  }

  canToggleVisible = () => {
    return true;
  }

  handleToggleVisibleTrue = () => {
    // modal 弹出的时候的处理。
  }

  handleToggleVisible = () => {
    if (!this.canToggleVisible()) {
      return;
    }
    this.setState({
      visible: !this.state.visible,
    }, () => {
      if (this.state.visible && _.isFunction(this.handleToggleVisibleTrue)) {
        this.handleToggleVisibleTrue();
      }
      if (this.state.visible && _.isFunction(this.props.onModalOpen)) {
        this.props.onModalOpen();
      }
    });
    debugAdd('page_detail_modal_current', this);
  }

  handleConfirm = () => {
    return Promise.resolve().then(() => {
      this.successCallback();
    });
  }

  // 提交表单正确时候的处理。
  successCallback = () => {
    this.setState({
      submitting: false,
      visible: false,
    });

    if ('function' === typeof this.props.onSuccessCallback) {
      this.props.onSuccessCallback();
    }
  }

  getModalOkText = () => {
    return null;
  }

  getModalCancelText = () => {
    return '取消';
  }

  innerRenderDetailView = () => {
    const columns = this.getDetailColumn();
    if ('DetailView' === this.state.detailViewMode) {
      return (
        columns && columns.length ? (<DetailView
          col={this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
          labelWidth={this.state.detailViewLabelWidth || '10em'}
          expand={this.state.detailViewExpand || 99999}
          loading={this.props.loading || false}
          dataSource={this.getDataSource()}
          columns={this.getDetailColumn()}
          title={null}
          data-bak-title={this.getDetailViewTitle()} />) : null
      );
    }
    else if ('Multiple' === this.state.detailViewMode) {
      return _.map(columns, (info, index) => {
        return columns && columns.length ? (<DetailView
          key={info.title || `mutilple_detail_view_${index}`}
          col={this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
          labelWidth={this.state.detailViewLabelWidth || '10em'}
          expand={this.state.detailViewExpand || 99999}
          loading={this.props.loading || false}
          dataSource={info.dataSource || this.getDataSource()}
          columns={info.columns || []}
          title={info.title || this.getDetailViewTitle()} />) : null;
      });
    }
    else if (__DEV__) {
      window.console.warn('page_detail_modal 目前只支持 DetailView / Multiple detailViewMode');
    }
  }

  render() {
    return (<span>
      <span onClick={this.handleToggleVisible}>
        { this.props.children || ''}
      </span>

      <span key={this.state.visible}>
        <Modal
          destroyOnClose
          className={`${!this.getModalOkText() && 'noSureBtnModal'} noBtnBorderModal ${this.state.modalClassName}`}
          width={this.state.modalWidth}
          visible={this.state.visible}
          data-dak-title={this.props.title || ''}
          onCancel={this.handleToggleVisible}
          onOk={this.handleConfirm}
          data-bak-footer={null}
          okText={this.getModalOkText()}
          title={this.getDetailViewTitle()}
          cancelText={this.getModalCancelText()}>
          <div className="page-detail-content page-modal-detail-content">
            {
              // this.getPageTitle()
            }
            { this.innerRenderDetailView() }
            { this.getPageFooter() }
          </div>
        </Modal>
      </span>
    </span>);
  }
}
