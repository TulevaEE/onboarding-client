import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/browser';
import { correctExpectedIncome } from '../../common/api';
import { THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY } from '../../common/apiHooks';
import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';

const CORRECTION_DELAY_MS = 400;

const saveInOrder = (corrections: [string, number][]) =>
  corrections.reduce<Promise<ThirdPillarTaxHeadroom | null>>(
    (previous, [month, amount]) => previous.then(() => correctExpectedIncome(month, amount)),
    Promise.resolve(null),
  );

export const useExpectedIncomeCorrection = () => {
  const queryClient = useQueryClient();
  const unsaved = useRef(new Map<string, number>());
  const delay = useRef<number>();
  const latestSave = useRef(0);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => window.clearTimeout(delay.current), []);

  const save = async () => {
    const corrections = Array.from(unsaved.current.entries());
    unsaved.current.clear();
    latestSave.current += 1;
    const thisSave = latestSave.current;
    try {
      const headroom = await saveInOrder(corrections);
      if (thisSave === latestSave.current) {
        queryClient.setQueryData(THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY, headroom);
        setSaving(false);
      }
    } catch (error) {
      captureException(error);
      if (thisSave === latestSave.current) {
        setFailed(true);
        setSaving(false);
      }
    }
  };

  const correct = (month: string, amount: number) => {
    unsaved.current.set(month, amount);
    setSaving(true);
    setFailed(false);
    window.clearTimeout(delay.current);
    delay.current = window.setTimeout(save, CORRECTION_DELAY_MS);
  };

  return { correct, saving, failed };
};
