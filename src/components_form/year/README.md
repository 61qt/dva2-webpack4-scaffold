# Year
---

Year，年份选择器，有DatePicker的全部API。

## Usage

```js
import Year from './year';

class Component extends React.PureComponent {
  render() {
    return <Year size="large" />
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
      <td>format</td>
      <td>string</td>
      <td>'YYYY'</td>
      <td>显示的日期格式</td>
    </tr>
    <tr>
      <td>value</td>
      <td>moment</td>
      <td>null</td>
      <td>格式化后日期</td>
    </tr>
    <tr>
      <td>size</td>
      <td>string</td>
      <td>'default'</td>
      <td>输入框大小，有'large'，'default'，'small'可选</td>
    </tr>
    <tr>
      <td>onChange</td>
      <td>function</td>
      <td>null</td>
      <td>时间发生变化时的回调函数</td>
    </tr>
  </tbody>
</table>

