import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import AuthenticationLoader from './AuthenticationLoader';
import { expectNoCardOfItsOwn } from '../../../test/expectNoCardOfItsOwn';
import { expectFullWidthCancel } from '../../../test/expectFullWidthCancel';
import {
  forgetTheLayout,
  layOutAboveTheFold,
  layOutBelowTheFold,
  scrolledIntoView,
  watchScrollingIntoView,
} from '../../../test/fold';

const renderLoader = (props: Record<string, unknown>, language: 'en' | 'et' = 'en') =>
  render(
    <IntlProvider locale={language} messages={translations[language]}>
      <AuthenticationLoader {...props} />
    </IntlProvider>,
  );

describe('AuthenticationLoader', () => {
  afterEach(forgetTheLayout);

  it('asks in one sentence above the code to compare it and to check that the request names Tuleva', () => {
    const { container } = renderLoader({ controlCode: '1337' });

    expect(
      screen.getByText('Make sure your phone shows this code and the name Tuleva:'),
    ).toBeInTheDocument();
    expect(container).toHaveTextContent(/Tuleva:1337/);
    expect(screen.queryByText(/request says Tuleva/)).not.toBeInTheDocument();
  });

  it('asks in one sentence to choose the code in the Smart-ID app when the request names Tuleva', () => {
    renderLoader({ controlCode: '1337', verificationCodeChoice: true });

    expect(screen.getByText(/^Choose this code if the request names Tuleva:$/)).toBeInTheDocument();
  });

  it.each([
    [false, 'Veendu, et telefonis on see kood ja nimi Tuleva:'],
    [true, 'Vali see kood, kui päringus on nimi Tuleva:'],
  ] as const)(
    'asks in Estonian in one sentence (code choice: %s)',
    (verificationCodeChoice, text) => {
      renderLoader({ controlCode: '1337', verificationCodeChoice }, 'et');

      expect(screen.getByText(text)).toBeInTheDocument();
    },
  );

  it('draws no card of its own unless it is overlayed, so it can sit inside the login card', () => {
    const { container } = renderLoader({ controlCode: '1337' });

    expectNoCardOfItsOwn(container);
  });

  it('cancels the login from the verification code', () => {
    const onCancel = jest.fn();
    renderLoader({ controlCode: '1337', onCancel });

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers no Cancel before there is a verification code', () => {
    renderLoader({});

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('offers the same full-width Cancel under the verification code as on every other login screen', () => {
    renderLoader({ controlCode: '1337' });

    expectFullWidthCancel(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('moves the focus to the instruction once the verification code arrives, so a screen reader reads it', () => {
    const { rerender } = renderLoader({});

    rerender(
      <IntlProvider locale="en" messages={translations.en}>
        <AuthenticationLoader controlCode="1337" />
      </IntlProvider>,
    );

    expect(
      screen.getByText('Make sure your phone shows this code and the name Tuleva:'),
    ).toHaveFocus();
  });

  it('brings the verification code and Cancel into view when the code arrives below the fold', () => {
    const scrollIntoView = watchScrollingIntoView();
    const { rerender } = renderLoader({});
    layOutBelowTheFold();

    rerender(
      <IntlProvider locale="en" messages={translations.en}>
        <AuthenticationLoader controlCode="1337" />
      </IntlProvider>,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    const [scrolled] = scrolledIntoView(scrollIntoView);
    expect(scrolled).toHaveTextContent('1337');
    expect(scrolled).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('leaves the page where it is when the verification code and Cancel arrive in view', () => {
    const scrollIntoView = watchScrollingIntoView();
    layOutAboveTheFold();

    renderLoader({ controlCode: '1337' });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('has nothing to compare while there is no verification code', () => {
    renderLoader({});

    expect(screen.queryByText(/the name Tuleva/)).not.toBeInTheDocument();
  });
});
