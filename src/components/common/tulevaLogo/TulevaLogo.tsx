import React, { ImgHTMLAttributes, useState } from 'react';

import logo from '../logo.svg';
import logoOnDark from '../logo-on-dark.svg';
import { isForcedDark } from '../forcedDark/forcedDark';

export const TulevaLogo = (props: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) => {
  const [src] = useState(() => (isForcedDark() ? logoOnDark : logo));
  return <img src={src} alt="Tuleva" {...props} />;
};
