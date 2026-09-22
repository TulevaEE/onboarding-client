import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Role } from '../../../common/apiModels';

type Props = {
  options: Role[];
  chosen: string;
  onChoose: (childPersonalCode: string) => void;
};

export const ChildPicker: FC<Props> = ({ options, chosen, onChoose }) => (
  <div className="d-flex flex-column gap-2">
    {options.length === 1 ? (
      <>
        <span className="fs-3 fw-semibold">
          <FormattedMessage id="giftLink.parent.child" />
        </span>
        <p className="form-control-plaintext form-control-lg m-0">{options[0].name}</p>
      </>
    ) : (
      <>
        <label htmlFor="gift-link-child" className="fs-3 fw-semibold">
          <FormattedMessage id="giftLink.parent.child" />
        </label>
        <select
          id="gift-link-child"
          className="form-select form-select-lg"
          value={chosen}
          onChange={(event) => onChoose(event.target.value)}
        >
          {options.map((child) => (
            <option key={child.code} value={child.code}>
              {child.name}
            </option>
          ))}
        </select>
      </>
    )}
  </div>
);
