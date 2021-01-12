import React from 'react';
import _ from 'lodash';
import { Modal, Button } from 'antd';

export default function quickPasteHoc() {
  return function decorate(WrappedComponent) {
    return class HocComponent extends React.Component {
      constructor(props) {
        super(props);
        debugAdd('quickPasteHoc', this);
        this.instances = {};
        this.modal = null;
      }

      componentDidMount = () => {
        window.addEventListener('paste', this.onPaste);
      }

      componentWillUnmount = () => {
        window.removeEventListener('paste', this.onPaste);
        if (null !== this.modal) {
          this.modal.destroy();
        }
      }

      onPaste = (e) => {
        const options = {};
        if (!(e.clipboardData && e.clipboardData.items)) {
          return;
        }

        // 1 取粘贴数据，仅可在onPaste回调发生时取值，否则为空
        // 2 直接复制文件夹中的文件，会产生多个粘贴内容，有string的filename和file，取其中为file的（若是同时复制多个，则会取最后一条）
        let hasFile = false;
        _.each(e.clipboardData.items, (item) => {
          if ('file' === _.get(item, 'kind', '')) {
            // 处理数据
            const pasteFile = item.getAsFile();
            options.file = pasteFile;
            hasFile = true;
          }
        });

        if (null === options.file) {
          return;
        }

        if (!hasFile) {
          return;
        }
        // 取所有instance
        const instances = this.getInstances();
        const keys = _.keys(instances);

        const onClick = (target) => {
          if (_.isEmpty(options)) {
            return;
          }
          if (_.isFunction(target.customRequest)) {
            target.customRequest(options);
          }
          if (null !== this.modal) {
            this.modal.destroy();
          }
        };

        if (1 < keys.length) {
          this.modal = Modal.info({
            title: '请选择图片的粘贴位置',
            okText: '关闭',
            content: <div>
              {
                _.map(keys, (name, index) => {
                  return (
                    <Button
                      style={{ margin: 8 }}
                      key={index}
                      onClick={() => {
                        onClick(instances[name]);
                      }}>{name}</Button>
                  );
                })
              }
            </div>,
          });
        }

        if (1 === keys.length) {
          const target = _.get(instances, _.get(keys, '[0]'), {});
          if (_.isFunction(target.customRequest)) {
            target.customRequest(options);
          }
        }
      }

      getPasteProps = (name) => {
        // 修饰后的目标组件，会存在instances中
        // 发生粘贴事件时会接受处理
        if (_.isEmpty(name)) {
          return;
        }

        if (__DEV__ && this.getInstanceRef(name)) {
          window.console.log('重复的title');
        }

        const buildPasteProps = (newName) => {
          const pasteProps = {};
          pasteProps.ref = (elem) => {
            if (elem) {
              this.setInstanceRef(newName, elem);
            }
          };
          return pasteProps;
        };

        return buildPasteProps(name);
      }

      setWrappedRef = (ref) => {
        this.wrappedRef = ref;
      }

      getWrappedRef = () => {
        return this.wrappedRef;
      }

      setInstanceRef = (name, target) => {
        this.instances[name] = target;
      }

      getInstanceRef = (name) => {
        return this.instances[name];
      }

      getInstances = () => {
        return this.instances;
      }

      render() {
        // 此处需要置空instances，fix组件移除时，instances中还有旧的ref
        // 在触发wrapped render时
        // getPasteProps修饰的组件会重新将填入instances
        this.instances = {};
        const props = { ...this.props };
        props.getPasteProps = this.getPasteProps;
        if ('function' === typeof this.props.getInstance) {
          props.ref = this.props.getInstance();
          this.setWrappedRef(this.props.getInstance());
        }
        else {
          props.ref = this.setWrappedRef;
        }
        return (<WrappedComponent {...props} />);
      }
    };
  };
}
