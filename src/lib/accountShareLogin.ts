import confirmationPopup from '@components/confirmationPopup';
import AccountController from '@lib/accounts/accountController';
import {getCurrentAccount} from '@lib/accounts/getCurrentAccount';
import rootScope from '@lib/rootScope';

type ShareRequestResponse = {
  requestId: string,
  error?: string
};

type ShareResultResponse = {
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'not_found',
  payload?: {
    accountData: Awaited<ReturnType<typeof AccountController.get>>
  }
};

type PendingRequest = {
  requestId: string,
  phone: string,
  requester: {
    ip: string,
    device: string
  }
};

const API_PREFIX = '/api/account-share';
const POLL_INTERVAL = 2500;

function getDeviceName() {
  return [navigator.platform, navigator.userAgent].filter(Boolean).join(' | ').slice(0, 256) || 'Unknown Device';
}

async function parseJson<T>(response: Response): Promise<T | undefined> {
  if(!response.ok) {
    return;
  }

  try {
    return await response.json();
  } catch(err) {
    return;
  }
}

export async function tryLoginViaSharedSession(phone: string) {
  const requestResponse = await fetch(`${API_PREFIX}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone,
      device: getDeviceName()
    })
  }).then((response) => parseJson<ShareRequestResponse>(response));

  if(!requestResponse?.requestId) {
    return {ok: false as const};
  }

  const startedAt = Date.now();
  while((Date.now() - startedAt) < 60_000) {
    const result = await fetch(`${API_PREFIX}/result?requestId=${encodeURIComponent(requestResponse.requestId)}`)
    .then((response) => parseJson<ShareResultResponse>(response));

    if(result?.status === 'approved' && result.payload?.accountData) {
      await AccountController.update(getCurrentAccount(), result.payload.accountData, true);
      return {ok: true as const};
    }

    if(result?.status === 'rejected' || result?.status === 'expired' || result?.status === 'not_found') {
      return {ok: false as const};
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }

  return {ok: false as const};
}

let initialized = false;

export function initSharedLoginProvider() {
  if(initialized) {
    return;
  }

  initialized = true;

  const registerSession = async() => {
    const self = await rootScope.managers.appUsersManager.getSelf();
    if(!self?.phone) {
      return;
    }

    const accountData = await AccountController.get(getCurrentAccount());
    if(!accountData?.userId) {
      return;
    }

    await fetch(`${API_PREFIX}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+' + self.phone,
        payload: {accountData}
      })
    });
  };

  const processPending = async() => {
    const self = await rootScope.managers.appUsersManager.getSelf();
    if(!self?.phone) {
      return;
    }

    const pending = await fetch(`${API_PREFIX}/pending?phone=${encodeURIComponent('+' + self.phone)}`)
    .then((response) => parseJson<{request?: PendingRequest}>(response));

    const request = pending?.request;
    if(!request) {
      return;
    }

    const approve = await confirmationPopup({
      title: '账号共享登录确认',
      descriptionRaw: `请求来源 IP: ${request.requester.ip}\n设备: ${request.requester.device}\n\n是否共享当前登录状态并允许对方一键登录？`,
      button: {
        langKey: 'OK',
        isDanger: false
      },
      rejectWithReason: true
    }).then(() => true).catch(() => false);

    await fetch(`${API_PREFIX}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: request.requestId,
        approve,
        payload: approve ? {
          accountData: await AccountController.get(getCurrentAccount())
        } : undefined
      })
    });
  };

  rootScope.addEventListener('user_auth', () => {
    registerSession();
  });

  registerSession();
  setInterval(() => {
    processPending();
  }, POLL_INTERVAL);
}
