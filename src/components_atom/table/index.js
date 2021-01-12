import React from 'react';
import _ from 'lodash';
import { Table } from 'antd';
import jQuery from 'jquery';
import './index.less';

let headerHeight = jQuery('.globalHeader').outerHeight() || 52;

export default class Component extends React.PureComponent {
  static defaultProps = {
    scrollWarpper: '.ant-layout',
    // autoFixed: true,
    // 是否自动固定 thead
    autoFixed: false,
    // 默认不检查 minWidth 的配置、
    forceNoMinWidth: false,

    // 是不是行内的 table ，如果是，那就开启 scroll.y
    inlineTable: false,
    scroll: {},
  }

  constructor(props) {
    super(props);
    headerHeight = jQuery('.globalHeader').outerHeight() || 52;
    debugAdd('table', this);
    if (!this.isMobile) {
      if (window.navigator && window.navigator.userAgent) {
        this.isMobile = -1 < window.navigator.userAgent.toLocaleLowerCase().indexOf('mobile');
      }
    }
    if (!this.isMobile) {
      this.isMobile = 660 > window.innerWidth;
    }
  }

  componentWillMount = () => {
    headerHeight = jQuery('.globalHeader').outerHeight() || 52;
  }

  componentDidMount() {
    debugAdd('table', this);
    if (!_.get(this.props, 'scroll.y')) {
      return;
    }
    if (this.props.autoFixed && !this.isMobile) {
      jQuery(this.props.scrollWarpper).on('scroll', this.detectScroll);
      this.getInitElem();
    }
  }

  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(nextProps, this.props)) {
      if (this.props.autoFixed && !this.isMobile) {
        this.getInitElem();
      }
    }
  }

  componentWillUnmount = () => {
    if (this.props.autoFixed && !this.isMobile) {
      jQuery(this.props.scrollWarpper).off('scroll', this.detectScroll);
    }
  }

  getInitElem = () => {
    this.wrapper = jQuery('.ant-table-content', this.container);
    this.wrapper.addClass('sticky-table');
    this.header = jQuery('.ant-table-header', this.container);
    this.body = jQuery('.ant-table-body, .ant-table-body-inner', this.container);
    this.footer = jQuery('.ant-table-footer', this.container);
    // this.fixHeader = jQuery('.ant-table-fixed-left .ant-table-header, .ant-table-fixed-right .ant-table-header', this.container);

    this.header.css({
      overflowY: 'auto',
    });
    this.wrapper.addClass('sticky-table');
  }

  detectScroll = (e) => {
    const table = this;
    table.target = e.target;
    table.e = e;
    if (!table.body || !table.body.length) {
      return table.getInitElem();
    }

    if (!table.body.is(':visible')) {
      return;
    }

    // if (!this.fixHeader.length) {
    //   this.fixHeader = jQuery('.ant-table-fixed-left .ant-table-header, .ant-table-fixed-right .ant-table-header', this.container);
    // }

    if (!this.initHeaderWidth) {
      this.initHeaderWidth = true;
      const width = jQuery('.ant-table-content .ant-table-body', this.container).outerWidth();
      // this.headerWidth = width;
      // this.tableHeaderWidth = jQuery('.ant-table-scroll .ant-table-header .ant-table-fixed', this.container).outerWidth();
      jQuery('.ant-table-scroll .ant-table-header', this.container).css({
        width,
      });
      table.footer.css({
        width,
      });
    }

    const topEdge = table.wrapper.offset().top - headerHeight;
    // const bottomEdge = (table.footer.outerHeight() * 2) + (topEdge + table.wrapper.outerHeight()) + table.header.outerHeight();
    // const scrollTop = jQuery(e.target).scrollTop();

    // window.console.log('scrollTop', scrollTop, 'topEdge', topEdge, 'bottomEdge', bottomEdge);
    // if (0 < topEdge || window.innerHeight > (table.wrapper.outerHeight() + topEdge) + table.footer.outerHeight()) {
    if (0 < topEdge || this.header.outerHeight() > (table.wrapper.outerHeight() + topEdge) + table.footer.outerHeight()) {
      // 非固定模式
      table.body.css('padding-top', '');
      table.header.removeClass('sticky-header').css({
        position: 'static',
      });
      table.footer.parent().css('padding-bottom', '');
      table.footer.css({
        position: 'static',
      });

      // this.fixHeader.css({
      //   overflowX: 'auto',
      // });
    }
    else {
      table.body.css('padding-top', table.header.outerHeight());

      // if (this.headerWidth < this.tableHeaderWidth) {
      //   this.fixHeader.css({
      //     overflowX: 'scroll',
      //   });
      // }
      // else {
      //   this.fixHeader.css({
      //     overflowX: 'auto',
      //   });
      // }

      table.header.addClass('sticky-header').css({
        position: 'fixed',
        top: headerHeight,
        zIndex: 1000,
      });

      table.footer.parent().css('padding-bottom', table.header.outerHeight());
      table.footer.css({
        position: 'fixed',
        bottom: 0,
        zIndex: 1000,
      });
    }
  };

  containerRef = (container) => {
    this.container = container;
  }

  render() {
    const columns = this.props.columns;
    const wrapperWidth = jQuery('.ant-table-content .ant-table-body', this.container).outerWidth();
    const scroll = {
      ...this.props.scroll,
      x: this.props.scroll.x > wrapperWidth ? this.props.scroll.x : wrapperWidth,
    };
    if (!this.props.inlineTable) {
      scroll.y = 'none';
    }

    if (this.isMobile) {
      delete scroll.y;
    }

    const key = `${window.innerWidth}`;

    const minWidthCol = [];
    const fixedCol = []; // 浮动的单元格
    _.each(columns, (elem) => {
      if ('minWidth' in elem || 'minLenght' in elem) {
        minWidthCol.push(elem);
      }
      if ('fixed' in elem) {
        fixedCol.push(elem);
      }
    });

    if (!this.props.forceNoMinWidth) {
      if (1 !== minWidthCol.length && window.console && window.console.error) {
        window.console.error('Table 组件必须传入一个存在属性为 minWidth 的 columns ，不能多不能少。');
      }

      if (__DEV__ && 1 !== minWidthCol.length && fixedCol.length) { // 如果没有fixed的话，就不提示minWidth
        return (<h1>minWidth 个数配置出错。</h1>);
      }
    }

    const props = {
      className: (this.props.autoFixed && !this.isMobile) ? 'sticky-table' : '',
      ...this.props,
      columns,
      size: this.props.size || 'small',
      scroll,
    };

    return (<div key={key} data-key={key} ref={this.containerRef}>
      <Table {...props} />
    </div>);
  }
}
