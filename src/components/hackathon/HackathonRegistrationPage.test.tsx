import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import {
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

const existingRegistration = (
  overrides: Partial<HackathonRegistration>,
): HackathonRegistration => ({
  registered: true,
  open: true,
  deadline: '2026-10-05T20:59:59Z',
  email: 'existing@example.com',
  phoneNumber: null,
  role: 'PARTICIPANT',
  skills: [],
  otherSkills: null,
  challenges: [],
  participation: 'LOOKING_FOR_TEAM',
  idea: null,
  linkedinUrl: null,
  tshirtColor: 'NONE',
  tshirtSize: null,
  termsAccepted: true,
  ...overrides,
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  useTestBackendsExcept(server, ['hackathonRegistration']);
});

describe('hackathon registration', () => {
  test('prefills contact details from the profile and registers with a T-shirt', async () => {
    const backend = hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toHaveValue(mockUser.email);
    expect(screen.getByLabelText('Phone (optional)')).toHaveValue(mockUser.phoneNumber);

    userEvent.click(screen.getByLabelText('Software development'));
    expect(screen.queryByLabelText('Other skills')).not.toBeInTheDocument();
    userEvent.click(screen.getByLabelText('Other'));
    userEvent.type(screen.getByLabelText('Other skills'), '  Projektijuhtimine ');
    userEvent.click(screen.getByLabelText('Fair lending'));
    userEvent.click(screen.getByLabelText('Navy blue'));
    userEvent.selectOptions(screen.getByLabelText('Size'), 'L');
    userEvent.click(screen.getByLabelText(/I have read the hackathon terms/));
    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Your registration has been saved.')).toBeInTheDocument();
    expect(backend.registrations).toEqual([
      {
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        role: 'PARTICIPANT',
        skills: ['SOFTWARE_DEVELOPMENT'],
        otherSkills: 'Projektijuhtimine',
        challenges: ['FAIR_LENDING'],
        participation: 'LOOKING_FOR_TEAM',
        idea: null,
        linkedinUrl: null,
        tshirtColor: 'NAVY',
        tshirtSize: 'L',
        termsAccepted: true,
      },
    ]);
  });

  test('does not ask for a size when the member does not want a T-shirt', async () => {
    const backend = hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    userEvent.click(await screen.findByLabelText('White'));
    expect(screen.getByLabelText('Size')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText("I don't want a T-shirt"));
    expect(screen.queryByLabelText('Size')).not.toBeInTheDocument();

    userEvent.click(screen.getByLabelText('Design'));
    userEvent.click(screen.getByLabelText('Fair lending'));

    userEvent.click(screen.getByLabelText(/I have read the hackathon terms/));
    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Your registration has been saved.')).toBeInTheDocument();
    expect(backend.registrations[0]).toMatchObject({ tshirtColor: 'NONE', tshirtSize: null });
  });

  test('requires a T-shirt choice, a size and accepting the terms before registering', async () => {
    const backend = hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    userEvent.click(await screen.findByRole('button', { name: 'Register' }));

    expect(
      await screen.findByText("Please choose a T-shirt or let us know you don't want one"),
    ).toBeInTheDocument();
    expect(screen.getByText('Please accept the hackathon terms')).toBeInTheDocument();
    expect(screen.getByText('Please choose at least one skill')).toBeInTheDocument();
    expect(screen.getByText('Please choose at least one challenge')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('Other'));
    userEvent.type(screen.getByLabelText('Other skills'), 'Projektijuhtimine');
    await waitFor(() =>
      expect(screen.queryByText('Please choose at least one skill')).not.toBeInTheDocument(),
    );

    userEvent.click(screen.getByLabelText('Grey'));
    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Please choose a size')).toBeInTheDocument();
    expect(backend.registrations).toEqual([]);
  });

  test('links to the terms and to the idea form', async () => {
    hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByRole('link', { name: 'hackathon terms' })).toHaveAttribute(
      'href',
      'https://tuleva.ee/vaata/hakaton/tingimused/',
    );
    expect(screen.getByRole('link', { name: 'Submit an idea' })).toHaveAttribute(
      'href',
      '/hackathon/idea',
    );
    expect(screen.getByText('deadline 30.09')).toBeInTheDocument();
  });

  test('never asks for the name or personal code we already have', async () => {
    hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();

    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/personal code/i)).not.toBeInTheDocument();
  });

  test('does not ask how the member takes part and marks the required fields', async () => {
    hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toBeRequired();
    expect(
      screen.getByText('Fields marked with an asterisk (*) are required.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Tuleva T-shirt' })).toBeRequired();
    expect(screen.getByRole('link', { name: "Members' Hackathon" })).toHaveAttribute(
      'href',
      '/hackathon',
    );
    expect(screen.queryByText("Members' hackathon")).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /team/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/The hackathon is an intensive weekend of working together/),
    ).toBeInTheDocument();
  });

  test('shows an existing registration and lets the member update it', async () => {
    hackathonRegistrationBackend(
      server,
      existingRegistration({
        phoneNumber: '+37255555555',
        role: 'MENTOR',
        skills: ['DESIGN'],
        challenges: ['INSURANCE'],
        participation: 'WITH_TEAM',
        tshirtColor: 'GRAY',
        tshirtSize: 'S',
      }),
    );
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toHaveValue('existing@example.com');
    expect(screen.getByLabelText('Design')).toBeChecked();
    expect(screen.getByLabelText('Insurance that actually protects')).toBeChecked();
    expect(screen.getByLabelText('Grey')).toBeChecked();
    expect(screen.getByLabelText('Size')).toHaveValue('S');
    expect(screen.getByLabelText(/I have read the hackathon terms/)).toBeChecked();
    expect(
      screen.getByText(
        'You are registered for the hackathon. You can change your answers until October 5.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Mentor')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Participant')).not.toBeInTheDocument();
  });

  test('keeps the role set by the organizers and an idea given in the old form when saving', async () => {
    let stored: Record<string, unknown> | null = null;
    const registration = existingRegistration({
      email: 'mentor@example.com',
      role: 'MENTOR',
      participation: 'WITH_TEAM',
      challenges: ['INSURANCE'],
      idea: 'Sujuv kahjukäsitlus',
    });
    server.use(
      rest.get('http://localhost/v1/hackathon-registration', (req, res, ctx) =>
        res(ctx.json(registration)),
      ),
      rest.post('http://localhost/v1/hackathon-registration', (req: any, res, ctx) => {
        stored = req.body;
        return res(ctx.json({ ...registration, ...req.body }));
      }),
    );
    initializeComponent();
    history.push('/hackathon');

    userEvent.click(await screen.findByLabelText('Design'));
    userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Your registration has been saved.')).toBeInTheDocument();
    expect(stored).toMatchObject({
      role: 'MENTOR',
      idea: 'Sujuv kahjukäsitlus',
      participation: 'WITH_TEAM',
    });
  });

  test('tells a member who registered with an idea that they are already registered', async () => {
    hackathonRegistrationBackend(server, existingRegistration({ participation: 'WITH_IDEA' }));
    initializeComponent();
    history.push('/hackathon');

    expect(
      await screen.findByText(
        'You are already registered for the hackathon with your idea. There is no need to register again. You can change your details here until October 5.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument();
  });

  test('keeps an existing registration read-only once registration has closed', async () => {
    hackathonRegistrationBackend(server, existingRegistration({ open: false }));
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByText('Registration has closed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Registration closed on October 5. Your registration stands, see you at the hackathon!',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  test('tells a member registration has closed', async () => {
    hackathonRegistrationBackend(
      server,
      existingRegistration({
        registered: false,
        open: false,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        role: null,
        participation: null,
        tshirtColor: null,
        termsAccepted: false,
      }),
    );
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByText('Registration has closed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Registration closed on October 5. Write to tuleva@tuleva.ee if you would still like to take part.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  test('switches to the closed state when the deadline passes before the member submits', async () => {
    let open = true;
    const registration = existingRegistration({
      registered: false,
      email: mockUser.email,
      role: null,
      participation: null,
      tshirtColor: null,
      termsAccepted: false,
    });
    server.use(
      rest.get('http://localhost/v1/hackathon-registration', (req, res, ctx) =>
        res(ctx.json({ ...registration, open })),
      ),
      rest.post('http://localhost/v1/hackathon-registration', (req, res, ctx) => {
        open = false;
        return res(ctx.status(400), ctx.json({ error: 'HACKATHON_REGISTRATION_CLOSED' }));
      }),
    );
    initializeComponent();
    history.push('/hackathon');

    userEvent.click(await screen.findByLabelText("I don't want a T-shirt"));
    userEvent.click(screen.getByLabelText('Design'));
    userEvent.click(screen.getByLabelText('Fair lending'));
    userEvent.click(screen.getByLabelText(/I have read the hackathon terms/));
    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Registration has closed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument();
  });

  test('invites a logged-in non-member to join instead of bouncing them away', async () => {
    server.resetHandlers();
    useTestBackendsExcept(server, ['hackathonRegistration', 'user']);
    userBackend(server, { memberNumber: null });
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByText('The hackathon is for Tuleva members')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Become a member' })).toHaveAttribute(
      'href',
      'https://tuleva.ee/tulundusyhistu/',
    );
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });
});
