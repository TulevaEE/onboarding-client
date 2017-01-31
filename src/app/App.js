import React, { PropTypes as Types } from 'react';

// This component will contain the app header and other such common elements.
const App = ({ children }) => (
  <div>
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
