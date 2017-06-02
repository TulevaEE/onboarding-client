import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ComparisonFootnotes } from './ComparisonFootnotes';

describe('Calculator Footnotes', () => {
  let component;
  let props;

  beforeEach(() => {
    component = shallow(<ComparisonFootnotes {...props} />);
  });

  it('renders footnotes', () => {
    expect(component.contains(
      <p className="small">
        <Message>new.user.flow.footnote.calculator.part1</Message>
        <a
          target="_blank" rel="noopener noreferrer"
          href="http://www.pensionikeskus.ee/ii-sammas/investorkaitse/varade-kaitse/"
        >
          <Message>new.user.flow.footnote.calculator.part2link</Message>
        </a>
        <Message>new.user.flow.footnote.calculator.part3</Message>
        <a
          target="_blank" rel="noopener noreferrer"
          href="http://www.pensionikeskus.ee/files/dokumendid/kogumispensioni_statistika_012017.pdf"
        >
          <Message>new.user.flow.footnote.calculator.part4link</Message>
        </a>
        <Message>new.user.flow.footnote.calculator.part5</Message>
      </p>,
    )).toBe(true);
  });

  it('renders footnotes for cheapest keyword', () => {
    expect(component.contains(
      <p className="small">
        <Message>new.user.flow.footnote.cheapest</Message>
      </p>,
    )).toBe(true);
  });

});
