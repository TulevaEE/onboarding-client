import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/browser';
import { correctExpectedIncome, expectYearlyIncome } from '../../common/api';
import { THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY } from '../../common/apiHooks';
import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';

const CORRECTION_DELAY_MS = 400;

type Correction =
  | { kind: 'month'; month: string; amount: number }
  | { kind: 'year'; amount: number };

const send = (correction: Correction) =>
  correction.kind === 'month'
    ? correctExpectedIncome(correction.month, correction.amount)
    : expectYearlyIncome(correction.amount);

const saveInOrder = (corrections: Correction[]) =>
  corrections.reduce<Promise<ThirdPillarTaxHeadroom | null>>(
    (previous, correction) => previous.then(() => send(correction)),
    Promise.resolve(null),
  );

export const useExpectedIncomeCorrection = () => {
  const queryClient = useQueryClient();
  const unsaved = useRef<Correction[]>([]);
  const delay = useRef<number>();
  const latestSave = useRef(0);
  const savesInFlight = useRef(0);
  const previousSave = useRef<Promise<unknown>>(Promise.resolve());
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => window.clearTimeout(delay.current), []);

  const save = async () => {
    const corrections = unsaved.current;
    unsaved.current = [];
    latestSave.current += 1;
    const thisSave = latestSave.current;
    savesInFlight.current += 1;
    const thisSaveInOrder = previousSave.current
      .catch(() => null)
      .then(() => saveInOrder(corrections));
    previousSave.current = thisSaveInOrder;
    try {
      const headroom = await thisSaveInOrder;
      if (thisSave === latestSave.current) {
        queryClient.setQueryData(THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY, headroom);
        setSaving(false);
      }
    } catch (error) {
      captureException(error);
      queryClient.invalidateQueries(THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY);
      if (thisSave === latestSave.current) {
        setFailed(true);
        setSaving(false);
      }
    } finally {
      savesInFlight.current -= 1;
    }
  };

  const schedule = (corrections: Correction[]) => {
    unsaved.current = corrections;
    window.clearTimeout(delay.current);
    if (corrections.length === 0) {
      if (savesInFlight.current === 0) {
        setSaving(false);
      }
      return;
    }
    setSaving(true);
    setFailed(false);
    delay.current = window.setTimeout(save, CORRECTION_DELAY_MS);
  };

  const correctMonth = (month: string, amount: number | null) => {
    const otherCorrections = unsaved.current.filter(
      (correction) => correction.kind !== 'month' || correction.month !== month,
    );
    schedule(
      amount === null ? otherCorrections : [...otherCorrections, { kind: 'month', month, amount }],
    );
  };

  const correctYear = (amount: number | null) =>
    schedule(
      amount === null
        ? unsaved.current.filter((correction) => correction.kind !== 'year')
        : [{ kind: 'year', amount }],
    );

  return { correctMonth, correctYear, saving, failed };
};
