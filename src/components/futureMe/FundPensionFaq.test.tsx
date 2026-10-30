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
  it('asks which pillar to use first, third, preferring the III pillar only while still working', () => {
    renderFaq({ hasBothPillars: true });
    const [, , third] = screen.getAllByRole('group');

    expect(third).toHaveTextContent(/^Kumba sammast enne kasutada\?/);
    expect(third).toHaveTextContent(/Kui töötad samal ajal edasi, siis III\ssammast\./);
    expect(third).toHaveTextContent(/lõpevad II\ssamba sissemaksed igaveseks, ka riigi 4%/);
    expect(third).toHaveTextContent(/III\ssambasse võid sissemakseid jätkata/);
    expect(third).toHaveTextContent(/Kui sa enam tööd ei tee.*on sambad üsna võrdsed/);
  });

  it('answers without a source line under the answers', () => {
    renderFaq({ hasBothPillars: true });

    expect(document.body).not.toHaveTextContent(/Allikas/);
  });

  it('does not ask which pillar to use first with only one pillar', () => {
    renderFaq();

    expect(orderQuestion()).not.toBeInTheDocument();
  });

  it('starts with what monthly payouts are, naming the funded pension and the longer period in one contract', () => {
    renderFaq();
    const [first] = screen.getAllByRole('group');

    expect(first).toHaveTextContent(/^Mis on igakuised väljamaksed ehk fondipension\?/);
    expect(first).toHaveTextContent(/määra pikem eeldatav eluiga ühe lepingu sõlmimisel/);
  });

  it('then tells how to choose the contract, until which age one contract pays and how to end it', () => {
    renderFaq();
    const [, second] = screen.getAllByRole('group');

    expect(second).toHaveTextContent(/^Kuidas valida igakuiste väljamaksete lepingut\?/);
    expect(second).toHaveTextContent(/keskmise elueani.*maksuvaba/);
    expect(second).toHaveTextContent(/väiksem.*kauem/);
    expect(second).toHaveTextContent(/lühem.*ei ole tulumaksuvaba/i);
    expect(second).toHaveTextContent(/Alguses on väljamaksed suuremad/);
    expect(second).toHaveTextContent(/Igal aastal saad perioodi uuesti määrata/);
    expect(second).toHaveTextContent(/Fondipension ei ole lõplik ega siduv kokkulepe/);
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
