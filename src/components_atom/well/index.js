import React, { useMemo } from 'react';
import { Spin } from 'antd';

import { renderEmpty } from '@/modules/default/router_config_factory';
import { computedColumnWidth } from '@/components_default/page_list/_util';
import styles from './index.less';

export function WellTable({ columns = [], dataSource }) {
  if (_.isEmpty(dataSource)) {
    return renderEmpty();
  }

  const tableColumns = useMemo(() => {
    return computedColumnWidth(columns);
    // 通过数组长度缓存当前计算值
  }, [columns.length]);
  return (<div className={styles.wellTableWrapper}>
    <table className={`table table-bordered ${styles.wellTable}`}>
      <colgroup>
        {
          _.map(tableColumns, (col, index) => {
            const props = {
              key: `col_${index}`,
            };
            if (!col.minWidth) {
              props.style = _.pick(col, ['width']);
              props.style.minWidth = col.width;
            }
            return (<col {...props} />);
          })
        }
      </colgroup>
      <thead>
        <tr>
          {_.map(tableColumns, (col, index) => {
            return (<th key={`${col.title}_${index}`} className={styles.wellTableTh}>{col.title}</th>);
          })}
        </tr>
      </thead>
      <tbody>
        {
          _.map(dataSource, (data = {}, index) => {
            return (<tr key={`${data.id}_${index}`}>
              {
                _.map(tableColumns, (col, colIndex) => {
                  return (<td key={`${col.dataIndex}_${colIndex}`} className={styles.wellTableTd}>{data[col.dataIndex] || ''}</td>);
                })
              }
            </tr>);
          })
        }
      </tbody>
    </table>
  </div>);
}

export default class Component extends React.PureComponent {
  state = {}

  render() {
    const {
      holderplace = false,
      loading = false,
      title = '',
      footer = '',
      children = null,
      className = '',
      free,
    } = this.props;

    return (
      <Spin spinning={loading}>
        <div className={`${holderplace ? 'well hidden-border' : ''} ${className}`}>
          <div className={`${styles.normal} well-content-warper`}>
            { title ? (<div className={`${styles.title} well-title`}>{title}</div>) : null }
            <div className={`${styles.content} well-content ${free ? styles.free : ''}`}>{children}</div>
            { footer ? (<div className={`${styles.footer} well-footer`}>{footer}</div>) : null }
          </div>
        </div>
      </Spin>
    );
  }
}
