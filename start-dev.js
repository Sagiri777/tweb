#!/usr/bin/env node

const {spawn} = require('child_process');
const readline = require('readline');

const DEFAULT_PROXY_URL = 'http://127.0.0.1:20122';
const DEFAULT_PROXY_ENABLED = true;

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function parseYesNo(answer, fallback) {
  const normalized = answer.trim().toLowerCase();
  if(!normalized) {
    return fallback;
  }

  if(['y', 'yes'].includes(normalized)) {
    return true;
  }

  if(['n', 'no'].includes(normalized)) {
    return false;
  }

  return undefined;
}

async function resolveProxyConfig() {
  if(process.env.TWEB_SKIP_PROXY_PROMPT === '1') {
    return null;
  }

  const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
  if(!isInteractive) {
    return null;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    let useProxy;
    while(useProxy === undefined) {
      const answer = await askQuestion(rl, '[start] Use network proxy? [Y/n] ');
      useProxy = parseYesNo(answer, DEFAULT_PROXY_ENABLED);
    }

    if(!useProxy) {
      return {
        VITE_NETWORK_PROXY_ENABLED: '0',
        VITE_NETWORK_PROXY_URL: '',
        TWEB_NETWORK_PROXY_URL: ''
      };
    }

    const answer = await askQuestion(rl, `[start] Proxy URL [${DEFAULT_PROXY_URL}] `);
    const proxyUrl = answer.trim() || DEFAULT_PROXY_URL;
    return {
      VITE_NETWORK_PROXY_ENABLED: '1',
      VITE_NETWORK_PROXY_URL: proxyUrl,
      TWEB_NETWORK_PROXY_URL: proxyUrl
    };
  } finally {
    rl.close();
  }
}

async function main() {
  const proxyConfig = await resolveProxyConfig();
  const child = spawn(
    process.platform === 'win32' ? 'corepack.cmd' : 'corepack',
    ['pnpm', 'start:vite', ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...(proxyConfig || {})
      }
    }
  );

  child.on('exit', (code, signal) => {
    if(signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[start] Failed to start dev server:', error.message);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('[start] Failed to prepare dev server:', error);
  process.exit(1);
});
