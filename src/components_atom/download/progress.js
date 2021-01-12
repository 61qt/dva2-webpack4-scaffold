import jQuery from 'jquery';
import React from 'react';
import Qs from 'qs';
import _ from 'lodash';
import { connect } from 'dva';
import { Modal, Progress } from 'antd';
import Cookies from 'js-cookie';

import CONSTANTS from '../../constants';
import ServicesCommon from '../../services/common';

@connect((state) => {
  return {
    loading: !!state.loading.models.$export,
    exportState: state.$export,
    breadcrumbState: state.breadcrumb,
  };
})
export default class DownloadProgress extends React.PureComponent {
  static defaultProps = {
  };

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      random: Math.random(),
    };

    debugAdd('progress', this);
    debugAdd('downloadProgress', this);
  }

  componentDidMount = () => {
    this.getProgress();
  }

  // 获取最新的更新
  getProgress = () => {
    const jobList = this.getJob();
    const promises = [];
    _.map(jobList, (elem) => {
      // 目前强制刷新，避免文件过期了之后还显示。
      if (!(1 * elem.progress) || 100 > 1 * elem.progress || 100 <= 1 * elem.progress) {
        const promise = ServicesCommon.downloadProcess(elem.v).then((res) => {
          const data = _.get(res, 'data', {});
          const asyncDownloadProcess = (parseInt(_.get(data, 'progress') * 10000, 10) || 0) / 100;
          jQuery(window).trigger(CONSTANTS.EVENT.DOWNLOAD_ASYNC_PROCESS, {
            ...data,
            jobId: elem.v,
            progress: asyncDownloadProcess,
          });
          setTimeout(() => {
            this.setState({
              random: Math.random(),
            });
          });
          return data;
        }).catch((rej) => {
          // 下载文件已经过期
          if (1046 === _.get(rej, 'code')) {
            Cookies.remove(elem.key, {
              path: '/',
            });
            sessionStorage.removeItem(elem.key);
          }
          return {};
        });
        promises.push(promise);
      }
    });

    Promise.all(promises).then(() => {
      setTimeout(() => {
        // 再次进行数据获取
        this.getProgress();
      }, 10 * 1000);
    });
  }

  getJob = () => {
    const cookies = Qs.parse(document.cookie.replace(/;\s+/g, '&'));

    const list = [];
    _.map(_.entries(cookies), ([k, v]) => {
      if (k === `download_async_${v}`) {
        let pregressInfo = {};
        try {
          pregressInfo = JSON.parse(sessionStorage.getItem(k));
        }
        catch (e) {
          pregressInfo = {};
        }

        list.push({
          key: k,
          v,
          ...pregressInfo,
        });
      }
    });

    return list;
  }

  handleToggleVisible = () => {
    this.setState({
      visible: !this.state.visible,
    });
  }

  // 最终的渲染
  render() {
    const job = this.getJob();
    return (<span className={`random-${this.state.random}`}>
      <Modal
        closable
        maskClosable
        width="700px"
        visible={this.state.visible}
        title="我的下载"
        cancelText="关闭"
        onCancel={this.handleToggleVisible}
        className="noSureBtnModal">
        <div className="ant-table ant-table-small ant-table-bordered">
          <table className="ant-table-fixed">
            <thead className="ant-table-thead">
              <tr>
                <th style={{ width: 180 }}>任务名</th>
                <th style={{ width: 200 }}>生成进度</th>
                <th style={{ width: 170 }}>创建时间</th>
                <th style={{ width: 60 }}>操作</th>
              </tr>
            </thead>
            <tbody className="ant-table-tbody">
              {
                job.map((elem) => {
                  return (<tr key={elem.key} className="ant-table-row">
                    <td className="download-progress-name">{elem.remark || ''}</td>
                    <td className="download-progress-progress"><Progress percent={elem.progress || 0} size="small" /></td>
                    <td className="download-progress-name">{elem.t || ''}</td>
                    <td className="download-progress-action">
                      {elem.downloadUrl ? (<a target="_blank" href={elem.downloadUrl}>下载</a>) : (<a disabled className="disabled">下载</a>)}
                    </td>
                  </tr>);
                })
              }
            </tbody>
          </table>
          <div className="ant-form-extra">下载有效期为一天，过期将清除</div>
        </div>
      </Modal>
      <span onClick={this.handleToggleVisible}>{this.props.children}</span>
    </span>);
  }
}
