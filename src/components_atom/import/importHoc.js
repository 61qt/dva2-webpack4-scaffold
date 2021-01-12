import React from 'react';
import { Upload, message } from 'antd';
import axios from 'axios';
import NP from 'number-precision';
import services from '@/services/download_task';
import fileUploader, { getfilesize } from '@/utils/file_uploader.js';
import { API_DOMAIN_WITH_PREFIX_AND_PROTOCOL, http } from '@/services/_factory';
import User from '@/utils/user';

export default function (newProps = {}) {
  // eslint-disable-next-line
  return function (Component) {
    return class HocComponent extends React.PureComponent {
      static defaultProps = {
        maxSize: 1024 * 1024 * 100,
        service: true, // 默认走api
        getInitFilesInfo: (props) => {
          if (_.isArray(props.value) || _.isArray(props.defaultValue)) {
            return _.map((props.value || props.defaultValue), (item, index) => {
              return {
                status: 'done',
                file: {
                  size: _.get(item, 'size', 0),
                  name: _.get(item, 'name', ''),
                  uid: `${index}-${_.get(item, 'name')}`,
                },
                successData: _.isString(item) ? item : _.get(item, 'url'),
              };
            });
          }
          return [];
        },
        ...newProps,
      }

      static getDerivedStateFromProps =(nextProps, { filesInfo }) => {
        if ('function' === typeof nextProps.onChange) {
          const newFilesInfo = nextProps.getInitFilesInfo(nextProps);
          let flag = false;
          _.each(filesInfo, (item, index) => {
            if (_.get(item, 'file', 'uid') !== _.get(newFilesInfo, `${index}.file.uid`)) {
              flag = true;
            }
          });

          if (flag) {
            return { filesInfo: newFilesInfo };
          }
        }

        return {};
      }

      constructor(props) {
        super(props);
        const filesInfo = props.getInitFilesInfo(props) || [];

        this.state = {
          isLine: false, // 队列是否可运行
          filesInfo, // status: 'beforeUpload'状态有：beforeUpload waiting uploading done error taskWaiting taskPolling taskDone taskError removed
          formValue: undefined,
        };
      }


      // eslint-disable-next-line
      time = {};
      // eslint-disable-next-line
      uploadRef = React.createRef()
      // eslint-disable-next-line
      childrenRef = React.createRef()

      cancel = {};

      componentWillUnmount=() => {
        this.closeAlignment();
        this.uploadRef = null;
        this.childrenRef = null;
      }

      clickInput=() => {
        if ('function' === typeof _.get(this.uploadRef, 'upload.uploader.fileInput.click')) {
          this.setState({ isLine: true });
          this.uploadRef.upload.uploader.fileInput.click();
        }
      }

      getUploadProps = () => {
        let action = '';
        if (this.props.path) {
          action = `${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL.replace(/\/$/, '')}/${this.props.path.replace(/^\//, '')}`;
        }

        const props = {
          showUploadList: false,
          withCredentials: true,
          // name: 'upload_file',
          name: 'file',
          action,
          data: () => {
            const params = {
              ..._.get(this.props, 'extraFormValue', {}),
              name: this.props.name,
            };
            return params;
          },
          headers: {
            Authorization: `Bearer ${User.token}`,
          },
          beforeUpload: (file) => {
            if (file.size >= this.props.maxSize) {
              let maxSizeErrorTips = `${_.get(file, 'name', '')}文件大小（${getfilesize(file.size)}）超过最大限制${getfilesize(_.get(props, 'maxSize'))}`;
              if (this.props.getMaxSizeErrorTips) {
                maxSizeErrorTips = this.props.getMaxSizeErrorTips(file);
              }

              message.error(maxSizeErrorTips, 8);
              return Promise.reject();
            }

            if (_.get(this.props, 'fileNameLength')) {
              const nameArr = (_.get(file, 'name') || '').split('.');
              nameArr.splice(nameArr.length - 1, 1);
              const currentName = nameArr.join();
              if (_.get(currentName, 'length', 0) > _.get(this.props, 'fileNameLength')) {
                message.error(`文件名请限制在${_.get(this.props, 'fileNameLength')}个字符以内`);
                return Promise.reject();
              }
            }

            // fixme: 后续纠正文件格式的校验
            if (_.get(props, 'accept')) {
              let typeErrorTips = `${_.get(file, 'name', '')}文件格式不正确`;
              if (this.props.getTypeErrorTips) {
                typeErrorTips = this.props.getTypeErrorTips(file);
              }

              if (_.get(props, 'accept').startsWith('.')) {
                const type = _.last(file.name.split('.'));
                const validateType = _.get(props, 'accept', '').replace(/\./g, '').split(',');
                if (!_.includes(validateType, type)) {
                  message.error(typeErrorTips);
                  return Promise.reject();
                }
              }
              else if (!_.includes(_.get(props, 'accept'), file.type)) {
                message.error(typeErrorTips);
                return Promise.reject();
              }
            }

            return true;
          },
          customRequest: (options) => {
            const fileInfo = { ...options, status: 'waiting' };
            this.setChildrenController('setBeforeUploadToWaiting', fileInfo);
            this.setInfoData(fileInfo);
          },
          ..._.omit(this.props, 'value', 'onChange'),
        };

        return props;
      }

      // 额外参数
      getExtraParams=(params) => {
        const extraFormValue = _.get(this.props, 'extraFormValue', {}) || {};
        const formValue = _.get(this.state, 'formValue', {}) || {};
        const newValues = { ...extraFormValue, ...formValue };
        const length = _.get(_.keys(newValues), 'length');
        if (length) {
          for (const key in newValues) {
            // eslint-disable-next-line
            if (newValues.hasOwnProperty(key)) {
              params.append(key, newValues[key]);
            }
          }
        }
        return params;
      }

      setFormValue=(value) => {
        this.setState({ formValue: value });
      }

      setValue=(filesInfo) => {
        const { onChange } = this.props;
        const fn = _.get(this.childrenRef, 'setValueCallback');
        if ('function' === typeof fn && 'function' === typeof onChange) {
          return fn(filesInfo);
        }
        else {
          this.setState({ filesInfo });
        }
      }

      setInfoData=(fileInfo) => {
        const { filesInfo, isLine } = this.state;


        if (!isLine) {
          return false;
        }
        const multiple = _.get(this.props, 'multiple');
        const current = { ...fileInfo };
        if (!multiple) {
          this.setValue([current]);
          return;
        }

        const idx = _.findIndex(filesInfo, (item) => {
          return _.get(item, 'file.uid') === _.get(current, 'file.uid');
        });
        if (0 > idx) {
          filesInfo.push(fileInfo);
        }
        else {
          filesInfo[idx] = current;
        }
        this.setValue([...filesInfo]);
      }

      setChildrenController=(name, params) => {
        if (!this.state.isLine) {
          return false;
        }
        const fn = _.get(this.childrenRef, name);
        if ('function' === typeof fn) {
          return fn(params);
        }
        return false;
      }

      getFilePromise=(options) => {
        const uid = _.get(options, 'file.uid');
        let params = new FormData();
        params.append('name', _.get(options, 'data.name'));
        params.append('file', _.get(options, 'file'));
        // 获取额外参数
        params = this.getExtraParams(params);
        this.setInfoData({ ...options, status: 'uploading' });
        const self = this;
        let cancelToken;
        if (!this.props.service && DEFINE_USE_ALIYUN_OSS) {
          // eslint-disable-next-line
          cancelToken = function (c) {
            self.cancel[uid] = c.cancel.bind(c);
          };
        }
        else {
          cancelToken = new axios.CancelToken(((c) => {
            // executor 函数接收一个 cancel 函数作为参数
            self.cancel[uid] = c;
          }));
        }


        const onUploadProgress = (e) => {
          let percent = ((e.loaded / e.total * 100) | 0);
          if (_.isNumber(e)) {
            percent = NP.round(NP.times(e, 100), 2);
          }
          self.setInfoData({ ...options, percent, status: 'uploading' });
        };
        if (_.get(options, 'action') && this.props.service) {
          return http.post(_.get(options, 'action'), params, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${User.token}` },
            cancelToken,
            onUploadProgress,
          });
        }
        else {
          const file = _.get(options, 'file');
          return fileUploader({
            name: _.get(file, 'name'),
            lastModified: _.get(file, 'lastModified', '') || new Date() * 1,
            file,
            maxSize: _.get(this.props, 'maxSize'),
            onProgress: onUploadProgress,
            cancelToken,
          });
        }
      }

      startUpload=(options) => {
        this.setChildrenController('setWaitingToUploading', options);
        const uid = _.get(options, 'file.uid');
        this.getFilePromise(options)
          .then((res) => {
            const current = { ...options, status: 'done', successData: _.get(res, 'data') || _.get(res, 'name') || _.get(res, 'files.0.url') };
            this.setInfoData(current);
            this.setChildrenController('setUploadingToDone', current);
            delete this.cancel[uid];
          }).catch((rej) => {
            const current = { ...options, status: 'error', errorData: rej };
            this.setInfoData(current);
            this.setChildrenController('setUploadingToError', current);
            delete this.cancel[uid];
          });
      }

      startTask=(options) => {
        const taskId = _.get(options, 'successData.id');
        if (!taskId) {
          return;
        }
        this.time[taskId] = null;
        this.setChildrenController('setTaskWaitingToTaskPolling');
        this.pollTask(options);
      }

      // 关闭在执行队列，并致为不可修改状态
      closeAlignment=() => {
        this.setState({ isLine: false, filesInfo: [], formValue: undefined });
        for (const key in this.time) {
          // eslint-disable-next-line
          if (this.time.hasOwnProperty(key)) {
            this.clearTimeOut(key);
          }
        }
        for (const key in this.cancel) {
          // eslint-disable-next-line
          if (this.cancel.hasOwnProperty(key)) {
            this.cancelHttp(key);
          }
        }
      }

      cancelHttp=(params) => {
        const uid = _.isObject(params) ? _.get(params, 'file.uid') : params;
        if ('function' === typeof this.cancel[uid]) {
          if (!this.props.service && DEFINE_USE_ALIYUN_OSS) {
            // 阿里云上传不能加参数
            this.cancel[uid]();
          }
          else {
            this.cancel[uid]('取消上传');
          }
        }

        delete this.cancel[uid];
      }

      pollTask = (options) => {
        const taskId = _.get(options, 'successData.id');
        services.graphqlDetail({ id: taskId }).then((res) => {
          const status = _.get(res, 'data.status');
          if (_.get(CONST_DICT, 'download_tasks.status.STATUS_NORMAL') === status) {
            const current = { ...options, status: 'taskPolling', task: _.get(res, 'data') };
            this.setInfoData(current);
            this.setChildrenController('setTaskPolling', current);
            this.time[taskId] = setTimeout(() => {
              this.pollTask(options);
            }, 2000);
          }
          else if (_.get(CONST_DICT, 'download_tasks.status.STATUS_SUCCESS') === status) {
            const current = { ...options, status: 'taskDone', task: _.get(res, 'data') };
            this.setInfoData(current);
            this.setChildrenController('setTaskPollingToTaskDone', current);
          }
          else if ([
            _.get(CONST_DICT, 'download_tasks.status.STATUS_EXPIRED'),
            _.get(CONST_DICT, 'download_tasks.status.STATUS_WARNING'),
          ].includes(status)) {
            const current = { ...options, status: 'taskDone', task: _.get(res, 'data') };
            this.setInfoData(current);
            this.setChildrenController('setTaskPollingToWarning', current);
          }
          else if ([
            _.get(CONST_DICT, 'download_tasks.status.STATUS_FAIL'),
          ].includes(status)) {
            const current = { ...options, status: 'taskDone', taskError: _.get(res, 'data') };
            this.setInfoData(current);
            this.setChildrenController('setTaskPollingToTaskFail', current);
          }
        }).catch((err) => {
          this.clearTimeOut(taskId);
          const current = { ...options, status: 'taskError', taskError: err };
          this.setInfoData(current);
          this.setChildrenController('setTaskPollingToTaskError', current);
        });
      };

      clearTimeOut=(taskId) => {
        if (this.time[taskId]) {
          window.clearTimeout(this.time[taskId]);
        }
        delete this.time[taskId];
      }

      deleteFile=(fileInfo) => {
        const { filesInfo } = this.state;
        const uid = _.get(fileInfo, 'file.uid');
        this.cancelHttp(uid);
        const copy = [...filesInfo];
        const idx = _.findIndex(filesInfo, (item) => {
          return _.get(item, 'file.uid') === uid;
        });

        if (0 <= idx) {
          copy.splice(idx, 1);
          this.setValue([...copy]);
        }
      }

      getWrapProps=() => {
        const { filesInfo } = this.state;
        return {
          ...this.props,
          filesInfo,
        };
      }

      render() {
        return (
          <React.Fragment>
            <div style={{ display: 'none' }}>
              <Upload
                ref={(el) => {
                  this.uploadRef = el;
                }}
                {...this.getUploadProps()} />
            </div>
            <Component
              ref={(el) => {
                  this.childrenRef = el;
                }}
              upload={this}
              {...this.getWrapProps()} />
          </React.Fragment>
        );
      }
    };
  };
}
