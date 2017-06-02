import React from 'react';
import { Message } from 'retranslate';

export const ComparisonFootnotes = () => (
  <div>
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
    </p>
    <p className="small">
      <Message>new.user.flow.footnote.cheapest</Message>
    </p>
  </div>
);

export default ComparisonFootnotes;
