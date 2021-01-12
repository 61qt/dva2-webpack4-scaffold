// import UUID from 'uuid';
// import { Cascader } from 'antd';
// import _ from 'lodash';
// import Factory from '@/services/_factory';

// export default class Component extends React.PureComponent {
//   static defaultProps = {
//     changeOnSelect: true,
//     size: 'default',
//     // 值的展示 format。
//     getInitValue: ({
//       value,
//     }) => {
//       if (__DEV__ && __PROD__) {
//         window.console.log('value', value);
//       }

//       return value;
//     },
//     // 初始化时候的查询条件
//     initFilter: () => {
//       return [['pid', '=', 0]];
//     },
//     // 当前这个树的外键表，多个的话会根据层级获取
//     table: ['department'],
//     // 获取每个层级的 filter 的 函数
//     getFilterFunc: ({
//       selectedOptions,
//       currentTable,
//     }) => {
//       if (__DEV__ && __PROD__) {
//         window.console.log('currentTable', currentTable);
//       }
//       const id = _.get(_.last(selectedOptions), 'id', 0);
//       return [
//         ['pid', '=', id],
//       ];
//     },
//   }
//   constructor(props) {
//     super(props);
//     this.state = {
//       value: props.value || undefined,
//       tree: [
//         // {
//         //   value: 'zhejiang',
//         //   label: 'Zhejiang',
//         //   isLeaf: false,
//         // },
//         // {
//         //   value: 'jiangsu',
//         //   label: 'Jiangsu',
//         //   isLeaf: false,
//         // },
//       ],
//     };
//     this.uuid = UUID().replace(/-/g, '_');
//     debugAdd('foreigh_select_cascader_async', this);
//     // window.console.log('props.url', props.url, 'this.uuid', this.uuid);
//     debugAdd(`foreigh_select_cascader_async_all_${props.url || ''}_${this.uuid}`, this);
//   }

//   componentDidMount = () => {
//     this.loadData();
//   }

//   // 更新传输的 value
//   componentWillReceiveProps = (nextProps) => {
//     if ('value' in nextProps && this.props.value !== nextProps.value) {
//       const value = nextProps.value;
//       // window.console.log('componentWillReceiveProps', value);
//       this.setState({
//         value,
//       });
//     }
//   }

//   componentWillUnmount = () => {
//   }

//   getTree = () => {
//     return this.state.tree;
//   }

//   getCurrentTable = (currentLength = 0) => {
//     const table = _.get(this.props, 'table', []);
//     if (_.isString(table)) {
//       return table;
//     }

//     const currentTable = _.get(this.props, `table[${currentLength}]`) || _.last(this.props.table);

//     return currentTable;
//   }

//   loadData = (selectedOptions) => {
//     window.console.log('loadData selectedOptions', selectedOptions, '需要 add 非 leaf 时候，无数据的 disable 的处理');
//     const currentLength = _.get(selectedOptions, '.length', 0);
//     const currentOption = _.last(selectedOptions);
//     const currentTable = this.getCurrentTable(currentLength);

//     window.console.log('currentTable', currentTable);
//     if (!currentTable) {
//       return;
//     }

//     if (_.get(currentOption, 'children.length')) {
//       return;
//     }

//     if (currentOption) {
//       currentOption.loading = true;
//     }

//     // 目前检查了下， graphqlMaxList  全部都是使用 Factory 生成。serviceName 在 book_category 查询的时候使用到，但是其指向的 graphqlAll 也是工厂方式生成。（其他的 graphqlAll ，暂时没用到。 ）
//     const xhr = _.get(Factory({ model: currentTable }), _.get(this.props, 'serviceName') || 'graphqlMaxList');

//     if (!xhr) {
//       return Promise.reject('需要配置这个服务');
//     }

//     xhr({
//       filter: this.props.getFilterFunc({
//         selectedOptions,
//         currentTable,
//       }),
//     }).then((res) => {
//       const data = _.get(res, 'data.data');

//       // window.console.log('res', res, 'data', data);
//       window.console.log('data', data);

//       if (!selectedOptions) {
//         this.setState({
//           tree: _.map(data, (elem) => {
//             return {
//               ...elem,
//               label: elem.name,
//               value: elem.id,
//               isLeaf: false,
//             };
//           }),
//         });
//       }
//       else {
//         currentOption.loading = false;
//         const children = _.map(data, (elem) => {
//           return {
//             ...elem,
//             label: elem.name,
//             value: elem.id,
//             isLeaf: false,
//           };
//         });

//         if (1 > data.length) {
//           currentOption.isLeaf = true;
//         }
//         else {
//           currentOption.children = children;
//         }

//         this.setState({
//           // eslint-disable-next-line react/no-unused-state
//           random: Math.random(),
//         });
//       }
//     }).then((rej) => {
//       window.console.log('rej', rej);
//     });
//   }

//   handleChange = (value) => {
//     window.console.log('handleChange', value);
//     // const formatedValue = _.last(value);
//     this.setState({
//       value,
//     });

//     const { onChange } = this.props;
//     if ('function' === typeof onChange) {
//       onChange(value);
//     }
//   }

//   render() {
//     return (<Cascader
//       size={this.props.size}
//       value={this.state.value}
//       loadData={this.loadData}
//       changeOnSelect={this.props.changeOnSelect}
//       placeholder="请选择"
//       options={this.getTree()}
//       onChange={this.handleChange} />);
//   }
// }
