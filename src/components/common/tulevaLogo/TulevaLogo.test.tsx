import React from 'react';
import { render, screen } from '@testing-library/react';

import { TulevaLogo } from './TulevaLogo';

describe('Tuleva logo', () => {
  afterEach(() => {
    document.documentElement.classList.remove('forced-dark');
  });

  it('shows the navy logo on a page the browser leaves light', () => {
    render(<TulevaLogo />);

    expect(screen.getByRole('img', { name: 'Tuleva' })).toHaveAttribute('src', 'logo.svg');
  });

  it('shows the logo with a white wordmark on a page the browser forces dark, so the navy does not disappear into it', () => {
    document.documentElement.classList.add('forced-dark');

    render(<TulevaLogo />);

    expect(screen.getByRole('img', { name: 'Tuleva' })).toHaveAttribute('src', 'logo-on-dark.svg');
  });

  it('passes its size and class on to the image', () => {
    render(<TulevaLogo width="146" height="66" className="brand-logo" />);

    const logo = screen.getByRole('img', { name: 'Tuleva' });
    expect(logo).toHaveAttribute('width', '146');
    expect(logo).toHaveAttribute('height', '66');
    expect(logo).toHaveClass('brand-logo');
  });
});
