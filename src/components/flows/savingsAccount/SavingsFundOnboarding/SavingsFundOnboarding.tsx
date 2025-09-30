import { FC, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { usePageTitle } from '../../../common/usePageTitle';

const useOtherInput = () => {
  const [isSelected, setIsSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSelected) {
      inputRef.current?.focus();
    }
  }, [isSelected]);

  return { isSelected, setIsSelected, inputRef };
};

export const SavingsFundOnboarding: FC = () => {
  usePageTitle('pageTitle.savingsFundOnboarding');

  const history = useHistory();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [residenceCountry, setResidenceCountry] = useState('Eesti');
  const isEstonianResidence = residenceCountry === 'Eesti';
  const {
    isSelected: isOtherIncomeSelected,
    setIsSelected: setIsOtherIncomeSelected,
    inputRef: otherIncomeInputRef,
  } = useOtherInput();
  const {
    isSelected: isOtherInvestmentGoalSelected,
    setIsSelected: setIsOtherInvestmentGoalSelected,
    inputRef: otherInvestmentGoalInputRef,
  } = useOtherInput();
  const sections = [
    <section className="d-flex flex-column gap-4" key="citizenship">
      <div className="section-header d-flex flex-column gap-1" id="section01-header">
        <h2 className="m-0">Mis riigi kodanik sa oled?</h2>
        <p className="m-0">Vali kõik riigid, mille kodakondsus sul on.</p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <select
          className="form-select form-select-lg"
          aria-label="section01-header"
          multiple
          size={10}
        >
          <optgroup label="Euroopa">
            <option>Eesti</option>
            <option>Austria</option>
            <option>Soome</option>
          </optgroup>
          <optgroup label="Muu maailm">
            <option>Malta</option>
            <option>Põhja-Korea</option>
            <option>Ukraina</option>
            <option>Valgevene</option>
            <option>Venemaa</option>
            <option>Venezuela</option>
            <option>Zimbabwe</option>
          </optgroup>
        </select>
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="residence">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Sinu alaline elukoht</h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div>
          <label htmlFor="section02-control01" className="form-label">
            Riik
          </label>
          <select
            className="form-select form-select-lg"
            id="section02-control01"
            autoComplete="country"
            value={residenceCountry}
            onChange={(event) => setResidenceCountry(event.target.value)}
          >
            <optgroup label="Euroopa">
              <option value="Eesti">Eesti</option>
              <option value="Austria">Austria</option>
              <option value="Soome">Soome</option>
            </optgroup>
            <optgroup label="Muu maailm">
              <option value="Malta">Malta</option>
              <option value="Põhja-Korea">Põhja-Korea</option>
              <option value="Ukraina">Ukraina</option>
              <option value="Valgevene">Valgevene</option>
              <option value="Venemaa">Venemaa</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Zimbabwe">Zimbabwe</option>
            </optgroup>
          </select>
        </div>
        {isEstonianResidence ? (
          <>
            <div>
              <label htmlFor="section02a-control02" className="form-label">
                Aadress
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                id="section02a-control02"
                autoComplete="off"
              />
            </div>
            <div className="row gx-3">
              <div className="col-sm-4">
                <label htmlFor="section02a-control03" className="form-label">
                  Korteri number
                </label>
                <select
                  className="form-select form-select-lg"
                  id="section02a-control03"
                  autoComplete="off"
                >
                  <option>20</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="row gx-3 row-gap-4">
              <div className="col-sm-8">
                <label htmlFor="section02b-control02" className="form-label">
                  Linn
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="section02b-control02"
                  autoComplete="address-level2"
                />
              </div>
              <div className="col-sm-4">
                <label htmlFor="section02b-control03" className="form-label">
                  Postiindeks
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="section02b-control03"
                  autoComplete="postal-code"
                />
              </div>
            </div>
            <div>
              <label htmlFor="section02b-control04" className="form-label">
                Aadress (tänav, maja, korter)
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                id="section02b-control04"
                autoComplete="address-line1"
              />
            </div>
          </>
        )}
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="contacts">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Sinu kontaktandmed</h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div>
          <label htmlFor="section03-control01" className="form-label">
            E-post
          </label>
          <input
            type="email"
            className="form-control form-control-lg"
            id="section03-control01"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="section03-control02" className="form-label">
            Telefon <span className="text-secondary fw-normal">(valikuline)</span>
          </label>
          <input
            type="tel"
            className="form-control form-control-lg"
            id="section03-control02"
            autoComplete="tel"
          />
        </div>
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="politically-exposed">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Kas oled riikliku taustaga isik?</h2>
        <p className="m-0">
          Riikliku taustaga isik on eraisik, kes täidab või on viimase aasta jooksul täitnud avaliku
          võimu olulisi ülesandeid või kes on sellise isiku pereliige või lähedane kaastöötaja.
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div className="selection-group d-flex flex-column gap-2">
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="radio" name="radioSet01" id="radioSet01-01" />
            <label className="form-check-label" htmlFor="radioSet01-01">
              Olen riikliku taustaga isik
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="radio" name="radioSet01" id="radioSet01-02" />
            <label className="form-check-label" htmlFor="radioSet01-02">
              Ma ei ole riikliku taustaga isik
            </label>
          </div>
        </div>
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="investment-goal">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Mis on sinu investeerimise eesmärk?</h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div className="selection-group d-flex flex-column gap-2">
          <div className="form-check m-0 lead">
            <input
              className="form-check-input"
              type="radio"
              name="radioSet02"
              id="radioSet02-01"
              onChange={() => setIsOtherInvestmentGoalSelected(false)}
            />
            <label className="form-check-label" htmlFor="radioSet02-01">
              Pikaajaline investeerimine, sh pension
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input
              className="form-check-input"
              type="radio"
              name="radioSet02"
              id="radioSet02-02"
              onChange={() => setIsOtherInvestmentGoalSelected(false)}
            />
            <label className="form-check-label" htmlFor="radioSet02-02">
              Konkreetne eesmärk (kodu, haridus jms)
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input
              className="form-check-input"
              type="radio"
              name="radioSet02"
              id="radioSet02-03"
              onChange={() => setIsOtherInvestmentGoalSelected(false)}
            />
            <label className="form-check-label" htmlFor="radioSet02-03">
              Lapse tuleviku tarbeks kogumine
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input
              className="form-check-input"
              type="radio"
              name="radioSet02"
              id="radioSet02-04"
              onChange={() => setIsOtherInvestmentGoalSelected(false)}
            />
            <label className="form-check-label" htmlFor="radioSet02-04">
              Aktiivne sh igapäevane kauplemine
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input
              className="form-check-input"
              type="radio"
              name="radioSet02"
              id="radioSet02-05"
              checked={isOtherInvestmentGoalSelected}
              onChange={(event) => setIsOtherInvestmentGoalSelected(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="radioSet02-05" id="radioSet02-05-label">
              Muu…
            </label>
            {isOtherInvestmentGoalSelected ? (
              <input
                ref={otherInvestmentGoalInputRef}
                type="text"
                className="form-control form-control-lg mt-2"
                aria-labelledby="radioSet02-05-label"
                placeholder="Sisesta investeerimise eesmärk"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="investment-assets">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Kui palju on sul investeeritavat vara?</h2>
        <p className="m-0">
          Investeeritavad varad on kohe kasutatav raha ja investeeringud, mida saad kiiresti müüa –
          näiteks pangakontol või hoiusel olev raha ning aktsiad, võlakirjad ja fondid.
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div className="selection-group d-flex flex-column gap-2">
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="radio" name="radioSet03" id="radioSet03-01" />
            <label className="form-check-label" htmlFor="radioSet03-01">
              Kuni 20 000 €
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="radio" name="radioSet03" id="radioSet03-02" />
            <label className="form-check-label" htmlFor="radioSet03-02">
              20 001–40 000 €
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="radio" name="radioSet03" id="radioSet03-03" />
            <label className="form-check-label" htmlFor="radioSet03-03">
              40 001–80 000 €
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="radio" name="radioSet03" id="radioSet03-04" />
            <label className="form-check-label" htmlFor="radioSet03-04">
              80 001 € või enam
            </label>
          </div>
        </div>
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="income-sources">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Millised on sinu sissetulekuallikad?</h2>
        <p className="m-0">Vali kõik allikad, kust sissetulekut saad.</p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div className="selection-group d-flex flex-column gap-2">
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="checkbox" id="checkSet01-01" />
            <label className="form-check-label" htmlFor="checkSet01-01">
              Palk
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="checkbox" id="checkSet01-02" />
            <label className="form-check-label" htmlFor="checkSet01-02">
              Säästud ja hoiused
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="checkbox" id="checkSet01-03" />
            <label className="form-check-label" htmlFor="checkSet01-03">
              Investeeringud (väärtpaberid, kinnisvara, jm)
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="checkbox" id="checkSet01-04" />
            <label className="form-check-label" htmlFor="checkSet01-04">
              Pension ja sotsiaaltoetused
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="checkbox" id="checkSet01-05" />
            <label className="form-check-label" htmlFor="checkSet01-05">
              Abikaasa ja pere raha, sh pärand
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input className="form-check-input" type="checkbox" id="checkSet01-06" />
            <label className="form-check-label" htmlFor="checkSet01-06">
              Tulu äriühingust (dividendid, juhatuse tasu)
            </label>
          </div>
          <div className="form-check m-0 lead">
            <input
              className="form-check-input"
              type="checkbox"
              id="checkSet01-07"
              checked={isOtherIncomeSelected}
              onChange={(event) => setIsOtherIncomeSelected(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="checkSet01-07" id="checkSet01-07-label">
              Muu…
            </label>
            {isOtherIncomeSelected ? (
              <input
                ref={otherIncomeInputRef}
                type="text"
                className="form-control form-control-lg mt-2"
                aria-labelledby="checkSet01-07-label"
                placeholder="Sisesta sissetulekuallikas"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>,
    <section className="d-flex flex-column gap-4" key="conditions">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">Tutvu tingimustega</h2>
      </div>
      <div className="section-content d-flex flex-column gap-5">
        <p className="m-0">
          <a
            className="d-flex align-items-center gap-2 p-3 p-sm-4 bg-blue-1 border border-blue-2 rounded-3 lead"
            href="https://tuleva.ee/"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5" />
              <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
            </svg>
            <span className="flex-fill">Täiendava kogumisfondi tingimused</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="(avaneb uues aknas)"
            >
              <path d="M7 7h10v10" />
              <path d="M7 17 17 7" />
            </svg>
          </a>
        </p>
        <div className="form-check m-0 lead">
          <input
            className="form-check-input"
            type="checkbox"
            id="checkSet02-01"
            checked={hasAcceptedTerms}
            onChange={(event) => {
              setHasAcceptedTerms(event.target.checked);
              if (event.target.checked) {
                setShowTermsError(false);
              }
            }}
          />
          <label className="form-check-label" htmlFor="checkSet02-01">
            Kinnitan, et olen tutvunud tingimustega
          </label>
          {showTermsError && (
            <p className="m-0 text-danger fs-base" role="alert">
              Jätkamiseks pead tingimustega nõustuma.
            </p>
          )}
        </div>
      </div>
    </section>,
  ];

  const [activeSection, setActiveSection] = useState(0);
  const totalSections = sections.length;
  const currentSection = activeSection + 1;
  const progressPercentage = (currentSection / totalSections) * 100;
  const isFirstSection = activeSection === 0;

  const showPreviousSection = () => {
    setShowTermsError(false);
    if (isFirstSection) {
      history.push('/account');
      return;
    }

    setActiveSection((current) => Math.max(current - 1, 0));
  };

  const showNextSection = () => {
    if (activeSection === totalSections - 1) {
      if (!hasAcceptedTerms) {
        setShowTermsError(true);
        return;
      }

      setShowTermsError(false);
      return;
    }

    setShowTermsError(false);
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <div className="d-flex align-items-center gap-2">
          <div
            className="progress flex-fill"
            role="progressbar"
            aria-hidden="true"
            style={{ height: '8px' }}
          >
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
          </div>
          <span className="fs-xs lh-1 text-secondary fw-medium">
            <span className="visually-hidden">Praegune samm:</span> {currentSection}/{totalSections}
          </span>
        </div>

        <h1 className="m-0">Täiendava kogumisfondi avamine</h1>
      </div>

      {sections[activeSection]}

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button type="button" className="btn btn-lg btn-light" onClick={showPreviousSection}>
          <FormattedMessage id="savingsFundOnboarding.back" />
        </button>
        <button type="button" className="btn btn-lg btn-primary" onClick={showNextSection}>
          <FormattedMessage id="savingsFundOnboarding.continue" />
        </button>
      </div>
    </div>
  );
};
