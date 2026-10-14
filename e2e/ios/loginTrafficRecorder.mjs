import http from 'node:http';
import net from 'node:net';

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
const LOGIN_TRAFFIC_PATH = '/__login-traffic';

const site = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3200');
const port = Number(process.env.E2E_IOS_RECORDER_PORT ?? 3290);

if (site.protocol !== 'http:') {
  throw new Error(`The login traffic recorder forwards plain HTTP only: E2E_BASE_URL=${site}`);
}

const target = { hostname: site.hostname, port: Number(site.port || 80) };
const exchanges = [];

const pathOf = (url) => (url ?? '/').split('?')[0];

const parsedAnswer = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const exchangeOf = (request, status, body) => {
  const answer = parsedAnswer(body);
  return {
    method: request.method,
    path: pathOf(request.url),
    status,
    userAgent: request.headers['user-agent'] ?? '',
    web2AppLink: answer.web2AppLink,
    deviceLink: answer.deviceLink,
    errorCode: answer.error ?? answer.errors?.[0]?.code,
    accessTokenIssued: Boolean(answer.access_token),
  };
};

const answerWithTheRecordedExchanges = (request, response) => {
  const since = Number(new URL(request.url, 'http://recorder').searchParams.get('since') ?? 0);
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ count: exchanges.length, exchanges: exchanges.slice(since) }));
};

const forward = (request, response) => {
  if (pathOf(request.url) === LOGIN_TRAFFIC_PATH) {
    answerWithTheRecordedExchanges(request, response);
    return;
  }
  const recorded = RECORDED_PATHS.includes(pathOf(request.url));
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
      const chunks = [];
      answer.on('data', (chunk) => {
        chunks.push(chunk);
        response.write(chunk);
      });
      answer.on('end', () => {
        response.end();
        exchanges.push(
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

const rawRequestHead = (request) =>
  [
    `${request.method} ${request.url} HTTP/${request.httpVersion}`,
    ...Object.entries(request.headers).flatMap(([name, value]) =>
      (Array.isArray(value) ? value : [value]).map((each) => `${name}: ${each}`),
    ),
    '',
    '',
  ].join('\r\n');

const tunnel = (request, socket, head) => {
  const upstream = net.connect(target.port, target.hostname, () => {
    upstream.write(rawRequestHead(request));
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
};

const server = http.createServer(forward);
server.on('upgrade', tunnel);
server.listen(port, '127.0.0.1', () => {
  console.log(`Login traffic recorder: http://localhost:${port} -> ${site.origin}`);
});
