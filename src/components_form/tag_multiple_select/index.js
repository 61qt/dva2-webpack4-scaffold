import React from 'react';
import Tag from '@/components_form/tag';
// import MultipleSelect from '@/components_form/user_role_select';
import { Select, Spin } from 'antd';
import styles from './index.less';


export class CustomSelect extends React.Component {
  static defaultProps = {
    options: [],
  }
  render() {
    return (
      <Select {...this.props}>
        {_.map(this.props.options, (ele) => {
          return <Select.Option key={`${ele.value}_item`} value={ele.value}>{ele.label}</Select.Option>;
        })}
      </Select>
    );
  }
}
export default class TagMultipleSelect extends React.Component {
  static defaultProps = {
    getInitValue: item => item,
    options: [],
    dataSource: [],
    allowClear: true,
    mode: 'multiple',
    selectWrapStyle: {},
  }

  static getDerivedStateFromProps=(nextProps, { hashValue, options }) => {
    const newState = {};
    if (!_.isEqual(nextProps.value, hashValue)) {
      newState.hashValue = nextProps.value;
    }
    if (!_.isEqual(nextProps.options, options)) {
      newState.options = nextProps.options;
      newState.currentTag = _.get(nextProps.options, '0.value');
    }
    return newState;
  }

  constructor(props) {
    super(props);
    this.state = {
      currentTag: _.get(props.options, '0.value'),
      hashValue: props.initialValue || props.value || {},
      options: props.options || [],
    };
  }


  componentDidMount = () => {

  }

  getValue=(key) => {
    const { hashValue = {} } = this.state;
    return hashValue[key];
  }

  setCurrentTag=(value) => {
    this.setState({ currentTag: value });
  }

  setValue = (key, value) => {
    const { onChange } = this.props;
    const { hashValue = {} } = this.state;
    const newValue = { ...hashValue, [key]: value };
    if ('function' === typeof onChange) {
      onChange(newValue);
    }
    else {
      this.setState({ hashValue: newValue });
    }
  }


  handleTagChange=(value) => {
    this.setState({ currentTag: value });
  }

  handleSelect=(key, value) => {
    const { mode } = this.props;
    const { hashValue = {} } = this.state;
    let currentValue = hashValue[key];
    // 这里没有实现单选逻辑
    if ('multiple' === mode) {
      if (currentValue) {
        currentValue.push(value);
      }
      else {
        currentValue = [value];
      }
      this.setValue(key, currentValue);
    }
  }

  handleDeselect=(key, value) => {
    const { mode } = this.props;
    const { hashValue = {} } = this.state;
    const currentValue = hashValue[key];
    // 这里没有实现单选逻辑
    if ('multiple' === mode) {
      const idx = (currentValue || []).findIndex(item => item === value);
      if (0 <= idx) {
        currentValue.splice(idx, 1);
        this.setValue(key, currentValue);
      }
    }
  }

  handleChange=(key, value) => {
    const { mode, allowClear } = this.props;
    if ('multiple' === mode) {
      if (!value.length && allowClear) {
        this.setValue(key, []);
      }
    }
  }


  render() {
    const { currentTag, options } = this.state;
    const { dataSource, mode, allowClear, dataSourceLoading, selectWrapStyle, filterOption } = this.props;
    return (<div>
      <Spin spinning={this.props.loading}>
        <Tag tags={options} value={currentTag} onChange={this.handleTagChange} allowClear={false} />
        <div style={selectWrapStyle}>
          {
          _.map(options, (item) => {
            return (<div className={styles.item} key={item.value} style={{ display: item.value === currentTag ? 'block' : 'none' }} >
              {
                _.map(item.children, (elem) => {
                  const keyString = `${_.get(item, 'value')}-${_.get(elem, 'value')}`;
                  let currentDataSource = [];
                  if ('function' === typeof dataSource) {
                    currentDataSource = dataSource(item.value, elem.value);
                  }
                  else {
                    currentDataSource = dataSource;
                  }
                  return (<div className={styles.selectItem} key={keyString}>
                    <div className={styles.selectLabel}>{elem.label}：</div>
                    <div className={styles.selectValue}>
                      <CustomSelect
                        mode={mode}
                        filterOption={filterOption}
                        loading={dataSourceLoading}
                        allowClear={allowClear}
                        value={this.getValue(keyString)}
                        onChange={this.handleChange.bind(this, keyString)}
                        onDeselect={this.handleDeselect.bind(this, keyString)}
                        onSelect={this.handleSelect.bind(this, keyString)}
                        options={currentDataSource}
                        key={elem.value} />
                    </div>
                  </div>);
                })
              }
            </div>);
          })
        }

        </div>
      </Spin>
    </div>);
  }
}
