import React from 'react';
import ReactDOM from 'react-dom';

import { BroughtIntoView } from './BroughtIntoView';
import { forgetTheLayout, layOutBelowTheFold, watchScrollingIntoView } from '../../../test/fold';

describe('Brought into view', () => {
  const container = document.createElement('div');

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    forgetTheLayout();
  });

  it('scrolls what opens below the fold into view as it is drawn, before the browser can paint the page unscrolled', () => {
    const scrollIntoView = watchScrollingIntoView();
    layOutBelowTheFold();

    ReactDOM.render(<BroughtIntoView>Cancel</BroughtIntoView>, container);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
