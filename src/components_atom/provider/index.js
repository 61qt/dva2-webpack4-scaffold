import { Provider } from 'react-redux';

import { getStore } from '../../utils/get_app';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);

    debugAdd('provider', this);
  }

  render() {
    return (<Provider store={getStore()}>{this.props.children}</Provider>);
  }
}
