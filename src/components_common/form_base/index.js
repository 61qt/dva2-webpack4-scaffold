import React from 'react';
import _ from 'lodash';

import { Form } from 'antd';
import { List, Button, InputItem, Toast } from 'antd-mobile';

import styles from './index.less';

function genLabel(name, isRequired) {
  if (isRequired) {
    return (
      <span>
        <i className={styles.requiredFlag}>*</i>
        {name}
      </span>
    );
  }
  else {
    return name;
  }
}

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    debugAdd('form_base', this);
    this.state = {
      errors: [],
      submitting: false,
    };
    this.getSubmitPromise = _.debounce(this.getSubmitPromise, 300);
  }

  componentDidMount = () => {
    this.componentDidMountExtend();
  }

  getFormColumns = () => {
    return [];
  }

  getDispatchType = () => {
    // 指定dispatch的model
    return false;
  }

  getSubmitPromise = () => {
    if (!this.getDispatchType()) {
      if (__DEV__) {
        window.console.log('未指定dispatch type');
      }
      return;
    }
    if (this.state.submitting) {
      return;
    }

    const { validateFields } = this.props.form;
    validateFields((errors, values) => {
      const formattedValues = this.genFormatedValues(values);
      if (null !== errors) {
        return;
      }
      this.setState({ submitting: true });
      this.props.dispatch({
        type: this.getDispatchType(),
        payload: { values: formattedValues },
      }).then((res) => {
        this.setState({ submitting: false });
        this.callbackWithSuccess(res);
      }).catch((rej) => {
        this.setState({ submitting: false });
        this.callbackWithFail(rej);
      });
    });
  }

  getSubmitBtn = () => {
    return (
      <div className="fixedWrap">
        <Button type="primary" onClick={this.getSubmitPromise}>提交</Button>
      </div>
    );
  }

  // 子类覆盖此方法，可以在定义提交成功之后的行为，下同
  callbackWithSuccess = (res) => {
    Toast.success('提交成功', 1.5);
    return res;
  }

  callbackWithFail = (rej) => {
    const { data, msg } = rej;
    Toast.fail(msg, 1.5);
    if (_.isObject(data)) {
      this.setState({ errors: data });
    }
    return rej;
  }

  componentDidMountExtend = () => {
  }

  genLabel = (name, isRequired) => {
    return genLabel(name, isRequired);
  }

  genListWrap = ({
    title,
    index,
    formItem,
    item,
  }) => {
    return (
      title ?
        <List
          className={`${styles.list} ${item.className || ''}`}
          key={index}
          renderHeader={() => title}>
          {formItem}
        </List>
        :
        <List
          className={`${styles.list} ${item.className || ''}`}
          key={index}>
          {formItem}
        </List>
    );
  }

  genFormatedValues = (values) => {
    const columns = this.getFormColumns();
    const formattedValues = values;
    _.each(columns, (item) => {
      const formatValue = _.get(item, 'formatValue');
      if ('function' === typeof formatValue) {
        const dataId = _.get(item, 'dataId');
        const value = formatValue(_.get(values, dataId));
        _.set(formattedValues, dataId, value);
      }
    });
    return formattedValues;
  }

  buildForm = () => {
    const columns = this.getFormColumns();
    const errors = this.props.form.getFieldsError();
    const formItems = [];
    _.each(columns, (item, index) => {
      // hasListWrap, 控制该项是否被List包裹，有margintop
      // rende, 指定该项的render方法
      // rules, 指定该项受控后的检验规则
      // removeRule, 移除此控件的条件，若为function，callback(初始值, form)
      // dataId, 指定该项提交时的字段名
      // title,  指定该项的title
      // label,  指定该项的label，（未指定特殊render时）
      // placeholder,  同上，指定该项的预览文字
      // initialValue,  初始值
      // formatValue,  表单提交时，指定对表单值的处理方法

      const labelTxt = _.get(item, 'label', '') || _.get(item, 'dataId', '') || '';
      const isRequired = _.get(_.find(_.get(item, 'rules', []), { required: true }), 'required', false);
      const placeholderText = _.get(item, 'placeholder', '') || `请输入${labelTxt}`;

      let formItem = null;
      const options = {};

      // 判断是否应该移除
      const removeRule = _.get(item, 'removeRule');
      let rowIsRemove = false;
      if ('boolean' === typeof removeRule) {
        rowIsRemove = removeRule;
      }
      else if ('function' === typeof removeRule) {
        rowIsRemove = removeRule(_.get(item, 'initialValue'), _.get(this.props, 'form'));
      }

      if (rowIsRemove) {
        return null;
      }

      // render
      const render = _.get(item, 'render');
      if ('function' === typeof render) {
        formItem = render();
      }
      else {
        formItem = <InputItem placeholder={placeholderText}>{this.genLabel(labelTxt, isRequired)}</InputItem>;
      }

      // rules
      const rules = _.get(item, 'rules');
      if (_.isArray(rules)) {
        options.rules = rules;
      }

      // 初始值
      const initialValue = _.get(item, 'initialValue');
      if (!_.isUndefined(initialValue)) {
        options.initialValue = initialValue;
        if (_.isFunction(initialValue)) {
          options.initialValue = initialValue();
        }
      }

      // 设置受控和字段
      const dataId = _.get(item, 'dataId');
      if ('string' === typeof dataId && 0 < dataId.length) {
        formItem = this.props.form.getFieldDecorator(dataId, options)(formItem);
      }

      const hasListWrap = _.get(item, 'hasListWrap');
      const title = _.get(item, 'title');
      formItems.push(hasListWrap ?
        this.genListWrap({
          title,
          index,
          formItem,
          item,
        })
        :
        <div key={index} className={item.className || ''}>
          {formItem}
        </div>);
      // 显示错误
      const error = _.get(this.state, `errors.${dataId}.[0]`) || _.get(errors, `${dataId}.[0]`, undefined);
      if (_.isString(error) && 0 < error.length) {
        formItems.push(<div key={`${index}-error`} className={styles.errorTips}>{error}</div>);
      }
    });
    return formItems;
  }

  renderContent = () => {
    const formItems = this.buildForm();

    return (<Form className={styles.form}>
      {formItems}
      {this.getSubmitBtn()}
    </Form>);
  }

  render() {
    return this.renderContent();
  }
}
