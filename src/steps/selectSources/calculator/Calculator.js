import React from 'react';

import './Calculator.scss';

export const Calculator = () => (
  <div className="tv-calculator">
    <div className="row">
      <div className="col-lg-12 px-4 py-4">
        <h1>Miks valitsemistasu loeb?</h1>
        <p>
          Näiliselt ainult natuke kõrgem valitsemistasu hammustab väga
          suure tüki sinu tulevasest pensionist. Tulevas maksad fondivalitsejale
          vähem kui üheski teises Eesti pensionifondis.<br />

          Arvuta, kui palju sa tänu Tulevale säästad!
        </p>

        <div className="mt-5 tv-calculator__input-row px-2">
          <div className="row px-4 py-4">
            <div className="col-lg-3">
              <label htmlFor="salary">
                <small><b>Sinu brutopalk täna</b></small>
              </label>
              <input
                id="salary"
                className="form-control pr-0"
                value="5000"
                type="number"
              />
            </div>
            <div className="col-lg-9">
              <label htmlFor="return-rate">
                <small>
                  <b>Maailma väärtpaberiturgude keskmine oodatav aastatootlus - %</b>
                </small>
              </label>
              <input
                id="return-rate"
                className="form-control pr-0 tv-calculator__input"
                value="8"
                type="number"
              />
            </div>
          </div>
        </div>

        <div className="tv-calculator__details-block mt-1 px-3 py-1">

          <div className="row tv-calculator__underline py-2">
            <div className="col-lg-6">
              <small>Arvutus</small>
            </div>
            <div className="col-lg-3">
              <small>Vanades fondides</small>
            </div>
            <div className="col-lg-3">
              <small>Tuleva fondis</small>
            </div>
          </div>

          <div className="row tv-calculator__underline tv-calculator__details-row py-2">
            <div className="col-lg-6">
              <b>Fondivalitsejale makstud valitsemistasude tõttu
                kulutad kokku</b>
            </div>
            <div className="col-lg-3">
              <div className="tv-calculator__num tv-calculator__red">44500€</div>
            </div>
            <div className="col-lg-3">
              <div className="tv-calculator__num">44500€</div>
            </div>
          </div>

          <div className="row tv-calculator__underline tv-calculator__details-row py-2">
            <div className="col-lg-6">
              <b>Pensioniks koguneb sulle</b>
            </div>
            <div className="col-lg-3">
              <div className="tv-calculator__num">127857€</div>
            </div>
            <div className="col-lg-3">
              <div className="tv-calculator__num tv-calculator__green">127857€</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Calculator;
