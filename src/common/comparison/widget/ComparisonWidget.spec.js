import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import Comparison from '../';

import { ComparisonWidget } from './ComparisonWidget';

describe('Comparison widget', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ComparisonWidget />);
  });

  it('can hide and show comparison', () => {
    const onHideComparison = () => jest.fn();
    component.setProps({
      onHideComparison,
      comparisonVisible: true,
    });

    expect(component.contains(<Comparison overlayed onClose={onHideComparison} />)).toBe(true);
    component.setProps({ comparisonVisible: false });
    expect(component.contains(<Comparison overlayed onClose={onHideComparison} />)).toBe(false);
  });

  it('displays show comparison', () => {
    const onShowComparison = () => jest.fn();

    component.setProps({ onShowComparison });

    expect(component.contains(<button
      className={'btn btn-primary mt-3 mb-3'}
      onClick={onShowComparison}
    ><Message>select.sources.show.comparison</Message></button>)).toBe(true);
  });
});
