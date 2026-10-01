import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagManager from 'react-gtm-module';
import ReactGA from 'react-ga4';
import { createBrowserHistory } from 'history';
import { startAnalytics } from './startAnalytics';
import { PII_CLASS } from './piiMarkup';

jest.mock('react-gtm-module');
jest.mock('react-ga4');

const nativeOpen = XMLHttpRequest.prototype.open;

const isNetworkScrubbed = () => XMLHttpRequest.prototype.open !== nativeOpen;

describe('startAnalytics', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('scrubs the network before Tag Manager and GA4 start', () => {
    const scrubbedAtStart: boolean[] = [];
    (TagManager.initialize as jest.Mock).mockImplementation(() =>
      scrubbedAtStart.push(isNetworkScrubbed()),
    );
    (ReactGA.initialize as jest.Mock).mockImplementation(() =>
      scrubbedAtStart.push(isNetworkScrubbed()),
    );

    startAnalytics(createBrowserHistory());

    expect(TagManager.initialize).toHaveBeenCalledWith({ gtmId: 'GTM-MRRG43' });
    expect(ReactGA.initialize).toHaveBeenCalledWith('G-2LNCGK63HR', expect.anything());
    expect(scrubbedAtStart).toStrictEqual([true, true]);
  });

  it('does not start Tag Manager or GA4 on a gift page, where analytics are off', () => {
    window.history.pushState({}, '', '/kingitus/SECRETTOKEN');

    startAnalytics(createBrowserHistory());

    expect(TagManager.initialize).not.toHaveBeenCalled();
    expect(ReactGA.initialize).not.toHaveBeenCalled();
  });

  it('starts Tag Manager and GA4 on a Smart-ID callback page only once the login has left it', () => {
    const history = createBrowserHistory();
    history.replace('/login/smart-id/callback');

    startAnalytics(history);
    expect(TagManager.initialize).not.toHaveBeenCalled();
    expect(ReactGA.initialize).not.toHaveBeenCalled();
    history.replace('/account');

    expect(TagManager.initialize).toHaveBeenCalledWith({ gtmId: 'GTM-MRRG43' });
    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
    history.replace('/account/second-pillar');
    expect(TagManager.initialize).toHaveBeenCalledTimes(1);
  });

  it('shows click listeners a stand-in for a click on personal data once started', () => {
    const seenTexts: string[] = [];
    const listener = (event: Event) => seenTexts.push((event.target as Element).textContent ?? '');
    document.addEventListener('click', listener, true);
    startAnalytics(createBrowserHistory());
    render(
      <button type="button" className={PII_CLASS}>
        John Doe
      </button>,
    );

    userEvent.click(screen.getByRole('button', { name: 'John Doe' }));

    expect(seenTexts).toStrictEqual(['[pii]']);
    document.removeEventListener('click', listener, true);
  });
});
