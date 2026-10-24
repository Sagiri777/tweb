const httpProxy = require('http-proxy');
const {HttpProxyAgent} = require('http-proxy-agent');
const {HttpsProxyAgent} = require('https-proxy-agent');

const PROXY_HTTP_PATH = '/__proxy/http';
const PROXY_WS_PATH = '/__proxy/ws';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,
  ws: true
});

function getProxyUrl(req) {
  const origin = `http://${req.headers.host || 'localhost'}`;
  const requestUrl = new URL(req.url, origin);
  return requestUrl.searchParams.get('proxy') ||
    process.env.TWEB_NETWORK_PROXY_URL ||
    process.env.VITE_NETWORK_PROXY_URL ||
    'http://127.0.0.1:20122';
}

function getTargetUrl(req) {
  const origin = `http://${req.headers.host || 'localhost'}`;
  const requestUrl = new URL(req.url, origin);
  const raw = requestUrl.searchParams.get('url');
  if(!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if(['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
      return url;
    }
  } catch(err) {

  }

  return null;
}

function createAgent(req, targetUrl) {
  const proxyUrl = getProxyUrl(req);
  if(!proxyUrl) {
    return undefined;
  }

  return (targetUrl.protocol === 'http:' || targetUrl.protocol === 'ws:') ?
    new HttpProxyAgent(proxyUrl) :
    new HttpsProxyAgent(proxyUrl);
}

function writeError(res, statusCode, message) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({error: message}));
}

function onProxyError(err, req, res) {
  if(res && typeof(res.writeHead) === 'function' && !res.headersSent) {
    writeError(res, 502, err?.message || 'Proxy request failed');
  }
}

proxy.on('error', onProxyError);

function proxyHttpRequest(req, res, next) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if(requestUrl.pathname !== PROXY_HTTP_PATH) {
    return next();
  }

  const targetUrl = getTargetUrl(req);
  if(!targetUrl || !['http:', 'https:'].includes(targetUrl.protocol)) {
    return writeError(res, 400, 'Invalid proxy target URL');
  }

  req.url = `${targetUrl.pathname}${targetUrl.search}`;
  proxy.web(req, res, {
    target: targetUrl.origin,
    agent: createAgent(req, targetUrl)
  }, (err) => onProxyError(err, req, res));
}

function proxyWebSocketRequest(req, socket, head) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if(requestUrl.pathname !== PROXY_WS_PATH) {
    return false;
  }

  const targetUrl = getTargetUrl(req);
  if(!targetUrl || !['ws:', 'wss:'].includes(targetUrl.protocol)) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return true;
  }

  req.url = `${targetUrl.pathname}${targetUrl.search}`;
  proxy.ws(req, socket, head, {
    target: `${targetUrl.protocol}//${targetUrl.host}`,
    agent: createAgent(req, targetUrl)
  });

  return true;
}

function attachNetworkProxy(app, server) {
  app.use(proxyHttpRequest);

  if(server && !server.__twebNetworkProxyAttached) {
    server.__twebNetworkProxyAttached = true;
    server.on('upgrade', (req, socket, head) => {
      proxyWebSocketRequest(req, socket, head);
    });
  }
}

module.exports = {
  attachNetworkProxy
};
