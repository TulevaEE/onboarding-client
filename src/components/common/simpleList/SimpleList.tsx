import { FC, ReactNode } from 'react';

type SimpleListItemProps = {
  media?: ReactNode;
  title: ReactNode;
};

export const SimpleListItem: FC<SimpleListItemProps> = ({ media, title }) => (
  <li className="d-flex gap-2 align-items-start">
    {media ? (
      <span aria-hidden="true" className="mt-1 me-1">
        {media}
      </span>
    ) : null}
    <span>{title}</span>
  </li>
);

export const SimpleList: FC = ({ children }) => (
  <ul className="d-flex flex-column row-gap-3 list-unstyled m-0">{children}</ul>
);
