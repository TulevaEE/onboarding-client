import React from 'react';
import { Message } from 'retranslate';

export const NonMember = () => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead">
        <Message dangerouslyTranslateInnerHTML="new.user.flow.non.member.title" />
      </p>
      <p><Message dangerouslyTranslateInnerHTML="new.user.flow.non.member.intro" /></p>
    </div>
  </div>
);

export default NonMember;
