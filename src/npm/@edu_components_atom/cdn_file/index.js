import React from 'react';
// import _ from 'lodash';
import { connect } from 'dva';

import Filters from '@/filters';

@connect(() => {
  return {
  };
})
export default class Component extends React.PureComponent {
  static defaultProps = {
    href: '',
    alt: '',
    className: '',
    style: {},
    type: 'image',
    isDownload: false,
  }

  constructor(props) {
    super(props);

    debugAdd('cdn_file', this);
  }


  render() {
    const href = Filters.cdnFile(this.props.href);
    const fullHref = this.props.isDownload && this.props.href ? href.replace('?rename=', '?filename=') : href;
    if (!this.props.href) {
      return (<span />);
    }
    return (<span key={fullHref} style={{ marginBottom: '1em', display: 'inline-block' }}>
      <div>
        { 'image' === this.props.type ? (<img style={{ ...this.props.style }} alt={this.props.alt} className={this.props.className} src={fullHref} />) : (<span>{ fullHref }</span>) }
      </div>
      <a className="ant-form-extra" target="_blank" href={fullHref}>查看{'image' === this.props.type ? '大图' : '文件'}</a>
    </span>);
  }
}
