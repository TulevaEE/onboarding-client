import React from 'react';

import logo from './logo.svg';

const App = () => (
  <div className="container mt-4">
    <h1>Main heading</h1>
    <h2>Secondary heading</h2>
    <h3>Tertiary heading</h3>
    <p>I will become the app.</p>
    <button className="btn btn-primary">Primary</button>
    <button className="btn btn-success">Success</button>
    <img src={logo} alt="Tuleva" />
  </div>
);

export default App;
