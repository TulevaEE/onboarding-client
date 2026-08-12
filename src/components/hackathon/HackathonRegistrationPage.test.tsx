import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen } from '@testing-library/react';
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

const server = setupServer();
let history: History;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  useTestBackendsExcept(server, ['hackathonRegistration']);
});

describe('hackathon registration', () => {
  test('prefills contact details from the profile and registers', async () => {
    hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toHaveValue(mockUser.email);
    expect(screen.getByLabelText('Phone (optional)')).toHaveValue(mockUser.phoneNumber);

    userEvent.click(screen.getByLabelText('I am looking for a team'));
    userEvent.click(screen.getByLabelText('Software development'));
    userEvent.click(screen.getByLabelText('Fair lending'));
    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Your registration has been saved.')).toBeInTheDocument();
  });

  test('never asks for the name or personal code we already have', async () => {
    hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();

    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/personal code/i)).not.toBeInTheDocument();
  });

  test('requires a participation choice before registering', async () => {
    hackathonRegistrationBackend(server);
    initializeComponent();
    history.push('/hackathon');

    userEvent.click(await screen.findByRole('button', { name: 'Register' }));

    expect(
      await screen.findByText('Please choose how you would like to take part'),
    ).toBeInTheDocument();
  });

  test('shows an existing registration and lets the member update it', async () => {
    hackathonRegistrationBackend(server, {
      registered: true,
      open: true,
      deadline: '2026-09-20T20:59:59Z',
      email: 'existing@example.com',
      phoneNumber: '+37255555555',
      role: 'MENTOR',
      skills: ['DESIGN'],
      challenges: ['INSURANCE'],
      participation: 'WITH_TEAM',
      idea: 'Sujuv kahjukäsitlus',
      linkedinUrl: null,
    });
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByLabelText('Email')).toHaveValue('existing@example.com');
    expect(screen.getByLabelText('Mentor')).toBeChecked();
    expect(screen.getByLabelText('Design')).toBeChecked();
    expect(screen.getByLabelText('Insurance that actually protects')).toBeChecked();
    expect(
      screen.getByText(
        'You are registered for the hackathon. You can change your answers until September 20.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  test('keeps an existing registration read-only once registration has closed', async () => {
    hackathonRegistrationBackend(server, {
      registered: true,
      open: false,
      deadline: '2026-09-20T20:59:59Z',
      email: 'existing@example.com',
      phoneNumber: null,
      role: 'PARTICIPANT',
      skills: [],
      challenges: [],
      participation: 'LOOKING_FOR_TEAM',
      idea: null,
      linkedinUrl: null,
    });
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByText('Registration has closed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Registration closed on September 20. Your registration stands, see you at the hackathon!',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  test('tells a member registration has closed', async () => {
    hackathonRegistrationBackend(server, {
      registered: false,
      open: false,
      deadline: '2026-09-20T20:59:59Z',
      email: mockUser.email,
      phoneNumber: mockUser.phoneNumber,
      role: null,
      skills: [],
      challenges: [],
      participation: null,
      idea: null,
      linkedinUrl: null,
    });
    initializeComponent();
    history.push('/hackathon');

    expect(await screen.findByText('Registration has closed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Registration closed on September 20. Write to tuleva@tuleva.ee if you would still like to take part.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  test('switches to the closed state when the deadline passes before the member submits', async () => {
    let open = true;
    const registration = {
      registered: false,
      open,
      deadline: '2026-09-20T20:59:59Z',
      email: mockUser.email,
      phoneNumber: null,
      role: null,
      skills: [],
      challenges: [],
      participation: null,
      idea: null,
      linkedinUrl: null,
    };
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

    userEvent.click(await screen.findByLabelText('I am looking for a team'));
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
