import React, { PropTypes as Types } from 'react';

import Header from './header';

// This component will contain the app header and other such common elements.
const App = ({ children }) => (
  <div className="container mt-4">
    <Header />
    {children}
  </div>
);

App.defaultProps = {
  children: null,
};

App.propTypes = {
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
};

export default App;
