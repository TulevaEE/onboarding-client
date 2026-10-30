import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { FundPensionFaq } from './FundPensionFaq';

const renderFaq = (props: React.ComponentProps<typeof FundPensionFaq> = {}) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FundPensionFaq {...props} />
    </IntlProvider>,
  );

const orderQuestion = () => screen.queryByText('Kumba sammast enne kasutada?');

describe('fund pension FAQ', () => {
  it('asks which pillar to use first, second, preferring the III pillar only while still working', () => {
    renderFaq({ hasBothPillars: true });
    const [, second] = screen.getAllByRole('group');

    expect(second).toHaveTextContent(/^Kumba sammast enne kasutada\?/);
    expect(second).toHaveTextContent(/Kui töötad samal ajal edasi, siis III\ssammast\./);
    expect(second).toHaveTextContent(/lõpevad II\ssamba sissemaksed igaveseks, ka riigi 4%/);
    expect(second).toHaveTextContent(/III\ssambasse võid sissemakseid jätkata/);
    expect(second).toHaveTextContent(/Kui sa enam tööd ei tee.*on sambad üsna võrdsed/);
  });

  it('does not ask which pillar to use first with only one pillar', () => {
    renderFaq();

    expect(orderQuestion()).not.toBeInTheDocument();
  });

  it('starts with how to choose the contract and until which age one contract pays', () => {
    renderFaq();
    const [first] = screen.getAllByRole('group');

    expect(first).toHaveTextContent(/^Kuidas valida igakuiste väljamaksete lepingut\?/);
    expect(first).toHaveTextContent(/keskmise elueani.*maksuvaba/);
    expect(first).toHaveTextContent(/väiksem.*kauem/);
    expect(first).toHaveTextContent(/lühem.*ei ole tulumaksuvaba/i);
  });

  it('asks about starting five years before the pension age, not at a fixed age', () => {
    renderFaq();

    expect(
      screen.getByText(/^Kas igakuisi väljamakseid saab alustada juba 5\sa enne pensioniiga\?$/),
    ).toBeInTheDocument();
  });

  it('names the III pillar start relative to the pension age', () => {
    renderFaq();

    expect(
      screen.getByText(/III\ssambast saad igakuisi väljamakseid alates 55-aastaselt/),
    ).toHaveTextContent(/või 5\sa enne pensioniiga\./);
  });
});
