import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Message } from 'retranslate';

class LoginTab extends Component {
  static propTypes = {
    activeTab: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    hideOnMobile: PropTypes.string.isRequired,
  };

  onClick = () => {
    const { label, onClick } = this.props;
    onClick(label);
  };

  render() {
    const {
      onClick,
      props: { activeTab, label, hideOnMobile },
    } = this;

    let className = 'tab-list-item';

    if (activeTab === label) {
      className += ' tab-list-active';
    }

    if (hideOnMobile === 'true') {
      className += ' d-none d-md-table-cell';
    }

    return (
      <button type="button" className={className} onClick={onClick}>
        <Message>{label}</Message>
      </button>
    );
  }
}

export default LoginTab;
