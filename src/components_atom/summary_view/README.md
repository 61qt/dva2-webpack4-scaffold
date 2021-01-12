# SummaryView
---
SummaryView，摘要视图，显示各项数据的名称以及对应的摘要数据。

## Usage

```js
import SummaryView from './summary_view';

class Component extends React.PureComponent {
  const data = {
    demo1: 1,
    demo2: 2,
    demo3: 3,
  };
  const columns = [
    {
      dataIndex: 'demo1',
      title: '示例1',
    },
    {
      dataIndex: 'demo2',
      title: '示例2',
    },
    {
      dataIndex: 'demo3',
      title: '示例3',
    },
  ];
  render() {
    <SummaryView
        dataSource={data}
        columns={columns}
        title="统计汇总（合计）"
        loading="false" />
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
      <td>dataSource</td>
      <td>object</td>
      <td>{}</td>
      <td>数据源</td>
    </tr>
    <tr>
      <td>columns</td>
      <td>array</td>
      <td>[]</td>
      <td>需要展示的列的数组，详情看下面的 columns 说明。</td>
    </tr>
    <tr>
      <td>title</td>
      <td>string或function或React component</td>
      <td>'统计汇总'</td>
      <td>标题</td>
    </tr>
    <tr>
      <td>loading</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否加载状态</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>自定义css样式</td>
    </tr>
  </tbody>
</table>

### columns

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
      <td>dataIndex</td>
      <td>string</td>
      <td></td>
      <td>获取值的那个字段</td>
    </tr>
    <tr>
      <td>title</td>
      <td>string or null</td>
      <td></td>
      <td>字段的名称。如果 title 为 null，那该字段的 title 表格就会被隐藏，直接显示内容字段，适用于例如合并栏或者不显示 title 的操作</td>
    </tr>
    <tr>
      <td>render</td>
      <td>funtion 或者 unset</td>
      <td></td>
      <td>渲染内容的方法，接收参数 function(text, dataSource):String|React Component 两个参数。如果没设置，就直接使用 dataSource 里面对应的值来显示</td>
    </tr>
    <tr>
      <td>removeRule</td>
      <td>funtion 或者 unset</td>
      <td></td>
      <td>如果有定义，就会判断该字段是不是需要在显示阶段移除。接收参数 function(text, dataSource):Boolean</td>
    </tr>
    <tr>
      <td>hiddenRule</td>
      <td>funtion 或者 unset</td>
      <td></td>
      <td>如果有定义，就会判断该字段是不是需要在显示阶段通过样式显示或者隐藏。接收参数 function(text, dataSource):Boolean</td>
    </tr>
    <tr>
      <td>colSpan</td>
      <td>number or number string</td>
      <td></td>
      <td>参考 table</td>
    </tr>
    <tr>
      <td>rowSpan</td>
      <td>number or number string</td>
      <td></td>
      <td>参考 table</td>
    </tr>
  </tbody>
</table>
