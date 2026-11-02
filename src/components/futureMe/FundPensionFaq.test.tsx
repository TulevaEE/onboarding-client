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

  it('says a smaller payout cannot be chosen, but a longer contract end or a new longer contract each year can lower it', () => {
    renderFaq();
    const surplus = screen
      .getAllByRole('group')
      .find((group) => /^Mis saab, kui väljamaksed on suuremad/.test(group.textContent || ''));

    expect(surplus).toHaveTextContent(/Väiksemat summat valida ei saa\./);
    expect(surplus).toHaveTextContent(
      /Saad aga valida pikema lepingu lõpu või sõlmida igal aastal uue lepingu uuele pikemale perioodile, mis võib väljamakse suurust vähendada\./,
    );
  });

  it('says the surplus can partly go back to the III pillar and that what to do with it is the saver’s own decision', () => {
    renderFaq();
    const surplus = screen
      .getAllByRole('group')
      .find((group) => /^Mis saab, kui väljamaksed on suuremad/.test(group.textContent || ''));

    expect(surplus).toHaveTextContent(
      /Ülejäägi saad võimalusel suunata osaliselt tagasi ka III\ssambasse, olenevalt tulumaksusoodustuse olukorrast\./,
    );
    expect(surplus).toHaveTextContent(
      /Väljavõetud summa ülejääk on sinu otsustada: kas investeerid selle \(nt hoiusele\) või kasutad muul viisil\./,
    );
  });

  it('says the period can be the saver’s own, not the statistical years, but not a shorter one', () => {
    renderFaq();
    const know = screen
      .getAllByRole('group')
      .find((group) => /^Mida teada igakuiste väljamaksete kohta/.test(group.textContent || ''));

    expect(know).toHaveTextContent(
      /Perioodiks võib seada ka sinu valitud perioodi, mitte statistiliselt elada jäänud aastad\. Statistiliselt lühemat perioodi siin määrata ei saa\./,
    );
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
