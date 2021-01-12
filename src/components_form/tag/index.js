import _ from 'lodash';
import React from 'react';
import { Badge, Tag } from 'antd';

import styles from './index.less';

export default class Component extends React.PureComponent {
  static defaultProps = {
    multiple: false, // todo: 多选模式
    tags: [],
    allowClear: true,
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedTags: this.formatValue(props.value),
    };
    debugAdd('tag', this);
  }

  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(_.get(nextProps, 'value'), _.get(this.props, 'value'))) {
      this.setState({
        selectedTags: this.formatValue(nextProps.value),
      });
    }
  }

  formatValue = (value) => {
    if ('' !== value) {
      if (_.isArray(value)) {
        return value;
      }
      else {
        return [value];
      }
    }
    else {
      return [];
    }
  }

  handleChange = (tagValue, checked) => {
    let selectedTags;
    if (this.props.allowClear) {
      if (checked) {
        selectedTags = [tagValue];
      }
      else {
        selectedTags = [];
      }
    }
    else {
      selectedTags = [tagValue];
    }

    this.setState({
      selectedTags,
    });

    if (_.isFunction(this.props.onChange)) {
      this.props.onChange(_.first(selectedTags));
    }
  }

  handleCheckableTagChange = (tagValue) => {
    return (checked) => {
      return this.handleChange(tagValue, checked);
    };
  }

  render() {
    const tags = this.props.tags || [];
    const selectedTags = this.state.selectedTags;
    return (<span className={styles.tagContainer}>
      {_.map(tags, (tag) => {
        return (<Badge count={tag.count || 0} dot offset={[-14, 5.4]} key={`${_.get(tag, 'value')}`}>
          <Tag.CheckableTag
            key={tag.value}
            checked={selectedTags.includes(tag.value)}
            onChange={this.handleCheckableTagChange(tag.value)}>
            {tag.label}
          </Tag.CheckableTag>
        </Badge>);
      })
      }
    </span>);
  }
}
