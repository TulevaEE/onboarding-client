import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import LoginTab, { LOGIN_TAB_PANEL_ID, loginTabId } from './LoginTab';
import { readPreferredLoginMethod, savePreferredLoginMethod } from './preferredLoginMethod';
import { LoginTabPickedByUser } from './loginTabPickedByUser';

const WAITING_LOGIN_METHOD_ID = 'login-waiting-method';

const TABS_HIDDEN_ON_MOBILE_SHOWN_FROM = '(min-width: 768px)';

const isShownAtThisWidth = (child) =>
  !child.props.hideOnMobile || window.matchMedia(TABS_HIDDEN_ON_MOBILE_SHOWN_FROM).matches;

const TAB_INDEX_AFTER_KEY = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (index, count) => count - 1,
};

function initialTab(children) {
  const labels = children.map((child) => child.props.label);
  const shownLabels = children.filter(isShownAtThisWidth).map((child) => child.props.label);
  const preferred = readPreferredLoginMethod();
  return shownLabels.includes(preferred) ? preferred : labels[0];
}

class LoginTabs extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Array).isRequired,
    onTabChange: PropTypes.func,
    tabsHidden: PropTypes.bool,
  };

  static defaultProps = {
    onTabChange: () => undefined,
    tabsHidden: false,
  };

  panelRef = createRef();

  tabButtons = new Map();

  // eslint-disable-next-line react/destructuring-assignment
  state = { activeTab: initialTab(this.props.children), pickedByUser: false };

  componentDidUpdate(_prevProps, { activeTab: prevActiveTab }) {
    const { activeTab } = this.state;
    if (prevActiveTab !== activeTab) {
      this.panelRef.current?.focus();
    }
  }

  onClickTabItem = (tab) => {
    const { onTabChange } = this.props;
    const { activeTab } = this.state;
    savePreferredLoginMethod(tab);
    this.setState({ activeTab: tab, pickedByUser: true });
    if (tab !== activeTab) {
      onTabChange();
    }
  };

  onTabListKeyDown = (event) => {
    const tabIndexAfterKey = TAB_INDEX_AFTER_KEY[event.key];
    if (!tabIndexAfterKey) {
      return;
    }
    event.preventDefault();
    const { children } = this.props;
    const shownLabels = children.filter(isShownAtThisWidth).map((child) => child.props.label);
    const focusedIndex = shownLabels.findIndex(
      (label) => this.tabButtons.get(label) === event.target,
    );
    const nextLabel = shownLabels[tabIndexAfterKey(focusedIndex, shownLabels.length)];
    this.tabButtons.get(nextLabel)?.focus();
  };

  render() {
    const {
      props: { children, tabsHidden },
      state: { activeTab, pickedByUser },
      onClickTabItem,
      onTabListKeyDown,
    } = this;

    return (
      <>
        {!tabsHidden && (
          <ul
            className="mt-4 pt-2 mt-sm-5 pt-sm-0 mb-4 nav nav-tabs nav-fill"
            role="tablist"
            onKeyDown={onTabListKeyDown}
          >
            {React.Children.map(children, (child) => {
              const { label, hideOnMobile } = child.props;

              return (
                <LoginTab
                  activeTab={activeTab}
                  key={label}
                  label={label}
                  onClick={onClickTabItem}
                  hideOnMobile={hideOnMobile}
                  buttonRef={(button) => this.tabButtons.set(label, button)}
                />
              );
            })}
          </ul>
        )}
        <div
          className={tabsHidden ? 'mt-4 pt-2 mt-sm-5 pt-sm-0' : 'tab-content pt-2'}
          id={LOGIN_TAB_PANEL_ID}
          aria-labelledby={tabsHidden ? WAITING_LOGIN_METHOD_ID : loginTabId(activeTab)}
          role={tabsHidden ? 'region' : 'tabpanel'}
          tabIndex="-1"
          aria-live="polite"
          ref={this.panelRef}
        >
          {tabsHidden && (
            <h3 id={WAITING_LOGIN_METHOD_ID} className="visually-hidden">
              <FormattedMessage id={activeTab} />
            </h3>
          )}
          <LoginTabPickedByUser.Provider value={pickedByUser}>
            {React.Children.map(children, (child) => {
              if (child.props.label !== activeTab) {
                return undefined;
              }
              return child.props.children;
            })}
          </LoginTabPickedByUser.Provider>
        </div>
      </>
    );
  }
}

export default LoginTabs;
