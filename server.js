const compression = require('compression');
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const {attachNetworkProxy} = require('./networkProxyServer.js');

const app = express();
app.use(express.json({limit: '2mb'}));

const thirdTour = process.argv[2] == 3;
const forcePort = process.argv[3];
const useHttp = process.argv[4] !== 'https';

const publicFolderName = thirdTour ? 'public3' : 'public';
const port = forcePort ? +forcePort : (thirdTour ? 8443 : 80);

app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(compression());
app.use(express.static(publicFolderName));

const MAX_SESSION_AGE = 15 * 60 * 1000;
const MAX_REQUEST_AGE = 60 * 1000;
const sharedSessions = new Map();
const pendingRequests = new Map();
const pendingByPhone = new Map();

function cleanupShareStore() {
  const now = Date.now();

  sharedSessions.forEach((session, phone) => {
    if((now - session.updatedAt) > MAX_SESSION_AGE) {
      sharedSessions.delete(phone);
    }
  });

  pendingRequests.forEach((request, requestId) => {
    if(request.status === 'pending' && (now - request.createdAt) > MAX_REQUEST_AGE) {
      request.status = 'expired';
    }

    if((now - request.createdAt) > MAX_SESSION_AGE) {
      pendingRequests.delete(requestId);
    }
  });
}

function dequeuePending(phone) {
  const queue = pendingByPhone.get(phone);
  if(!queue || !queue.length) {
    return;
  }

  while(queue.length) {
    const requestId = queue[0];
    const request = pendingRequests.get(requestId);
    if(!request || request.status !== 'pending') {
      queue.shift();
      continue;
    }

    return request;
  }
}

app.post('/api/account-share/register', (req, res) => {
  cleanupShareStore();
  const {phone, payload} = req.body || {};
  if(!phone || !payload) {
    return res.status(400).json({error: 'invalid_payload'});
  }

  sharedSessions.set(phone, {
    payload,
    updatedAt: Date.now()
  });

  return res.json({ok: true});
});

app.post('/api/account-share/request', (req, res) => {
  cleanupShareStore();
  const {phone, device} = req.body || {};
  if(!phone) {
    return res.status(400).json({error: 'phone_required'});
  }

  if(!sharedSessions.has(phone)) {
    return res.status(404).json({error: 'not_online'});
  }

  const requestId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const request = {
    requestId,
    phone,
    requester: {
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown',
      device: String(device || 'Unknown Device').slice(0, 256)
    },
    status: 'pending',
    createdAt: Date.now(),
    payload: undefined
  };

  pendingRequests.set(requestId, request);

  const queue = pendingByPhone.get(phone) || [];
  queue.push(requestId);
  pendingByPhone.set(phone, queue);

  return res.json({requestId});
});

app.get('/api/account-share/pending', (req, res) => {
  cleanupShareStore();
  const phone = req.query.phone;
  if(!phone) {
    return res.status(400).json({error: 'phone_required'});
  }

  const request = dequeuePending(phone.toString());
  return res.json({request});
});

app.post('/api/account-share/respond', (req, res) => {
  cleanupShareStore();
  const {requestId, approve, payload} = req.body || {};
  const request = requestId && pendingRequests.get(requestId);
  if(!request) {
    return res.status(404).json({error: 'request_not_found'});
  }

  if(request.status !== 'pending') {
    return res.status(400).json({error: 'request_already_resolved'});
  }

  request.status = approve ? 'approved' : 'rejected';
  if(approve) {
    request.payload = payload || sharedSessions.get(request.phone)?.payload;
  }

  return res.json({ok: true});
});

app.get('/api/account-share/result', (req, res) => {
  cleanupShareStore();
  const requestId = req.query.requestId;
  const request = requestId && pendingRequests.get(requestId.toString());
  if(!request) {
    return res.json({status: 'not_found'});
  }

  if(request.status === 'approved') {
    return res.json({status: 'approved', payload: request.payload});
  }

  return res.json({status: request.status});
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + `/${publicFolderName}/index.html`);
});

const server = useHttp ? http : https;

let options = {};
if(!useHttp) {
  options.key = fs.readFileSync(__dirname + '/certs/server-key.pem');
  options.cert = fs.readFileSync(__dirname + '/certs/server-cert.pem');
}

const httpServer = server.createServer(options, app);
attachNetworkProxy(app, httpServer);

httpServer.listen(port, () => {
  console.log('Listening port:', port, 'folder:', publicFolderName);
});
