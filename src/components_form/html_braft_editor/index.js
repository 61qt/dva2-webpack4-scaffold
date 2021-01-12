import _ from 'lodash';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/index.css';
import { message } from 'antd';
// Alert
import fileUploader from '../../utils/file_uploader';
import buildPreviewHtml from '../../utils/build_preview_html';
import styles from './index.less';
// import ServicesCommon from '../../services/common';
import Filters from '../../filters';

const hooks = {
  'toggle-link': ({ href, target }) => {
    // eslint-disable-next-line no-param-reassign
    href = 0 === href.indexOf('http') ? href : `http://${href}`;
    return { href, target };
  },
};

export default class Component extends React.PureComponent {
  static defaultProps = {
    // 是否只保留部分样式 style
    clearStyle: true,
    // 是否开启少数功能。
    tinyFunc: true,
    // 是否以纯文本模式粘贴内容
    stripPastedStyles: true,
  }

  constructor(props) {
    super(props);
    this.state = {
      key: '',
      // value: this.removeSpecificContent(props.value || ''),
      value: this.removeSpecificContent(props.value || ''),
      editorState: BraftEditor.createEditorState(props.value || ''),
    };
    debugAdd('html_braft_editor', this);
  }


  componentDidMount = () => {
    this.newKey();
  }

  // 更新传输的 value
  componentWillReceiveProps = (nextProps) => {
    if ('value' in nextProps && nextProps.value !== this.state.value) {
      this.setState({
        // value: this.removeSpecificContent(nextProps.value || ''),
        value: this.removeSpecificContent(nextProps.value || ''),
      }, () => {
        this.newKey();
      });
    }
  }

  onChange = (event) => {
    // 这样改，改动最少
    this.setState({ editorState: event });
    const value = this.removeSpecificContent(event.toHTML());
    this.setValue(value);
  }

  setEditorState=(value) => {
    this.setState({ editorState: BraftEditor.createEditorState(value) });
  }

  setValue=(value) => {
    const onChange = this.props.onChange;
    if ('function' === typeof onChange) {
      onChange('<p></p>' === value ? undefined : value);
    }
    else {
      this.setState({ value });
    }
  }

  removeSpecificContent = (value = '') => {
    let newValue = value;
    newValue = _.replace(newValue, /\sdata-block="[^"]+"/ig, '');
    newValue = _.replace(newValue, /\sdata-offset-key="[^"]+"/ig, '');

    if (this.props.clearStyle) {
      newValue = _.replace(newValue, /\bline-height:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bline-height:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bline-height:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bfont-size:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bfont-size:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bfont-size:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bcolor:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bcolor:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bcolor:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bletter-spacing:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bletter-spacing:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bletter-spacing:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bfont-family:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bfont-family:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bfont-family:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bpadding:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bpadding:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bpadding:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bpadding-(left|right|bottom|top):\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bpadding-(left|right|bottom|top):\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bpadding-(left|right|bottom|top):\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bmargin:\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bmargin:\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bmargin:\s*[^;'"]+"/ig, '"');

      newValue = _.replace(newValue, /\bmargin-(left|right|bottom|top):\s*[^;'"]+;/ig, '');
      newValue = _.replace(newValue, /\bmargin-(left|right|bottom|top):\s*[^;'"]+'/ig, '\'');
      newValue = _.replace(newValue, /\bmargin-(left|right|bottom|top):\s*[^;'"]+"/ig, '"');
    }

    return newValue;
  }

  newKey = () => {
    const key = `${new Date() * 1}_${Math.random()}`.replace('0.', '');
    this.setState({
      key,
    });
  }

  // uploadFn = (options) => {
  //   const { file, success } = options;
  //   this.qiniuTokenFunc().then((token) => {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('token', token);
  //     ServicesCommon.qiniuUpload(formData).then((res) => {
  //       const imgUrl = `${Filters.cdnFile(res.hash) || ''}`.replace(/\?.+/, '');
  //       success({
  //         url: imgUrl,
  //       });
  //       return imgUrl;
  //     });
  //   });
  // }

  uploadFn = (options) => {
    const { file, success, error } = options;
    return fileUploader({
      file,
      onProgress: (progress) => {
        const total = progress.total;
        const loaded = progress.loaded;
        const percentComplete = parseInt(loaded / total * 10000, 10) / 100;
        window.console.log('文件上传完成率', percentComplete, '%');
        this.state.progress = percentComplete;
      },
    }).then((res) => {
      // const imageUrl = res.data.image;
      // window.console.log('image upload  res', res);
      let imageUrl = '';
      if (DEFINE_USE_ALIYUN_OSS) {
        imageUrl = `${_.get(res, 'name', '')}`;
      }
      else {
        imageUrl = _.get(res, 'files[0].url', '');
        imageUrl = `${imageUrl}?image=${encodeURIComponent(_.get(this.state, 'file.name', ''))}`;
      }

      const fullImageUrl = Filters.cdnFile(imageUrl, {
        type: 'image',
      });

      if (_.get(res, 'files[0].url', '') || _.get(res, 'name')) {
        success({
          url: fullImageUrl,
          meta: {
            ...file,
          },
        });
        return fullImageUrl;
      }
      else if (_.get(res, 'files[0].error', '')) {
        message.error(_.get(res, 'files[0].error', ''));
        error({
          msg: _.get(res, 'files[0].error', ''),
        });
        // return Promise.reject(_.get(res, 'files[0].error', ''));
        // return;
      }
      else {
        const msg = '上传失败，请重试';
        error({
          msg,
        });
        message.error(msg);
        // return Promise.reject(msg);
        // return;
      }
    }).catch((rej) => {
      const msg = _.get(rej, 'msg') || _.get(rej, 'files[0].error') || (_.isEmpty(rej) ? '上传失败，请重试。' : rej);
      message.error(msg);
      error({
        msg,
      });
      return Promise.reject(rej);
    });
  }

  preview = () => {
    if (window.previewWindow) {
      window.previewWindow.close();
    }
    window.previewWindow = window.open();
    window.previewWindow.document.write(this.buildPreviewHtml());
  }

  buildPreviewHtml = () => {
    const htmlContent = this.state.value;

    return buildPreviewHtml(htmlContent);
  }


  render() {
    const oldControls = ['undo', 'redo', 'separator', 'font-size', 'font-family', 'line-height', 'letter-spacing',
      'indent', 'text-color', 'bold', 'italic', 'underline', 'strike-through',
      'superscript', 'subscript', 'remove-styles', 'text-align', 'separator', 'headings', 'list_ul',
      'list_ol', 'blockquote', 'code', 'separator', 'link', 'separator', 'hr', 'separator', 'media', 'clear', 'preview'];

    const controls = this.props.controls || (this.props.tinyFunc ? ['undo', 'redo', 'separator',
      'indent', 'bold', 'italic', 'underline', 'strike-through',
      'remove-styles', 'separator', 'text-align', 'separator',
      'blockquote', 'code', 'separator', 'link', 'separator', 'media', 'clear', 'preview'] : oldControls);
    const extendControls = [
      {
        type: 'button',
        className: 'preview-button',
        text: <span>预览</span>,
        onClick: this.preview,
      },
    ];
    const imageControls = [
      'float-left', // 设置图片左浮动
      'float-right', // 设置图片右浮动
      'align-left', // 设置图片居左
      'align-center', // 设置图片居中
      'align-right', // 设置图片居右
      // 'link', // 设置图片超链接
      'size', // 设置图片尺寸
      'remove', // 删除图片
    ];
    const excludeControls = [];
    const media = _.assign({
      accepts: {
        image: true, // 图片插入功能
        video: true, // 视频插入功能
        audio: true, // 音频插入功能
      },
      externals: {
        image: false, // 图片插入功能
        video: false, // 视频插入功能
        audio: false, // 音频插入功能
        embed: false,
      },
      validateFn: null, // 指定本地校验函数，说明见下文
      allowPasteImage: true, // 是否允许直接粘贴剪贴板图片（例如QQ截图等）到编辑器
      uploadFn: this.uploadFn, // 指定上传函数，说明见下文
      removeConfirmFn: null, // 指定删除前的确认函数，说明见下文
      onRemove: null, // 指定媒体库文件被删除时的回调，参数为被删除的媒体文件列表(数组)
      onChange: null, // 指定媒体库文件列表发生变化时的回调，参数为媒体库文件列表(数组)
      onInsert: null, // 指定从媒体库插入文件到编辑器时的回调，参数为被插入的媒体文件列表(数组)
    }, this.props.media);

    const props = {
      hooks,
      media,
      extendControls,
      contentFormat: 'html',
      controls,
      imageControls,
      excludeControls,
      onChange: this.onChange,
      defaultValue: BraftEditor.createEditorState(this.state.value),
      value: this.state.editorState,
      contentId: this.state.key,
      stripPastedStyles: this.props.stripPastedStyles, // 是否以纯文本模式粘贴内容
    };

    // // 如果是班牌的，就做字号的特殊处理
    // if (this.props.isBoardContent) {
    //   props.fontSizes = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42];
    // }


    return (
      <div className={`${styles.normal} ${this.props.className || ''}`}>
        {/* {
          this.props.isBoardContent ? <Alert message="班牌发布内容建议字号为 24 号字体" type="info" closable /> : null
        } */}
        <BraftEditor {...props} />
      </div>
    );
  }
}
