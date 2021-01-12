import _ from 'lodash';
import React from 'react';
// import { Button } from 'antd';
import buildColumnFormItem from '../../utils/build_column_form_item';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);

    // this.state = {
    //   dataSource: {},
    // };

    debugAdd('table_form', this);
  }

  // componentWillReceiveProps = (nextProps) => {

  // }

  getFormColumn = () => {
    const {
      leadKey = '', // { items: [] } items is leadKey
      columns = [],
      defaultValueSet = {},
      form,
    } = this.props;

    return _.map(defaultValueSet[leadKey] || [], (defaultValue, index) => {
      const formColumns = _.map(columns, (column) => {
        const tableColumn = {};
        tableColumn.title = column.title;
        tableColumn.dataIndex = `${leadKey}[${index}].${column.dataIndex}`;
        if (_.isFunction(column.render)) {
          tableColumn.render = () => {
            return column.render(index, defaultValue);
          };
        }

        return tableColumn;
      });

      return buildColumnFormItem({
        columns: formColumns,
        defaultValueSet,
        shouldInitialValue: true,
        // defaultValueSet: defaultValue,
        form,
        warpCol: false,
        label: false,
        size: this.props.size,
      });
    });
  }

  render() {
    const formColumns = this.getFormColumn();
    return (<div className="detail-view">
      <table>
        <thead>
          <tr>
            <td colSpan={_.get(this.props, 'columns.length')}>
              {/* <Button onClick={} type="primary" size={this.props.size || 'default'}>新增一项</Button> */}
            </td>
          </tr>
          <tr>
            {
              _.map(this.props.columns || [], (column, index) => {
                return (<td key={`${column.title}_${index}`}>{column.title}</td>);
              })
            }
          </tr>
        </thead>
        <tbody>
          {
            _.map(formColumns, (columns, columnsIndex) => {
              return (<tr key={`columnsIndex_${columnsIndex}`}>
                {
                  _.map(columns, (column, columnIndex) => {
                    return (<td key={`${columnsIndex}_${columnIndex}`}>
                      {
                        column.render()
                      }
                    </td>);
                  })
                }
              </tr>);
            })
          }
        </tbody>
      </table>
    </div>);
  }
}
