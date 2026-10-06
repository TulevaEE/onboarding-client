import { useHistory, useLocation } from 'react-router-dom';

export const VIEWS = ['application', 'calculator'] as const;

export type View = (typeof VIEWS)[number];

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T =>
  allowed.find((candidate) => candidate === value) ?? allowed[0];

export const useView = (): [View, (view: View) => void] => {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);

  const setView = (view: View) => {
    params.set('view', view);
    history.replace({ search: params.toString() });
  };

  return [oneOf(params.get('view'), VIEWS), setView];
};
