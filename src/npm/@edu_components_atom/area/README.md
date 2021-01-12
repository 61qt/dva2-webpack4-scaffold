# Area
---

Area 地区显示，用于显示没有查询只有 id 时候自动显示。

## Usage

```js
import Area from './area';

class Component extends React.PureComponent {
  render() {
    return (<Area id="620000" />);
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
      <td>id</td>
      <td>number 或者 number string</td>
      <td>0</td>
      <td>需要展示的地区，确保系统已经初始化 area/tree 的state</td>
    </tr>
  </tbody>
</table>


# changelog

## 1.0.0
init version
