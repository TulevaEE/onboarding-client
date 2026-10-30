import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useHighContrast } from './useHighContrast';

const Probe = () => <p>{useHighContrast() ? 'on' : 'off'}</p>;

const switchContrast = (on: boolean) =>
  act(() => {
    document.documentElement.classList.toggle('high-contrast', on);
  });

describe('useHighContrast', () => {
  afterEach(() => switchContrast(false));

  it('is off while the page is in the normal colours', () => {
    render(<Probe />);

    expect(screen.getByText('off')).toBeInTheDocument();
  });

  it('is on when the page is already in high contrast', () => {
    switchContrast(true);
    render(<Probe />);

    expect(screen.getByText('on')).toBeInTheDocument();
  });

  it('follows the footer switch while the page is open', async () => {
    render(<Probe />);

    switchContrast(true);

    expect(await screen.findByText('on')).toBeInTheDocument();
    switchContrast(false);
    expect(await screen.findByText('off')).toBeInTheDocument();
  });
});
