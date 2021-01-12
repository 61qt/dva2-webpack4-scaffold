import React from 'react';
import _ from 'lodash';
import jQuery from 'jquery';

import './index.less';

let appendedFlag = false;
let svgTimeoutSave;
let svgLink = '';
const attr = 'xlink:href';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    debugAdd('svg', this);
  }

  replaceUse = () => {
    jQuery('svg use.react-use').each((index, elem) => {
      const $elem = jQuery(elem);
      const $elemLink = `${$elem.attr(attr) || ''}`;
      if ($elemLink.startsWith(svgLink)) {
        const id = $elemLink.replace(/^.+?(#.+)-usage$/, '$1');
        $elem.removeClass('react-use');
        $elem.attr(attr, id);
      }
    });
  }

  ie = () => {
    if (-1 < `${_.get(window, 'navigator.userAgent') || ''}`.indexOf('Trident') && 0 < jQuery('svg use.react-use').length) {
      svgLink = jQuery('svg use.react-use').eq(0).attr(attr).replace(/#.+$/, '');
      if (appendedFlag) {
        this.replaceUse();
      }
      else {
        jQuery.get(svgLink, '', '', 'text').then((res) => {
          jQuery('body').prepend(res);
          appendedFlag = true;
          this.replaceUse();
        });
      }
    }
  }

  render() {
    let link = this.props.link;
    if (link.default) {
      link = link.default;
    }

    if (svgTimeoutSave) {
      clearTimeout(svgTimeoutSave);
    }

    svgTimeoutSave = setTimeout(() => {
      this.ie();
    }, 1000);

    const otherProps = {
      ...this.props,
    };
    delete otherProps.link;
    delete otherProps.style;
    delete otherProps.className;

    return (<svg {...otherProps} className={`svg ${this.props.className || ''}`} style={this.props.style}>
      <use className="react-use" xlinkHref={`${link.url || link.id}`} />
    </svg>);
  }
}
