import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';

import LoginTab from './LoginTab';
import { readPreferredLoginMethod, savePreferredLoginMethod } from './preferredLoginMethod';

function initialTab(children) {
  const labels = children.map((child) => child.props.label);
  const preferred = readPreferredLoginMethod();
  return labels.includes(preferred) ? preferred : labels[0];
}

class LoginTabs extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Array).isRequired,
  };

  panelRef = createRef();

  // eslint-disable-next-line react/destructuring-assignment
  state = { activeTab: initialTab(this.props.children) };

  componentDidUpdate(_prevProps, { activeTab: prevActiveTab }) {
    const { activeTab } = this.state;
    if (prevActiveTab !== activeTab) {
      this.panelRef.current?.focus();
    }
  }

  onClickTabItem = (tab) => {
    savePreferredLoginMethod(tab);
    this.setState({ activeTab: tab });
  };

  render() {
    const {
      props: { children },
      state: { activeTab },
      onClickTabItem,
    } = this;

    return (
      <>
        <ul className="mt-4 mt-sm-5 mb-4 nav nav-tabs nav-fill" role="tablist">
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
        </ul>
        <div
          className="tab-content"
          role="tabpanel"
          tabIndex="-1"
          aria-live="polite"
          ref={this.panelRef}
        >
          {React.Children.map(children, (child) => {
            if (child.props.label !== activeTab) {
              return undefined;
            }
            return child.props.children;
          })}
        </div>
      </>
    );
  }
}

export default LoginTabs;
