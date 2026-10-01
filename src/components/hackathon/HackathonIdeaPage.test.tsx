import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import {
  hackathonIdeasBackend,
  hackathonRegistrationBackend,
  useTestBackendsExcept,
  userBackend,
} from '../../test/backend';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { mockUser } from '../../test/backend-responses';
import { HackathonRegistration } from '../common/apiModels/hackathon';

const server = setupServer();
let history: History;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
}

const registeredMember: HackathonRegistration = {
  registered: true,
  open: true,
  deadline: '2026-10-05T20:59:59Z',
  email: mockUser.email,
  phoneNumber: mockUser.phoneNumber,
  role: 'PARTICIPANT',
  skills: ['DESIGN'],
  otherSkills: null,
  challenges: ['INSURANCE'],
  participation: 'LOOKING_FOR_TEAM',
  idea: null,
  linkedinUrl: null,
  tshirtColor: 'NAVY',
  tshirtSize: 'M',
  termsAccepted: true,
};

const describeTheIdea = async () => {
  userEvent.click(await screen.findByLabelText('Fair lending'));
  userEvent.type(
    screen.getByLabelText('Describe the problem you want to solve'),
    'Laenu vahetamine on tülikas',
  );
  userEvent.type(
    screen.getByLabelText('Describe the solution you plan to develop at the hackathon'),
    'Fondiosaku tagatisel krediidiliin',
  );
  userEvent.click(
    within(screen.getByRole('group', { name: 'What skills does your team need?' })).getByLabelText(
      'Design',
    ),
  );
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  useTestBackendsExcept(server, ['hackathonRegistration', 'hackathonIdeas']);
});

describe('hackathon idea submission', () => {
  test('registers a member who has not registered yet together with their idea', async () => {
    const registrationBackend = hackathonRegistrationBackend(server);
    const ideasBackend = hackathonIdeasBackend(server);
    initializeComponent();
    history.push('/hackathon/idea');

    await describeTheIdea();
    expect(screen.getByText(/Ideas are the heart of the hackathon/)).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'What kind of ideas are we looking for?' }),
    ).toHaveTextContent('Impact.');
    expect(
      screen.getByText('Fields marked with an asterisk (*) are required.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Describe the problem you want to solve')).toBeRequired();
    expect(screen.getByLabelText('Describe the problem you want to solve')).toHaveAttribute(
      'aria-describedby',
      'hackathon-idea-problem-hint',
    );
    expect(
      screen.getByText("Whose problem is it? How often does it happen? What isn't working today?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Which challenge does your idea solve?' }),
    ).toBeRequired();
    expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue(mockUser.email);
    userEvent.click(
      within(
        screen.getByRole('group', { name: 'What are your skills and experience?' }),
      ).getByLabelText('Software development'),
    );
    userEvent.click(screen.getByLabelText('Other'));
    userEvent.type(screen.getByLabelText('Other skills'), 'Projektijuhtimine');
    userEvent.click(screen.getByLabelText('White'));
    userEvent.selectOptions(screen.getByLabelText('Size'), 'M');
    userEvent.click(screen.getByLabelText(/I have read the hackathon terms/));
    userEvent.click(screen.getByRole('button', { name: 'Submit idea' }));

    expect(
      await screen.findByText(
        'You are registered for the Tuleva hackathon with your idea. We will announce all submitted ideas on 2 October. You can submit another idea if you like.',
      ),
    ).toBeInTheDocument();
    expect(registrationBackend.registrations).toEqual([
      {
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        role: 'PARTICIPANT',
        skills: ['SOFTWARE_DEVELOPMENT'],
        otherSkills: 'Projektijuhtimine',
        challenges: ['FAIR_LENDING'],
        participation: 'WITH_IDEA',
        idea: null,
        linkedinUrl: null,
        tshirtColor: 'WHITE',
        tshirtSize: 'M',
        termsAccepted: true,
      },
    ]);
    expect(ideasBackend.submitted).toEqual([
      {
        challenge: 'FAIR_LENDING',
        problem: 'Laenu vahetamine on tülikas',
        solution: 'Fondiosaku tagatisel krediidiliin',
        progress: null,
        neededSkills: ['DESIGN'],
        additionalInfo: null,
      },
    ]);
    expect(screen.queryByRole('heading', { name: 'About you' })).not.toBeInTheDocument();
    expect(await screen.findByText(/Fondiosaku tagatisel krediidiliin/)).toBeInTheDocument();
  });

  test('a registered member submits only the idea', async () => {
    const registrationBackend = hackathonRegistrationBackend(server, registeredMember);
    const ideasBackend = hackathonIdeasBackend(server, {
      open: true,
      deadline: '2026-09-30T20:59:59Z',
      registered: true,
      ideas: [],
    });
    initializeComponent();
    history.push('/hackathon/idea');

    await describeTheIdea();
    expect(screen.queryByRole('heading', { name: 'About you' })).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Submit idea' }));

    expect(
      await screen.findByText(/You are registered for the Tuleva hackathon with your idea/),
    ).toBeInTheDocument();
    expect(registrationBackend.registrations).toEqual([]);
    expect(ideasBackend.submitted).toHaveLength(1);
  });

  test('requires a challenge, a problem and a solution', async () => {
    hackathonRegistrationBackend(server, registeredMember);
    const ideasBackend = hackathonIdeasBackend(server);
    initializeComponent();
    history.push('/hackathon/idea');

    userEvent.click(await screen.findByRole('button', { name: 'Submit idea' }));

    expect(await screen.findByText('Please choose a challenge')).toBeInTheDocument();
    expect(screen.getByText('Please describe the problem')).toBeInTheDocument();
    expect(screen.getByText('Please describe the solution')).toBeInTheDocument();
    expect(
      screen.getByText('Please choose at least one skill your team needs'),
    ).toBeInTheDocument();
    expect(ideasBackend.submitted).toEqual([]);
  });

  test('asks a member who has not registered for a T-shirt choice and the terms', async () => {
    const registrationBackend = hackathonRegistrationBackend(server);
    const ideasBackend = hackathonIdeasBackend(server);
    initializeComponent();
    history.push('/hackathon/idea');

    await describeTheIdea();
    userEvent.click(screen.getByRole('button', { name: 'Submit idea' }));

    expect(
      await screen.findByText("Please choose a T-shirt or let us know you don't want one"),
    ).toBeInTheDocument();
    expect(screen.getByText('Please accept the hackathon terms')).toBeInTheDocument();
    expect(screen.getByText('Please choose at least one skill')).toBeInTheDocument();
    expect(registrationBackend.registrations).toEqual([]);
    expect(ideasBackend.submitted).toEqual([]);
  });

  test('registers the member for the chosen challenge when submitting an idea', async () => {
    const registrationBackend = hackathonRegistrationBackend(server);
    const ideasBackend = hackathonIdeasBackend(server);
    initializeComponent();
    history.push('/hackathon/idea');

    userEvent.click(await screen.findByLabelText('Insurance that actually protects'));
    userEvent.type(screen.getByLabelText('Describe the problem you want to solve'), 'Probleem');
    userEvent.type(
      screen.getByLabelText('Describe the solution you plan to develop at the hackathon'),
      'Lahendus',
    );
    userEvent.click(
      within(
        screen.getByRole('group', { name: 'What skills does your team need?' }),
      ).getByLabelText('Design'),
    );
    userEvent.click(
      within(
        screen.getByRole('group', { name: 'What are your skills and experience?' }),
      ).getByLabelText('Design'),
    );
    userEvent.click(screen.getByLabelText("I don't want a T-shirt"));
    userEvent.click(screen.getByLabelText(/I have read the hackathon terms/));
    userEvent.click(screen.getByRole('button', { name: 'Submit idea' }));

    expect(
      await screen.findByText(/You are registered for the Tuleva hackathon with your idea/),
    ).toBeInTheDocument();
    expect(registrationBackend.registrations[0]).toMatchObject({
      challenges: ['INSURANCE'],
      tshirtColor: 'NONE',
      tshirtSize: null,
    });
    expect(ideasBackend.submitted[0]).toMatchObject({ challenge: 'INSURANCE' });
  });

  test('shows the ideas the member has already submitted', async () => {
    hackathonRegistrationBackend(server, registeredMember);
    hackathonIdeasBackend(server, {
      open: true,
      deadline: '2026-09-30T20:59:59Z',
      registered: true,
      ideas: [
        {
          id: 1,
          challenge: 'INSURANCE',
          problem: 'Kahjukäsitlus on aeglane',
          solution: 'Sujuv kahjukäsitlus',
          progress: null,
          neededSkills: [],
          additionalInfo: null,
          createdTime: '2026-09-15T10:00:00Z',
        },
      ],
    });
    initializeComponent();
    history.push('/hackathon/idea');

    const mine = await screen.findByRole('list', { name: 'Your submitted ideas' });
    expect(within(mine).getByText('Insurance that actually protects')).toBeInTheDocument();
    expect(within(mine).getByText(/Sujuv kahjukäsitlus/)).toBeInTheDocument();
  });

  test('tells the member when idea submission has closed', async () => {
    hackathonRegistrationBackend(server, registeredMember);
    hackathonIdeasBackend(server, {
      open: false,
      deadline: '2026-09-30T20:59:59Z',
      registered: true,
      ideas: [],
    });
    initializeComponent();
    history.push('/hackathon/idea');

    expect(await screen.findByText('Idea submission has closed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ideas could be submitted until September 30. You can still register as a participant.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register as a participant' })).toHaveAttribute(
      'href',
      '/hackathon',
    );
    expect(screen.queryByRole('button', { name: 'Submit idea' })).not.toBeInTheDocument();
  });

  test('invites a logged-in non-member to join', async () => {
    server.resetHandlers();
    useTestBackendsExcept(server, ['hackathonRegistration', 'hackathonIdeas', 'user']);
    userBackend(server, { memberNumber: null });
    initializeComponent();
    history.push('/hackathon/idea');

    expect(await screen.findByText('The hackathon is for Tuleva members')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit idea' })).not.toBeInTheDocument();
  });
});
