import {RestrictionReason} from '@layer';

const platforms = new Set([
  'all',
  'web',
  'webk'
]);

const ignore = new Set();

export function getRestrictionReason(reasons: RestrictionReason[]) {
  // return reasons[0];
  if(ignore.has('all')) return;
  return reasons.find((reason) => platforms.has(reason.platform) && !ignore.has(reason.reason));
}

export function isSensitive(reasons: RestrictionReason[]) {
  if(ignore.has('all')) return false;
  if(ignore.has('sensitive')) return false;
  return reasons.some((reason) => reason.reason === 'sensitive' /* && platforms.has(reason.platform) */);
}

export function isRestricted(reasons: RestrictionReason[]) {
  if(ignore.has('all')) return false;
  return !!getRestrictionReason(reasons);
}

export function ignoreRestrictionReasons(reasons: string[]) {
  ignore.clear();
  reasons.forEach((reason) => {
    ignore.add(reason);
  });
}
