import React, { Component } from 'react';
import PropTypes from 'prop-types';

import LoginTab from './LoginTab';

class LoginTabs extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Array).isRequired,
  };

  state = {
    activeTab: this.props.children[0].props.label,
  };

  onClickTabItem = (tab) => {
    this.setState({ activeTab: tab });
  };

  render() {
    const {
      onClickTabItem,
      props: { children },
      state: { activeTab },
    } = this;

    return (
      <div className="m-0 mt-4 tabs">
        <ol className="tab-list">
          {React.Children.map(children, (child) => {
            const { label, hideOnMobile } = child.props;

            return (
              <LoginTab
                activeTab={activeTab}
                key={label}
                label={label}
                onClick={onClickTabItem}
                hideOnMobile={hideOnMobile}
              />
            );
          })}
        </ol>
        <div className="tab-content">
          {React.Children.map(children, (child) => {
            if (child.props.label !== activeTab) {
              return undefined;
            }
            return child.props.children;
          })}
        </div>
      </div>
    );
  }
}

export default LoginTabs;
