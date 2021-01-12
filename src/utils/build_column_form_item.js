import React from 'react';
import _ from 'lodash';
import { Col, Form } from 'antd';
import NP from 'number-precision';
import CustomInput from '../components_form/input';
import InputNumber from '../components_form/input_number';

// formItemOptions

// 高级用法，嵌套
/*
  {
    title: '班级学段',
    dataIndex: 'edu_stage',
    col: 24, // 当前行的宽度
    contentCol: 8, // 当前 render 的宽度
    children: [
      {
        title: '年级',
        dataIndex: 'grade',
        col: 14,
      },
    ],
  },
*/

function buildColumnFormItem({
  columns = [],
  formValidate = {},
  defaultValueSet = {},
  shouldInitialValue = false,
  form,
  formItemLayout,
  col = 24,
  warpCol = true,
  label = true,
  autoAddDebugValue = false,
  size = 'default',
}) {
  const children = [];
  columns.forEach((elem) => {
    // 获取 elem 的配置。

    // 获取初始值，如果有特定的初始值初始化方法，就调用。
    let defaultValue = _.get(defaultValueSet, elem.dataIndex);
    if (elem.initialValue) {
      defaultValue = elem.initialValue(defaultValue, defaultValueSet, { form, text: defaultValue, dataSource: defaultValueSet, dataIndex: elem.dataIndex });
    }
    // 如果值为零，就是代表填写为空，后端存储的为 int 型造成
    else if (elem.zeroEmptyFlag && (0 === defaultValue || '0' === defaultValue)) {
      defaultValue = '';
    }

    // 判断是否应该移除
    let rowIsRemove = false;
    if ('boolean' === typeof elem.removeRule) {
      rowIsRemove = elem.removeRule;
    }
    else if ('function' === typeof elem.removeRule) {
      rowIsRemove = elem.removeRule(defaultValue, defaultValueSet, { form, dataSource: defaultValueSet, text: defaultValue });
    }

    if (rowIsRemove) {
      return null;
    }

    let elemTitle = elem.title;
    if ('function' === typeof elemTitle) {
      elemTitle = elemTitle(defaultValue, defaultValueSet, { form, dataSource: defaultValueSet, text: defaultValue });
    }

    // 判断是否为隐藏表单列。
    let rowIsHide = false;
    if ('boolean' === typeof elem.hiddenRule) {
      rowIsHide = elem.hiddenRule;
    }
    else if ('function' === typeof elem.hiddenRule) {
      rowIsHide = elem.hiddenRule(defaultValue, defaultValueSet, { form, dataSource: defaultValueSet, text: defaultValue });
    }
    // 生成 from 表单展示的内容，默认为 input ，如果配置了 render ，就调用 render(defaultValue); 如果没配置 render 但是配置了 inputNumberOptions ，就输出 InputNumber
    let elemRender = null;
    const key = elem.key || elem.dataIndex;
    if (elem.render) {
      elemRender = elem.render(defaultValue, defaultValueSet, {
        form,
        text: defaultValue,
        dataSource: defaultValueSet,
        dataIndex: elem.dataIndex,
        elem,
      }) || (<span key={key} />);
    }
    else if (elem.inputNumberOptions) {
      elemRender = (<InputNumber autoComplete="false" key={key} size={size} {...elem.props} {...elem.inputNumberOptions} disabled={elem.disabled} hidden={elem.hidden} placeholder={elem.placeholder || '请输入'} />);
    }
    else if (elem.isInputTextarea) {
      elemRender = (<CustomInput.TextArea autoComplete="false" key={key} size={size} {...elem.props} disabled={elem.disabled} hidden={elem.hidden} placeholder={elem.placeholder || '请输入'} />);
    }
    else {
      elemRender = (<CustomInput autoComplete="false" defaultValue={defaultValue} key={key} size={size} hidden={elem.hidden} disabled={elem.disabled} {...elem.props} placeholder={elem.placeholder || '请输入'} />);
    }

    // getFieldDecorator options
    const options = {
      initialValue: undefined,
      valuePropName: elem.valuePropName || 'value',
    };
    // 单个原始不允许设置成初始化。
    if (false === elem.shouldInitialValue) {
      // window.console.log('elem.shouldInitialValue false');
      options.initialValue = undefined;
    }
    // 单个原始允许设置成初始化。或者全部允许设置成初始化。
    else if (elem.shouldInitialValue || shouldInitialValue) {
      // window.console.log('elem.shouldInitialValue || shouldInitialValue true', options.initialValue);
      options.initialValue = defaultValue;
    }
    if (!options.initialValue && autoAddDebugValue && __DEV__) {
      if (elem.render) {
        // 不进行赋值
      }
      else if (elem.inputNumberOptions) {
        options.initialValue = 1;
      }
      else {
        options.initialValue = `${elem.title}测试`;
      }
    }

    if (elem.rules) {
      options.rules = _.concat([], elem.rules);
    }
    else {
      options.rules = [];
    }

    if (elem.inputNumberOptions) {
      if ('step' in elem.inputNumberOptions) {
        const stepRule = {};
        let times = 0;
        if (0 === elem.inputNumberOptions.step) {
          times = 0;
        }
        else {
          times = 1 / elem.inputNumberOptions.step;
        }
        let pow = 0;
        // eslint-disable-next-line no-restricted-properties
        while (Math.pow(10, pow) < times && 20 > pow) { // 避免死循环到100以上
          pow += 1;
        }
        stepRule.validator = (rule, value, callback) => {
          if (_.includes(['', null, undefined], value)) {
            return callback();
          }

          if (_.floor(NP.times(value, times)) !== _.ceil(NP.times(value, times))) {
            // eslint-disable-next-line no-useless-escape
            if (!/^-?[\d.]+$/.test(`${value}`)) {
              return callback('请填写数值');
            }

            if (0 === pow) {
              return callback('不能有小数');
            }
            else {
              return callback(`最多精确到${pow}位小数`);
            }
          }
          return callback();
        };
        options.rules = _.concat([], [stepRule], options.rules);
      }

      if ('max' in elem.inputNumberOptions) {
        const max = elem.inputNumberOptions.max;
        const maxRule = {};
        maxRule.validator = (rule, value, callback) => {
          if (_.includes(['', null, undefined], value)) {
            return callback();
          }
          if (value * 1 > max) {
            return callback(`最大为${max}`);
          }
          return callback();
        };
        options.rules = _.concat([], [maxRule], options.rules);
      }

      if ('min' in elem.inputNumberOptions) {
        const min = elem.inputNumberOptions.min;
        const minRule = {};
        minRule.validator = (rule, value, callback) => {
          if (_.includes(['', null, undefined], value)) {
            return callback();
          }
          if (value * 1 < min) {
            return callback(`最小为${min}`);
          }
          return callback();
        };
        options.rules = _.concat([], [minRule], options.rules);
      }
    }

    if (elem.validateTrigger) {
      options.validateTrigger = elem.validateTrigger;
    }
    const elemValidate = formValidate[elem.key || elem.dataIndex] || {};

    const formItemOptions = {
      className: elem.className,
      style: elem.style,
    };
    if (elem.extra) {
      formItemOptions.extra = elem.extra;
      if ('function' === typeof elem.extra) {
        formItemOptions.extra = elem.extra(defaultValue, defaultValueSet, { form, text: defaultValue, dataSource: defaultValueSet });
      }
    }

    const buildElemFormItemLayout = elem.formItemLayout || {
      ...formItemLayout,
    };
    let childrenColumn = [];
    if (elem.children) {
      childrenColumn = buildColumnFormItem({
        columns: elem.children,
        formValidate,
        defaultValueSet,
        shouldInitialValue,
        form,
        formItemLayout,
        col: elem.col || col,
        warpCol: false,
        label,
        size,
      });
    }

    // 渲染实际内容。
    const formItem = (<Form.Item key={key} {...formItemOptions} {...buildElemFormItemLayout} label={label ? elemTitle : ''} {...elemValidate} className={`${elem.className || ''} ${rowIsHide ? 'ant-hide' : ''}`}>

      {
        elem.col ? (<Col span={elem.contentCol}>
          { form.getFieldDecorator(elem.dataIndex, options)(elemRender) }
        </Col>) : form.getFieldDecorator(elem.dataIndex, options)(elemRender)
      }

      {
        childrenColumn.map((childrenColumnElem) => {
          const childrenColumnCol = childrenColumnElem.col || elem.contentCol;

          const childrenColumnKey = childrenColumnElem.key || childrenColumnElem.dataIndex;

          return childrenColumnCol ? (<Col span={childrenColumnCol} key={childrenColumnKey}>
            { childrenColumnElem.render() }
          </Col>) : childrenColumnElem.render();
        })
      }

    </Form.Item>);

    let childrenElem;
    if (warpCol) {
      // 表单结构化。
      childrenElem = (
        <Col {...formItemOptions} md={elem.col || col} span={elem.col || col} sm={24} xs={24} key={key} className={`${elem.className} ${rowIsHide ? 'ant-hide' : ''}`}>
          { formItem }
        </Col>
      );
    }
    else {
      // 返回原来数据，自行组装。
      childrenElem = {
        ...elem,
        rowIsHide,
        rowIsRemove,
        render: () => {
          if (rowIsRemove) {
            return null;
          }
          return formItem;
        },
      };
    }

    children.push(childrenElem);
    Object.defineProperty(children, key, {
      enumerable: false,
      value: childrenElem,
    });
  });

  return children;
}

export default buildColumnFormItem;
