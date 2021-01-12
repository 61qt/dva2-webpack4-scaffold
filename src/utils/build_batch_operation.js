import { Button, Popconfirm, Menu, Dropdown, Icon } from 'antd';
import Access from '@/npm/@edu_components_atom/access';
import { defineUnenumerableProperty } from '@/components_default/page_list/index';

export const buildSingleOperation = (item, handleToggleRowSelection) => {
  // if (item.modalComponent) {
  //   const Modal = item.modalComponent;
  //   return (
  //     <Access key={item.key} auth={item.auth}>
  //       <Modal {...item.modalProps}>
  //         <Button size="small" onClick={() => handleToggleRowSelection.call(this, item.key)}>{item.text}</Button>
  //       </Modal>
  //     </Access>
  //   );
  // }
  return (
    <Access key={item.key} auth={item.auth}>
      <Button size="small" onClick={() => handleToggleRowSelection.call(this, item.key)}>{item.text}</Button>
    </Access>
  );
};

const buildBatchOperation = (list, handleToggleRowSelection, patchOperateCount) => {
  const listOperation = [];
  const menus = [];

  if (_.isArray(list)) {
    list.map((item, index) => {
      const operation = buildSingleOperation(item, handleToggleRowSelection);
      if (list.length > patchOperateCount) {
        if (patchOperateCount - 1 > index) {
          listOperation.push(operation);
        }
        else {
          menus.push(<Menu.Item key={item.key}>{operation}</Menu.Item>);
        }
      }
      else {
        listOperation.push(operation);
      }

      defineUnenumerableProperty(listOperation, item.key, operation);
      return item;
    });
  }
  else if (_.isObject(list)) {
    const operation = buildSingleOperation(list, handleToggleRowSelection);
    listOperation.push(operation);
    defineUnenumerableProperty(listOperation, list.key, operation);
  }

  if (!_.isEmpty(menus)) {
    const dropdown = (<Dropdown key="left1More" size="small" overlay={<Menu>{menus}</Menu>}>
      <Button size="small">更多操作<Icon type="down" /></Button>
    </Dropdown>);

    listOperation.push(dropdown);
  }

  // console.log(listOperation)
  return listOperation;
};

export const buildConfirmOperation = ({ modalComponent: Modal, ...item } = {}, handlePatchOperation) => {
  const text = item.confirmText || _.get(item, 'text', '').replace('批量', '确认');

  if (Modal) {
    return (<Modal {...item.modalProps} key={`${item.key}Confirm`}>
      <Button
        size="small"
        type="primary"
        onClick={() => {
          if (item.patchHandle) {
            // 一般作用是统计
            item.patchHandle();
          }
        }}>{text}</Button>
    </Modal>);
  }

  return (<Popconfirm {...item.popconfirm} key={`${item.key}Confirm`} onConfirm={handlePatchOperation}>
    <Button size="small" type="primary">{text}</Button>
  </Popconfirm>);
};

export default buildBatchOperation;
