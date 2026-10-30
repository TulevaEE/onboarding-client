import React, { ReactNode } from 'react';

export const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export const hidden = (chunks: ReactNode) => <span className="visually-hidden">{chunks}</span>;
