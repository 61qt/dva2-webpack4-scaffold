import React from 'react';
import { Table, Modal, Button } from 'antd';
import { formItemLayout } from '@/components_default/page_add';
import FormContainer from '@/components_form/form_container';
import styled from './index.less';


export class ModalContainer extends React.Component {
  static defaultProps = {
    formContainerProps: {
      dataSource: {},
      layout: 'horizontal',
      formCol: 24,
      showOperation: false,
      formItemLayout,
    },
    width: 570,
    title: '新增',
    type: 'add',
    getDefaultProps: props => props,
  }

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
    this.formRef = null;// 这个是formContainer的this.props.form
    this.containerRef = null; // 这个是formContainer组件的ref
  }

  getFormRef=(e) => {
    this.formRef = e;
  }

  getContainerRef=(e) => {
    this.containerRef = e;
  }

  handleCancel=() => {
    this.setState({ visible: false }, () => {
      if (this.containerRef) {
        this.containerRef.handleReset();
      }
    });
  }

  handleOk=() => {
    if (this.containerRef) {
      this.containerRef.handleSubmit();
    }
  }

  handleVisible =() => {
    const { disabled } = this.props;
    if (disabled) {
      return;
    }
    this.setState({ visible: true });
  }

  handleSubmit=(value) => {
    const { onChange } = this.props.getDefaultProps(this.props);
    this.handleCancel();
    if ('function' === typeof onChange) {
      onChange(value);
    }
  }

  render() {
    const { visible } = this.state;
    const { type } = this.props;

    const { title, children, formContainerProps, width } = this.props.getDefaultProps(this.props, this.formRef);
    return (<React.Fragment>
      {React.cloneElement(children, { onClick: this.handleVisible })}
      <Modal
        title={title}
        width={width}
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}>
        <div>
          <FormContainer
            {...this.props.formContainerProps}
            {...formContainerProps}
            shouldInitialValue={'edit' === type}
            dataSource={this.props.dataSource}
            forwardedRef={this.getContainerRef}
            ref={this.getFormRef}
            handleSubmit={this.handleSubmit} />
        </div>
      </Modal>
    </React.Fragment>);
  }
}

export default class TableItem extends React.PureComponent {
  static defaultProps = {
    tableProps: {},
    modalContainerProps: {},
  }

  static getDerivedStateFromProps=(nextProps, { preValue }) => {
    const newState = { preValue: nextProps.value };
    if (!_.isEqual(nextProps.value, preValue)) {
      newState.preValue = nextProps.value;
    }
    return newState;
  }

  constructor(props) {
    super(props);
    let propsValue = props.value || props.defaultValue;
    if (!_.isArray(propsValue)) {
      propsValue = undefined;
    }

    this.state = {
      preValue: propsValue,
    };
    this.keyPreFix = 'item_';
  }

  getTableProps=() => {
    const { tableProps } = this.props;
    return {
      columns: [],
      pagination: false,
      editText: '编辑',
      deleteText: '删除',
      ...tableProps,
    };
  }

  getModalContainerProps=() => {
    const { modalContainerProps } = this.props;
    return {
      addText: '新增',
      editText: '编辑',
      addDisabled: false,
      ...modalContainerProps,
    };
  }


  setValue=(values) => {
    const { onChange } = this.props;
    if ('function' === typeof onChange) {
      onChange(values);
    }
    else {
      this.setState({ preValue: values });
    }
  }

  addValue=(value) => {
    let { preValue } = this.state;
    if (_.isArray(preValue)) {
      preValue.push(value);
    }
    else {
      preValue = [value];
    }
    this.setValue(preValue);
  }

  deleteValue = (idx) => {
    let { preValue } = this.state;
    if (!preValue) {
      return;
    }
    preValue.splice(idx, 1);
    if (0 === preValue.length) {
      preValue = undefined;
    }
    this.setValue(preValue);
  }

  editValue=(idx, value) => {
    const { preValue } = this.state;
    if (!preValue || !preValue[idx]) {
      return;
    }
    const newPreValue = [...preValue];
    newPreValue[idx] = { ...preValue[idx], ...value };

    this.setValue(newPreValue);
  }

  formatColumn=(column) => {
    const newColumn = column;
    const tableProps = this.getTableProps();
    const modalContainerProps = this.getModalContainerProps();
    const { preValue } = this.state;
    if (0 < column.length) {
      newColumn.push({
        title: '操作',
        key: 'operation',
        width: _.get(tableProps, 'operationWidth') || 60,
        textType: 'cn',
        render: (text, record, idx) => {
          return (<span className={styled.operation}>
            <ModalContainer type="edit" list={preValue || []} {...modalContainerProps} shouldInitialValue dataSource={record} onChange={this.editValue.bind(this, idx)} >
              <a>{_.get(tableProps, 'editText')}</a>
            </ModalContainer>
            <a onClick={this.deleteValue.bind(this, idx)}>{_.get(tableProps, 'deleteText')}</a>
          </span>);
        },
      });
    }
    return newColumn;
  }


  render() {
    const tableProps = this.getTableProps();
    const modalContainerProps = this.getModalContainerProps();
    const { preValue } = this.state;
    const newColumns = this.formatColumn(_.get(tableProps, 'columns') || []);

    return (
      <div>
        <div className={styled.action} >
          <ModalContainer type="add" {...modalContainerProps} list={preValue || []} disabled={_.get(modalContainerProps, 'addDisabled')} onChange={this.addValue} >
            <Button type="primary" disabled={_.get(modalContainerProps, 'addDisabled')} size="small">{_.get(modalContainerProps, 'addText')}</Button>
          </ModalContainer>
        </div>
        <Table {...tableProps} columns={newColumns} dataSource={preValue} />

      </div>
    );
  }
}
