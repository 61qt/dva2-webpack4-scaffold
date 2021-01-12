import _ from 'lodash';
import { InputNumber } from 'antd';
// import { DatePicker } from 'antd';
import styles from './index.less';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    this.prefix = this.props.prefix || undefined;
    this.start = 'start';
    this.end = 'end';
    if (this.prefix) {
      this.start = `${this.prefix}_start`;
      this.end = `${this.prefix}_end`;
    }
    this.state = {
      [this.start]: undefined,
      [this.end]: undefined,
    };
    debugAdd('number_range', this);
  }

  // 更新传输的 value
  componentWillReceiveProps = (nextProps) => {
    if (nextProps.prefix !== this.prefix) {
      window.console.warn('date_range：Cannot change prefix');
    }
    if ('value' in nextProps) {
      this.setState({
        [this.start]: _.get(nextProps, `value.${this.start}`),
        [this.end]: _.get(nextProps, `value.${this.end}`),
      });
    }
  }

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });

    const onChange = this.props.onChange;
    if ('function' === typeof onChange) {
      onChange({
        [this.start]: this.state[this.start],
        [this.end]: this.state[this.end],
        [field]: value,
      });
    }
  }

  onStartChange = (value) => {
    this.onChange(this.start, value);
  }

  onEndChange = (value) => {
    this.onChange(this.end, value);
  }

  render() {
    const startOption = {
      value: this.state[this.start],
      placeholder: `${_.get(this.props, 'placeholder', '')}最低值`,
      onChange: this.onStartChange,
    };

    const endOption = {
      value: this.state[this.end],
      placeholder: `${_.get(this.props, 'placeholder', '')}最高值`,
      onChange: this.onEndChange,
    };

    if (undefined !== _.get(this.props, 'min')) {
      startOption.min = _.get(this.props, 'min');
      endOption.min = _.get(this.props, 'min');
    }
    if (undefined !== _.get(this.props, 'max')) {
      startOption.max = _.get(this.props, 'max');
      endOption.max = _.get(this.props, 'max');
    }
    if (undefined !== _.get(this.props, 'step')) {
      startOption.step = _.get(this.props, 'step');
      endOption.step = _.get(this.props, 'step');
    }
    if (undefined !== _.get(this.props, 'precision')) {
      startOption.precision = _.get(this.props, 'precision');
      endOption.precision = _.get(this.props, 'precision');
    }

    const size = this.props.size || 'default';
    return (
      <div className={styles.dateranger} >
        <InputNumber size={size} {...startOption} />
        <InputNumber size={size} {...endOption} />
      </div>
    );
  }
}
