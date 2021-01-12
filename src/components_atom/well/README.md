# Well
---
Well，卡片组件，可承载文字、列表、图片、段落，常用于后台概览页面。

## Usage

```js
import Well from './well';

class Component extends React.PureComponent {
  const children = <p>子组件</p>;
  render() {
    <Well loading="false" holderplace title="标题" footer="底部" free>
      {children}
    </Well>
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
      <td>holderplace</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否去掉默认边框</td>
    </tr>
    <tr>
      <td>loading</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否为加载状态</td>
    </tr>
    <tr>
      <td>title</td>
      <td>string, react component</td>
      <td>''</td>
      <td>卡片标题</td>
    </tr>
    <tr>
      <td>footer</td>
      <td>string, react component</td>
      <td>''</td>
      <td>卡片底部</td>
    </tr>
    <tr>
      <td>children</td>
      <td>string, react component</td>
      <td>null</td>
      <td>子组件</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>自定义样式</td>
    </tr>
    <tr>
      <td>free</td>
      <td>boolean</td>
      <td>null</td>
      <td>有无边距</td>
    </tr>
  </tbody>
</table>
