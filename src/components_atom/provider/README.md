# Provider
---
Provider，用于修复组件无法获取store状态。

## Usage

```js
import Provider from './provider';

class Component extends React.PureComponent {
  render() {
    <Provider>{children}</Provider>
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
      <td>children</td>
      <td>string或React component</td>
      <td>null</td>
      <td>需要连接store的组件</td>
    </tr>
  </tbody>
</table>
