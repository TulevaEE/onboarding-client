import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installPiiClickGuard } from './piiClickGuard';
import { PII_CLASS } from './piiMarkup';

const gtmElementText = (element: Element) =>
  ((element as HTMLElement).innerText || element.textContent || '').trim();

const metaButtonText = (element: Element) =>
  // eslint-disable-next-line testing-library/no-node-access
  element.closest('a, button, [role*="button"], [class*="btn"], [class*="button"]')?.textContent ??
  '';

const preventNavigation = (event: React.MouseEvent) => event.preventDefault();

const listenToClicks = (useCapture: boolean) => {
  const clicks: Event[] = [];
  const targets: Element[] = [];
  const listener = (event: Event) => {
    clicks.push(event);
    targets.push(event.target as Element);
  };
  document.addEventListener('click', listener, useCapture);
  return {
    clicks,
    targets,
    stop: () => document.removeEventListener('click', listener, useCapture),
  };
};

describe('installPiiClickGuard', () => {
  let uninstall: () => void;
  let elementClicks: ReturnType<typeof listenToClicks>;
  let linkClicks: ReturnType<typeof listenToClicks>;

  beforeEach(() => {
    uninstall = installPiiClickGuard();
    elementClicks = listenToClicks(true);
    linkClicks = listenToClicks(false);
  });

  afterEach(() => {
    uninstall();
    elementClicks.stop();
    linkClicks.stop();
  });

  it('shows click listeners a stand-in without the options when a select of children is clicked', () => {
    render(
      <select className={`form-select ${PII_CLASS}`} aria-label="Child">
        <option>John Doe (39001011234)</option>
        <option>Jane Doe (40404049996)</option>
      </select>,
    );

    userEvent.click(screen.getByRole('combobox', { name: 'Child' }));

    expect(elementClicks.targets).toHaveLength(1);
    const [seen] = elementClicks.targets;
    expect(gtmElementText(seen)).toBe('[pii]');
    expect(seen).toBeInstanceOf(HTMLSelectElement);
    expect(seen).toHaveClass('form-select', PII_CLASS);
  });

  it('lets a React handler inside a personal element see the element that was clicked', () => {
    const handledTargets: EventTarget[] = [];
    render(
      <div className={PII_CLASS}>
        <button type="button" onClick={(event) => handledTargets.push(event.target)}>
          John Doe
        </button>
      </div>,
    );

    userEvent.click(screen.getByRole('button', { name: 'John Doe' }));

    expect(handledTargets).toStrictEqual([screen.getByRole('button', { name: 'John Doe' })]);
  });

  it('hands the clicked element back to the event once the click has been handled', () => {
    render(
      <a className={PII_CLASS} href="/capital/transfer/1" onClick={preventNavigation}>
        John Doe
      </a>,
    );

    userEvent.click(screen.getByRole('link', { name: 'John Doe' }));

    const [click] = elementClicks.clicks;
    expect(click.target).toBe(screen.getByRole('link', { name: 'John Doe' }));
  });

  it('masks a click on a container that holds personal data', () => {
    render(
      <section aria-label="Details">
        <p className={PII_CLASS}>John Doe</p>
        <button type="button">Continue</button>
      </section>,
    );

    userEvent.click(screen.getByRole('region', { name: 'Details' }));

    expect(gtmElementText(elementClicks.targets[0])).toBe('[pii]');
  });

  it('masks a click on text that carries a personal code even without the class', () => {
    render(<p>John Doe, IK:39001011234</p>);

    userEvent.click(screen.getByText('John Doe, IK:39001011234'));

    expect(gtmElementText(elementClicks.targets[0])).toBe('[pii]');
  });

  it('keeps the name on a button away from click listeners when the icon next to it is clicked', () => {
    render(
      <button type="button" className="btn">
        <span className={PII_CLASS}>John Doe</span> <span>▾</span>
      </button>,
    );

    userEvent.click(screen.getByText('▾'));

    const [seen] = elementClicks.targets;
    expect(gtmElementText(seen)).toBe('▾');
    expect(metaButtonText(seen)).not.toContain('John Doe');
  });

  it('leaves a click without personal data untouched', () => {
    render(<button type="button">Continue</button>);

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(elementClicks.targets).toStrictEqual([screen.getByRole('button', { name: 'Continue' })]);
    expect(linkClicks.targets).toStrictEqual([screen.getByRole('button', { name: 'Continue' })]);
  });

  it('reports a personal link without its query, hash or gift token', () => {
    render(
      <a
        className={PII_CLASS}
        href="/kingitus/SECRETTOKEN?code=39001011234#top"
        onClick={preventNavigation}
      >
        John Doe
      </a>,
    );

    userEvent.click(screen.getByRole('link', { name: 'John Doe' }));

    expect(elementClicks.targets[0]).toHaveAttribute('href', '/kingitus/:token');
  });

  it('shows link listeners a stand-in of the whole link that still leads to the same place', () => {
    render(
      <a href="/capital/transfer/1" onClick={preventNavigation}>
        <span className={PII_CLASS}>John Doe</span> <span>Open</span>
      </a>,
    );

    userEvent.click(screen.getByText('Open'));

    const [seen] = linkClicks.targets;
    expect(seen).toBeInstanceOf(HTMLAnchorElement);
    expect(gtmElementText(seen)).toBe('[pii]');
    expect(seen).toHaveAttribute('href', '/capital/transfer/1');
  });

  it('leaves the clicks alone on a gift page, where analytics are off', () => {
    uninstall();
    window.history.pushState({}, '', '/kingitus/SECRETTOKEN');
    const uninstallOnGiftPage = installPiiClickGuard();
    render(
      <button type="button" className={PII_CLASS}>
        John Doe
      </button>,
    );

    userEvent.click(screen.getByRole('button', { name: 'John Doe' }));

    expect(elementClicks.targets).toStrictEqual([screen.getByRole('button', { name: 'John Doe' })]);
    uninstallOnGiftPage();
    window.history.pushState({}, '', '/');
  });

  it('keeps guarding when installed a second time and that second installation is undone', () => {
    installPiiClickGuard()();
    render(
      <button type="button" className={PII_CLASS}>
        John Doe
      </button>,
    );

    userEvent.click(screen.getByRole('button', { name: 'John Doe' }));

    expect(gtmElementText(elementClicks.targets[0])).toBe('[pii]');
  });
});
