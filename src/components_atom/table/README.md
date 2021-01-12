# Table
---
Table，基于antd的表格组件，显示行列信息，拥有其全部API

## Usage

```js
import Table from './table';

class Component extends React.PureComponent {
  const data = {
    demo1: 1,
    demo2: 2,
    demo3: 3,
  };
  const columns = [
    {
      dataIndex: demo1,
      title: 示例1,
    },
    {
      dataIndex: demo2,
      title: 示例2,
    },
    {
      dataIndex: demo3,
      title: 示例3,
    },
  ];
  render() {
    <Table
      dataSource={data}
      columns={columns}
      autoFixed="true"
      scroll={{ y: 240 }}
    />
  }
}
```

## API

### Props
<table class="table table-bordered table-striped">
  <thead>
    <tr>
      <th style="width: 100px;">name</th>
      <th style="width: 50px;">type</th>
      <th style="width: 50px;">default</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>autoFixed</td>
      <td>boolean</td>
      <td>false</td>
      <td>滚动时是否将表头固定在页面</td>
    </tr>
    <tr>
      <td>columns</td>
      <td>array</td>
      <td>[]</td>
      <td>表格列的配置描述，具体项见下表</td>
    </tr>
    <tr>
      <td>scroll</td>
      <td>{ x: number | true, y: number }</td>
      <td>null</td>
      <td>设置滚动区域或滚动区域的宽高</td>
    </tr>
    <tr>
      <td>scrollWarpper</td>
      <td>string</td>
      <td>'ant-layout'</td>
      <td>为有该属性定义的css的容器设置滚动</td>
    </tr>
    <tr>
      <td>size</td>
      <td>string</td>
      <td>'default'</td>
      <td>正常或迷你类型，default or small</td>
    </tr>
    <tr>
      <td>forceNoMinWidth</td>
      <td>boolean</td>
      <td>false</td>
      <td>是不是必须传输 minWidth</td>
    </tr>
  </tbody>
</table>
