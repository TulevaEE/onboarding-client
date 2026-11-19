import React, { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { externalLink } from './ExternalLink';
import { HELP_LINKS } from './helpLinks';
import { strong } from './richText';

const element = (Tag: keyof JSX.IntrinsicElements, className?: string) => (chunks: ReactNode) => (
  <Tag className={className}>{chunks}</Tag>
);

const HelpTable = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();
  return (
    <div
      className="help-table"
      role="region"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={intl.formatMessage({ id: 'futureMe.help.table.ariaLabel' })}
    >
      <table className="table table-sm">{children}</table>
    </div>
  );
};

const links = Object.fromEntries(
  Object.entries(HELP_LINKS).map(([tag, href]) => [tag, externalLink(href)]),
);

export const helpRichText = {
  ...links,
  strong,
  p: element('p'),
  note: element('p', 'help-note'),
  ul: element('ul'),
  ol: element('ol'),
  li: element('li'),
  table: (chunks: ReactNode) => <HelpTable>{chunks}</HelpTable>,
  thead: element('thead'),
  tbody: element('tbody'),
  tr: element('tr'),
  td: element('td'),
  colhead: (chunks: ReactNode) => <th scope="col">{chunks}</th>,
  rowhead: (chunks: ReactNode) => <th scope="row">{chunks}</th>,
};
