// import React from 'react';
// import _ from 'lodash';
// // import { Avatar } from 'antd';

// // import Filters from '../../filters';

// import styles from './index.less';

// export default class Component extends React.PureComponent {
//   static defaultProps = {
//     handleTabClick: (elem) => {
//       return elem;
//     },
//     activeKey: 'asset',
//     tab: [
//       {
//         name: '我的资产',
//         key: 'asset',
//         icon: (<span className="sp sp-navbar-home" />),
//         icon_active: (<span className="sp sp-navbar-home-active" />),
//       },
//       {
//         name: '申请',
//         key: 'apply',
//         icon: (<span className="sp sp-navbar-lists" />),
//         icon_active: (<span className="sp sp-navbar-lists-active" />),
//       },
//       {
//         name: '消息',
//         key: 'message',
//         icon: (<span className="sp sp-navbar-course" />),
//         icon_active: (<span className="sp sp-navbar-course-active" />),
//       },
//       {
//         name: '我',
//         key: 'me',
//         icon: (<span className="sp sp-navbar-user" />),
//         icon_active: (<span className="sp sp-navbar-user-active" />),
//       },
//     ],
//     title: '请配置 title',
//   }
//   constructor(props) {
//     super(props);
//     debugAdd('navigation_bar', this);

//     this.state = {
//       activeKey: props.activeKey,
//     };
//   }

//   componentDidMount = () => {

//   }

//   componentWillReceiveProps = (nextProps) => {
//     if ('activeKey' in nextProps && this.state.activeKey !== nextProps.activeKey) {
//       this.setState({
//         activeKey: nextProps.activeKey,
//       });
//     }
//   }

//   handleTabClick = (elem) => {
//     // eslint-disable-next-line no-console
//     console.log('handleTabClick elem', elem);
//     this.setState({
//       activeKey: elem.key,
//     });

//     if ('function' === typeof this.props.handleTabClick) {
//       this.props.handleTabClick(elem);
//     }
//   }

//   render() {
//     return (<div className={`navigation-bar ${styles.normal}`}>
//       <ul className="navigation-bar-ul">
//         {
//           _.map(this.props.tab, (elem) => {
//             return (<li className={`navigation-bar-li ${this.state.activeKey === elem.key ? 'active' : ''}`} key={elem.key} onClick={this.handleTabClick.bind(this, elem)}>
//               <div className="navigation-bar-icon">{ elem.icon }</div>
//               <div className="navigation-bar-icon active">{ elem.icon_active }</div>
//               <div className="navigation-bar-name">{ elem.name }</div>
//             </li>);
//           })
//         }
//       </ul>
//     </div>);
//   }
// }
