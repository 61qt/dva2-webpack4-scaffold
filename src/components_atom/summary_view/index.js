import React from 'react';
import _ from 'lodash';
import { Spin } from 'antd';

import styles from './index.less';

export default class Component extends React.PureComponent {
  static defaultProps = {
    // 数据源
    dataSource: {},
    // 需要展示的列的数组
    columns: [],
    // 标题
    title: '统计汇总',
    // loading
    loading: false,
    // className
    className: '',
  };

  constructor(props) {
    super(props);

    debugAdd('detail_view', this);
  }

  render() {
    const { dataSource, columns, title, loading = false, className } = this.props;
    let titleElem = title;
    if ('function' === typeof title) {
      titleElem = title();
    }

    return (
      <Spin spinning={loading}>
        <div className={styles.normal}>
          <div className={className}>
            <div className={styles.header}>
              { titleElem }
            </div>
            <div className={styles.content}>
              <table className={styles.scrollBar}>
                <tbody>
                  <tr>
                    {
                      columns.map((elem, index) => {
                        const text = _.get(dataSource, elem.dataIndex);
                        return (<td style={{ width: elem.width }} className={styles.summaryItem} key={elem.key || index}>
                          <div className="sum-item">
                            <div className="sum-item-desc">
                              { elem.title }
                            </div>
                            <div className={`sum-item-value ${elem.valueClassName}`}>
                              { elem.render ? elem.render(text, dataSource) : text }
                            </div>
                          </div>
                        </td>);
                      })
                    }
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Spin>
    );
  }
}
