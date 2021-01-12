import { Tooltip } from 'antd';
import { renderEmpty } from '@/modules/default/router_config_factory';

// 这个是table 长度计算的默认值及宽度
export const PADDING_LEFT = 16; // padding-left 长度
export const PADDING_RIGHT = 30; // padding-right 长度
export const CN_LENGTH = 15; // cn长度
export const CODE_LENGTH = 10; // code长度
export const DEFAULT_ADD_LENGTH = 2; // 默认额外长度
export const DEFAULT_TEXT_TYPE = 'cn'; // 默认文字类型
export const TYPE_LENGTH_RELATION_MAP = { // 文字类型长度关系映射
  cn: CN_LENGTH,
  code: CODE_LENGTH,
};

export function getDetailViewTableNoDataTip(props = {}) {
  return renderEmpty(props);
}

export function computedColumnWidth(columns) {
  return _.map(columns, (item) => {
    const textLength = TYPE_LENGTH_RELATION_MAP[_.get(item, 'textType') || DEFAULT_TEXT_TYPE] || TYPE_LENGTH_RELATION_MAP[DEFAULT_TEXT_TYPE];
    const newItem = { ...item, textLength };
    if ('length' in item) {
      newItem.width = PADDING_LEFT + PADDING_RIGHT + (_.get(item, 'length') * 1 + ('addLength' in item ? _.get(item, 'addLength') * 1 : DEFAULT_ADD_LENGTH)) * textLength;
    }
    else if ('minLength' in item) {
      newItem.minWidth = PADDING_LEFT + PADDING_RIGHT + (_.get(item, 'minLength') * 1 + ('addLength' in item ? _.get(item, 'addLength') * 1 : DEFAULT_ADD_LENGTH)) * textLength;
    }
    else if ('width' in item) {
      // padding 从 4px 变成 16px ，16*2-4*2=24；
      newItem.width = (item.width * 1 || 0) + 24;
    }
    else if ('minWidth' in item) {
      // padding 从 4px 变成 16px ，16*2-4*2=24；
      newItem.minWidth = (item.minWidth * 1 || 0) + 24;
    }

    // 默认添加ellipsis

    if ('operation' !== item.key && undefined === item.ellipsis && !item.minLength && !item.numberAlignLength && !item.render) {
      newItem.ellipsis = true;
    }

    if (_.get(newItem, 'ellipsis')) {
      const oldRender = item.render;
      newItem.render = function render(...arg) {
        const text = _.get(arg, '[0]');

        return 'function' === typeof oldRender ?
          (<Tooltip placement="topLeft" title={oldRender.apply(this, arg)}>
            {
              _.get(newItem, 'fixed')
              ? <div style={{ width: newItem.width - (PADDING_LEFT * 2 + DEFAULT_ADD_LENGTH) }} className="fixed-ellipsis">{oldRender.apply(this, arg)}</div>
              : <span>{oldRender.apply(this, arg)}</span>
            }
          </Tooltip>)
          :
          (<Tooltip placement="topLeft" title={text}>
            {
              _.get(newItem, 'fixed')
              ? <div style={{ width: newItem.width - (PADDING_LEFT * 2 + DEFAULT_ADD_LENGTH) }} className="fixed-ellipsis">{text}</div>
              : <span>{text}</span>
            }
          </Tooltip>);
      };
    }
    return newItem;
  });
}

export const defineUnenumerableProperty = (arr, key, value) => {
  Object.defineProperty(arr, key, {
    enumerable: false,
    value,
  });
};
