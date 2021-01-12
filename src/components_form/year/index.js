import moment from 'moment';
// import _ from 'lodash';
import { DatePicker } from 'antd';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    this.format = this.props.format || 'YYYY';

    let value;
    if (props.value && moment(props.value, this.format).isValid()) {
      value = moment(props.value, this.format);
    }
    this.state = {
      open: false,
      value,
    };
    debugAdd('year', this);
  }

  // 更新传输的 value
  componentWillReceiveProps = (nextProps) => {
    if ('value' in nextProps && nextProps.value !== this.props.value) {
      const options = {
        value: undefined,
      };
      if (moment(nextProps.value, this.format).isValid()) {
        options.value = moment(nextProps.value, this.format);
      }

      this.setState(options);
    }
  }

  onChange = (value) => {
    this.setState({
      value,
    });

    if ('function' === typeof this.props.onChange) {
      let formatValue = value;
      if (value && value.format) {
        formatValue = value.format(this.format) * 1 || value.format(this.format);
      }
      this.props.onChange(formatValue);
    }
  }

  toggleOpen = () => {
    this.setState({ open: !this.state.open });
  }

  handlePanelChange = (value) => {
    this.setState({
      value,
      open: false,
    });
    this.onChange(value);
  }

  render() {
    const size = this.props.size || 'default';
    return (<DatePicker
      {...this.props}
      value={this.state.value}
      onChange={this.onChange}
      open={this.state.open}
      onOpenChange={this.toggleOpen}
      onPanelChange={this.handlePanelChange}
      mode="year"
      format={this.format}
      size={size} />);
  }
}
