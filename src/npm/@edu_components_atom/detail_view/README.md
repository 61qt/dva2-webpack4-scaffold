# DetailView
---

DetailView 详情的列表，主要用于详情页面的信息展示。

## Usage

```js
import moment from 'moment';
import DetailView from './detail_view';

class Component extends React.PureComponent {
  render() {
    const dataSource = {
      name: '王小二',
    };
    const columns = [
      {
        dataIndex: 'name',
        birthday: 1121212,
      }
      {
        dataIndex: 'birthday',
        render: (text, dataSource) => {
          // dataSource 为传输进去组件的 dataSource
          return moment.unix(text).format('YYYY-MM-DD');
        },
      }
    ];

    return (<DetailView
      key={key}
      col={this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
      labelWidth={this.state.detailViewLabelWidth || '10em'}
      expand={this.state.detailViewExpand || 99999}
      loading={this.props.loading || false}
      dataSource={dataSource}
      columns={columns}
      title="学生详情" /> );
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
      <td>作为渲染内容的取值源，回调时候的 text 的取值源。</td>
    </tr>
    <tr>
      <td>renderTitle</td>
      <td>function</td>
      <td>undefined</td>
      <td>如果定义为 function ，将会让用户自行渲染，接收参数为 function(colElem):String,React Component ,其中 colElem 为 colums 中的每一个子元素</td>
    </tr>
    <tr>
      <td>titleClassName</td>
      <td>string</td>
      <td>''</td>
      <td>title 的 className，这个 title 并非整个组件的 title ，而是 colums 中每一个 title 对应组件的 className </td>
    </tr>
    <tr>
      <td>title</td>
      <td>string 或者 react component</td>
      <td>null</td>
      <td>整个组件的 title ，如果没传输或者判断为 false ，就没有 thead 的输出</td>
    </tr>
    <tr>
      <td>labelWidth</td>
      <td>css 的长度</td>
      <td>0</td>
      <td>如果没传输，就会自动计算适合的宽度。一般取最左上角的来作为基准长度。</td>
    </tr>
    <tr>
      <td>col</td>
      <td>nunmber</td>
      <td>1</td>
      <td>每一行展示多少组信息</td>
    </tr>
    <tr>
      <td>expand</td>
      <td>nunmber</td>
      <td>0</td>
      <td>缩起状态最少展开多少行的参数。例如页面的基础信息一定要展示，就是用该字段处理。</td>
    </tr>
    <tr>
      <td>defaultExpand</td>
      <td>number</td>
      <td>99999</td>
      <td>默认展开多少行，这个参数目前不记得是不是有 bug 了。改版了很多次还没处理这个参数。</td>
    </tr>
    <tr>
      <td>loading</td>
      <td>bolean</td>
      <td>false</td>
      <td>是否加载中的状态</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>容器的 className</td>
    </tr>
    <tr>
      <td>columns</td>
      <td>object array</td>
      <td>[]</td>
      <td>
        需要显示的列，如
        {
          dataIndex: 'key',
          title: 'title',
          render: (text, dataSource) => {
            render text || dataSource.key;
          },
          removeRule: (text, dataSource) => {
            render text || dataSource.key;
          },
          hiddenRule: (text, dataSource) => {
            render text || dataSource.key;
          },
          colSpan: 1,
          rowSpan: 1,
        },
        详情看下面的 columns 说明。
      </td>
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



# changelog


## 1.0.2
修复less导出空之后的警告

## 1.0.1
fix error file path


## 1.0.0
init version
