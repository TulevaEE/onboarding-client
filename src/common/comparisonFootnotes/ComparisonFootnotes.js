import React from 'react';
import { Message } from 'retranslate';

export const ComparisonFootnotes = () => (
  <div>
    <p className="small">
      <Message>footnote.comparison.part1</Message>
      <a
        target="_blank" rel="noopener noreferrer"
        href="http://www.pensionikeskus.ee/ii-sammas/investorkaitse/varade-kaitse/"
      >
        <Message>footnote.comparison.part2link</Message>
      </a>
      <Message>footnote.comparison.part3</Message>
      <a
        target="_blank" rel="noopener noreferrer"
        href="http://www.pensionikeskus.ee/files/dokumendid/kogumispensioni_statistika_012017.pdf"
      >
        <Message>footnote.comparison.part4link</Message>
      </a>
      <Message>footnote.comparison.part5</Message>
    </p>
    <p className="small">
      <Message>footnote.cheapest</Message>
      <a
        target="_blank" rel="noopener noreferrer"
        href="https://docs.google.com/document/d/1IKm6NldgI1lu01X2rvCMy9B78wNANh81z3_wvVEKtM4/edit?usp=sharing"
      >
        <Message>footnote.comparison.assumptions</Message>
      </a>
    </p>
  </div>
);

export default ComparisonFootnotes;
