# Svg
---
Svg，svg图片显示。

## Usage

```js
import Svg from './svg';

class Component extends React.PureComponent {
  render() {
    <Svg link={require('./demo.svg')} />
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
      <td>link</td>
      <td>svg模块</td>
      <td>null</td>
      <td>要加载的svg文件</td>
    </tr>
  </tbody>
</table>
