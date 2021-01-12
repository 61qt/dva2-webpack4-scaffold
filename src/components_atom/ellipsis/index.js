import React from 'react';
import styles from './index.less';

export default class Component extends React.PureComponent {
  static defaultProps = {
    // react props.children
    children: '',
    // container css
    style: {},
    width: '100%',
    line: 1,
    height: '1rem',
    className: '',
    // container css end
  }

  render() {
    const { style, children, width = '100%', line = 1, height = '1rem' } = this.props;
    return (<div
      {...this.props}
      className={`${styles.ellipsis} ${this.props.className}`}
      style={{
        ...style,
        lineClamp: line,
        WebkitLineClamp: line,
        width: style.width || width,
        height: style.height || height,
        WebkitBoxOrient: 'vertical' }}>{ children }</div>);
  }
}
