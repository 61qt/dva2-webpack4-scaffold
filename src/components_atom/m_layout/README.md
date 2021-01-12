# PageLayout
---
PageLayout，页面整体布局，含有面包屑与侧边栏。

## Usage

```js
import PageLayout from './page_layout';

class Component extends React.PureComponent {
  const children = <p>children</p>;
  const sider = <span>sider</span>;
  const breadcrumb = {
    current: [
      {
        url: '/page1',
        name: '页面1'
      }
    ],
  }
  render() {
    <PageLayout
      children={children}
      Sider={sider}
      breadcrumb={breadcrumb}
    ></PageLayout>
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
      <td>breadcrumb</td>
      <td>{
        current: [
          {
            url: string,
            name: string,
          }
        ]
        }</td>
      <td>{}</td>
      <td>面包屑内容</td>
    </tr>
    <tr>
      <td>children</td>
      <td>string或React component</td>
      <td>null</td>
      <td>内容部分子组件</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>自定义CSS样式</td>
    </tr>
    <tr>
      <td>hideBreadcrumb</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否隐藏面包屑</td>
    </tr>
    <tr>
      <td>Sider</td>
      <td>string或React component</td>
      <td>null</td>
      <td>侧边栏部分组件</td>
    </tr>
  </tbody>
</table>
