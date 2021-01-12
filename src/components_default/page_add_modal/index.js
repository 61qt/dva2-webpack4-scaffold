// import moment from 'moment';
import React from 'react';
// import _ from 'lodash';
import { Button, Modal, Spin } from 'antd';
import { notificationClose } from '@/utils/form_error_message_show';
import PageAdd from '../../components_default/page_add';

import styles from './index.less';

export default class Component extends PageAdd {
  constructor(props) {
    super(props);
    debugAdd('page_add_model', this);

    _.assign(this.state, {
      isInPageAddModal: true,
      visible: false,
      closable: true,
      successAutoBackList: false,
      formMode: 'DetailView',
      maskClosable: false,
      addModalWidth: '525px',
      addModalClassName: '',
    });
  }

  canToggleVisible = () => {
    return true;
  }

  canShowCloseBtn = () => {
    return true;
  }

  canShowSubmitBtn = () => {
    return true;
  }

  canShowResetBtn = () => {
    return true;
  }

  canShowResetBtnWarper = () => {
    if (!this.canShowResetBtn()) {
      return false;
    }

    // 设计师说，只有数据大于等于2的时候，才有重置按钮
    const columns = this.getFormColumn();
    let isColumnsGte2 = false;
    if (_.isArray(columns)) {
      if (1 < _.get(columns, 'length')) {
        isColumnsGte2 = true;
      }
    }
    else {
      isColumnsGte2 = true;
    }

    return isColumnsGte2;
  }

  enhanceSubmitBtn = (submitBtn) => {
    return submitBtn;
  }

  renderFormActionElem = () => {
    const list = this.renderFormActionElemArr();

    const close = (<Button key="close" size="default" onClick={this.handleToggleVisible}>{this.renderCancelText()}</Button>);
    list.push(close);
    Object.defineProperty(list, 'close', {
      value: close,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    return (<span className="page-add-action page-add-modal-action">
      { this.canShowCloseBtn() ? close : null }
      { this.canShowResetBtnWarper() ? list.reset : null }
      { this.canShowSubmitBtn() ? this.enhanceSubmitBtn(list.submit) : null }
    </span>);
  }

  closeNotification = () => {
    if (this.state.visible) {
      // 清除提示框
      notificationClose();
    }
  }

  renderFormActionModeDetect = () => {
    return (<div className="text-right">
      {this.renderFormActionElem()}
    </div>);
  }

  handleToggleVisible = () => {
    if (!this.canToggleVisible()) {
      return;
    }

    this.closeNotification();

    this.setState({
      visible: !this.state.visible,
    }, () => {
      if (this.state.visible) {
        this.handleVisibleTrueCallBack();
      }
      else {
        this.handleVisibleFalseCallBack();
      }
    });
    debugAdd('page_add_model_current', this);
  }

  // 显示之后的 cb
  handleVisibleTrueCallBack = () => {
    return Promise.resolve(true);
  }

  // 显示之后的 cb
  handleVisibleFalseCallBack = () => {
    return Promise.resolve(true);
  }

  // 提交表单正确时候的处理。
  successCallback = (options = {}) => {
    this.setState({
      submitting: false,
      visible: false,
    });

    if ('function' === typeof this.props.onSuccessCallback) {
      this.props.onSuccessCallback();
    }

    if ('function' === typeof this.props.onSuccessCallbackOfData) {
      this.props.onSuccessCallbackOfData(options);
    }
  }

  renderCancelText = () => {
    return '取消';
  }

  render() {
    let modalTitle = this.props.title || '';
    if ('function' === typeof this.getEditFormTitle && !this.props.title) {
      const functionGetModalTitle = this.getEditFormTitle();
      if (!_.isNull(functionGetModalTitle)) {
        modalTitle = functionGetModalTitle;
      }
    }
    return (<span>
      <span onClick={this.handleToggleVisible}>
        { this.props.children || ''}
      </span>

      <span key={this.state.visible}>
        <Modal
          destroyOnClose
          closable={this.state.closable}
          maskClosable={this.state.maskClosable}
          className={`${styles.modal} ${this.state.addModalClassName}`}
          width={this.state.addModalWidth}
          visible={this.state.visible}
          title={modalTitle}
          onCancel={this.handleToggleVisible}
          footer={null}
          okText={null}
          cancelText={this.renderCancelText()}>
          <div className="page-add-content">
            { this.getPageHeader() }
            <Spin spinning={this.state.loading}>
              { this.state.dataSource && !this.state.loading ? this.renderForm() : <div>正在加载</div>}
            </Spin>
            { this.getPageFooter() }
          </div>
        </Modal>
      </span>
    </span>);
  }
}
