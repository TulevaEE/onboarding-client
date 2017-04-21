import React from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';

export const NonMember = () => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead">Too pension Tulevasse ilma liikmeks astumata</p>
      <p>Millist netipanka kasutad?</p>
      <button className="btn btn-secondary mr-2">Swedbank</button>
      <button className="btn btn-secondary mr-2">SEB</button>
      <button className="btn btn-secondary mr-2">LHV</button>
      <button className="btn btn-secondary">Pensionikeskus</button>
    </div>

    <Link className={'btn btn-primary mb-2 mr-2'} to="/steps/new-user">
      <Message>Tagasi</Message>
    </Link>
  </div>
);

export default NonMember;
