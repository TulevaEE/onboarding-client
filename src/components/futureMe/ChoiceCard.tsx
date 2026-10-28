import React from 'react';
import { EmojiIcon } from './FutureMeIcon';

interface Props {
  idPrefix: string;
  name: string;
  value: string;
  checked: boolean;
  title: React.ReactNode;
  text?: React.ReactNode;
  emoji?: string;
  extra?: React.ReactNode;
  onChange: () => void;
}

export const ChoiceCard = ({
  idPrefix,
  name,
  value,
  checked,
  title,
  text,
  emoji,
  extra,
  onChange,
}: Props) => {
  const id = `${idPrefix}-${value}`;

  return (
    <label className="payout-choice" htmlFor={id}>
      <input
        type="radio"
        id={id}
        aria-labelledby={`${id}-name`}
        aria-describedby={text ? `${id}-text` : undefined}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span className="payout-choice-body">
        {emoji && (
          <span className="payout-choice-emoji" aria-hidden="true">
            <EmojiIcon emoji={emoji} />
          </span>
        )}
        <strong id={`${id}-name`}>{title}</strong>
        {text && <small id={`${id}-text`}>{text}</small>}
        {extra}
      </span>
    </label>
  );
};
