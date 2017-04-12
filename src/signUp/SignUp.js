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
      <p>Nimi <br />
        Isikukood <br />
        Email <br />
        Telefon
      </p>

    </div>

    <Link className={'btn btn-primary mb-2 mr-2'} to="/signup">
      <Message>Edasi</Message>
    </Link>
    <Link className={'btn btn-secondary mb-2'} to="/new-user">
      <Message>Tagasi</Message>
    </Link>
  </div>
);

export default SignUp;
