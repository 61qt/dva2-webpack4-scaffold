import _ from 'lodash';
import { Select, Input, DatePicker } from 'antd';
import ComponentsForm from '../../components_form';
import Filters from '../../filters';

// dynamicProps { areaParentId({ form }) { form.getFieldValue('___city_id') * 1 || undefined; } }
// eslint-disable-next-line no-unused-vars
function dynamicRenerProps({ elem, form, props }) {
  const dynamicProps = _.get(elem, 'dynamicProps', {});
  const finalProps = { ...props };
  _.each(_.entries(dynamicProps), ([key, propsFunc]) => {
    if (_.isFunction(propsFunc)) {
      finalProps[key] = propsFunc({ elem, form, props });
    }
  });

  return finalProps;
}

// 配置类型工厂对象，新增类型直接在对象里面按照 { newType: { getComponent({ elem, defaultProps })} }}
const typeCmpFactory = {
  select: {
    getComponent({ elem, defaultProps }) {
      // const props = _.defaults(dynamicRenerProps({ elem, defaultProps, form }), {
      //   placeholder: `请选择${elem.label}`,
      //   allowClear: true,
      // });
      const props = _.defaults(defaultProps, {
        placeholder: '请选择',
        allowClear: true,
      });

      const dictPathArray = _.split(elem.dict, '.');
      return (
        <Select {...props}>
          {Filters.dict(dictPathArray).map((option) => {
            return (
              <Select.Option
                value={option.value}
                key={`${elem.dataIndex}_${option.value}`}>
                {option.label}
              </Select.Option>
            );
          })}
        </Select>
      );
    },
  },

  foreign: {
    getComponent({ elem, defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请选择',
        table: elem.table,
        allowClear: true,
      });
      return <ComponentsForm.ForeignSelectGraphql {...props} />;
    },
  },

  date_range: {
    getComponent({ defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请选择',
        allowClear: true,
      });
      return <ComponentsForm.DateRange {...props} />;
    },
  },

  number_range: {
    getComponent({ defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请输入',
        allowClear: true,
      });
      return <ComponentsForm.NumberRange {...props} />;
    },
  },

  area: {
    getComponent({ elem, defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请选择',
        allowClear: true,
      });
      if (elem.pid) {
        props.areaParentId = elem.pid;
      }
      return <ComponentsForm.AreaSelect {...props} />;
    },
  },

  date: {
    getComponent({ elem, defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请选择',
        allowClear: true,
        format: elem.format || undefined,
      });

      // 这个只是创建之后的使用示例，在实际中，需要自动创建 render 属性给该搜索条件。
      const showTime = /H/.test(props.format) && /m/.test(props.format);

      const showDay = /D/.test(props.format);

      if (!showDay) {
        return (<DatePicker.MonthPicker {...props} showTime={showTime} />);
      }

      return (<DatePicker {...props} showTime={showTime} />);
    },
  },

  year: {
    getComponent({ defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请选择',
        allowClear: true,
      });

      return <ComponentsForm.Year {...props} />;
    },
  },

  input: {
    getComponent({ defaultProps }) {
      const props = _.defaults(defaultProps, {
        placeholder: '请输入',
        // allowClear: true,
      });
      return <Input autoComplete="off" {...props} />;
    },
  },
};

/**
 * @param {{
 *   type: keyof typeCmpFactory,
 *   dataIndex: string,
 *   props: {},
 *   label: string,
 *   dict?: string
 *   table?: string,
 *   } elem
 */
export default function getSearchColumnComponent(elem = {}) {
  const props = _.get(elem, 'props', {});
  const defaultProps = _.defaults(props, {
    size: 'small',
  });

  const type = elem.type || 'input';
  const cmpFactory = _.get(typeCmpFactory, type);

  return cmpFactory.getComponent({ elem, defaultProps });
}
