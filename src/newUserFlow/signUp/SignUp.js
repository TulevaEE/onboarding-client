import React from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';

export const SignUp = () => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead">Väga hea otsus</p>
      <p>Tuleva olulisemad tingimused</p>
      <p>Soovi korral saad lugeda kogu põhikirja</p>
      <p>Eeltäidetud väljad isikuandmetega</p>

      <div className="row">
        <div className="col-6">
          <form id="register-form" action="#" method="post" role="form">
            <div className="form-group">
              <input
                type="text" name="firstName" id="firstName" className="form-control"
                placeholder="Eesnimi"
              />
            </div>
            <div className="form-group">
              <input
                type="text" name="lastName" id="lastName" className="form-control"
                placeholder="Perekonnanimi"
              />
            </div>
            <div className="form-group">
              <input
                type="number" name="personalCode" id="personalCode" className="form-control"
                placeholder="Isikukood"
              />
            </div>
            <div className="form-group">
              <input
                type="email" name="email" id="email" className="form-control"
                placeholder="Email"
              />
            </div>
            <div className="form-group">
              <input
                type="number" name="phoneNumber" id="phoneNumber" className="form-control"
                placeholder="Telefoninumber"
              />
            </div>
          </form>
        </div>
      </div>

    </div>

    <Link className={'btn btn-primary mb-2 mr-2'} to="/signup">
      <Message>Liitun Tulevaga</Message>
    </Link>
    <Link className={'btn btn-secondary mb-2'} to="/new-user">
      <Message>Tagasi</Message>
    </Link>
  </div>
);

export default SignUp;
