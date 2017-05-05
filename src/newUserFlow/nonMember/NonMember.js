import React from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';

export const NonMember = () => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.non.member.title</Message></p>
      <p><Message>new.user.flow.non.member.intro</Message></p>
      <button className="btn btn-secondary mr-2 mt-2">Swedbank</button>
      <button className="btn btn-secondary mr-2 mt-2">SEB</button>
      <button className="btn btn-secondary mr-2 mt-2">LHV</button>
      <button className="btn btn-secondary mt-2">Pensionikeskus</button>
    </div>

    <Link className={'btn btn-primary mb-2 mr-2'} to="/steps/new-user">
      <Message>new.user.flow.back</Message>
    </Link>
  </div>
);

export default NonMember;
