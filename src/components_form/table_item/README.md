### 表格form表单组件

value: [
  {}
]

```javascript
 <TableItem {...this.getTableItemProps()} />

 getTableItemProps=() => {
    return {
      tableProps: {
        operationWidth: 180,
        editText: '修改获奖名额',
        columns: [
          {
            title: '奖项名称',
            dataIndex: 'name',
          },
          {
            title: '奖项类型',
            dataIndex: 'type',
          },
          {
            title: '获奖名额',
            dataIndex: 'number',
          },
        ],
      },
      modalContainerProps: {
        addText: '新增奖项',
        editText: '修改获奖名额',
        getDefaultProps: (props) => {
          const type = props.type;
          return {
            ...props,
            title: 'add' === type ? '新增奖项' : '修改获奖名额',
            formContainerProps: {
              formColumns: [
                {
                  title: '奖项名称',
                  rules: [
                    { required: true, whitespace: true, message: '必填' },
                  ],
                  dataIndex: 'name',
                  props: {
                    maxLength: 10,
                    disabled: 'edit' === type,
                  },
                },
                {
                  title: '奖项类型',
                  rules: [
                    { required: true, whitespace: true, message: '必填' },
                  ],
                  hiddenRule: 'edit' === type,
                  dataIndex: 'type',
                },
                {
                  title: '获奖名额',
                  rules: [
                    { required: true, message: '必填' },
                  ],
                  inputNumberOptions: {
                    // className 带有 ant-input-number-row 代表长度为 100% 。
                    className: 'ant-input-number-row',
                    min: 1,
                    max: 100,
                    step: 1,
                  },
                  dataIndex: 'number',

                },
              ],
            },
          };
        },
      },
    };
  }
```