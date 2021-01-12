import React from 'react';
import { Form, Button, message, Row } from 'antd';
import buildColumnFormItem from '@/utils/build_column_form_item';

// 转发ref拿到组件内的this
function forwardRef() {
  // eslint-disable-next-line
  return function (Component) {
    class ForwardRef extends React.Component {
      render() {
        const { forwardedRef } = this.props;
        return <Component ref={forwardedRef} {...this.props} />;
      }
    }

    return React.forwardRef((props, ref) => {
      return <ForwardRef {...props} forwardRef={ref} />;
    });
  };
}


@Form.create()
@forwardRef()
export default class FormAddContainer extends React.Component {
  static defaultProps = {
    shouldInitialValue: false,
    dataSource: {},
    formCol: 8,
    warpCol: true,
    label: true,
    formColumns: [],
    submitText: '提交',
    handleSubmit: () => {},
    reset: true,
    buttonList: [],
    showOperation: true,
  }

  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
    };
    this.ref = this.handleSubmit;
  }

  componentDidMount=() => {

  }


  getBuildFormCol = () => {
    const { formColumns } = this.props;
    let columns = formColumns;
    if ('function' === typeof formColumns) {
      columns = formColumns(this.props.form);
    }


    const formCol = buildColumnFormItem({
      ...this.props,
      ...this.state,
      columns,
      shouldInitialValue: this.props.shouldInitialValue,
      defaultValueSet: this.props.dataSource,
      formItemLayout: this.props.formItemLayout,
      formValidate: this.props.formValidate,
      col: this.props.formCol,
      warpCol: this.props.warpCol,
      label: this.props.label,
      layout: 'horizontal',
    });
    this.formCol = formCol;
    return formCol;
  }

  handleSubmit=(e) => {
    if (e) {
      e.preventDefault();
    }


    if (this.state.submitting) {
      message.info('正在提交');
      return;
    }

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const formattedValuesTemp = this.formatFormValue(values);
        // 如果直接 false ，不进行提交
        if (!formattedValuesTemp) {
          return;
        }


        this.props.handleSubmit({ ...formattedValuesTemp });
      }
      else if ('function' === typeof this.props.errFormCallback) {
        this.props.errFormCallback(err);
      }
    });
  }


  formatFormValue=(values) => {
    if ('function' === typeof this.props.formatFormValue) {
      return this.props.formatFormValue(values);
    }
    return values;
  }

  handleReset = () => {
    this.props.form.resetFields();
    if (this.props.handleReset) {
      this.props.handleReset();
    }
  }

  render() {
    const { layout, reset, buttonList, showOperation } = this.props;
    return (
      <Form layout={layout} onSubmit={this.handleSubmit}>
        {'horizontal' === layout || !layout ? <Row gutter={0}>
          {this.getBuildFormCol()}
        </Row> : this.getBuildFormCol()}
        {
          showOperation && <Form.Item style={{ maxHeight: '40px' }} wrapperCol={{ span: 24, offset: 5 }}>
            <Button type="primary" htmlType="submit">
              {this.props.submitText}
            </Button>
            {reset && <Button style={{ marginLeft: 20 }} onClick={this.handleReset}>重置</Button>}
            {
            buttonList.map(item => item)
          }
          </Form.Item>
        }


      </Form>
    );
  }
}
