import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'dva';
import _ from 'lodash';
import { Modal, Form, Progress, Spin, Row, Upload, message, Button, Icon } from 'antd';
import { getfilesize } from '@/utils/file_uploader.js';
import User from '../../utils/user';
import Component, { formItemLayout } from '../../components_default/page_add';
import Well from '../../components_atom/well';
import formErrorMessageShow from '../../utils/form_error_message_show';
import { undershoot as sentryUndershoot } from '../../utils/dva-sentry';
import buildColumnFormItem from '../../utils/build_column_form_item';
import { API_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '../../services/_factory';

import styles from './index.less';

function random() {
  return `${Math.random()}`.replace(/0./, '');
}


@Form.create()
@connect((state) => {
  return {
    breadcrumbState: state.breadcrumb,
  };
})
export default class UploadComponent extends Component {
  static defaultProps = {
    maxSize: 1024 * 1024 * 100,
    path: '',
    // 展现形式，是否为链接，默认为 false
    link: false,
    uploadConfirmTip: undefined,
    successTips: (options = {}) => {
      const response = _.get(options, 'response', {});
      if (0 === _.get(response, 'code', undefined)) {
        return '上传成功';
      }

      return '上传失败';
    },
    // 获取上传的表单数组
    getUploadFormColumn: ({ form }) => {
      if (__DEV__ && __PROD__) {
        window.console.log('getUploadFormColumn form', form);
      }
      return [];
    },
    onUploaded: (info) => {
      if (__DEV__ && __PROD__) {
        window.console.log('onUploaded info', info);
      }
    },
    // 提交的额外的表单的操作。
    // 默认的 value 更改函数。自定义时候需要覆盖
    formatFormValue: (values) => {
      return values;
    },
    extraFormValue: {},

    // 导入是异步任务的
    asyncUpload: false,
  };

  constructor(props) {
    super(props);

    _.assign(this.state, {
      visible: false,
      // visible: true,
      random: random(),
      file: {},
      info: {},
      loading: false,
      dataSource: {},
      // 上传中的
      mode: 'result',
      // 必须确认才能提交的
      // mode: 'confirm',
      // 还有额外 form 表单的
      // mode: 'form',
      formValue: {},
    });

    debugAdd('upload', this);
  }

  componentDidMount = () => {
  }

  componentWillReceiveProps = () => {}

  getTranslateDict = () => {
    if ('function' === typeof this.props.getTranslateDict) {
      try {
        return this.props.getTranslateDict();
      }
      catch (err1) {
        sentryUndershoot.capture(err1, {
          ...err1,
        });
        return [];
      }
    }
    else {
      return {};
    }
  }

  getUploadProps = () => {
    const routerName = _.get(_.last(_.get(this.props, 'breadcrumbState.current')), 'name', '');
    let innerText = '';
    if (_.isString(this.props.children)) {
      innerText = this.props.children;
    }
    else {
      try {
        // eslint-disable-next-line react/no-find-dom-node
        innerText = ReactDOM.findDOMNode(this).innerText;
      }
      catch (e) {
        innerText = '';
      }
    }
    const autoName = `${routerName} - ${innerText}`;

    const action = `${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL.replace(/\/$/, '')}/${this.props.path.replace(/^\//, '')}`;
    const props = {
      showUploadList: false,
      withCredentials: true,
      // name: 'upload_file',
      name: 'file',
      action,
      data: () => {
        const params = {
          ..._.get(this.state, 'formValue', {}),
          ..._.get(this.props, 'extraFormValue', {}),
          name: this.props.name || autoName,
        };

        return params;
      },
      headers: {
        Authorization: `Bearer ${User.token}`,
        // 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      beforeUpload: (file) => {
        if (file.size >= this.props.maxSize) {
          message.error(`文件大小（${getfilesize(file.size)}）超过最大限制${getfilesize(this.props.maxSize)}`, 8);
          return Promise.reject();
        }

        return new Promise((resolve, reject) => {
          // resolve 之后，就会开始上传。
          this.resolve = resolve;
          this.reject = reject;
          if (1 > _.get(this.getFormColumn(), 'length')) {
            // 没有额外的表单
            this.setState({
              visible: true,
              file,
              submitting: true,
              mode: 'result',
            });
            resolve(true);
          }
          else {
            // 有额外的表单
            this.setState({
              visible: true,
              file,
              mode: 'form',
              submitting: false,
            });
          }
        });
      },
      onChange: (info) => {
        this.setState({
          info,
        });

        const res = _.get(info, 'file.response') || {};

        if ('error' === info.file.status) {
          message.error(`${info.file.name} 上传失败，请重试.`);
          if (window.console && window.console.log) {
            window.console.log('上传失败，应该是上传网络出问题了', '错误信息', JSON.stringify(info.file));
          }
          if (0 !== res.code) {
            return formErrorMessageShow(res, {
              translateDict: this.getTranslateDict(),
            });
          }
        }

        if ('done' === info.file.status) {
          const newState = {
            // visible: false,
            submitting: false,
            loading: false,
            mode: 'result',
          };

          if (0 === res.code) {
            newState.visible = false;
          }

          this.setState(newState);
          if (0 !== res.code) {
            if (window.console && window.console.log) {
              window.console.log('上传成功但是解析失败了', '错误信息', JSON.stringify(info.file));
            }

            return formErrorMessageShow(res, {
              translateDict: this.getTranslateDict(),
            });
          }
          else {
            if (_.get(res, 'data.id')) {
              this.showAsyncUploadTips();
            }
            else {
              message.success(`${info.file.name} 文件上传成功，批量导入成功`);
            }
            // this.showAsyncUploadTips();
            if ('function' === typeof this.props.onUploaded) {
              if (this.props.asyncUpload) {
                this.handleAsyncUploadTip({
                  info,
                  // args { info, taskResponse? }
                  successCallback: (...args) => {
                    this.props.onUploaded(...args);
                  },
                });
              }
              else {
                this.props.onUploaded(info);
              }
            }
          }
        }
      },
    };
    return props;
  }

  getFormColumn = () => {
    if ('function' === typeof this.props.getUploadFormColumn) {
      return this.props.getUploadFormColumn({
        form: this.props.form,
      });
    }
    return [];
  }

  handleSubmitRun = ({
    values,
  }) => {
    this.setState({
      mode: 'result',
      formValue: {
        ...values,
      },
    }, () => {
      if ('function' === typeof this.resolve) {
        this.resolve(true);
      }
    });
  }

  handleAsyncUploadTip = ({
    info = {},
    successCallback = _.noop,
  }) => {
    const task = _.get(info, 'file.response.data') || {};
    if (!_.isEmpty(task) && task.id) {
      let timeout = null;
      const modal = Modal.info({
        title: '导入中',
        okButtonProps: {
          className: __DEV__ ? '' : 'ant-hide',
        },
        content: <div>
          数据导入中，请稍后。。。<Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} />
        </div>,
      });
      const pollTask = (successCb = _.noop) => {
        this.props.dispatch({
          type: 'download_task/detail',
          payload: {
            id: task.id,
          },
        }).then((res) => {
          const status = _.get(res, 'status');
          if (_.get(CONST_DICT, 'download_tasks.status.STATUS_NORMAL') === status) {
            timeout = setTimeout(() => {
              pollTask(successCb);
            }, 2000);
          }
          else if (_.get(CONST_DICT, 'download_tasks.status.STATUS_SUCCESS') === status) {
            successCb({ ...info, taskResponse: res });
            modal.destroy();
            message.success('导入成功');
          }
          else if ([
            _.get(CONST_DICT, 'download_tasks.status.STATUS_FAIL'),
            _.get(CONST_DICT, 'download_tasks.status.STATUS_EXPIRED'),
            _.get(CONST_DICT, 'download_tasks.status.STATUS_WARNING'),
          ].includes(status)) {
            modal.destroy();
            message.error('导入失败，请到右侧【我的任务】查看原因，调整后重新导入');
          }
        }).catch((err) => {
          if (timeout) {
            window.clearTimeout(timeout);
          }
          modal.destroy();
          formErrorMessageShow(err);
        });
      };

      pollTask(successCallback);
    }
    else {
      successCallback({ ...info });
    }
  }

  uploadCancel = () => {
    this.setState({
      formValue: {},
      random: random(),
      visible: false,
      loading: false,
      submitting: false,
    });
    if (this.reject) {
      this.reject(true);
    }
  }

  closeTips = () => {
    document.body.removeChild(this.divDom);
    this.divDom = '';
  }

  showAsyncUploadTips = () => {
    if (!this.divDom) {
      this.divDom = document.createElement('div');
      document.body.append(this.divDom);
    }

    ReactDOM.render(this.renderAsyncUploadTips(), this.divDom);
  }

  renderAsyncUploadTips = () => {
    const absoulteLeft = document.getElementsByClassName('home-taskIcon')[0].getBoundingClientRect().left || 700;
    return (<div className={styles.asyncUploadTips} style={{ left: absoulteLeft - 110 }}>
      <div className={styles.triangle} />
      <div>请点击此处进入【我的任务】查看导入进度。</div>
      <div onClick={this.closeTips} className={styles.closeButton}>关闭</div>
    </div>);
  }

  renderControlContent = ({
    onClick,
  }) => {
    const props = {
      // onClick: this.uploadBirdge,
      className: this.props.className,
      style: this.props.style,
      size: this.props.size,
    };

    if (onClick) {
      props.onClick = onClick;
    }

    if (this.props.link) {
      return (<a {...props} className={`text-black ${this.props.className || ''}`}>
        { this.props.children }
      </a>);
    }
    else {
      return (<Button {...props}>
        { this.props.children }
      </Button>);
    }
  }

  renderUploadContent = () => {
    const percent = parseInt(_.get(this.state.info, 'file.percent') || 0, 10);
    const status = _.get(this.state.info, 'file.status') || 'uploading';
    const response = _.get(this.state.info, 'file.response') || {};

    const actions = this.renderFormActionElemArrWithCancel();
    return (<span key={this.state.random}>
      <Modal
        visible={this.state.visible}
        wrapClassName={styles.normal}
        keyboard="false"
        maskClosable="false"
        footer={null}>

        <div className={'confirm' === this.state.mode ? '' : 'ant-hide'}>
          <div className="text-center">{this.props.uploadConfirmTip || null}</div>
          <br />
          <hr />
          <br />
          <div className="text-right">
            { actions.cancel }
            &nbsp;
            &nbsp;
            {
              this.renderUploadController({
                content: (<Button type="primary">确定上传</Button>),
              })
            }
          </div>
        </div>
        <div className={'form' === this.state.mode ? '' : 'ant-hide'}>
          <div>
            <span>选中的文件： {_.get(this.state, 'file.name')} ，文件大小 {getfilesize(_.get(this.state, 'file.size', ''))}</span>
            <br />
            <br />
          </div>

          {
            0 < _.get(this.getFormColumn(), 'length') ? this.renderUploadForm({
              columns: this.getFormColumn(),
            }) : null
          }
        </div>

        <div className={'result' === this.state.mode ? '' : 'ant-hide'}>
          <Spin spinning={false} data-bak-spinning={this.state.submitting}>
            <div className={styles.uploadTipContent}>
              <div>{this.state.file.name}</div>
              <br />
              <Progress percent={percent} status={'uploading' === status} />
              <br />
              <br />
              {
                'uploading' === status ? (<div>正在批量导入中，请耐心等待</div>) : null
              }
              {
                'error' === status ? (<div>
                  <div>上传失败</div>
                  <br />
                  <Well title="错误信息(调试专用)">
                    <div className={undefined === _.get(this.state.info, 'file.response') ? '' : 'ant-hide'}>可能原因：网络连接不通</div>
                    <div className={`${styles.uploadErrorContent}`}>
                      { _.isEmpty(response) ? null : <pre>{JSON.stringify(response, 2, 2).replace(/\\n/g, '')}</pre>}
                    </div>
                  </Well>
                </div>) : null
              }
              {
                'done' === status ? (<div>
                  <div>
                    {
                      this.props.successTips({
                        status,
                        response,
                      })
                    }
                  </div>

                  <br />
                  <Well title="错误信息(调试专用)" className={0 === _.get(response, 'code', undefined) ? 'ant-hide' : ''}>
                    <div className={styles.uploadErrorContent}>
                      <pre>{JSON.stringify(response, 2, 2).replace(/\\n/g, '')}</pre>
                    </div>
                  </Well>

                </div>) : null
              }
            </div>
          </Spin>
          <div className={styles.uploadCancelAction}>
            <Button onClick={this.uploadCancel}>
              <span>{ 'done' === status ? '关闭' : '取消上传' }</span>
            </Button>
          </div>
        </div>
      </Modal>
      { this.renderUploadInitViewContent() }
    </span>);
  }

  renderUploadInitViewContent = () => {
    // 这个是有弹提示的
    if (this.props.uploadConfirmTip) {
      const showTip = () => {
        if (__DEV__) {
          window.console.log('showTip');
        }
        return this.setState({
          mode: 'confirm',
          visible: true,
        });
      };

      return this.renderControlContent({
        onClick: showTip,
      });
    }
    else {
      return this.renderUploadController({
        content: this.renderControlContent({}),
      });
    }
  }

  renderUploadController = ({
    content = this.renderControlContent({}),
  }) => {
    return (<Upload key={this.state.key} {...this.getUploadProps()}>
      { content }
    </Upload>);
  }

  renderUploadForm = ({ columns }) => {
    const formCol = buildColumnFormItem({
      ...this.props,
      ...this.state,
      columns,
      shouldInitialValue: true,
      defaultValueSet: {},
      formItemLayout: formItemLayout || {},
      formValidate: this.state.formValidate,
      col: 24,
      warpCol: true,
      label: true,
    });

    return (<div>
      <Form id={this.state.formId} className="app-edit-form" onSubmit={this.handleSubmit}>
        <Well title="填写上传的信息" footer={null}>
          <Row gutter={40}>
            {formCol}
          </Row>
        </Well>
        { this.renderFormActionElem() }
      </Form>
    </div>);
  }

  renderFormSubmitActionElemTitle = () => {
    return '确定';
  }

  renderFormActionElemArrWithCancel = () => {
    const list = this.renderFormActionElemArr();
    const cancel = (<Button key="cancel" size="default" onClick={this.uploadCancel}>取消</Button>);
    list.push(cancel);
    Object.defineProperty(list, 'cancel', {
      value: cancel,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return list;
  }

  renderFormActionElem = () => {
    const list = this.renderFormActionElemArrWithCancel();

    return (<div className="text-right page-add-action">
      { list }
    </div>);
  }

  render() {
    return this.renderUploadContent();
  }
}

