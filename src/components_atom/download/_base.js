import jQuery from 'jquery';
import UUID from 'uuid';
import React from 'react';
import ReactDOM from 'react-dom';
import Qs from 'qs';
import moment from 'moment';
import _ from 'lodash';
import store from 'store';
import axios from 'axios';
import { Spin, Progress, Modal, Checkbox, message } from 'antd';
import download from '../../utils/download';
import User from '../../utils/user';
import { http, API_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '../../services/_factory';
import ServicesDownloadTask from '../../services/download_task';
import ServicesCommon from '../../services/common';
import formErrorMessageShow from '../../utils/form_error_message_show';
import CONSTANTS from '../../constants';

import styles from './index.less';

const DOWNLOAD_CONFIRM_STORE_KEY = 'DOWNLOAD_CONFIRM_STORE_KEY';

export const baseProps = {
  // 是否移除 baseUrl
  removeBaseUrl: false,
  // // 这个是 redux 中的存储的能下载的表头的全部信息
  // exportState: [],
  // 是否需要弹窗确认下载
  confirm: false,
  // 下载路径
  path: 'graphql',
  // 是否跳过授权
  skipAuthorization: false,
  // // 额外需要传输的数据信息，貌似没用到。目前考试管理，导出学生成绩和学生座位号的增加了处理
  paramsData: {},
  // 打开的方式
  method: 'POST',
  className: '',
  children: null,
  // 这个是延迟生成下载文件的，用于异步下载
  downloadAsync: false,
  // _blank: 新窗口打开
  target: '',
  canDownload: () => {
    return true;
  },
  // 是否被禁止
  disabled: false,
};

export default class Base extends React.PureComponent {
  static defaultProps = {
    ...baseProps,
  };

  constructor(props) {
    super(props);
    // 标识这个组件是不是已经消灭了，如果消灭了，那就不执行异步回来的数据信息。
    this.componentUnmountFlag = false;
    this.state = {
      // 这个得拆出去，使用另外一个组件处理下载中的任务，生命周期常驻。
      asyncBuilding: false,
    };

    this.uuid = UUID().replace(/-/g, '_');
    debugAdd('download', this);
    debugAdd(`download_all_${this.uuid}`, this);
  }

  componentDidMount = () => {
    this.componentUnmountFlag = false;
  }

  componentWillUnmount = () => {
    this.componentUnmountFlag = true;
  }

  // 如果当天不在显示，那就勾选，缓存，今天内不再提醒。
  onTodayConfirmNotShowCheckboxChange = (e) => {
    const value = _.get(e, 'target.checked');
    if (value) {
      const today = moment(CONST_TIME, DEFINE_CONST_TIME_FORMT).format('YYYY-MM-DD');
      store.set(DOWNLOAD_CONFIRM_STORE_KEY, today);
    }
    else {
      store.remove(DOWNLOAD_CONFIRM_STORE_KEY);
    }
  }

  // 进行下载的操作，
  // 自定义表头模式，如果已经确认当天不需要再进行弹窗提醒，就今天不再弹窗。否则弹窗确认（导出的表格仅导出本次搜索的结果）
  // 如果是普通的下载，那就直接进行下载，调用 download 函数下载。
  downloadBirdge = (optionsArgs = {}) => {
    const today = moment(CONST_TIME, DEFINE_CONST_TIME_FORMT).format('YYYY-MM-DD');
    if (today === store.get(DOWNLOAD_CONFIRM_STORE_KEY)) {
      return this.download(optionsArgs);
    }
    if (-1 < ['true', true].indexOf(this.props.confirm)) {
      Modal.confirm({
        title: '下载提示',
        content: (<div>
          <span>导出的表格仅导出本次搜索的结果</span>
          <br />
          <br />
          <Checkbox onChange={this.onTodayConfirmNotShowCheckboxChange}>今天内不在显示该提示</Checkbox>
        </div>),
        okText: '确定',
        okType: 'primary',
        cancelText: '取消',
        onOk: () => {
          this.download(optionsArgs);
        },
        onCancel: () => {
          if (__DEV__) {
            window.console.log('取消了下载');
          }
        },
      });
    }
    else {
      this.download(optionsArgs);
    }
  }

  downloadCallBack = () => {
    if ('function' === typeof this.props.downloadCallBack) {
      this.props.downloadCallBack();
    }
  }

  // 真正的下载功能。这个功能，还得精简。然后进行不同组件间的回调。
  download = (optionsArgs = {}) => {
    const downloadParams = _.get(optionsArgs, 'downloadParams');

    if ('function' === typeof this.props.canDownload && !this.props.canDownload()) {
      return;
    }

    const { path, method = 'POST' } = this.props;

    let formData = {
      ...this.props.paramsData, // 这个参数，暂时没用了。目前考试管理，导出学生成绩和学生座位号的增加了处理
      ...downloadParams,
      ...Qs.parse(this.props.query || ''),
    };
    if (!this.props.skipAuthorization) {
      if (this.props.tokenName) {
        formData[this.props.tokenName] = User.token;
      }
      else {
        formData.token = User.token;
        formData.api_token = User.token;
      }
    }

    let options = {
      base: API_DOMAIN_WITH_PREFIX_AND_PROTOCOL,
      method: -1 < window.location.search.indexOf('method=get') ? 'GET' : method,
    };

    if (this.props.removeBaseUrl) {
      delete options.base;
    }

    // graphql 那边会组将新的数据
    if ('function' === typeof this.formatFormData) {
      const result = this.formatFormData({ formData, options });
      formData = result.formData;
      options = result.options;
    }

    // 判断是否异步加载的
    if (this.props.downloadAsync) {
      this.asyncDownload({
        path,
        formData,
        options,
      });
    }
    else {
      download(path, formData, options);
    }

    if ('function' === typeof this.downloadCallBack) {
      this.downloadCallBack();
    }

    return true;
  }

  // 异步下载的。监控到后端生成下载完成之后，就会直接进行下载，这个动作应该放出来广播到其他组件里面处理。
  asyncDownload = ({
    path,
    formData,
    options,
  }) => {
    const runTimeout = () => {
      if (this.componentUnmountFlag) {
        return;
      }

      // 不显示时，终止timeout
      if (!this.state.asyncBuilding) {
        return;
      }

      let timeoutSave = '';
      if (timeoutSave) {
        window.clearTimeout(timeoutSave);
      }

      const timerMs = __DEV__ ? 1000 : 2 * 1000;
      timeoutSave = setTimeout(() => {
        let promise = null;
        // 如果有这个下载的存储表，那就使用异步下载任务
        if (DEFINE_TABLE_HAS_DOWNLOAD_TASK) {
          promise = ServicesDownloadTask.graphqlDetail({ id: this.jobId });
        }
        else {
          promise = ServicesCommon.downloadProcess(this.jobId);
        }

        promise.then((res) => {
          const data = _.get(res, 'data', {});
          const asyncDownloadProcess = _.round(0 < _.get(data, 'current_count') * _.get(data, 'task_count') ? _.get(data, 'current_count') / _.get(data, 'task_count') * 100 : 0, 2) || 0;
          const downloadUrl = _.get(data, 'download_url') || '';
          const status = _.get(data, 'status') || '';

          if (DEFINE_TABLE_HAS_DOWNLOAD_TASK) {
            jQuery(window).trigger(CONSTANTS.EVENT.DOWNLOAD_ASYNC_PROCESS, {
              ...data,
              jobId: this.jobId,
              progress: asyncDownloadProcess,
            });
          }

          if (_.get(CONST_DICT, 'download_tasks.status.STATUS_SUCCESS') === status && downloadUrl) {
            if (!this.componentUnmountFlag && this.state.asyncBuilding) {
              this.setState({
                asyncDownloadProcess,
                asyncBuilding: false,
              }, () => {
                jQuery(window).trigger(CONSTANTS.EVENT.TOGGLE_HEADER_ACCOUNT_LAYOUT, false);
              });
              const subfix = _.get(downloadUrl.match(/(\.[^.]+$)/), 1, '');
              const name = `${data.name}${subfix}`;
              const url = `${downloadUrl}?rename=${encodeURIComponent(name)}`;
              if (DEFINE_USE_ALIYUN_OSS) {
                // 阿里云要重命名文件
                return axios.get(url.replace(/https:|http:/g, location.protocol), {
                  responseType: 'blob',
                }).then((rep) => {
                  const newUrl = window.URL.createObjectURL(new Blob([rep.data]));
                  const link = document.createElement('a');
                  link.style.display = 'none';
                  link.href = newUrl;
                  link.setAttribute('download', name);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }).catch(() => {
                  message.error('网络错误');
                });
              }

              if ('_blank' === this.props.target) {
                try {
                  const winHandler = window.open('', '_blank');
                  winHandler.location.href = url;
                }
                catch (error) {
                  message.error('无法打开资源');
                  window.console.log(error);
                }
              }
              else {
                // 直接使用浏览器跳转的模式
                location.href = url;
              }

              // download(downloadUrl, {
              //   format: 'format',
              //   rename: name,
              // }, {
              //   ...options,
              //   method: 'GET',
              //   format: 'format',
              //   target: '_blank',
              // });
            }
          }
          else if (!this.componentUnmountFlag && this.state.asyncBuilding) {
            this.setState({
              asyncDownloadProcess,
            }, () => {
              runTimeout();
            });
          }
        }).catch((rej) => {
          window.console.log('rej', rej);
          formErrorMessageShow(rej);
          this.setState({
            asyncDownloadProcess: 0,
            asyncBuilding: false,
          }, () => {
            jQuery(window).trigger(CONSTANTS.EVENT.TOGGLE_HEADER_ACCOUNT_LAYOUT, false);
          });
        });
      }, timerMs);
    };
    this.setState({
      asyncDownloadProcess: 0,
      asyncBuilding: true,
    }, () => {
      jQuery(window).trigger(CONSTANTS.EVENT.TOGGLE_HEADER_ACCOUNT_LAYOUT, true);
    });
    let innerText = '';
    try {
      // eslint-disable-next-line react/no-find-dom-node
      innerText = ReactDOM.findDOMNode(this).innerText;
    }
    catch (e) {
      innerText = '';
    }
    const routerName = _.get(this.props, 'routerName') || _.get(_.last(_.get(this.props, 'breadcrumbState.current')), 'name', '');
    const autoName = `${routerName} - ${innerText}`;
    const appendFormData = {
      ...formData,
      autoName,
      name: formData.name || autoName,
    };
    http.post(path, appendFormData, options).then((res) => {
      // window.console.log('path', path, 'formData', formData, 'options', options);
      // window.console.log('res', res);
      // const jobId = _.get(res, 'data.job_id');
      const jobId = _.get(res, 'data.id') || _.get(res, 'data.job_id') || _.get(res, `data.${this.props.exportableList}.id`);
      this.jobId = jobId;
      runTimeout();
    }).catch((rej) => {
      // window.console.log('rej', rej);
      this.setState({
        asyncBuilding: false,
      }, () => {
        jQuery(window).trigger(CONSTANTS.EVENT.TOGGLE_HEADER_ACCOUNT_LAYOUT, false);
      });

      formErrorMessageShow(rej);
    });
  }

  handleErrorMax=(rej) => {
    Modal.error({
      title: '导出失败',
      content: `导出数据超过${_.get(rej, 'data.max', 0)}行，无法导出，请先筛选数据再导出。`,
      okText: '确定',
    });
  }

  handleCancelModal = () => {
    this.setState({
      asyncBuilding: false,
    }, () => {
      jQuery(window).trigger(CONSTANTS.EVENT.TOGGLE_HEADER_ACCOUNT_LAYOUT, false);
    });
  }

  // 异步下载的情况，进行展示生成进度。
  renderAsync = () => {
    if (!this.props.downloadAsync) {
      return null;
    }

    return (<span>
      <Modal
        onCancel={this.handleCancelModal}
        cancelText="关闭"
        destroyOnClose
        visible={this.state.asyncBuilding}
        title="正在下载文件，请稍等"
        className="noSureBtnModal">
        <div>
          <div>文件正在生成中： {this.state.asyncDownloadProcess}% </div>
          <div><Progress percent={this.state.asyncDownloadProcess} status="active" /></div>
          <div>服务器生成完成，将直接跳转到下载链接，请稍后。</div>
          <div className={styles.tips}>关闭此窗口，在右上角指示处，打开”我的任务“，也可找到此次下载任务。</div>
        </div>
      </Modal>
    </span>);
  }

  renderView = () => {
    // 每个继承之后，自定义， 否则，就不显示
    // 继承之后，目前有 link ，普通的 restful 的 button 模式， graphql 的自定义头下载的模式。
    return null;
  }

  // 最终的渲染
  render() {
    return (<Spin spinning={this.props.loading} wrapperClassName={styles.downloadSpin}>
      { this.renderView() }
      {this.renderAsync() }
    </Spin>);
  }
}
