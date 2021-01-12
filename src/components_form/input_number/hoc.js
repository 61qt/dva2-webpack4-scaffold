import React from 'react';

export default function () {
  // eslint-disable-next-line
  return function (Component) {
    return class extends React.PureComponent {
      render() {
        const { extraText, extraStyle = {}, style = {} } = this.props;
        return (
          <div style={{ display: 'inline-block', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Component {...this.props} style={{ overflow: 'hidden', flex: 1, ...style }} />
              {extraText && <span style={{ margin: '0px 10px', ...extraStyle }}>{extraText}</span>}
            </div>
          </div>);
      }
    };
  };
}
