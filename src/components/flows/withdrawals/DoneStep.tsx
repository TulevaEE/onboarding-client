import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';

export const DoneStep = () => (
  <div className="row mt-5">
    <div className="col-12 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">Väljamaksete avaldused esitatud</h2>
        {/* TODO mandate list? */}
      </SuccessNotice>
    </div>
  </div>
);
