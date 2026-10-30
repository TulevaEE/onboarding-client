import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { FundPensionFaq } from './FundPensionFaq';

const renderFaq = () =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FundPensionFaq />
    </IntlProvider>,
  );

describe('fund pension FAQ', () => {
  it('starts with how to choose the contract and until which age one contract pays', () => {
    renderFaq();
    const [first] = screen.getAllByRole('group');

    expect(first).toHaveTextContent(/^Kuidas valida fondipensioni lepingut\?/);
    expect(first).toHaveTextContent(/keskmise elueani.*maksuvaba/);
    expect(first).toHaveTextContent(/väiksem.*kauem/);
    expect(first).toHaveTextContent(/lühem.*ei ole maksuvaba/i);
  });

  it('asks about starting five years before the pension age, not at a fixed age', () => {
    renderFaq();

    expect(
      screen.getByText(/^Kas fondipensioni saab alustada juba 5\sa enne pensioniiga\?$/),
    ).toBeInTheDocument();
  });

  it('names the III pillar start relative to the pension age', () => {
    renderFaq();

    expect(
      screen.getByText(/III\ssambast saad fondipensioni alates 55-aastaselt/),
    ).toHaveTextContent(/või 5\sa enne pensioniiga\./);
  });
});
