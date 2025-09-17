import React from 'react';
import { usePageTitle } from '../common/usePageTitle';

const SecondPillarTaxWin = () => {
  usePageTitle('pageTitle.secondPillarTaxWin');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <div className="d-flex flex-column gap-4">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0">Sinu II samba maksuvõit</h1>
          <p className="m-0">
            Oled Eesti kõige targemate investorite hulgas, sest tõstsid eelmisel aastal II samba
            sissemakseid. 2025. aasta esimese 8 kuuga on sul kokku kogunenud 2400 eurot. Sellest
            märkimisväärne osa on maksuvõit.
          </p>
        </div>
        <div>Chart placeholder</div>
        <div className="d-flex flex-column gap-3">
          <p className="m-0">
            II samba sissemaksete tõstmisega oled hakanud ise rohkem koguma ning saad ka riigilt
            märksa suurema maksuvõimenduse.
          </p>
          <p className="m-0">Kuidas saaksid maksuvõitu suurendada?</p>
          <ul className="m-0">
            <li>
              Tõsta II samba sissemakse 6% peale. Sellel aastal oleksid saanud maksuvõitu veel
              X eurot.
            </li>
            <li>Tee sissemakse III sambasse.</li>
          </ul>
          <p className="m-0">
            See on sinu vara, mis aitab sinu tulevikku kindlustada. Vaata oma kontolt, kuidas su
            varal on läinud.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecondPillarTaxWin;
