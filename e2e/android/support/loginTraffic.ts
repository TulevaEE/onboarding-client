import fs from 'fs';
import http, { IncomingMessage, ServerResponse } from 'http';
import net, { AddressInfo } from 'net';

import { TokenAnswer } from '../../support/loginPage';

const SMART_ID_LOGIN_START_PATH = '/v1/smart-id/login';
const SMART_ID_QR_CODE_PATH = '/v1/smart-id/login/qr-code';
const SMART_ID_CALLBACK_PATH = '/v1/smart-id/login/callback';
const TOKEN_PATH = '/oauth/token';
const RECORDED_PATHS = [
  SMART_ID_LOGIN_START_PATH,
  SMART_ID_QR_CODE_PATH,
  SMART_ID_CALLBACK_PATH,
  TOKEN_PATH,
];
const STILL_WAITING_FOR_THE_SMART_ID_APP = 'AUTHENTICATION_NOT_COMPLETE';
const POLL_INTERVAL_MILLIS = 250;
const LONGEST_WAIT_FOR_THE_PHONE_MILLIS = 60000;

export type LoginExchange = {
  method: string;
  path: string;
  status: number;
  userAgent: string;
  web2AppLink?: string;
  deviceLink?: string;
  errorCode?: string;
  accessTokenIssued: boolean;
};

export type LoginTraffic = {
  port: number;
  mark: () => number;
  web2AppLinkSince: (mark: number) => Promise<LoginExchange & { web2AppLink: string }>;
  newestQrCodeLinkSince: (mark: number) => Promise<string>;
  callbackAnswerSince: (mark: number) => Promise<LoginExchange>;
  finalTokenAnswerSince: (mark: number) => Promise<TokenAnswer>;
  close: () => Promise<void>;
};

type Target = { hostname: string; port: number };

type AnswerBody = {
  web2AppLink?: string;
  deviceLink?: string;
  access_token?: string;
  error?: string;
  errors?: { code?: string }[];
};

const pathOf = (url: string | undefined): string => (url ?? '/').split('?')[0];

const isRecorded = (request: IncomingMessage): boolean =>
  RECORDED_PATHS.includes(pathOf(request.url));

const parsedAnswer = (body: string): AnswerBody => {
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const exchangeOf = (request: IncomingMessage, status: number, body: string): LoginExchange => {
  const answer = parsedAnswer(body);
  return {
    method: request.method ?? 'GET',
    path: pathOf(request.url),
    status,
    userAgent: request.headers['user-agent'] ?? '',
    web2AppLink: answer.web2AppLink,
    deviceLink: answer.deviceLink,
    errorCode: answer.error ?? answer.errors?.[0]?.code,
    accessTokenIssued: Boolean(answer.access_token),
  };
};

const isLoginStart = (exchange: LoginExchange): boolean =>
  exchange.method === 'POST' && exchange.path === SMART_ID_LOGIN_START_PATH;

const isQrCode = (exchange: LoginExchange): boolean =>
  exchange.path === SMART_ID_QR_CODE_PATH && Boolean(exchange.deviceLink);

const isCallback = (exchange: LoginExchange): boolean =>
  exchange.method === 'POST' && exchange.path === SMART_ID_CALLBACK_PATH;

const isFinalTokenAnswer = (exchange: LoginExchange): boolean =>
  exchange.method === 'POST' &&
  exchange.path === TOKEN_PATH &&
  (exchange.accessTokenIssued ||
    (Boolean(exchange.errorCode) && exchange.errorCode !== STILL_WAITING_FOR_THE_SMART_ID_APP));

const tokenAnswerOf = (exchange: LoginExchange): TokenAnswer =>
  exchange.accessTokenIssued
    ? { loggedIn: true }
    : { loggedIn: false, errorCode: exchange.errorCode ?? `HTTP ${exchange.status}` };

const delay = (millis: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, millis);
  });

const rawRequestHead = (request: IncomingMessage): string =>
  [
    `${request.method} ${request.url} HTTP/${request.httpVersion}`,
    ...Object.entries(request.headers).flatMap(([name, value]) =>
      (Array.isArray(value) ? value : [value]).map((each) => `${name}: ${each}`),
    ),
    '',
    '',
  ].join('\r\n');

export async function startLoginTrafficRecorder(
  target: Target,
  logFile: string,
): Promise<LoginTraffic> {
  const exchanges: LoginExchange[] = [];
  const upgradedSockets = new Set<net.Socket>();

  const record = (exchange: LoginExchange) => {
    exchanges.push(exchange);
    fs.appendFileSync(
      logFile,
      `${JSON.stringify({ at: new Date().toISOString(), ...exchange })}\n`,
    );
  };

  const forward = (request: IncomingMessage, response: ServerResponse) => {
    const recorded = isRecorded(request);
    const headers = { ...request.headers };
    if (recorded) {
      delete headers['accept-encoding'];
    }
    const upstream = http.request(
      { ...target, method: request.method, path: request.url, headers },
      (answer) => {
        response.writeHead(answer.statusCode ?? 502, answer.headers);
        if (!recorded) {
          answer.pipe(response);
          return;
        }
        const chunks: Buffer[] = [];
        answer.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          response.write(chunk);
        });
        answer.on('end', () => {
          response.end();
          record(
            exchangeOf(request, answer.statusCode ?? 0, Buffer.concat(chunks).toString('utf8')),
          );
        });
      },
    );
    upstream.on('error', (error) => {
      if (!response.headersSent) {
        response.writeHead(502);
      }
      response.end(`Login traffic recorder could not reach the client: error=${error.message}`);
    });
    request.pipe(upstream);
  };

  const tunnel = (request: IncomingMessage, socket: net.Socket, head: Buffer) => {
    const upstream = net.connect(target.port, target.hostname, () => {
      upstream.write(rawRequestHead(request));
      upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
    upgradedSockets.add(socket);
    socket.on('close', () => upgradedSockets.delete(socket));
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
  };

  const server = http.createServer(forward);
  server.on('upgrade', tunnel);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const waitFor = async <T>(
    find: () => T | undefined,
    description: string,
    deadline = Date.now() + LONGEST_WAIT_FOR_THE_PHONE_MILLIS,
  ): Promise<T> => {
    const found = find();
    if (found !== undefined) {
      return found;
    }
    if (Date.now() > deadline) {
      throw new Error(
        `Phone sent no ${description}: waitedMillis=${LONGEST_WAIT_FOR_THE_PHONE_MILLIS}`,
      );
    }
    await delay(POLL_INTERVAL_MILLIS);
    return waitFor(find, description, deadline);
  };

  const since = (mark: number) => exchanges.slice(mark);

  return {
    port: (server.address() as AddressInfo).port,
    mark: () => exchanges.length,
    web2AppLinkSince: (mark) =>
      waitFor(() => {
        const start = since(mark).find(isLoginStart);
        return start?.web2AppLink ? { ...start, web2AppLink: start.web2AppLink } : undefined;
      }, 'Smart-ID login start'),
    newestQrCodeLinkSince: (mark) =>
      waitFor(() => since(mark).filter(isQrCode).pop()?.deviceLink, 'Smart-ID QR code request'),
    callbackAnswerSince: (mark) => waitFor(() => since(mark).find(isCallback), 'Smart-ID callback'),
    finalTokenAnswerSince: async (mark) =>
      tokenAnswerOf(
        await waitFor(() => since(mark).find(isFinalTokenAnswer), 'final token answer'),
      ),
    close: async () => {
      upgradedSockets.forEach((socket) => socket.destroy());
      server.closeAllConnections();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
