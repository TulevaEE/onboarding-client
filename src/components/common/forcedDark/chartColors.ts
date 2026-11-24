import { isForcedDark } from './forcedDark';

const ON_A_LIGHT_PAGE = {
  label: '#212529',
  zeroLine: 'rgba(0, 0, 0, 0.175)',
  barSeparator: '#fff',
  lightBlueBar: 'rgba(132,197,230,0.7)',
  lightBlueBarHover: 'rgba(83,175,220,0.7)',
};

const ON_A_FORCED_DARK_PAGE: typeof ON_A_LIGHT_PAGE = {
  label: '#e9ecef',
  zeroLine: 'rgba(255, 255, 255, 0.3)',
  barSeparator: '#121212',
  lightBlueBar: '#a9d6ed',
  lightBlueBarHover: '#87c7e7',
};

export const chartColors = () => (isForcedDark() ? ON_A_FORCED_DARK_PAGE : ON_A_LIGHT_PAGE);
