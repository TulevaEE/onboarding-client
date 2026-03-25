import { useEffect, useRef } from 'react';
import TomSelect from 'tom-select';
import 'tom-select/dist/css/tom-select.bootstrap5.css';

export type SelectOption = { value: string; text: string };

type Props<T extends SelectOption> = {
  lookup: (query: string) => Promise<T[]>;
  onChange: (value: T | undefined) => void;
  options?: T[];
  defaultValue?: string;
  onBlur?: () => void;
  ariaLabel?: string;
  className?: string;
  placeholder?: string;
};

export const SelectWithAutocomplete = <T extends SelectOption>({
  className = 'form-select form-select-lg',
  options,
  defaultValue,
  ariaLabel,
  lookup,
  onChange,
  onBlur,
  placeholder,
}: Props<T>) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const tomSelectRef = useRef<TomSelect | null>(null);

  useEffect(() => {
    if (!selectRef.current) {
      return undefined;
    }
    tomSelectRef.current = new TomSelect(selectRef.current, {
      maxItems: 1,
      load: (q: string, cb: (o: T[]) => void) => lookup(q).then(cb),
      onChange: (value: string) => onChange(tomSelectRef.current.options[value]),
      options,
      items: defaultValue ? [defaultValue] : [],
      placeholder,
    });
    return () => {
      tomSelectRef.current?.destroy();
      tomSelectRef.current = null;
    };
  }, []);
  return <select ref={selectRef} className={className} aria-label={ariaLabel} onBlur={onBlur} />;
};
