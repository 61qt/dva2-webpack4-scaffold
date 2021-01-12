import moment from 'moment';
import _ from 'lodash';
import { DatePicker } from 'antd';
import styles from './index.less';

export default class Component extends React.PureComponent {
  static defaultProps = {
    allowClear: true,
  }

  static getDerivedStateFromProps=(nextProps) => {
    let startStr = 'start';
    let endStr = 'end';
    if (nextProps.prefix) {
      startStr = `${nextProps.prefix}_start`;
      endStr = `${nextProps.prefix}_end`;
    }

    if ('value' in nextProps) {
      let start = null;
      let end = null;
      if (_.get(nextProps, `value.${startStr}`)) {
        start = moment(_.get(nextProps, `value.${startStr}`));
        if (!start.isValid()) {
          start = null;
        }
      }
      if (_.get(nextProps, `value.${endStr}`)) {
        end = moment(_.get(nextProps, `value.${endStr}`));
        if (!end.isValid()) {
          end = null;
        }
      }
      return { [startStr]: start, [endStr]: end };
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.format = this.props.format || 'YYYY-MM-DD';
    this.prefix = this.props.prefix || undefined;
    this.start = 'start';
    this.end = 'end';
    if (this.prefix) {
      this.start = `${this.prefix}_start`;
      this.end = `${this.prefix}_end`;
    }
    this.state = {
      [this.start]: null,
      [this.end]: null,
      endOpen: false,
    };
    debugAdd('data_range', this);
  }

  onChange = (field, value) => {
    const formatValue = value && value.format ? moment(value.format(this.format)) : null;
    this.setState({
      [field]: formatValue,
    });

    const onChange = this.props.onChange;
    if ('function' === typeof onChange) {
      onChange({
        [this.start]: this.state[this.start],
        [this.end]: this.state[this.end],
        [field]: formatValue,
      });
    }
  }

  onStartChange = (value) => {
    this.onChange(this.start, value);
  }

  onEndChange = (value) => {
    this.onChange(this.end, value);
  }

  disabledStartDate = (start) => {
    const end = this.state[this.end];
    if (!start || !end) {
      return false;
    }
    return start.valueOf() > end.valueOf();
  }

  disabledEndDate = (end) => {
    const start = this.state[this.start];
    if (!end || !start) {
      return false;
    }
    // 时间可以选择当天
    return end.valueOf() <= (start.valueOf() - 24 * 60 * 60);
  }

  handleStartOpenChange = (open) => {
    if (!open) {
      this.setState({ endOpen: true });
    }
  }

  handleEndOpenChange = (open) => {
    this.setState({ endOpen: open });
  }

  render() {
    const startOption = {
      disabledDate: this.disabledStartDate,
      format: this.props.format,
      disabled: this.props.startDisabled,
      value: this.state[this.start],
      placeholder: '开始时间',
      onChange: this.onStartChange,
      onOpenChange: this.handleStartOpenChange,
      showTime: this.props.showTime,
      allowClear: this.props.allowClear,
    };

    const endOption = {
      disabledDate: this.disabledEndDate,
      format: this.props.format,
      disabled: this.props.endDisabled,
      value: this.state[this.end],
      placeholder: '结束时间',
      onChange: this.onEndChange,
      open: this.state.endOpen,
      onOpenChange: this.handleEndOpenChange,
      showTime: this.props.showTime,
      allowClear: this.props.allowClear,
    };
    const size = this.props.size || 'default';
    return (
      <div className={styles.dateranger} >
        <DatePicker size={size} {...startOption} showTime={this.props.showTime} />
        <DatePicker size={size} {...endOption} showTime={this.props.showTime} />
      </div>
    );
  }
}
