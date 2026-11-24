import { chartColors } from './chartColors';

describe('chart colors', () => {
  afterEach(() => {
    document.documentElement.classList.remove('forced-dark');
  });

  it('keeps the colors charts were designed with on a page the browser leaves light', () => {
    expect(chartColors()).toEqual({
      label: '#212529',
      zeroLine: 'rgba(0, 0, 0, 0.175)',
      barSeparator: '#fff',
      lightBlueBar: 'rgba(132,197,230,0.7)',
      lightBlueBarHover: 'rgba(83,175,220,0.7)',
    });
  });

  it('draws labels and lines light, separators in the card color and see-through bars opaque on a page the browser forces dark, which leaves canvas colors as they are', () => {
    document.documentElement.classList.add('forced-dark');

    expect(chartColors()).toEqual({
      label: '#e9ecef',
      zeroLine: 'rgba(255, 255, 255, 0.3)',
      barSeparator: '#121212',
      lightBlueBar: '#a9d6ed',
      lightBlueBarHover: '#87c7e7',
    });
  });
});
