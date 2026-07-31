import React from 'react';
import { useFundNavHistory } from './api/navHistory.api';
import { NavHistoryByIsin } from './portfolio';

/**
 * One hook call per fund, so each ISIN gets its own cached NAV query.
 * React requires a stable number of hooks, hence a component per ISIN.
 */
const NavHistoryForIsin: React.FunctionComponent<{
  isin: string;
  from: string;
  to: string;
  onLoaded: (isin: string, values: NavHistoryByIsin[string]) => void;
}> = ({ isin, from, to, onLoaded }) => {
  const { data } = useFundNavHistory(isin, from, to);

  React.useEffect(() => {
    if (data) {
      onLoaded(isin, data);
    }
  }, [data, isin, onLoaded]);

  return null;
};

export const NavHistoryLoader: React.FunctionComponent<{
  isins: string[];
  from: string;
  to: string;
  onLoaded: (isin: string, values: NavHistoryByIsin[string]) => void;
}> = ({ isins, from, to, onLoaded }) => (
  <>
    {isins.map((isin) => (
      <NavHistoryForIsin key={isin} isin={isin} from={from} to={to} onLoaded={onLoaded} />
    ))}
  </>
);
