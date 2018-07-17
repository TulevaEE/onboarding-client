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
    expect(
      component.contains(
        <p className="small">
          <Message>footnote.comparison.part1</Message>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="http://www.pensionikeskus.ee/ii-sammas/investorkaitse/varade-kaitse/"
          >
            <Message>footnote.comparison.part2link</Message>
          </a>
          <Message>footnote.comparison.part3</Message>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="http://www.pensionikeskus.ee/files/dokumendid/kogumispensioni_statistika_012017.pdf"
          >
            <Message>footnote.comparison.part4link</Message>
          </a>
          <Message>footnote.comparison.part5</Message>
        </p>,
      ),
    ).toBe(true);
  });

  it('renders footnotes for cheapest keyword', () => {
    expect(component.contains(<Message>footnote.cheapest</Message>)).toBe(true);
  });

  it('renders comparison assumptions', () => {
    expect(component.contains(<Message>footnote.comparison.assumptions</Message>)).toBe(true);
  });
});
