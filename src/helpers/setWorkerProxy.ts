/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import {CURRENT_ACCOUNT_QUERY_PARAM} from '@lib/accounts/constants';

const HAS_WINDOW = typeof window !== 'undefined';
const HAS_LOCATION = typeof location !== 'undefined';
const HAS_WORKER = typeof Worker !== 'undefined';
const HAS_SHARED_WORKER = typeof SharedWorker !== 'undefined';

export function makeWorkerURL(url: string | URL) {
  if(!(url instanceof URL)) {
    url = new URL(url + '', HAS_LOCATION ? location.href : undefined);
  }

  if(HAS_LOCATION && location.search && url.protocol !== 'blob:') {
    const params = new URLSearchParams(location.search);
    params.forEach((value, key) => {
      if(key === CURRENT_ACCOUNT_QUERY_PARAM) return;
      (url as URL).searchParams.set(key, value);
    });
  }

  // exclude useless params
  (url as URL).searchParams.delete('swfix');

  return url;
}

export default function setWorkerProxy() {
  if(!HAS_WINDOW || (!HAS_WORKER && !HAS_SHARED_WORKER)) {
    return;
  }

  // * hook worker constructor to set search parameters (test, debug, etc)
  const workerHandler = {
    construct(target: any, args: any) {
      args[0] = makeWorkerURL(args[0]);
      return new target(...args);
    }
  };

  [
    Worker,
    HAS_SHARED_WORKER && SharedWorker
  ].filter(Boolean).forEach((w) => {
    window[w.name as any] = new Proxy(w, workerHandler);
  });
}

setWorkerProxy();
