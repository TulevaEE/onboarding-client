import React, { useState } from 'react';
import { useMe } from '../../common/apiHooks';
import { formatAmountForCurrency } from '../../common/utils';

export const Payout: React.FunctionComponent = () => {
  const { data: user } = useMe();
  const [partialWithdrawal, setPartialWithdrawal] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  const monthlyAmount = (10000 - amount) / 19 / 12;

  if (!user) {
    return null;
  }

  return (
    <div className="col-md-8 offset-md-2">
      <h1 className="mt-3 mb-4 text-center font-weight-semibold">Väljamaksed</h1>
      <div className="lead text-center mb-5">
        Oled <span className="font-weight-bold">60-aastane</span> ja sul on õigus kogutud
        pensionivara <span className="font-weight-bold">soodustingimustel</span> kasutama hakata.
      </div>
      {/* <div> */}
      {/*  <div className="tv-step__title tv-step__title--active"> */}
      {/*    <span className="tv-step__number mr-3"> */}
      {/*      <b>1</b> */}
      {/*    </span> */}
      {/*    Väljamakse */}
      {/*  </div> */}
      {/* </div> */}
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">Sul on III sambas kokku</h3>
        <h3 className="m-0">{formatAmountForCurrency(10000, 0)}</h3>
      </div>

      <div className="card p-4">
        <div className="d-flex flex-row justify-content-between">
          {!partialWithdrawal ? (
            <div className="text-muted">Soovid osa raha kohe välja võtta?</div>
          ) : (
            <div className="">Soovid osa raha kohe välja võtta?</div>
          )}

          <div className="custom-control custom-switch">
            <input
              type="checkbox"
              className="custom-control-input"
              id="partialWithdrawal"
              onChange={() => setPartialWithdrawal(!partialWithdrawal)}
              checked={partialWithdrawal}
            />
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="custom-control-label" htmlFor="partialWithdrawal" />
          </div>
        </div>

        {partialWithdrawal && (
          <div className="mt-3">
            <div className="form-inline">
              <div className="input-group input-group-lg w-100">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white">Võtan välja</span>
                </div>
                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  className="form-control form-control-lg text-right"
                  value={amount}
                  onChange={(event) => setAmount(event.target.valueAsNumber)}
                  onWheel={(event) => event.currentTarget.blur()}
                  lang="et"
                />
                <div className="input-group-append">
                  <span className="input-group-text bg-white">&euro;</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <input
                type="range"
                className="form-control-range"
                id="formControlRange"
                value={amount}
                onChange={(event) => setAmount(event.target.valueAsNumber)}
                min={0}
                max={10000}
                step={1}
              />
            </div>
            <div className="mt-3 text-muted">
              Riik peab kinni -10% tulumaksu. Täpne summa selgub osakute müümisel.
            </div>

            <div className="mt-3 d-flex flex-row justify-content-between">
              <h3 className="m-0">Saad järgmine kuu</h3>
              <h3 className="m-0">
                {amount > 0 ? '~' : ''}
                {formatAmountForCurrency(amount * 0.9, 0)}
              </h3>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 card p-4 bg-very-light-blue border-0">
        <div className="d-flex flex-row justify-content-between align-items-end">
          <h3 className="m-0">Saad tulumaksu&shy;vabalt</h3>
          <h3 className="m-0 pl-2">
            {monthlyAmount > 0 ? '~' : ''}
            {formatAmountForCurrency(monthlyAmount, 0)}&nbsp;kuus
          </h3>
        </div>
        <div className="mt-3 text-muted">
          Iga kuu saad kätte 0.44% osakutest, mis on tänases turuhinnas{' '}
          {formatAmountForCurrency(monthlyAmount, 0)}.
        </div>
        <div className="mt-3">
          <a href="#asdf">Sinu fondi jääv vara teenib järgnevad 19 aastat tootlust edasi.</a> Kui
          osaku turuhind kasvab, siis väljamakse suureneb, ja kui kahaneb, siis väheneb.
        </div>
      </div>
    </div>
  );
};
