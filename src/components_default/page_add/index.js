import moment from 'moment';
import React from 'react';
import _ from 'lodash';
import Qs from 'qs';
import { message, Spin, Button, Form, Row, Icon } from 'antd';
import PropTypes from 'prop-types';
import DetailView from '@/npm/@edu_components_atom/detail_view';
// import Filters from '../../filters';
import formErrorMessageShow from '../../utils/form_error_message_show';
import translator from '../../utils/translate';
import buildColumnFormItem from '../../utils/build_column_form_item';
import formatFormValue from '../../utils/format_form_value';
import { undershoot as sentryUndershoot } from '../../utils/dva-sentry';
import { getState } from '../../utils/get_app';
import Well from '../../components_atom/well';
import PageLayout from '../../components_atom/page_layout';
// import { getApiConfig } from '../../utils/get_api_config';

import './index.less';

function uuidFunc() {
  return `uuid_${moment().unix()}_${String(Math.random()).substr(2)}`;
}

const FIELD_UPLOADING_TEXT = '文件正在上传中，请等待。。。';

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

export const formTailItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 14, offset: 6 },
  },
};

export default class Component extends React.PureComponent {
  // context 类型定义
  static childContextTypes = {
    patchFormValidateOfFieldUpload: PropTypes.func,
  }

  constructor(props) {
    super(props);
    debugAdd('page_add', this);

    const query = Qs.parse(window.location.search.replace(/^\?/, ''));
    this.query = query;

    const paramsId = _.get(props, 'match.params.id') * 1 || _.get(props, 'dataSource.id') * 1 || false;
    this.editInfo = {
      paramsId,
      text: false === paramsId ? '新增' : '编辑',
      method: false === paramsId ? 'create' : 'update',
    };

    const uuid = uuidFunc();
    this.state = {
      formId: `page_add_form_${uuid}`,
      // 当前页面的展示的表(service 或者是 schema)的名称。
      model: 'admin_city',
      // 当前页面的展示的表(service 或者是 schema)的中文可读名称。
      modeLabel: '市级管理员',
      // 当前是不是展开所以的列。
      formExpand: true,
      // 收起时候展示的行数。
      formShowCount: 99999,
      formCol: 24,
      formValidate: {},
      submitting: false,
      loading: true,
      dataSource: false,
      // 是否显示导航条
      hideBreadcrumb: false,
      // 目前只能是 [Well, DetailView, Custom]
      // Custom 就不输出了
      formMode: 'Well',
      // 当输出为 DetailView, DetailView 的 col 属性。
      detailViewCol: 1,
      detailViewLabelWidth: '10em',
      successAutoBackList: true,
      editSubjectTitle: '资料',
      pageAddClassName: '',
      hiddenFormAction: false,
      detailViewActionCol: 0,
      // 表单，是否自动填充数据。
      autoAddDebugValue: false,
      needPreSubmitTrimRequiredString: true,
    };
    // if (__DEV__) {
    //   this.state.successAutoBackList = false;
    // }

    // getAndFormatDataSource 函数是否被调用标识
    this.getAndFormatDataSource.hasCalled = false;
  }

  getChildContext = () => {
    return {
      patchFormValidateOfFieldUpload: this.patchFormValidateOfFieldUpload,
    };
  }

  componentDidMount = () => {
    if (this.props.dataSource && this.props.dataSource.id) {
      // 新增状态
      const dataSource = {
        ...this.props.dataSource,
      };
      this.loadedDataSource({
        dataSource,
      });
      this.setState({
        loading: false,
        dataSource: this.formatDataSource(dataSource),
      });
    }
    else if (this.shouldLoadDataSource()) {
      // 编辑状态
      this.getAndFormatDataSource();
    }
    else {
      // 新增状态
      this.setState({
        loading: false,
        dataSource: {},
      });
    }

    this.componentDidMountExtend();
  }

  componentWillReceiveProps = (nextProps) => {
    // 新增状态
    if (nextProps.dataSource && !_.isEqual(nextProps.dataSource, this.props.dataSource)) {
      // 直接传输数据的状态
      const dataSource = {
        ...nextProps.dataSource,
      };
      this.loadedDataSource({
        dataSource,
      });
      this.setState({
        loading: false,
        dataSource,
      });
    }
  }

  getPageHeader = () => {
    return null;
  }

  getPageFooter = () => {
    return null;
  }

  getLoadDataSourcePromise = () => {
    return this.props.dispatch({
      type: `${this.state.model}/detail`,
      payload: { id: this.editInfo.paramsId },
    });
  }

  getAndFormatDataSource = () => {
    this.getAndFormatDataSource.hasCalled = true;
    return this.getLoadDataSourcePromise().then((data) => {
      this.loadedDataSource({
        dataSource: data,
      });

      this.setState({
        loading: false,
        dataSource: this.formatDataSource(data),
      }, () => {
        this.setState({
          random: Math.random(),
        });
      });
    }).catch((rej) => {
      formErrorMessageShow({
        msg: '找不到该数据',
        ...rej,
      });
      this.loadedDataSource({
        dataSource: {},
      });
      this.setState({
        loading: false,
      });
    });
  }

  getFormColumn = () => {
    return [];
  }

  getBuildFormCol = (options = {}) => {
    const columns = options.columns || this.getFormColumn();
    const formCol = buildColumnFormItem({
      ...this.props,
      ...this.state,
      columns,
      shouldInitialValue: this.shouldInitialValue(),
      defaultValueSet: this.state.dataSource,
      formItemLayout: options.formItemLayout || {},
      formValidate: this.state.formValidate,
      col: this.state.formCol,
      warpCol: options.warpCol || false,
      label: options.label || false,
      autoAddDebugValue: this.state.autoAddDebugValue,
    });

    this.formCol = formCol;
    return formCol;
  }

  getUpdateDispatchType= () => {
    return `${this.state.model}/update`;
  }

  getCreateDispatchType = () => {
    return `${this.state.model}/create`;
  }

  getSubmitPromise = ({
    formData,
  }) => {
    let promise;
    if ('update' === this.editInfo.method) {
      promise = this.props.dispatch({
        type: this.getUpdateDispatchType(),
        payload: {
          id: this.editInfo.paramsId,
          values: formData,
        },
      });
    }
    else {
      promise = this.props.dispatch({
        type: this.getCreateDispatchType(),
        payload: {
          values: formData,
        },
      });
    }

    return promise;
  }

  getEditFormTitle = () => {
    return `${this.editInfo.text}${this.state.editSubjectTitle || ''}`;
  }

  getCustomSubmitSuccessBackUrl = () => {
    return false;
  }

  getTranslateDictExtra = () => {
    return {};
  }

  getTranslateDictColumn = () => {
    let column = [];
    try {
      const formColumns = this.getFormColumn();

      const addDictWithColumnChildren = (columns = []) => {
        let result = [];
        _.each(columns, (formColumn) => {
          // 丢弃 children，防止重复遍历
          result.push(_.omit(formColumn, ['children']));

          if (formColumn && formColumn.children && _.isArray(formColumn.children)) {
            result = _.concat(result, addDictWithColumnChildren(formColumn.children));
          }
        });

        return result;
      };

      column = [].concat(addDictWithColumnChildren(formColumns));
    }
    catch (e) {
      // do nothing
    }
    return column;
  }

  getTranslateDict = () => {
    const extraDict = { ...this.getTranslateDictExtra() };
    const translateDict = {
      ...extraDict,
    };

    _.each(extraDict, (value, key) => {
      translateDict[_.camelCase(key)] = extraDict[key]; // 相同的key，冗余驼峰的
    });

    const mapColumns = (columns) => {
      _.map(columns, (elem) => {
        const dataIndex = elem.dataIndex || elem.key;
        if (dataIndex) {
          // translateDict[_.replace(dataIndex, /_/ig, ' ')] = elem.title;
          translateDict[dataIndex] = elem.a11yTitle || elem.title;
        }

        if (_.isArray(elem.columns)) {
          mapColumns(elem.columns);
        }
      });
    };

    if ('function' === typeof this.getFormColumn) {
      try {
        mapColumns(this.getTranslateDictColumn());
      }
      catch (err1) {
        sentryUndershoot.capture(err1, {
          ...err1,
        });
      }
    }

    return translateDict;
  }

  getFormProps = () => {
    return {};
  }

  getFormTailItemLayout = () => {
    return formTailItemLayout;
  }


  getFormItemLayout=() => {
    return formItemLayout;
  }

  // setDetailViewActionCol=(width) => {
  //   if (width) {
  //     this.setState({ detailViewActionCol: `${width + 1}px` });
  //   }
  //   else {
  //     this.setState({ detailViewActionCol: this.state.detailViewLabelWidth });
  //   }
  // }

  formatDataSource = (dataSource) => {
    return dataSource;
  }

  shouldLoadDataSource = () => {
    return !!this.editInfo.paramsId;
  }

  shouldInitialValue = () => {
    return this.editInfo.paramsId || _.get(this.props, 'dataSource.id') || false;
  }

  loadedDataSource = ({ dataSource }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('dataSource', dataSource);
    }

    // // 加载完毕初始记录之后的处理。
    // if (__DEV__) {
    //   window.console.warn('[loadedDataSource] 如果需要配置加载完毕初始数据之后的操作，需要在子类重新定义该方法');
    // }
  }

  reloadDataSource = () => {
    if (!this.state.successAutoBackList && this.getAndFormatDataSource.hasCalled) {
      this.setState({
        submitting: true,
      });

      const loadDataPromise = this.getAndFormatDataSource();
      const unsetSubmitting = () => {
        this.setState({
          submitting: false,
        });
      };
      if (loadDataPromise && _.isFunction(loadDataPromise.then)) {
        return loadDataPromise
          .finally(() => {
            unsetSubmitting();
          });
      }
      else {
        unsetSubmitting();
      }
    }
  }

  componentDidMountExtend = () => {
    // if (__DEV__) {
    //   window.console.warn('[componentDidMountExtend] 如果需要配置额外信息，需要在子类重新定义该方法');
    // }
  }

  // 用于设置上传组件的上传中状态。
  patchFormValidateOfFieldUpload = (name, type) => {
    const options = {};
    if ('error' === type) {
      options[name] = { validateStatus: 'error', help: FIELD_UPLOADING_TEXT };
    }
    else {
      options[name] = {};
    }

    this.patchFormValidate(options);
  }

  // 增加新的表单验证信息
  patchFormValidate = (newFormValidate) => {
    this.setState({
      formValidate: {
        ...this.state.formValidate,
        ...newFormValidate,
      },
    });
  }

  resetFormValidate = () => {
    const formValidate = {};
    this.getFormColumn().forEach((elem) => {
      const dataIndex = elem.key || elem.dataIndex;
      formValidate[dataIndex] = {};
    });

    this.setState({
      formValidate,
    });
  }

  // 提交表单正确时候的处理。
  successCallback = (options = {}) => {
    this.setState({
      submitting: false,
    });

    if ('function' === typeof this.props.onSuccessCallback) {
      this.props.onSuccessCallback();
    }

    if ('function' === typeof this.props.onSuccessCallbackOfData) {
      this.props.onSuccessCallbackOfData(options);
    }
  }

  successCallbackAfter = (res) => {
    if (__DEV__ && __PROD__) {
      window.console.log('res', res);
    }
  }

  // 提交表单错误时候的处理。
  errorCallback = (value) => {
    const formValidate = this.state.formValidate;
    for (const [k] of _.entries(formValidate)) {
      formValidate[k] = {};
    }

    const bracketReg = /\.(\d+)\./g;
    const translateDict = this.getTranslateDict();
    for (const [k, v] of _.entries(value)) {
      const validateObj = {
        validateStatus: 'error',
        help: translator(_.get(v, '[0]') || v, translateDict),
      };

      formValidate[k] = validateObj;

      let key = k;
      if (key && bracketReg.test(key)) {
        // 冗余额外的 key，兼容多种格式
        // studentFamilies.0.name -> studentFamilies[0].name
        key = key.replace(bracketReg, '[$1].');
        formValidate[key] = validateObj;
      }
    }
    this.setState({
      formValidate,
      submitting: false,
    });
  }

  errorCallbackAfter = ({
    rejData,
    rej,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('rejData', rejData, 'rej', rej);
    }
  }

  // 默认的 value 更改函数。自定义时候需要覆盖
  formatFormValue = (values) => {
    return values;
  }

  canHandleSubmit = () => {
    return true;
  }

  handleInterceptSubmit = ({ formattedValues }) => {
    this.state.submitting = true;
    this.setState({
      submitting: true,
    });
    this.handleSubmitRun({
      values: formattedValues,
    });
  }

  handleRequiredTrimValue = () => {
    const columns = this.getFormColumn();
    const requiredColumnsDataIndex = _.map(_.filter(columns, (item) => {
      return _.some(_.map(_.get(item, 'rules'), 'required'));
    }), 'dataIndex');

    const values = _.assign({}, this.props.form.getFieldsValue() || {});
    _.each(requiredColumnsDataIndex, (key) => {
      if (_.isString(values[key])) {
        values[key] = values[key].trim();
      }
    });
    this.props.form.setFieldsValue(values);

    return values;
  }

  handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!this.canHandleSubmit()) {
      return;
    }

    if (this.state.submitting) {
      message.info('正在提交');
      return;
    }

    // 判断是否有上传中的
    let formValidateStr = '';
    try {
      formValidateStr = JSON.stringify(this.state.formValidate);
    }
    catch (error) {
      formValidateStr = '';
    }
    if (_.includes(formValidateStr, FIELD_UPLOADING_TEXT)) {
      formErrorMessageShow({
        msg: FIELD_UPLOADING_TEXT,
      });
      return;
    }
    // 必填项未字符串的时候trim
    if (this.state.needPreSubmitTrimRequiredString) {
      try {
        this.handleRequiredTrimValue();
      }
      catch (error) {
        // do nothing
        window.console.log('error', error);
      }
    }

    // 判断是否有上传中的 end
    this.resetFormValidate();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (err) {
        if (__DEV__) {
          window.console.log('form submit validate err', err);
        }
        return formErrorMessageShow({
          msg: '请检查表单内容',
          data: {
            ...err,
          },
        }, {
          showKey: true,
          translateDict: this.getTranslateDict(),
        });
      }
      if (!err) {
        const formattedValuesTemp = this.formatFormValue(values);
        // 如果直接 false ，不进行提交
        if (!formattedValuesTemp) {
          return;
        }
        const formattedValues = {
          ...formattedValuesTemp,
        };
        for (const [key, value] of _.entries(formattedValues)) {
          formattedValues[key] = formatFormValue(value);
        }
        this.handleInterceptSubmit({ formattedValues });
      }
    });
  }

  handleSubmitRunSuccessMsg = () => {
    return `${this.editInfo.text}成功`;
  }

  handleSubmitRun = ({ values }) => {
    const formData = {
      ...values,
    };
    this.getSubmitPromise({
      formData,
    }).then((res) => {
      if (this.handleSubmitRunSuccessMsg()) {
        message.success(this.handleSubmitRunSuccessMsg());
      }
      this.successCallback({
        res,
        formData,
      });
      this.handleSubmitSuccessBack({
        res,
        formData,
      });

      this.successCallbackAfter(res);
    }).catch((rej) => {
      window.console.log('page add catch rej', rej);
      formErrorMessageShow(rej, {
        translateDict: this.getTranslateDict(),
      });
      let rejData = {};
      try {
        rejData = JSON.parse(_.get(rej, 'data'));
      }
      catch (e) {
        rejData = _.get(rej, 'data');
      }

      this.errorCallback(rejData);
      this.errorCallbackAfter({
        rejData,
        rej,
      });
    });
  }

  handleSubmitSuccessBack = () => {
    if (this.state.successAutoBackList) {
      if (this.getCustomSubmitSuccessBackUrl() && _.get(this, 'props.history.push')) {
        return this.props.history.push(this.getCustomSubmitSuccessBackUrl());
      }

      const state = getState();
      const historySave = _.get(state, 'breadcrumb.history') || [];
      const back = _.last(_.get(historySave, `[${historySave.length - 2}]`));
      const current = _.last(_.last(historySave));

      if (this.qurey && this.query.dt) {
        this.props.history.push(this.query.dt);
      }
      else if (this.qurey && this.query.redirect_uri) {
        this.props.history.push(this.query.redirect_uri);
      }
      else if (back && back.url && current && back.url !== current.url && _.get(this, 'props.history.push')) {
        this.props.history.push(back.url);
      }
      // else if (_.get(this, 'props.history.push')) {
      //   const jumpBackUrl = Filters.path(`${this.state.model}`, {});
      //   if (jumpBackUrl) {
      //     this.props.history.push(jumpBackUrl);
      //   }
      // }
      else {
        try {
          window.history.back();
        }
        catch (e) {
          // do nothing
        }
      }
    }
    else {
      window.console.log('开发模式下面，编辑新增完毕，不自动跳转到列表页面');
      // 不自动跳转的 page_add 页面，确保 getAndFormatDataSource 调用过了，才可以重新调用
      this.reloadDataSource();
    }
  }

  handleReset = () => {
    this.props.form.resetFields();
    this.resetFormValidate();
    if ('function' === typeof this.handleResetAfter) {
      this.handleResetAfter();
    }
  }

  toggleFormExpand = () => {
    const { formExpand } = this.state;
    this.setState({ formExpand: !formExpand });
  }


  wellFooter = () => {
    return null;
  }
  renderTips = () => {
    return null;
  }


  renderWellForm = (options = {}) => {
    const formShowCount = options.formShowCount || this.state.formShowCount;
    const formExpand = options.formExpand || this.state.formExpand;

    const formCol = options.formCol || this.getBuildFormCol({
      warpCol: true,
      label: true,
      formItemLayout: this.getFormItemLayout() || formItemLayout,
    });

    const wellProps = {
      title: this.state.isInPageAddModal ? null : (options.title || this.getEditFormTitle()),
      footer: this.state.isInPageAddModal ? null : this.wellFooter(),
      // 如果是弹窗模式，就不显示这个边框。如果 isInPageAddModal 为 true ，holderplace 就是 true ，这个时候 well 会没有边框
      holderplace: this.state.isInPageAddModal,
    };

    return (<Well {...wellProps}>
      {
        this.renderFormColHeaderTips() ? <Row gutter={40}>
          {this.renderFormColHeaderTips()}
        </Row> : null
      }
      <Row gutter={40}>
        {formCol.slice(0, formShowCount)}
      </Row>
      <Row
        className={`${formExpand ? '' : 'ant-hide'}`}
        gutter={40}>
        {formCol.slice(formShowCount)}
      </Row>
    </Well>);
  }

  renderDetailViewForm = (options = {}) => {
    const formCol = options.formCol || this.getBuildFormCol({
      warpCol: false,
      label: false,
    });
    const renderTitle = (elem) => {
      const isRequired = _.find(elem.rules, {
        required: true,
      });
      // eslint-disable-next-line jsx-a11y/label-has-for
      return (<label htmlFor={elem.dataIndex} className={`page-add-detail-view-label  no-wrap ${isRequired ? 'ant-form-item-required' : ''}`} title={elem.a11yTitle || elem.title}>
        {elem.title}{this.state.isInPageAddModal && elem.title ? ' ：' : ''}
      </label>);
    };

    const detailViewProps = {
      key: `formCol_${options.key || formCol.length}`,
      titleClassName: 'text-align-right',
      className: `small ${this.state.isInPageAddModal ? 'page-add-model-detail-view' : ''} ${options.className || ''}`,
      col: options.detailViewCol || this.state.detailViewCol,
      expand: this.state.isInPageAddModal ? 9999 : (this.state.detailViewExpand || 99999),
      labelWidth: this.state.detailViewLabelWidth,
      dataSource: {},
      columns: formCol,
      // getTdWidth: this.setDetailViewActionCol,
      renderTitle,
      title: this.state.isInPageAddModal ? null : (options.title || this.getEditFormTitle()),
      // 如果是在弹窗模式，那么detailview里面的 table 就没有边框
      tableHasBorder: !this.state.isInPageAddModal,
      // 如果是在弹窗模式，那么detailview里面的 label 字段就不设定宽度。
      labelWidthCalculate: !this.state.isInPageAddModal,
    };

    return (<DetailView {...detailViewProps} />);
  }

  renderMultiForm = () => {
    return _.map(this.getFormColumn(), (formObj, index) => {
      const viewType = formObj.viewType || 'Well';
      const formCol = this.getBuildFormCol({
        warpCol: 'Well' === viewType,
        label: 'Well' === viewType,
        columns: formObj.columns,
        formItemLayout: formObj.formItemLayout || this.getFormItemLayout(),
      });

      const renderArgs = {
        formCol,
        ...formObj,
      };

      if ('Well' === viewType) {
        return (<span key={`${formObj.title}_${index}`}>{this.renderWellForm(renderArgs)}</span>);
      }
      else if ('DetailView' === viewType) {
        return (<span key={`${formObj.title}_${index}`}>{this.renderDetailViewForm(renderArgs)}</span>);
      }
    });
  }

  renderMultiDetailViewForm = () => {
    return _.map(this.getFormColumn(), (columns) => {
      const formCol = this.getBuildFormCol({
        warpCol: false,
        label: false,
        columns,
      });

      const renderTitle = (elem) => {
        const isRequired = _.find(elem.rules, {
          required: true,
        });
        // eslint-disable-next-line jsx-a11y/label-has-for
        return (<label htmlFor={elem.dataIndex} className={`${isRequired ? 'ant-form-item-required' : ''}`} title={elem.a11yTitle || elem.title}>{elem.title}</label>);
      };

      return (<DetailView
        key={`formCol_${formCol.length}`}
        titleClassName="text-align-right"
        className="small"
        col={this.state.detailViewCol}
        expand={this.state.detailViewExpand || 99999}
        labelWidth={this.state.detailViewLabelWidth}
        dataSource={{}}
        columns={formCol}
        renderTitle={renderTitle}
        title={this.getEditFormTitle()} />);
    });
  }

  renderCustomForm = () => {
    return null;
  }

  renderFormActionModeDetect = () => {
    if ('Custom' === this.state.formMode) {
      return (<Well holderplace className={`page-add-action page-add-well-action ${'Custom' === this.state.formMode ? '' : 'ant-hide'} ${this.state.hiddenFormAction ? 'ant-hide' : ''}`}>
        <Row gutter={0}>
          <Form.Item {...this.getFormTailItemLayout()}>
            {this.renderFormAction()}
          </Form.Item>
        </Row>
      </Well>);
    }

    if ('Well' === this.state.formMode) {
      return (<Well holderplace className={`page-add-action page-add-well-action ${'Well' === this.state.formMode ? '' : 'ant-hide'} ${this.state.hiddenFormAction ? 'ant-hide' : ''}`}>
        <Row gutter={0}>
          <Form.Item {...this.getFormTailItemLayout()}>
            {this.renderFormAction()}
          </Form.Item>
        </Row>
      </Well>);
    }

    if ('Multiple' === this.state.formMode) {
      return (<Well holderplace className={`page-add-action page-add-well-action ${'Multiple' === this.state.formMode ? '' : 'ant-hide'} ${this.state.hiddenFormAction ? 'ant-hide' : ''}`}>
        <Row gutter={0}>
          <Form.Item {...this.getFormTailItemLayout()}>
            {this.renderFormAction()}
          </Form.Item>
        </Row>
      </Well>);
    }

    if ('DetailView' === this.state.formMode) {
      return (<div className={`page-add-action page-add-detail-view-action ${'DetailView' === this.state.formMode ? '' : 'ant-hide'} ${this.state.hiddenFormAction ? 'ant-hide' : ''}`}>
        <div style={{ width: this.state.detailViewActionCol }} className="page-add-detail-view-action-col" />{this.renderFormAction()}
      </div>);
    }

    if ('MultiDetailView' === this.state.formMode) {
      return (<div className={`page-add-action page-add-detail-view-action ${'MultiDetailView' === this.state.formMode ? '' : 'ant-hide'} ${this.state.hiddenFormAction ? 'ant-hide' : ''}`}>
        <div style={{ width: this.state.detailViewActionCol }} className="page-add-detail-view-action-col" />{this.renderFormAction()}
      </div>);
    }
  }

  renderFormColumnModeDetect = () => {
    if ('Well' === this.state.formMode) {
      return this.renderWellForm();
    }

    if ('DetailView' === this.state.formMode) {
      return this.renderDetailViewForm();
    }

    if ('Multiple' === this.state.formMode) {
      return this.renderMultiForm();
    }

    // 这个 MultiDetailView 应该要废弃了。坐等
    if ('MultiDetailView' === this.state.formMode) {
      return this.renderMultiDetailViewForm();
    }

    if ('Custom' === this.state.formMode) {
      return this.renderCustomForm();
    }
  }

  renderForm = () => {
    return (
      <Spin spinning={this.state.submitting}>
        <Row gutter={40}>{ this.renderFormHeader() }</Row>
        <Form id={this.state.formId} className="app-edit-form" onSubmit={this.handleSubmit} {...this.getFormProps()}>
          {this.renderFormColumnModeDetect()}
          {this.renderTips()}
          <Row gutter={0}>
            { this.renderFormFooter() }
          </Row>
          {this.renderFormActionModeDetect()}
        </Form>
      </Spin>
    );
  }

  renderFormColHeaderTips=() => {
    return null;
  }

  renderFormHeader = () => {
    return null;
  }

  renderFormFooter = () => {
    return null;
  }

  renderFormAction = () => {
    return this.renderFormActionElem();
  }

  renderFormActionElem = () => {
    const list = this.renderFormActionElemArr();
    // console.log(list);

    return (
      <span className="page-add-action">
        { list }
      </span>);
  }

  renderFormSubmitActionElemTitle = () => {
    return '保存';
  }

  renderFormSubmitActionElemProps = () => {
    return {};
  }

  renderFormActionElemArr = () => {
    const list = [];

    const customActionElemProps = this.renderFormSubmitActionElemProps();
    const submitProps = {
      key: 'submit',
      form: this.state.formId,
      size: 'default',
      type: 'primary',
      htmlType: 'submit',
      disabled: this.state.submitting || customActionElemProps.disabled,
      loading: this.state.submitting,
      ...customActionElemProps,
    };

    const submit = (<Button {...submitProps}>{this.renderFormSubmitActionElemTitle()}</Button>);
    list.push(submit);
    Object.defineProperty(list, 'submit', {
      value: submit,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    const reset = (<Button key="reset" size="default" onClick={this.handleReset}>重置</Button>);
    list.push(reset);
    Object.defineProperty(list, 'reset', {
      value: reset,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    let showToggle = false;
    const column = this.getFormColumn();
    if (_.isArray(column) && column.length > this.state.formShowCount) {
      showToggle = true;
    }
    const toggle = (<a key="toggle" className={`${showToggle ? '' : 'ant-hide'}`} onClick={this.toggleFormExpand}>
      { this.state.formExpand ? '收起' : '展开' }
      <Icon type={this.state.formExpand ? 'up' : 'down'} />
    </a>);
    list.push(toggle);
    Object.defineProperty(list, 'toggle', {
      value: toggle,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return list;
  }

  render() {
    return (<PageLayout
      hideBreadcrumb={this.state.hideBreadcrumb}
      className={`${this.state.pageAddClassName || ''}`}>
      { this.getPageHeader() }
      <div className="page-add-content">

        <Spin spinning={this.state.loading}>
          { this.state.dataSource && !this.state.loading ? this.renderForm() : <div>正在加载</div> }
        </Spin>
      </div>
      { this.getPageFooter() }
    </PageLayout>);
  }
}
