import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Modal, Steps, Progress, Form } from 'antd';
import uploadImg from '@/assets/upload.png';
import Access from '@/npm/@edu_components_atom/access';
import formErrorMessageShow from '@/utils/form_error_message_show';
import uploadSuccess from '@/assets/upload-success.png';
import { DownloadButton } from '@/components_atom/download';
import uploadError from '@/assets/upload-error.png';
import uploadWarning from '@/assets/upload-warning.png';
import { undershoot as sentryUndershoot } from '@/utils/dva-sentry';
import buildColumnFormItem from '@/utils/build_column_form_item';
import importHoc from './importHoc';
import styled from './index.less';


export const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

@Form.create()
@importHoc({
  accept: '.xls,.xlsx', // 必须是xls,xlsx application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel
  maxSize: 2 * 1024 * 1024,
})
export default class UploadComponent extends React.PureComponent {
  static defaultProps = {
    children: '上传',
    asyncUpload: true,
    getUploadFormColumn: () => {},
    form: {},
  };

  constructor(props) {
    super(props);
    this.steps = [
      {
        title: '上传Excel文件',
        key: 'upload',
      },
      {
        title: '数据导入中',
        key: 'task',
      },
      {
        title: '完成',
        key: 'done',
      },
    ];

    if (this.props.getUploadFormColumn()) {
      this.steps.unshift({
        title: 'form表单',
        key: 'form',
      });
    }

    const stepHash = this.steps.reduce((sum, item, index) => {
      // eslint-disable-next-line
      sum[item.key] = index;
      // eslint-disable-next-line
      sum[index] = item.key;
      return sum;
    }, {});

    this.state = {
      step: 0,
      visible: false,
      taskStatus: 'normal', // normal, success, warning, error
      stepHash,
    };

    this.steps = this.getStepConfig(this.steps);
  }


  componentDidMount = () => {};

  getStepConfig=(arr, key) => {
    const newSteps = [...arr];
    const defaultStepConfig = this.getDefaultStepConfig();
    if (key) {
      const { stepHash } = this.state;
      const propsConfig = this.getPropsConfig(key);
      const item = _.get(arr, stepHash[key], {}) || {};
      return {
        ...item,
        ...defaultStepConfig[item.key],
        ...propsConfig,
      };
    }
    _.each(newSteps, (item, index) => {
      if (defaultStepConfig[item.key]) {
        const propsConfig = this.getPropsConfig(item.key);
        newSteps[index] = {
          ...defaultStepConfig[item.key],
          ...item,
          ...propsConfig,
        };
      }
    });

    return newSteps;
  }

  getPropsConfig=(key) => {
    const config = _.get(this.props, `${key}Config`, {});
    if ('function' === typeof config) {
      return config(this);
    }

    return config || {};
  }

  getDefaultStepConfig=() => {
    const { filesInfo } = this.props;
    const { taskStatus } = this.state;
    return {
      form: {
        okFn: this.handleSubmitForm,
        cancelFn: this.handleCancel,
        okText: '下一步',
        cancelText: '取消',
      },
      upload: {
        okFn: this.handleOk,
        cancelFn: 4 === this.steps.length ? this.handleUploadBack : this.handleCancel,
        okText: '开始上传',
        cancelText: 4 === this.steps.length ? '上一步' : '取消',
        okProps: {
          disabled: !_.get(filesInfo, 'length') || 'uploading' === this.getFileStatus(),
        },
      },
      task: {},
      done: {
        okText: '确定',
        cancelText: ['warning', 'error'].includes(taskStatus) && '重新上传',
        cancelFn: this.resetUpload,
        okFn: this.handleOk,
      },
    };
  }

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

  getFormColumn = () => {
    if ('function' === typeof this.props.getUploadFormColumn) {
      return this.props.getUploadFormColumn({
        form: this.props.form,
      });
    }
    return [];
  }

  getBuildFormCol = () => {
    const columns = this.getFormColumn();
    const formCol = buildColumnFormItem({
      ...this.props,
      ...this.state,
      columns,
      ...this.props.form, // 替换为下面的属性
      // shouldInitialValue: this.props.form.shouldInitialValue,
      // defaultValueSet: this.props.form.dataSource,
      formItemLayout,
      // formValidate: this.props.formValidate,
      // col: this.props.formCol,
      // warpCol: this.props.warpCol,
      // label: this.props.label,
      layout: 'horizontal',
    });

    return formCol;
  }


  getFileStatus = () => {
    return _.get(this.props.filesInfo, '0.status');
  };

  getTaskInfo =(options) => {
    const msg = _.get(options, 'task.messages', '') || '';
    const messageArr = msg.match(/\d+/g);
    const success = _.get(messageArr, '0', 0);
    const error = _.get(messageArr, '1', 0);
    return { success, error };
  }

  setUploadingToError=(options) => {
    const { asyncUpload } = this.props;

    const rej = _.get(options, 'errorData');
    let msg = '';
    if (!_.get(rej, 'msg')) {
      msg = '文件上传失败：服务器繁忙';
    }
    else {
      msg = rej;
    }
    if (asyncUpload) {
      formErrorMessageShow(msg);
    }
    else {
      this.setState({ taskStatus: 'error' });
      this.next();
    }
  }

  setUploadingToDone = (options) => {
    const { asyncUpload } = this.props;
    const { stepHash } = this.state;
    if (asyncUpload) {
      this.props.upload.startTask(options);
      this.next();
    }
    else {
      this.next(stepHash.done);
    }
  };

  setTaskPollingToTaskFail=() => {
    this.setState({ taskStatus: 'error' });
    this.next();
  }

  setTaskPollingToWarning=() => {
    this.setState({ taskStatus: 'warning' });
    this.next();
  }

  setTaskPollingToTaskDone=() => {
    this.setState({ taskStatus: 'success' });
    this.next();
    setTimeout(() => {
      this.successCallBack();
    }, 1000);
  }


  setTaskPollingToTaskError=() => {
    this.setState({ taskStatus: 'error' });
    this.next();
  }

  successCallBack=() => {
    if ('function' === typeof this.props.onUploaded) {
      this.props.onUploaded(_.get(this.props.filesInfo, '0'));
    }
  }

  handleClick = () => {
    this.setState({ visible: true });
  };

  handleUpload = () => {
    this.props.upload.clickInput();
  };

  handleOk = () => {
    const { taskStatus } = this.state;
    if ('normal' === taskStatus) {
      this.props.upload.startUpload(_.get(this.props.filesInfo, '0'));
    }
    // 在导入后，半成功半失败，用户点击【确定】刷新列表，加载出已经成功导入的数据
    else if ('warning' === taskStatus) {
      this.successCallBack();
      this.handleClose();
    }
    else {
      this.handleClose();
    }
  };

  handleCancel=() => {
    const { step, stepHash } = this.state;

    if (stepHash.upload === step && !!_.get(this.props.filesInfo, 'length')) {
      return Modal.confirm({
        title: <div>当前正在导入模板，取消将会删除原来已经上传的模板，是否确定取消确定后，则清空当前的导入任务，关闭弹窗。</div>,
        content: '',
        width: 600,
        icon: 'exclamation-circle',
        okText: '确 定',
        cancelText: '取 消',
        onOk: () => {
          this.handleClose();
        },
      });
    }

    if (stepHash.task === step) {
      this.showAsyncUploadTips();
    }
    this.handleClose();
  }

  handleClose=() => {
    this.props.upload.closeAlignment();
    this.next(0);
    this.setState({ visible: false, taskStatus: 'normal' });
  }

  handleUploadBack=() => {
    this.props.upload.closeAlignment();
    this.back();
  }

  resetUpload=() => {
    this.setState({ taskStatus: 'normal' });
    this.props.upload.closeAlignment();
    this.next(0);
  }

  handleSubmitForm = (e) => {
    if (e) {
      e.preventDefault();
    }


    // if (this.state.submitting) {
    //   message.info('正在提交');
    //   return;
    // }

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const formattedValuesTemp = this.formatFormValue(values);
        // 如果直接 false ，不进行提交
        if (!formattedValuesTemp) {
          return;
        }


        this.props.upload.setFormValue(formattedValuesTemp);
        this.next();
      }
    });
  }

  formatFormValue=(values) => {
    if ('function' === typeof this.props.formatFormValue) {
      return this.props.formatFormValue(values);
    }
    return values;
  }

  next=(value) => {
    const { step } = this.state;
    const newStep = value || 0 === value ? value : step + 1;
    this.setState({ step: newStep });
  }

  back=() => {
    const { step } = this.state;
    const newStep = 0 === step ? this.steps.length : step - 1;
    this.setState({ step: newStep });
  }

  showAsyncUploadTips = () => {
    if (!this.divDom) {
      this.divDom = document.createElement('div');
      document.body.append(this.divDom);
    }

    ReactDOM.render(this.renderAsyncUploadTips(), this.divDom);
  }

  closeTips = () => {
    document.body.removeChild(this.divDom);
    this.divDom = '';
  }

  renderAsyncUploadTips = () => {
    const absoulteLeft = document.getElementsByClassName('home-taskIcon')[0].getBoundingClientRect().left || 700;
    return (<div className={styled.asyncUploadTips} style={{ left: absoulteLeft - 110 }}>
      <div className={styled.triangle} />
      <div>请点击此处进入【我的任务】查看导入进度。</div>
      <div onClick={this.closeTips} className={styled.closeButton}>关闭</div>
    </div>);
  }

  render() {
    const { children, filesInfo, template, form } = this.props;
    const { step, visible, taskStatus, stepHash } = this.state;

    const { okText, cancelText, okFn = () => {}, cancelFn = () => {}, okProps = {}, renderFooter = () => null, cancelProps = {} } = this.getStepConfig(this.steps, stepHash[step]) || {};
    const taskInfo = this.getTaskInfo(_.get(filesInfo, '0', {}));

    return (
      <React.Fragment>
        <Modal
          destroyOnClose
          maskClosable={false}
          wrapClassName={styled.importName}
          title="批量导入"
          width={894}
          visible={visible}
          footer={null}
          bodyStyle={{ padding: '0px 0px' }}
          onOk={this.handleOk}
          onCancel={this.handleCancel}>
          <div className={styled.wrap}>
            <div className={`${styled.stepWrap} ${4 === this.steps.length ? styled.stepWrap4 : ''}`}>
              <Steps current={step}>
                {this.steps.map(item => (
                  <Steps.Step key={item.title} title={item.title} />
                ))}
              </Steps>
            </div>
            {
              stepHash.form === step && (
                <div className={styled.form}>
                  <Form layout={form.layout} >
                    {this.getBuildFormCol()}
                  </Form>
                  {renderFooter()}
                </div>
              )
            }

            {stepHash.upload === step && (
              <React.Fragment>
                <div className={styled.upload}>
                  <img src={uploadImg} alt="" />
                  <div className={styled.uploadTitle}>Excel批量导入文件</div>
                  <div className={styled.uploadButton}>
                    <Button
                      type="primary"
                      onClick={this.handleUpload}
                      disabled={'uploading' === this.getFileStatus()}>
                    上传Excel
                    </Button>
                    { template && <span className={styled.uploadTemplate}>{template}</span> }
                    {!!_.get(filesInfo, 'length') && (
                    <div className={styled.uploading}>
                      <div className={styled.fileName}>
                        <span className="sp sp-excel" />
                        <span className={styled.name}>{_.get(filesInfo, '0.file.name')}</span>
                      </div>
                      {'uploading' === this.getFileStatus() && (
                        <Progress
                          percent={_.get(filesInfo, '0.percent')} />
                      )}
                    </div>
                  )}
                  </div>
                </div>
                <div className={styled.tips}>
                  <div>提示：</div>
                  <div>
                    <div>
                      1. 仅支持.xls和.xlsx格式文件导入，且大小不能超过2M
                    </div>
                    <div>2. 除去标题行，请确保Excel的记录在2000行以内</div>
                    <div>
                      3. 为保证上传成功，请勿对模板中的单位格及长度名称进行更改
                    </div>
                    <div>
                      4.
                      一次仅支持一份文件上传，多次选取文件以最后一次选择的文件为准
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
            {stepHash.task === step && (
              <React.Fragment>
                <div className={styled.task}>
                  <div className={styled.taskTitle}>当前已处理数据量(条)</div>
                  <div className={styled.taskNumber}>{(_.get(filesInfo, '0.task.current_count', 0)).toLocaleString()}</div>
                  <div className={styled.fileName}>
                    <span className="sp sp-excel" />
                    <span className={styled.name}>{_.get(filesInfo, '0.file.name')}</span>
                  </div>
                </div>

                <div className={styled.tips}>
                  <div>提示：</div>

                  <div>
                    数据在导入中，请稍等，关闭弹窗后，可以在页面右上角
                    -【我的任务】查看导入结果。
                  </div>

                </div>

              </React.Fragment>
            )}
            {
              stepHash.done === step && (<div className={styled.done}>
                {'success' === taskStatus &&
                  <React.Fragment>
                    <img src={uploadSuccess} alt="" />
                    <div className={styled.doneTitle}>
                      导入成功
                    </div>
                    {_.get(taskInfo, 'success', 0) &&
                      <div className={styled.doneTips} >你已经成功导入 {_.get(taskInfo, 'success', 0)} 条数据，可以在列表中刷新查看刚导入数据。</div>}
                  </React.Fragment>
                }
                {'warning' === taskStatus &&
                  <React.Fragment>
                    <img src={uploadWarning} alt="" />
                    <div className={styled.doneTitle}>
                      成功导入 {_.get(taskInfo, 'success', 0)} 条，失败 {_.get(taskInfo, 'error', 0)} 条
                    </div>
                    <div className={styled.doneTips}>
                      {_.get(taskInfo, 'error', 0)}条错误记录，你可以<a href={_.get(filesInfo, '0.task.download_url')}><span className="sp sp-upload-download" />下载未导入数据</a>，根据错误原因修改后重新上传
                    </div>
                  </React.Fragment>
                }
                {'error' === taskStatus &&
                  <React.Fragment>
                    <img src={uploadError} alt="" />
                    <div className={styled.doneTitle}>
                      导入失败
                    </div>
                    <div className={styled.doneTips}>
                      {
                        _.get(filesInfo, '0.taskError.messages')
                        || _.get(filesInfo, '0.taskError.msg')
                        || _.get(filesInfo, '0.taskError.errorData')
                        || '文件上传失败：服务器繁忙'
                      }
                    </div>
                  </React.Fragment>
                }
              </div>)
            }
          </div>
          {step.task !== step && (
            <div className={styled.footer}>
              { cancelText && <Button host onClick={cancelFn.bind(this)} {...cancelProps}>{cancelText}</Button>}
              { okText && <Button type="primary" className={styled.buttonOk} {...okProps} onClick={okFn.bind(this)}>
                  {okText}
                </Button>}
            </div>
          )}
        </Modal>
        {
          _.isString(children)
          ? <Button host size="small" onClick={this.handleClick}>
            {children}
          </Button> : React.cloneElement(children, { onClick: this.handleClick })
        }

      </React.Fragment>
    );
  }
}


function validatePropsError(props = {}, prefix = '', requireKey = []) {
  let msg = '';
  _.each(requireKey, (item) => {
    if (!props[item]) {
      msg += `，${item}`;
    }
  });

  return msg ? prefix + msg : msg;
}

/**
 *
 * @param {*} columns [{
 * templateProps: {...}
 * uploadProps: {
 *    ${stepKey}Config: Fn(this) | Object
 * }
 * auth:
 * }]
 */
export function buildImportUploadComponent(columns) {
  if (!_.isArray(columns)) {
    return [];
  }
  return _.map(columns, (item, index) => {
    const errorUploadProps = validatePropsError(_.get(item, 'uploadProps', {}), '组件uploadProps缺少必传属性', ['name', 'path']);
    const errorTemplateProps = validatePropsError(_.get(item, 'templateProps', {}), '组件templateProps缺少必传属性', ['path']);
    if (errorUploadProps || errorTemplateProps) {
      const errorText = `buildImportUploadComponent columns[${index}] ${errorUploadProps};${errorTemplateProps}`;
      if (__DEV__) {
        throw new Error(errorText);
      }
      else {
        window.console.log(errorText);
        return null;
      }
    }
    const key = `importUpload-${index}-${_.get(item, 'uploadProps.name')}`;
    const importUpload = (
      <UploadComponent
        key={key}
        template={
          <DownloadButton
            method="GET"
            size="default"
            {...item.templateProps}>
            {_.get(item, 'templateProps.children') || _.get(item, 'templateProps.name') || '下载Excel模板'}
          </DownloadButton>
        }
        {...item.uploadProps}>{_.get(item, 'uploadProps.children') || '批量导入'}</UploadComponent>
    );
    return (
      item.auth ? <Access data-page-list key={key} auth={item.auth} >{importUpload}</Access> : importUpload);
  });
}
