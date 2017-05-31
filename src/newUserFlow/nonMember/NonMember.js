import React from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import Collapsible from 'react-collapsible';

import './NonMember.scss';

export const NonMember = () => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.non.member.title</Message></p>
      <p><Message>new.user.flow.non.member.intro</Message></p>
    </div>

    <Collapsible
      trigger={<button className="btn btn-secondary lhv mr-2 mt-2">
        <Message>new.user.flow.non.member.bank1.button</Message> &#9660;
      </button>}
    >
      <ol>
        <li>
          <Message>new.user.flow.non.member.bank1.content1</Message>: <a href="https://lhv.ee" target="_blank" rel="noopener noreferrer">
            <Message>new.user.flow.non.member.bank1.button</Message>
          </a>
        </li>
        <li><Message>new.user.flow.non.member.bank1.content2</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content3</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content4</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content5</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content6</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content7</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content8</Message></li>
        <li><Message>new.user.flow.non.member.bank1.content9</Message></li>
      </ol>
    </Collapsible>
    <Collapsible
      trigger={<button className="btn btn-secondary seb mr-2 mt-2">
        <Message>new.user.flow.non.member.bank2.button</Message> &#9660;
      </button>}
    >
      <ol>
        <li>
          <Message>new.user.flow.non.member.bank2.content1</Message>: <a href="https://seb.ee" target="_blank" rel="noopener noreferrer">
            <Message>new.user.flow.non.member.bank2.button</Message>
          </a>
        </li>
        <li><Message>new.user.flow.non.member.bank2.content2</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content3</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content4</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content5</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content6</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content7</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content8</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content9</Message></li>
        <li><Message>new.user.flow.non.member.bank2.content10</Message></li>
      </ol>
    </Collapsible>
    <Collapsible
      trigger={<button className="btn btn-secondary swed mr-2 mt-2">
        <Message>new.user.flow.non.member.bank3.button</Message> &#9660;
      </button>}
    >
      <ol>
        <li>
          <Message>new.user.flow.non.member.bank3.content1</Message>: <a href="https://swedbank.ee" target="_blank" rel="noopener noreferrer">
            <Message>new.user.flow.non.member.bank3.button</Message>
          </a>
        </li>
        <li><Message>new.user.flow.non.member.bank3.content2</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content3</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content4</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content5</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content6</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content7</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content8</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content9</Message></li>
        <li><Message>new.user.flow.non.member.bank3.content10</Message></li>
      </ol>
    </Collapsible>
    <Collapsible
      trigger={<button className="btn btn-secondary mr-2 mt-2">
        <Message>new.user.flow.non.member.bank4.button</Message> &#9660;
      </button>}
    >
      <ol>
        <li>
          <Message>new.user.flow.non.member.bank4.content1</Message>: <a href="https://pensionikeskus.ee" target="_blank" rel="noopener noreferrer">
            <Message>new.user.flow.non.member.bank4.button</Message>
          </a>
        </li>
        <li><Message>new.user.flow.non.member.bank4.content2</Message></li>
        <li><Message>new.user.flow.non.member.bank4.content3</Message></li>
        <li><Message>new.user.flow.non.member.bank4.content4</Message></li>
        <li><Message>new.user.flow.non.member.bank4.content5</Message></li>
        <li><Message>new.user.flow.non.member.bank4.content6</Message></li>
        <li><Message>new.user.flow.non.member.bank4.content7</Message></li>
        <li><Message>new.user.flow.non.member.bank4.content8</Message></li>
      </ol>
    </Collapsible>

    <Link className={'btn btn-primary mt-4 mb-2 mr-2'} to="/steps/new-user">
      <Message>new.user.flow.back</Message>
    </Link>
  </div>
);

export default NonMember;
