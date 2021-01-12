import _ from 'lodash';
import { Form, Spin, Button } from 'antd';
// Modal Checkbox
import { connect } from 'dva';
import Base, { baseProps } from './_base';
import PageAddModal from '../../components_default/page_add_modal';

// 获取随机数
function random() {
  return `${Math.random()}`.replace(/0./, '');
}

@Form.create()
@connect((state) => {
  return {
    departmentState: state.department,
  };
})
class AddModalComponent extends PageAddModal {
  static defaultProps = {
    // 是否为链接形式
    link: false,
  }

  constructor(props) {
    super(props);
    debugAdd('DownloadFormFormModal', this);
    _.assign(this.state, {
      model: 'campus',
      modeLabel: '下载信息',
      formMode: 'Well',
      addModalWidth: '700px',
    });
  }

  getFormColumn = () => {
    let columns = [];
    if ('function' === typeof this.props.getFormColumn) {
      columns = this.props.getFormColumn({ form: this.props.form });
    }

    return columns;
  }

  getEditFormTitle = () => {
    return null;
  }
  canShowResetBtn = () => {
    return false;
  }

  handleInterceptSubmit = ({ formattedValues }) => {
    this.setState({
      submitting: false,
      visible: false,
    });

    if ('function' === typeof this.props.onSubmit) {
      this.props.onSubmit({
        formData: formattedValues,
      });
    }
  }

  renderCancelText = () => {
    return '取消';
  }

  renderFormSubmitActionElemTitle = () => {
    return '导出';
  }
}

@connect((state) => {
  return {
    loading: !!state.loading.models.$export,
    exportState: state.$export,
    breadcrumbState: state.breadcrumb,
  };
})
export default class DownloadForm extends Base {
  static defaultProps = {
    ...baseProps,
    formatFormValue: (values) => {
      return values;
    },
  };

  constructor(props) {
    super(props);
    debugAdd('DownloadForm', this);
    _.assign(this.state, {
      customFormModelVisible: false,
      random: random(),
      selectOptions: [],
      defaultValue: [],
      checkedValues: [],
    });
  }

  onSubmit = ({
    formData,
  }) => {
    const newFormData = this.props.formatFormValue(formData);
    // 注意这个下载，应该不会`有错误的了。所以直接跳转然后关闭弹窗。
    // window.console.log('formData', formData, 'now download', 'newFormData', newFormData);

    this.downloadBirdge({ downloadParams: newFormData });
  }

  renderView = () => {
    return (<span key={this.state.random}>
      <AddModalComponent
        {...this.props}
        title={this.props.formTitle || '填写导出的信息'}
        onSubmit={this.onSubmit}
        className="page-add-model">
        {!this.props.link ? <Button
          ghost={this.props.ghost}
          loading={this.state.asyncBuilding}
          type={this.props.type}
          size={this.props.size}
          disabled={this.props.disabled}
          className={this.props.className}>
          {this.props.children}
        </Button> : <Spin spinning={this.state.asyncBuilding}><a disabled={this.props.disabled} loading={this.state.asyncBuilding} className={`${this.props.disabled ? 'disabled' : ''} text-black ${this.props.className}`}>{this.props.children}</a></Spin> }
      </AddModalComponent>
    </span>
    );
  }
  // 这个是带有表格填写的普通的下载，目前，继承了
}
