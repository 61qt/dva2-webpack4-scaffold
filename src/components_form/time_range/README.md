# TimeRange
---

TimeRange，时间范围选择器

## Usage

```js
import TimeRange from './time_range';

class Component extends React.PureComponent {
  render() {
    return <TimeRange format="h:mm a" />
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
      <td>'HH:mm:ss'</td>
      <td>显示的时间格式</td>
    </tr>
    <tr>
      <td>onChange</td>
      <td>function</td>
      <td>null</td>
      <td>时间发生变化时的回调函数，可传入一个option，包含改变的状态('start'或'end')与对应时间值</td>
    </tr>
  </tbody>
</table>

