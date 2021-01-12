import { Input } from 'antd';
import React from 'react';
import './index.less';

const { TextArea } = Input;

class CustomTextArea extends React.Component {
  render() {
    const { props } = this;
    if (!props.maxLength) {
      return (<Input {...props} />);
    }
    const count = _.get(`${props.value || ''}`, 'length') || 0;
    let color = '#BFBFBF';
    if (count === props.maxLength) {
      color = '#D0021B';
    }

    return (
      <React.Fragment>
        <TextArea {...props} />
        <div style={{ color: `${color}`, textAlign: 'right', height: '20px', lineHeight: '20px' }}>{count}/{props.maxLength}</div>
      </React.Fragment>
    );
  }
}

class CustomInput extends React.PureComponent {
  render() {
    const { props } = this;
    if (!props.maxLength) {
      return (<Input {...props} />);
    }
    const count = _.get(`${props.value || ''}`, 'length') || 0;
    let color = '#BFBFBF';
    if (count === props.maxLength) {
      color = '#D0021B';
    }

    // 根据长度 设置input的padding-right
    let inputClass = '';

    if (9 < props.maxLength) {
      inputClass = 'custom-suffix-input-large';
    }

    return (<Input
      {...props}
      className={inputClass}
      suffix={<span style={{ color: `${color}` }}>{count}/{props.maxLength}</span>} />);
  }
}

CustomInput.TextArea = CustomTextArea;

export default CustomInput;
