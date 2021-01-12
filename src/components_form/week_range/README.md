# WeekRange
---

WeekRange，星期范围选择器，包含初始星期与结束星期。

## Usage

```js
import WeekRange from './week_range';

class Component extends React.PureComponent {
  render() {
    return <WeekRange numberFormat />
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
      <td>numberFormat</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否格式化为整数</td>
    </tr>
    <tr>
      <td>onChange</td>
      <td>function</td>
      <td>null</td>
      <td>时间发生变化时的回调函数，可传入一个option，包含改变的状态('start'或'end')与对应时间值</td>
    </tr>
  </tbody>
</table>

