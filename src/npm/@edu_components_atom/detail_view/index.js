import React from 'react';
import _ from 'lodash';
import jQuery from 'jquery';
import { Spin, Icon } from 'antd';

import styles from './index.less';

class DetailRow extends React.PureComponent {
  static defaultProps = {
    col: 1,
    // 该字段从父级传输。
    currentExpand: 9999999,
    expand: 0,
    labelWidth: 0,
    // 数据源 [{}]
    dataSource: {},
    // 输入列描述项 [{}]
    columns: [],
    // (colElem) => string
    renderTitle: undefined,
    titleClassName: '',
    // 该字段从父级传输。
    toggleShowMore: undefined,
    className: '',
    title: null,

    // 表格是否有边框
    tableHasBorder: true,
    labelWidthCalculate: true,
  };

  constructor(props) {
    super(props);

    this.table = false;

    debugAdd('detail_view', this);
  }

  componentDidMount = () => {
    let flag = false;
    flag = this.countTdWidth();
    if (!flag) {
      setTimeout(() => {
        flag = this.countTdWidth();
        if (!flag) {
          setTimeout(() => {
            flag = this.countTdWidth();
            if (!flag) {
              setTimeout(() => {
                flag = this.countTdWidth();
              }, 2000);
            }
          }, 1000);
        }
      }, 500);
    }
    if ('function' === typeof this.props.getTdWidth) {
      this.props.getTdWidth(_.get(this.td, '0.scrollWidth'));
    }
  }

  // 设置宽度
  // eslint-disable-next-line react/sort-comp
  countTdWidth = () => {
    if (this.table && jQuery('.detail-view-label', jQuery('tr.detail-view-holder-tr', this.table)[0]).length) {
      // const totalWidth = jQuery(this.table).width();
      const labelWidth = jQuery(jQuery('.detail-view-label', jQuery('tr.detail-view-holder-tr', this.table)[0])[0]).width();
      const contentWidth = this.countFinialContentWidthFunc(labelWidth);

      // console.log('countTdWidth contentWidth', contentWidth, 'labelWidth', labelWidth, 'totalWidth', totalWidth);

      return this.setLabelContentWidth(labelWidth, contentWidth);
    }

    return false;
  }

  componentWillReceiveProps = (nextProps) => {
    if (this.table && nextProps.labelWidth !== this.props.labelWidth) {
      // const totalWidth = jQuery(this.table).width();
      const labelWidth = this.countFinialLabelWidthFunc(nextProps.labelWidth);

      const contentWidth = this.countFinialContentWidthFunc(labelWidth);

      // console.log('componentWillReceiveProps contentWidth', contentWidth, 'labelWidth', labelWidth, 'totalWidth', totalWidth);

      this.setLabelContentWidth(labelWidth, contentWidth);
    }
  }

  setLabelContentWidth = (labelWidth, contentWidth) => {
    if (_.get(jQuery('.detail-view-label', jQuery('tr.detail-view-holder-tr', this.table)[0]), 'length')) {
      if (this.props.labelWidthCalculate) {
        jQuery('.detail-view-label', jQuery('tr.detail-view-holder-tr', this.table)[0]).each((index, elem) => {
          jQuery(elem).width(labelWidth);
        });
        jQuery('.detail-view-content', jQuery('tr.detail-view-holder-tr', this.table)[0]).each((index, elem) => {
          jQuery(elem).width(contentWidth);
        });
      }
      else {
        jQuery('.detail-view-label', jQuery('tr.detail-view-holder-tr', this.table)[0]).each((index, elem) => {
          jQuery(elem).width(0);
        });
        jQuery('.detail-view-content', jQuery('tr.detail-view-holder-tr', this.table)[0]).each((index, elem) => {
          jQuery(elem).width('100%');
        });
      }
      return true;
    }

    return false;
  }

  // eslint-disable-next-line react/sort-comp
  countFinialLabelWidthFunc = (labelWidth) => {
    const fontSize = (1 * parseInt(jQuery('.detail-view-label').css('fontSize'), 10)) || 14;
    let countFinialLabelWidth = 0;
    if (1 * _.replace(labelWidth, 'px', '')) {
      countFinialLabelWidth = 1 * _.replace(labelWidth, 'px', '');
    }
    else if (_.endsWith(labelWidth, 'em')) {
      countFinialLabelWidth = fontSize * (1 * _.replace(labelWidth, 'px', ''));
    }
    else if (_.includes([`${labelWidth || ''}`, labelWidth], labelWidth * 1)) {
      countFinialLabelWidth = 1 * labelWidth;
    }

    return countFinialLabelWidth;
  }

  countFinialContentWidthFunc = (labelWidth) => {
    const totalWidth = jQuery(this.table).width();
    const contentWidth = totalWidth / this.props.col - labelWidth;

    return contentWidth;
  }

  componentWillUnmount = () => {}

  getValue = (elem, dataSource) => {
    const text = _.get(dataSource, elem.dataIndex);
    return 'function' === typeof elem.render ? elem.render(text, dataSource) : text;
  }

  getRows = (col = this.props.col) => {
    const dataSource = this.props.dataSource;
    const hiddenColumn = [];
    const showColumn = [];
    _.filter(this.props.columns, (elem) => {
      const text = _.get(dataSource, elem.dataIndex);

      const removeRule = elem.removeRule;
      let rowIsRemove = false;
      if ('boolean' === typeof removeRule) {
        rowIsRemove = removeRule;
      }
      else if ('function' === typeof removeRule) {
        rowIsRemove = removeRule(text, dataSource);
      }

      const hiddenRule = elem.hiddenRule;
      let rowIsHide = false;
      if ('boolean' === typeof hiddenRule) {
        rowIsHide = hiddenRule;
      }
      else if ('function' === typeof hiddenRule) {
        rowIsHide = hiddenRule(text, dataSource);
      }

      if (rowIsHide) {
        hiddenColumn.push(elem);
      }
      else if (!rowIsRemove) {
        showColumn.push(elem);
      }
      else {
        // 隐藏了的 elem 。
      }
    });

    const tableColumns = [];
    let columnsIndex = 0;
    let rowColSum = 0;
    const eachRowMaxColSave = {};
    // 初始化创建一个一维数组，存储每一列的长度。
    _.each(showColumn, (elem, index) => {
      eachRowMaxColSave[index] = col * 2;
    });

    // 计算每一列。保存应该存储的 elem 。到时候渲染直接通过 elem 来渲染。
    // let rowColSpanTotal = 0;
    _.each(showColumn, (elem) => {
      tableColumns[columnsIndex] = tableColumns[columnsIndex] || [];
      const colSpan = elem.colSpan || 1;
      let rowSpan = elem.rowSpan || 1;
      let titleSpan = 1;
      if (null === elem.title) {
        titleSpan = 0;
      }

      // if (rowColSpanTotal + 1 + colSpan > eachRowMaxColSave[columnsIndex]) {
      //   colSpan = eachRowMaxColSave[columnsIndex] - rowColSpanTotal - 1;
      // }
      if (colSpan + titleSpan >= col * 2) {
        rowSpan = 1;
      }
      if (rowColSum + titleSpan + colSpan > eachRowMaxColSave[columnsIndex]) {
        columnsIndex += 1;
        rowColSum = titleSpan + colSpan;
        // rowColSpanTotal = 0;
      }
      else {
        rowColSum += titleSpan + colSpan;
      }

      // rowColSpanTotal += colSpan + titleSpan;
      tableColumns[columnsIndex] = tableColumns[columnsIndex] || [];
      tableColumns[columnsIndex].push({
        ...elem,
        colSpan,
        rowSpan,
      });
      if (1 < rowSpan) {
        do {
          const rowIndex = columnsIndex + rowSpan - 1;
          eachRowMaxColSave[rowIndex] -= 2 * colSpan;
          rowSpan -= 1;
        }
        while (1 < rowSpan);
      }
    });
    if (this.props.console) {
      window.console.clear();
      window.console.log('tableColumns', tableColumns, 'eachRowMaxColSave', eachRowMaxColSave);
    }

    // 展开了的列
    const expandColumn = _.filter(tableColumns, (elem, index) => {
      return index < this.props.currentExpand;
    });

    const renderTitle = this.props.renderTitle || function renderTitle(elem) {
      return elem.title;
    };

    // 渲染已经展开的列。
    const trArr = expandColumn.map((rowElem, rowIndex) => {
      const tdArr = [];
      let colSpanLength = 0;
      _.each(rowElem, (colElem) => {
        colSpanLength += (colElem.colSpan + 1);
        if (null !== colElem.title) {
          tdArr.push(<td className={`detail-view-cell detail-view-label ${colElem.className || ''} ${this.props.titleClassName || ''}`} rowSpan={colElem.rowSpan} key={`${rowIndex}_${colSpanLength}_1`} style={{ ...this.buildLabelStyle(), ...colElem.style }}>{renderTitle(colElem)}</td>);
        }
        tdArr.push(<td className={`detail-view-cell detail-view-content ${colElem.className}`} style={{ ...colElem.style }} rowSpan={colElem.rowSpan} key={`${rowIndex}_${colSpanLength}_2`} colSpan={colElem.colSpan}>{this.getValue(colElem, dataSource)}</td>);
      });

      while (eachRowMaxColSave[rowIndex] > colSpanLength) {
        // colSpanLength += 1;
        // tdArr.push(<td key={`${rowIndex}_${colSpanLength}`} />);
        colSpanLength += 1;
        tdArr.push(<td className="detail-view-cell detail-view-empty" colSpan="1" key={`${rowIndex}_${colSpanLength}`} />);
      }
      return (<tr key={rowIndex}>
        { tdArr }
      </tr>);
    });
    if (hiddenColumn && hiddenColumn.length) {
      trArr.push(<tr key="hiddenColumn" className="ant-hide">
        <td className="detail-view-cell">
          {
            _.map(hiddenColumn, (elem) => {
              return this.getValue(elem, dataSource);
            })
          }
        </td>
      </tr>);
    }
    return trArr;
  }

  getShowMoreRow = () => {
    const { columns, expand, currentExpand, col } = this.props;
    if (!expand || expand >= columns.length) {
      return null;
    }

    const expandFlag = currentExpand >= columns.length;

    return (
      <tr key="expand" >
        <td className="detail-view-cell" style={this.buildLabelStyle()}>更多信息</td>
        <td className="detail-view-cell" onClick={this.props.toggleShowMore}>
          <a>
            { expandFlag ? '收起' : '展开' } <Icon type={expandFlag ? 'up' : 'down'} />
          </a>
        </td>
        {
          1 < col ? (<td className="detail-view-cell detail-view-empty" colSpan={2 * (col - 1)} />) : null
        }
      </tr>
    );
  }

  buildLabelStyle = () => {
    if (!this.props.labelWidthCalculate) {
      return {
        width: '0px',
      };
    }

    if (this.labelStyles) {
      return this.labelStyles;
    }
    let labelWidth = this.props.labelWidth;
    if (undefined === labelWidth) {
      this.labelStyles = {};
    }
    const labelStyles = {};
    if (`${labelWidth * 1}` === labelWidth) {
      labelWidth = `${labelWidth}px`;
    }

    labelStyles.width = labelWidth;

    this.labelStyles = labelStyles;
    return labelStyles;
  }

  tdRef = (index, td) => {
    this.td = this.td || [];
    this.td[index] = td;
  }

  tableRef = (table) => {
    // window.console.log('table', table);
    this.table = table;
  }

  render() {
    const { title, col } = this.props;
    const tableStyle = {};
    tableStyle.width = '100%';
    if (!title) {
      tableStyle.borderTop = '0';
    }

    return (
      <div className={styles.normal}>
        <div className={`detail-view ${this.props.className || ''}`}>
          <table
            ref={this.tableRef}
            className={`detail-view-table ${this.props.tableHasBorder ? '' : 'table-no-border'} ${this.props.labelWidthCalculate ? '' : 'table-no-calculate-label-witdh'}`}
            style={tableStyle}>
            {
              title ? (<thead>
                <tr>
                  <th className="detail-view-cell" colSpan={2 * col}>
                    { title }
                  </th>
                </tr>
              </thead>) : null
            }
            <tbody>
              <tr className="detail-view-holder-tr">
                {
                  _.map(_.range(0, 2 * this.props.col), (index) => {
                    return (<td className={index % 2 ? 'detail-view-cell detail-view-content' : 'detail-view-cell detail-view-label'} key={index} ref={this.tdRef.bind(this, index)} />);
                  })
                }
              </tr>
              { this.getRows() }
              { this.getShowMoreRow() }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default class Component extends React.PureComponent {
  static defaultProps = {
    expand: 0,
    defaultExpand: 99999,
    columns: [],
    loading: false,
    className: '',
  }

  constructor(props) {
    super(props);
    this.state = {
      currentExpand: 99999,
    };
    debugAdd('detail_view', this);
  }

  componentWillMount = () => {
    const { expand, columns, defaultExpand } = this.props;
    let currentExpand = expand * 1 || columns.length;
    if (defaultExpand) {
      currentExpand = columns.length;
    }
    this.setState({
      currentExpand,
    });
  }

  componentWillReceiveProps = (nextProps) => {
    const { columns } = nextProps;
    this.setState({
      currentExpand: columns.length,
    });
  }

  toggleShowMore = () => {
    const { columns, expand } = this.props;
    const currentExpand = this.state.currentExpand === columns.length
      ? expand : columns.length;
    this.setState({
      currentExpand,
    });
  }

  render() {
    const { loading = false, className } = this.props;

    return (
      <Spin spinning={loading}>
        <div>
          <div className={className}>
            <DetailRow
              {...this.props}
              currentExpand={this.state.currentExpand}
              toggleShowMore={this.toggleShowMore} />
          </div>
        </div>
      </Spin>
    );
  }
}
