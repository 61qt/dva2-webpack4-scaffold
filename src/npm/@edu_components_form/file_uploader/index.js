import 'cropperjs/dist/cropper.min.css';

import React from 'react';
import Cropper from 'cropperjs';
import { Spin, Upload, Icon, message, Button } from 'antd';
import _ from 'lodash';
import PropTypes from 'prop-types';
import UUID from 'uuid';
// import * as qiniuImageUploaderUtil from '@/utils/qiniu_img_uploader';
import fileUploader, { getfilesize } from '@/utils/file_uploader';

import Filters from '@/filters';
import User from '@/utils/user';
import formErrorMessageShow from '@/utils/form_error_message_show';

import styles from './index.less';

function getFileName(str) {
  let name = '';

  const match = str.match(/\b(filename|rename|image)\b=([^&]+)/);

  if (_.get(match, '[2]')) {
    name = decodeURIComponent(_.get(match, '[2]'));
  }

  if (!name) {
    return str;
  }
  else {
    return `${name}`;
  }
}


export const DEFAULT_CROPPER_OPTIONS = {
  responsive: true,
  viewMode: 3,
  checkCrossOrigin: true,
  rotatable: true,
  aspectRatio: 1 / 1,
  minCropBoxWidth: 100,
  minCropBoxHeight: 100,
  minContainerWidth: 400,
  minContainerHeight: 400,
  outputWidth: null,
  outputHeight: null,
  maxOutputWidth: 2000,
  maxOutputHeight: 2000,
  maxSize: 1024 * 1024 * 20,
  // maxSize: 1024 * 1024 * 6,
  maxWarningSelectFileSize: 1024 * 1024 * 1,
  autoCropArea: 1,
  cropRate: 2,
  isMobile: false,
  // inlinePlaceholder: false,
};

// 抽离url函数
export const getUrl = (data, file, type) => {
  let imageUrl = '';
  if (DEFINE_USE_ALIYUN_OSS) {
    imageUrl = `${_.get(data, 'name', '')}`;
    return imageUrl;
  }
  else {
    const url = `${_.get(data, 'files[0].url', '')}`;
    // 默认全局添加 url 的处理。
    if ('image' !== type) {
      imageUrl = `${url}?rename=${encodeURIComponent(_.get(file, 'name', ''))}`;
    }
    else {
      imageUrl = `${url}?image=${encodeURIComponent(_.get(file, 'name', ''))}`;
    }

    return imageUrl;
  }
};

export default class Component extends React.PureComponent {
  // 子组件声明自己需要使用 context
  static contextTypes = {
    patchFormValidateOfFieldUpload: PropTypes.func,
  }

  static defaultProps = {
    // 多选时候有效，最多上传多少张，0为无限
    // maxLength 如果选择的时候数据就超过 maxLength 的数，那就不管。
    maxLength: 0,
    // 是否多选，目前只支持图片类型。
    multiple: false,
    capture: '',
    accept: '',
    // type: 'file',
    originImage: false,
    type: 'image',
    showLink: true,
    allowClear: false,
    inlinePlaceholder: false,
    // 上传了的图片，是否使用背景图片形式展示，默认 false
    showImgByBg: false,
    // 上传之后时候展示 border ，默认都展示
    uploadedShowBorder: true,
    selectedFile: (file) => {
      if (__DEV__ && __PROD__) {
        window.console.log('file', file);
      }
    },
    onChange: () => {
    },
  };

  constructor(props) {
    super(props);
    let imageUrl;
    const imageUrlInit = props.initValue || props.value;
    if (this.props.multiple) {
      imageUrl = [];
      if (_.isArray(imageUrlInit)) {
        _.map(imageUrlInit, (elem) => {
          imageUrl.push(elem);
        });
      }
    }
    else {
      imageUrl = _.isString(imageUrlInit) ? imageUrlInit : undefined;
    }

    this.state = {
      imageUrl: props.initValue || props.value,
      preview: false,
      file: false,
      localSrc: '',
      reading: false,
      uploading: false,
      imgType: 'image/jpeg',
    };

    this.uploadingFileCount = 0;
    debugAdd('image_uploader', this);
    debugAdd('file_uploader', this);
  }

  componentDidMount = () => {
    let aspectRatio = 1;
    const { options = {} } = this.props;
    if (options.width && options.height) {
      aspectRatio = options.width / options.height;
    }

    const cropperOptions = _.assign({}, DEFAULT_CROPPER_OPTIONS, {
      aspectRatio,
      cropRate: options.cropRate || DEFAULT_CROPPER_OPTIONS.cropRate,
      viewMode: options.cropViewMode || DEFAULT_CROPPER_OPTIONS.viewMode,
      width: options.width,
      height: options.height,
      minContainerWidth: options.width,
      minContainerHeight: options.height,
      outputWidth: options.width,
      outputHeight: options.height,
      maxOutputWidth: 960,
      maxOutputHeight: (options.height / options.width) * 960,
      maxSize: this.props.maxSize || DEFAULT_CROPPER_OPTIONS.maxSize,
    });

    this.cropperOptions = cropperOptions;
    // 如果没有，那就是没有，只有单选模式才会有。
    if (!this.props.multiple) {
      this.cropper = new Cropper(this.previewImgRef, cropperOptions);
    }
  }

  // 更新传输的 value
  componentWillReceiveProps = (nextProps) => {
    if ('value' in nextProps && !_.isEqual(this.state.imageUrl, nextProps.value)) {
      let imageUrl;
      if (this.props.multiple) {
        imageUrl = [];
        if (_.isArray(nextProps.value)) {
          _.map(nextProps.value, (elem) => {
            imageUrl.push(elem);
          });
        }
      }
      else {
        imageUrl = _.isString(nextProps.value) ? nextProps.value : undefined;
      }
      this.setState({
        imageUrl,
      });
    }
  }

  // 监听上传的状态是否变更了。
  componentDidUpdate = (prevProps, prevState) => {
    if (_.get(prevState, 'uploading') !== _.get(this, 'state.uploading')) {
      this.setUploadingTip();
    }
  }

  getFileSrc = ({ file = this.state.file, callback }) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const options = {
        localSrc: reader.result,
        reading: false,
        imgType: _.get(reader.result.match(/^data:(image\/.*?);/), '[1]') || 'image/jpeg',
      };
      this.setState(options, () => {
        if ('function' === typeof callback) {
          callback(options);
        }
        if (this.props.originImage) {
          return;
        }
        this.cropper.reset();
        this.cropper.clear();
        this.setState(options, () => {
          this.cropper.replace(reader.result);
          this.cropper.enable();
          if (this.cropper.containerData) {
            this.cropper.resize();
          }
        });
      });
    };
    reader.onload = reader.onloadend;

    reader.readAsDataURL(file);
    this.reader = reader;
  }

  getSize = (size) => {
    // eslint-disable-next-line no-restricted-properties
    return getfilesize(size);
  }

  // 设置外部上传中的
  setUploadingTip = () => {
    let type = 'error';
    if (!this.state.uploading) {
      type = 'success';
    }

    const patchFormValidateOfFieldUpload = _.get(this, 'context.patchFormValidateOfFieldUpload');
    // 这个字段为 hack，不推荐常规使用。
    const name = _.get(this.props, 'data-__field.name', '');
    try {
      if (name && 'function' === typeof patchFormValidateOfFieldUpload) {
        patchFormValidateOfFieldUpload(name, type);
      }
    }
    catch (error) {
      // do nothing
    }
  }

  validatorSize=(fileSize, maxSize) => {
    this.closeUpload();
    const messageStr = `文件过大，不能大于${this.getSize(maxSize)}`;
    formErrorMessageShow({
      // eslint-disable-next-line no-restricted-properties
      msg: messageStr,
      data: {
        // eslint-disable-next-line no-restricted-properties
        fileSize: `当前文件大小：${this.getSize(fileSize)}`,
      },
    });

    if (DEFINE_IS_MOBILE) {
      message.info(messageStr);
    }

    return false;
  }

  beforeUpload = (file, fileList) => {
    const { originImage, maxSize, multiple } = this.props;
    // originImage 和多选模式不会走剪切，不会校验文件大小
    if ((originImage || multiple) && maxSize && file.size > maxSize) {
      return this.validatorSize(file.size, maxSize);
    }

    // 校验文件类型
    const accept = this.uploadConfig.accept;
    if (accept && '*' !== accept) {
      let messageStr = `上传文件类型错误(${file.type})`;

      if (accept.startsWith('.')) {
        const type = _.last(_.get(file, 'name').split('.'));
        const validateType = accept.replace(/\./g, '').split(',');
        if (!_.includes(validateType, type)) {
          messageStr = `${_.get(file, 'name', '')}文件格式不正确`;
          formErrorMessageShow(messageStr);
          if (DEFINE_IS_MOBILE) {
            message.info(messageStr);
          }
          return false;
        }
      }
      // 兼容 image/* 问题
      else if (_.endsWith(accept, '/*')) {
        if (_.startsWith(file.type, _.replace(accept, '/*', '/'))) {
          // do nothing
        }
        else {
          if (DEFINE_IS_MOBILE) {
            message.info(messageStr);
          }
          formErrorMessageShow({
            msg: messageStr,
          });
          return false;
        }
      }
      else if (-1 >= accept.indexOf(file.type)) {
        if (DEFINE_IS_MOBILE) {
          message.info(messageStr);
        }
        formErrorMessageShow({
          msg: messageStr,
        });
        return false;
      }
    }

    // 大小判断在上传的时候判断。
    this.uploadingFileCount = 0;
    if ('function' === typeof this.props.beforeUpload) {
      return this.props.beforeUpload(file, fileList);
    }
  }

  customRequest = (options) => {
    const file = options.file;
    if ('file' === this.props.type || this.props.originImage || ('image/gif' === file.type && this.props.gifAutoUpload)) {
      this.setState({
        file,
        uploading: true,
      });
      this.runQiniuUpload(file);
    }
    else {
      // if (file.size >= this.cropperOptions.maxWarningSelectFileSize) {
      //   const fileSize = this.getSize(file.size);
      //   // eslint-disable-next-line no-alert
      //   window.confirm(`当前文件大小为${fileSize}，原文件过大，可能会造成网页奔溃，建议压缩文件大小后上传。`);
      // }
      this.setState({
        file,
        preview: true,
        reading: true,
      });
      this.getFileSrc({
        file,
      });
    }
  }

  handleReset = () => {
    const imageUrl = undefined;
    this.setState({
      imageUrl,
    }, () => {
      if ('function' === typeof this.props.onChange) {
        this.props.onChange(imageUrl);
      }
    });
  }
  hideModelHandler = () => {
    this.setState({
      preview: false,
    });
  }

  closeUpload = () => {
    this.setState({
      uploading: false,
      reading: false,
      preview: false,
    });
  }

  runQiniuUpload = (blob) => {
    if (this.cropperOptions.maxSize <= blob.size) {
      return this.validatorSize(blob.size, this.cropperOptions.maxSize);
    }

    return fileUploader({
      ...this.cropperOptions,
      name: _.get(blob, 'name', '') || _.get(this.state, 'file.name', '') || UUID(),
      lastModified: _.get(blob, 'lastModified', '') || new Date() * 1,
      file: blob,
      onProgress: (options) => {
        const total = options.total;
        const loaded = options.loaded;
        const percentComplete = parseInt(loaded / total * 10000, 10) / 100;
        window.console.log('文件上传完成率', percentComplete, '%');
      },
    }).then((res) => {
      let imageUrl = '';
      imageUrl = getUrl(res, this.state.file, this.props.type);
      // 直接覆盖使用

      if ('function' === typeof this.props.onChange) {
        this.props.onChange(imageUrl);
      }
      this.setState({
        imageUrl,
        uploading: false,
        reading: false,
      });
      if (this.props.originImage) {
        // set update
        // do nothing
      }
      else {
        this.cropper.reset();
        this.cropper.clear();
      }
    }).catch((rej) => {
      const msg = _.get(rej, 'msg') || _.get(rej, 'files[0].error') || (_.isEmpty(rej) ? '上传失败，请重试。' : rej);
      formErrorMessageShow({
        msg,
      });
      const newState = {
        uploading: false,
        reading: false,
        preview: true,
      };
      if (this.props.originImage) {
        newState.reading = false;
        newState.preview = false;
      }
      else {
        this.cropper.enable();
      }
      this.setState(newState);
    });

    // return qiniuImageUploaderUtil.qiniuImageUploader({
    //   file: blob,
    //   onProgress: (percentComplete) => {
    //     window.console.log('文件上传完成率', percentComplete, '%');
    //   },
    // }).then((res) => {
    //   const imageUrl = res.data.image;
    //   if ('function' === typeof this.props.onChange) {
    //     this.props.onChange(imageUrl);
    //   }
    //   this.setState({
    //     imageUrl,
    //     uploading: false,
    //     reading: false,
    //   });
    //   this.cropper.reset();
    //   this.cropper.clear();
    // }).catch((rej) => {
    //   this.cropper.enable();
    //   formErrorMessageShow(rej)
    //   const newState = {
    //     uploading: false,
    //     reading: false,
    //     preview: true,
    //   };
    //   if (this.props.originImage) {
    //     newState.reading = false;
    //     newState.preview = false;
    //   }
    //   this.setState(newState);
    // });
  }

  imgOnLoad = (e) => {
    const target = e.target;
    if (target && this.props.originImage) {
      if (_.get(this.props, 'style.minHeight') && target.height && target.height < _.get(this.props, 'style.minHeight')) {
        target.style.position = 'absolute';
      }
      else {
        target.style.position = 'static';
      }
    }
    else {
      target.style.position = 'absolute';
    }
  }

  upload = () => {
    // 直接上传了，不需要他
    if ('file' === this.props.type) {
      return;
    }

    this.cropper.disable();
    this.setState({
      uploading: true,
      reading: false,
      preview: false,
    }, () => {
      const canvas = this.cropper.getCroppedCanvas({
        width: this.cropperOptions.width * this.cropperOptions.cropRate,
        height: this.cropperOptions.height * this.cropperOptions.cropRate,
      });
      if (!canvas) {
        window.console.log('canvas', canvas);
        formErrorMessageShow({
          msg: '创建画图板失败，请重试',
        });
        return;
      }
      canvas.toBlob((blob) => {
        this.runQiniuUpload(blob);
      }, this.state.imgType, 0.95);
    });
  }

  previewImgRef = (previewImgRef) => {
    this.previewImgRef = previewImgRef;
  }

  selectedFile = (event) => {
    const file = event.file;
    if ('function' === typeof this.props.selectedFile) {
      this.props.selectedFile(file);
    }
  }

  renderMultipleUpload = () => {
    const maxLength = 1 * this.props.maxLength;
    const handleFileUploadAction = ({
      file,
      onProgress,
      onError,
      onSuccess,
    }) => {
      if (__DEV__) {
        window.console.log('file', file);
      }
      return fileUploader({
        file,
        onProgress: (options) => {
          // window.console.log('options', options);
          const total = options.total;
          const loaded = options.loaded;
          const percentComplete = parseInt(loaded / total * 10000, 10) / 100;
          if (window.console && window.console.log) {
            window.console.log(file.name, '文件上传完成率', percentComplete, '%');
          }
          if ('function' === typeof onProgress) {
            onProgress({
              ...options,
              percent: percentComplete,
            });
            // onProgress(options);
          }
        },
      }).then((res) => {
        let currentImageUrl = '';
        if (DEFINE_USE_ALIYUN_OSS) {
          currentImageUrl = `${_.get(res, 'name', '')}`;
        }
        else {
          currentImageUrl = `${_.get(res, 'files[0].url', '')}`;
          currentImageUrl = `${currentImageUrl}?image=${encodeURIComponent(_.get(file, 'name', ''))}`;
        }
        const fullCurrentImageUrl = Filters.cdnFile(currentImageUrl);

        let imageUrl = [];
        if (_.isArray(this.state.imageUrl)) {
          imageUrl = _.concat([], this.state.imageUrl);
        }
        imageUrl = _.concat(imageUrl, currentImageUrl);
        if (0 < maxLength) {
          imageUrl = _.slice(imageUrl, 0, maxLength);
        }


        this.setState({
          imageUrl,
          // uploadIngFile,
        }, () => {
          if ('function' === typeof onSuccess) {
            onSuccess(fullCurrentImageUrl);
          }
          if ('function' === typeof this.props.onChange) {
            this.props.onChange(imageUrl);
          }
        });
      }).catch((rej) => {
        formErrorMessageShow(rej);
        const msg = `${getFileName(file.name)} 上传失败`;
        message.info(msg);
        if (window.console && window.console.log) {
          window.console.log(msg);
        }
        if ('function' === typeof onError) {
          onError(msg);
        }
        return Promise.reject(rej);
      });
    };

    const fileList = [];
    if (_.isArray(this.state.imageUrl)) {
      _.map(this.state.imageUrl, (elem, index) => {
        fileList.push({
          uid: index,
          name: `${index}`,
          status: 'done',
          url: Filters.cdnFile(elem),
          elemUrl: elem,
        });
      });
    }
    const patchCreateProps = {
      listType: 'picture-card',
      multiple: true,
      // directory: true,
      showUploadList: this.props.showUploadList,
      size: 'small',
      // listType: 'picture',
      className: `${this.props.isMobile && styles.m_upload} upload-list-inline`,
      accept: this.props.accept || 'image/gif,image/jpeg,image/jpg,image/png,image/x-icon',
      action: `${DEFINE_UPLOAD_PATH}`,
      fileList,
      beforeUpload: this.beforeUpload,
      headers: () => {
        return {
          Authorization: `Bearer ${User.token}`,
        };
      },
      onRemove: (file) => {
        // const removedElemUrl = file.elemUrl;
        let imageUrl = [];
        if (_.isArray(this.state.imageUrl)) {
          // 根据下标删除对应的图片
          const index = file.uid;
          imageUrl = [...this.state.imageUrl];
          imageUrl.splice(index, 1);
          // _.map(this.state.imageUrl, (elem) => {
          //   if (elem === removedElemUrl) {
          //     // 这个照片被删除了
          //   }
          //   else {
          //     imageUrl.push(elem);
          //   }
          // });
        }
        this.setState({
          imageUrl,
        }, () => {
          if ('function' === typeof this.props.onChange) {
            this.props.onChange(imageUrl);
          }
        });
        if (__DEV__) {
          window.console.log('file', file);
        }
      },
      // showUploadList: false,
      customRequest: (event) => {
        const file = event.file;
        const hadUploadedFiles = this.state.imageUrl;

        // 是否有限制最大上传数；
        if (0 < maxLength) {
          if (_.get(hadUploadedFiles, 'length') + this.uploadingFileCount === maxLength) {
            return;
          }
        }

        // 需要显示加载中的
        let uploadIngFile = [];
        if (_.isArray(this.state.uploadIngFile)) {
          uploadIngFile = _.concat(this.state.uploadIngFile, uploadIngFile);
        }
        uploadIngFile.push(file);
        this.setState({
          uploadIngFile,
        });
        this.uploadingFileCount += 1;
        handleFileUploadAction({
          file,
          onProgress: event.onProgress,
          onError: event.onError,
          onSuccess: event.onSuccess,
        });

        return {
          abort() {
            window.console.log('upload progress is aborted.'); // todo abort ajax, 文件会在进程继续上传，form表单提交只有上传完成的
          },
        };
      },
    };

    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">上传图片</div>
      </div>
    );

    function getUploadBtn() {
      if (!(1 * maxLength)) {
        return uploadButton;
      }

      if (1 * maxLength && fileList.length < 1 * maxLength) {
        return uploadButton;
      }

      return null;
    }

    const upload = (<div>
      <Upload {...patchCreateProps}>
        { getUploadBtn() }
      </Upload>
    </div>);

    this.uploadConfig = patchCreateProps;

    return upload;
  }

  renderSingle = () => {
    const imageUrl = this.state.imageUrl;
    const { options = {} } = this.props;
    let style = {
      ...this.props.style,
      width: options.width,
      height: options.height,
      marginBottom: 0,
    };
    let qiniuImageOptions = {
      width: options.width * 2,
      height: options.height * 2,
    };
    if (this.props.originImage) {
      qiniuImageOptions = {

      };
      style = {
        ...this.props.style,
      };
    }

    if (this.props.disabled) {
      style.cursor = 'not-allowed';
    }

    const fullImageUrl = Filters.cdnFile(imageUrl, {
      ...qiniuImageOptions,
      type: this.props.type,
    });
    const imageUploaderContentProps = {};
    if (fullImageUrl && 'image' === this.props.type && this.props.showImgByBg) {
      imageUploaderContentProps.style = {
        backgroundImage: `url(${fullImageUrl})`,
      };
    }

    const uploadProps = {
      accept: this.props.accept || ('image' === this.props.type ? 'image/gif,image/jpeg,image/jpg,image/png,image/x-icon' : '*'),
      customRequest: this.customRequest,
      disabled: this.props.disabled,
      name: 'image_uploader',
      multiple: this.props.multiple || false,
      showUploadList: false,
      beforeUpload: this.props.beforeUpload || this.beforeUpload,
      style: {
        ...style,
      },
      onChange: this.selectedFile,
    };
    if (this.props.capture) {
      uploadProps.capture = this.props.capture;
    }
    this.uploadConfig = uploadProps;
    let placeholderText = `选择文件${imageUrl ? '重新' : ''}上传`;
    if ('function' === typeof this.props.getPlaceholder) {
      placeholderText = this.props.getPlaceholder(imageUrl);
    }


    return (<div style={{ marginBottom: '1.4em', ...style }} disabled={this.props.disabled}><Spin style={style} spinning={this.state.reading || this.state.uploading}>
      <div className={`upload-normal-warper ${styles.normal}`} type={this.props.type}>
        {
          this.state.imageUrl && this.props.allowClear ? (<div className={styles.clear} onClick={this.handleReset}>
            <Icon type="close-circle" />
          </div>) : null
        }
        <div
          style={style}
          className={`${fullImageUrl && !this.props.uploadedShowBorder ? 'image-uploader-no-border' : ''} image-uploader ${fullImageUrl ? 'image-uploader-uploaded' : ''} ${this.props.className || ''} ${this.props.originImage ? 'image-uploader-origin' : ''} ${this.props.disabled ? 'disabled' : ''}`}>
          <Upload {...uploadProps}>
            <div type={this.props.type} className={`imageUploaderContent ${styles.imageUploaderContent}`}>
              <div className={`${styles.imageUploadTriggerContainer} imageUploadTriggerContainer ${imageUrl ? 'has-content' : ''}`}>
                <div className={`${styles.imageUploaderTrigger}`}>
                  {
                    this.props.placeholder ? this.props.placeholder : (<div className={`${styles.imageUploaderTriggerContent} ${this.props.inlinePlaceholder ? 'imageUploaderTriggerContent inlinePlaceholder' : ''}`}>
                      <Icon type="plus" />
                      <br className={`${this.props.inlinePlaceholder ? 'ant-hide' : ''}`} />
                      <span>{placeholderText}</span>
                    </div>)
                  }
                </div>
              </div>
              <div className={`${imageUrl ? '' : 'ant-hide'} image-uploader-content ${this.props.className || ''}`} {...imageUploaderContentProps} data-url={fullImageUrl}>
                {
                  'image' === this.props.type ? (this.props.showImgByBg ? null : (<img onLoad={this.imgOnLoad} referrerPolicy="no-referrer" src={fullImageUrl} alt="实际图" className={`image-uploader-img ${this.state.uploading ? 'ant-hide' : ''} ${this.props.originImage ? 'image-uploader-img-origin' : ''}`} />)) : (<div className={`text-left ${this.props.className || ''}`}>
                    {getFileName(fullImageUrl)}
                  </div>)
                }
              </div>
            </div>
          </Upload>

          <div className={`${this.props.originImage ? 'ant-hide' : ''} ${styles.preview} ${this.state.uploading || this.state.preview ? '' : styles.previewHidden}`}>
            <div className="img-cropper">
              <img ref={this.previewImgRef} src={this.state.localSrc} alt="预览图" className="cropper-hidden" />
            </div>
            <div className={`operate ${this.state.uploading ? styles.previewHidden : ''}`}>
              <Button onClick={this.upload} type="primary">
                <Icon type="check" />
                <span>&nbsp;确认上传</span>
              </Button>
              <Button onClick={this.closeUpload}>
                <Icon type="close" />
                <span>&nbsp;取消</span>
              </Button>
            </div>
          </div>
        </div>
        <div className={`${!this.props.showLink || !imageUrl ? 'ant-hide' : ''} ${styles.resultHref}`}>
          <a target="_blank" href={fullImageUrl}>打开查看</a>
        </div>
      </div>
    </Spin></div>);
  }

  render() {
    return this.props.multiple && 'image' === this.props.type ? this.renderMultipleUpload() : this.renderSingle();
  }
}
