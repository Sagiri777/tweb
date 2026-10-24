const PROXY_HTTP_PATH = '/__proxy/http';
const PROXY_WS_PATH = '/__proxy/ws';

const NETWORK_PROXY_ENABLED = import.meta.env.VITE_NETWORK_PROXY_ENABLED !== '0';
const NETWORK_PROXY_URL = import.meta.env.VITE_NETWORK_PROXY_URL || 'http://127.0.0.1:20122';

type InstallableGlobalScope = typeof globalThis & {
  fetch?: typeof fetch,
  WebSocket?: typeof WebSocket,
  XMLHttpRequest?: typeof XMLHttpRequest,
  location?: Location | WorkerLocation,
  __twebNetworkProxyInstalled__?: boolean
};

function replaceGlobalValue<K extends keyof InstallableGlobalScope>(
  scope: InstallableGlobalScope,
  key: K,
  value: InstallableGlobalScope[K]
) {
  try {
    scope[key] = value;
    return true;
  } catch(err) {

  }

  const descriptor = Object.getOwnPropertyDescriptor(scope, key);
  if(descriptor && !descriptor.configurable) {
    return false;
  }

  try {
    Object.defineProperty(scope, key, {
      configurable: true,
      writable: true,
      value
    });
    return true;
  } catch(err) {

  }

  return false;
}

function getLocation(scope: InstallableGlobalScope) {
  return scope.location;
}

function getParsedAbsoluteUrl(value: string) {
  try {
    const url = new URL(value);
    if(['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
      return url;
    }
  } catch(err) {

  }

  return undefined;
}

function shouldProxyUrl(scope: InstallableGlobalScope, value: string) {
  const url = getParsedAbsoluteUrl(value);
  if(!NETWORK_PROXY_ENABLED || !url) {
    return false;
  }

  const location = getLocation(scope);
  if(location) {
    if(url.origin === location.origin) {
      return false;
    }

    if((url.protocol === 'ws:' || url.protocol === 'wss:') && url.host === location.host) {
      return false;
    }
  }

  return true;
}

function buildProxyHttpUrl(scope: InstallableGlobalScope, value: string) {
  if(!shouldProxyUrl(scope, value)) {
    return value;
  }

  const location = getLocation(scope);
  const proxyUrl = new URL(PROXY_HTTP_PATH, location?.origin || value);
  proxyUrl.searchParams.set('url', value);
  proxyUrl.searchParams.set('proxy', NETWORK_PROXY_URL);
  return proxyUrl.toString();
}

function buildProxyWebSocketUrl(scope: InstallableGlobalScope, value: string) {
  if(!shouldProxyUrl(scope, value)) {
    return value;
  }

  const location = getLocation(scope);
  const targetUrl = new URL(value);
  const protocol = location?.protocol === 'https:' ? 'wss:' : 'ws:';
  const proxyUrl = new URL(`${protocol}//${location?.host || targetUrl.host}${PROXY_WS_PATH}`);
  proxyUrl.searchParams.set('url', value);
  proxyUrl.searchParams.set('proxy', NETWORK_PROXY_URL);
  return proxyUrl.toString();
}

function patchFetch(scope: InstallableGlobalScope) {
  if(!scope.fetch) {
    return;
  }

  const nativeFetch = scope.fetch.bind(scope);
  replaceGlobalValue(scope, 'fetch', ((input: RequestInfo | URL, init?: RequestInit) => {
    if(typeof(input) === 'string' || input instanceof URL) {
      return nativeFetch(buildProxyHttpUrl(scope, String(input)), init);
    }

    const proxiedUrl = buildProxyHttpUrl(scope, input.url);
    if(proxiedUrl === input.url) {
      return nativeFetch(input, init);
    }

    return nativeFetch(new Request(proxiedUrl, input), init);
  }) as typeof fetch);
}

function patchXMLHttpRequest(scope: InstallableGlobalScope) {
  if(!scope.XMLHttpRequest) {
    return;
  }

  const nativeOpen = scope.XMLHttpRequest.prototype.open;
  scope.XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    return nativeOpen.call(this, method, buildProxyHttpUrl(scope, String(url)), async, username, password);
  };
}

function patchWebSocket(scope: InstallableGlobalScope) {
  if(!scope.WebSocket) {
    return;
  }

  const NativeWebSocket = scope.WebSocket;
  class ProxiedWebSocket extends NativeWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(buildProxyWebSocketUrl(scope, String(url)), protocols as string | string[]);
    }
  }

  Object.defineProperty(ProxiedWebSocket, 'name', {value: 'WebSocket'});
  const staticStateDescriptors = Object.getOwnPropertyDescriptors(NativeWebSocket);
  ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach((key) => {
    const descriptor = staticStateDescriptors[key];
    if(descriptor) {
      Object.defineProperty(ProxiedWebSocket, key, descriptor);
    }
  });

  replaceGlobalValue(scope, 'WebSocket', ProxiedWebSocket as typeof WebSocket);
}

export function installGlobalNetworkProxy(scope: InstallableGlobalScope = globalThis as InstallableGlobalScope) {
  if(scope.__twebNetworkProxyInstalled__) {
    return;
  }

  scope.__twebNetworkProxyInstalled__ = true;
  patchFetch(scope);
  patchXMLHttpRequest(scope);
  patchWebSocket(scope);
}

export {
  NETWORK_PROXY_ENABLED,
  NETWORK_PROXY_URL
};
