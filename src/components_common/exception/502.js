import React from 'react';
import Exception from './exception';

export default class Component extends React.PureComponent {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    return (<Exception type="502" style={{ minHeight: 500, height: '80%' }} />);
  }
}
