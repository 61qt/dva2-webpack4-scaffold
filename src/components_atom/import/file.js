import React from 'react';
import { Icon, Modal } from 'antd';
import Qs from 'qs';
import { getfilesize } from '@/utils/file_uploader.js';
import formErrorMessageShow from '@/utils/form_error_message_show';
import importHoc from './importHoc';
import styled from './file.less';

export function parseFile(files) {
  return _.map(files, (item, index) => {
    if (_.isString(item)) {
      const queryStr = item.replace(/^[^?#]*\??/g, '');
      const query = Qs.parse(queryStr) || {};
      return {
        status: _.get(query, 'status') || 'done',
        file: {
          size: _.get(query, 'size', 0),
          name: _.get(query, 'name', '') || _.get(query, 'rename', '') || '',
          uid: `${index}-${_.get(query, 'name')}`,
        },
        successData: item,
      };
    }
    return item;
  });
}

export function validatorAllDone(options = { message: '请等待文件上传完成' }) {
  return (rule, value, cb) => {
    if (value && value.length) {
      const files = parseFile(value);
      const isEveryFileDone = files.every(item => 'done' === item.status);
      if (!isEveryFileDone) {
        cb(options.message);
      }
      else {
        cb();
      }
    }
    else {
      cb();
    }
  };
}

@importHoc({
  service: false,
  getInitFilesInfo: (props) => {
    const value = props.value || props.defaultValue || [];
    return parseFile(value);
  },
  fileNameLength: 20, // 上传的文件名字符在20以内
})
export default class FileUploader extends React.PureComponent {
  // constructor(props) {
  //   super(props);
  //   // this.getFileChange = _.debounce(this.getFileChange, 300);
  // }

  getFileChange=(filesInfo) => {
    const { onChange } = this.props;


    const files = _.map(filesInfo, (item) => {
      if ('done' === _.get(item, 'status')) {
        return /status/.test(item.successData) ? item.successData : `${encodeURIComponent(_.get(item, 'successData') || '')}?rename=${encodeURIComponent(_.get(item, 'file.name') || '')}&size=${_.get(item, 'file.size')}&status=${item.status}`;
      }

      return item;
      // if (/status=/.test(item.successData) || )) {
      //   return item;
      // }
    });


    if ('function' === typeof onChange) {
      onChange(files);
    }
  }

  setValueCallback=(filesInfo) => {
    this.getFileChange(filesInfo);
  }

  // setUploadingToDone=() => {
  //   this.getFileChange();
  // }

  setBeforeUploadToWaiting=(options) => {
    this.props.upload.startUpload(options);
  }

  setUploadingToError=(options) => {
    const msg = _.get(options, 'errorData.msg') || _.get(options, 'errorData.files[0].error') || (_.isEmpty(_.get(options, 'errorData')) ? '上传失败，请重试。' : _.get(options, 'errorData'));
    formErrorMessageShow({
      msg,
    });
    this.props.upload.deleteFile(options);
    // this.getFileChange();
  }

  handleClick = () => {
    this.props.upload.clickInput();
  };

  handleDeleteFile=(options) => {
    const status = _.get(options, 'status');
    if (['beforeUpload', 'waiting', 'uploading'].includes(status)) {
      return Modal.confirm({
        title: <div>{_.get(options, 'file.name', '')}文件正在上传中，确定要删除？</div>,
        content: '',
        width: 600,
        icon: 'exclamation-circle',
        okText: '确 定',
        cancelText: '取 消',
        onOk: () => {
          this.props.upload.deleteFile(options);
          // this.getFileChange();
        },
      });
    }
    this.props.upload.deleteFile(options);
    // this.getFileChange();
  }


  renderFileStatus=(options) => {
    const status = _.get(options, 'status');
    const percent = _.get(options, 'percent', 0);
    const size = !!_.get(options, 'file.size') * 1 ? getfilesize(_.get(options, 'file.size')) : _.get(options, 'file.size');

    if (['beforeUpload', 'waiting', 'uploading'].includes(status)) {
      return <span>上传中{`${percent}%`}</span>;
    }

    if ('done' === status) {
      return <span>{size}</span>;
    }

    return null;
  }

  render() {
    const { children, extra, filesInfo, icon, progress } = this.props;
    return (
      <div>
        <div>{React.cloneElement(children, { onClick: this.handleClick })}{extra}</div>
        <div className={styled.file}>
          {
            _.map(filesInfo, item => (
              <div className={styled.fileItem} key={_.get(item, 'file.uid')}>
                <div className={styled.fileName}>{icon && <Icon type="paper-clip" />}{_.get(item, 'file.name')}</div>
                <div className={styled.fileStatus}>{this.renderFileStatus(item)}</div>
                <Icon className={styled.fileClose} type="close-circle" theme="filled" onClick={this.handleDeleteFile.bind(this, item)} />
                {
                  progress && 'uploading' === _.get(item, 'status') && <div className={styled.progress} >
                    <div className={styled.progressTop} style={{ width: `${_.get(item, 'percent', 0)}%` }} />
                  </div>
                }
              </div>
            ))
          }

        </div>
      </div>
    );
  }
}
