import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { HelpButton } from './HelpButton';
import { HELP_TOPICS, HelpTopic } from './helpTopics';
import translations from '../translations';
import { installDialogPolyfill } from './dialogPolyfill';

const renderHelp = (topic: HelpTopic = 'sex') =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <HelpButton topic={topic} />
    </IntlProvider>,
  );

const openerOf = (name: RegExp) => screen.getByRole('button', { name });

const dialog = () => screen.getByRole('dialog', { name: 'Miks küsime sugu?' });

describe('HelpButton', () => {
  beforeAll(installDialogPolyfill);

  it('names the button after the explanation it opens and keeps the dialog closed', () => {
    renderHelp();

    expect(openerOf(/^Selgitus: Miks küsime sugu$/)).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a modal dialog named by the question and moves focus to its heading', () => {
    renderHelp();

    userEvent.click(openerOf(/Miks küsime sugu/));

    expect(dialog()).toBeInTheDocument();
    expect(within(dialog()).getByRole('heading', { name: 'Miks küsime sugu?' })).toHaveFocus();
    expect(
      within(dialog()).getByText(/Naised elavad Eestis keskmiselt kauem kui mehed/),
    ).toBeInTheDocument();
  });

  it('shows a table and a source link of the explanation as markup', () => {
    renderHelp();

    userEvent.click(openerOf(/Miks küsime sugu/));

    expect(within(dialog()).getByRole('columnheader', { name: 'Naised' })).toBeInTheDocument();
    expect(within(dialog()).getByRole('rowheader', { name: '65' })).toBeInTheDocument();
    expect(
      within(dialog()).getByRole('link', { name: /^Statistikaamet RV045 ja RV046/ }),
    ).toHaveAttribute(
      'href',
      'https://andmed.stat.ee/et/stat/rahvastik__rahvastikusundmused__surmad/RV045',
    );
  });

  it('closes with the close button and returns focus to the button that opened it', () => {
    renderHelp();
    userEvent.click(openerOf(/Miks küsime sugu/));

    userEvent.click(within(dialog()).getByRole('button', { name: 'Sulge selgitus' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openerOf(/Miks küsime sugu/)).toHaveFocus();
  });

  it('closes when the browser closes the dialog, as it does on Esc', () => {
    renderHelp();
    userEvent.click(openerOf(/Miks küsime sugu/));

    act(() => {
      dialog().dispatchEvent(new Event('close'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openerOf(/Miks küsime sugu/)).toHaveFocus();
  });

  it('closes on a click on the backdrop but not on a click inside the dialog', () => {
    renderHelp();
    userEvent.click(openerOf(/Miks küsime sugu/));

    userEvent.click(within(dialog()).getByRole('heading', { name: 'Miks küsime sugu?' }));
    expect(dialog()).toBeInTheDocument();

    userEvent.click(dialog());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the page from scrolling while the dialog is open', () => {
    renderHelp();

    userEvent.click(openerOf(/Miks küsime sugu/));
    expect(document.body).toHaveStyle({ position: 'fixed' });

    userEvent.click(within(dialog()).getByRole('button', { name: 'Sulge selgitus' }));
    expect(document.body).not.toHaveStyle({ position: 'fixed' });
  });

  it.each(HELP_TOPICS)('opens the explanation of %s with its question and an answer', (topic) => {
    renderHelp(topic);

    userEvent.click(screen.getByRole('button', { name: /^Selgitus: / }));

    const opened = screen.getByRole('dialog');
    const question = within(opened).getByRole('heading');
    expect(opened).toHaveAccessibleName(question.textContent as string);
    expect(question).not.toHaveTextContent(/^futureMe\./);
    expect(opened).not.toHaveTextContent(/futureMe\.help|<\/?\w+>/);
    expect(opened).toHaveTextContent(/[\s\S]{200}/);
  });
});
