// https://stackoverflow.com/a/61676104
export default function getTimeFormat(): 'h12' | 'h23' {
  if(typeof document === 'undefined') {
    const {hourCycle} = new Intl.DateTimeFormat(undefined, {hour: 'numeric'}).resolvedOptions() as Intl.ResolvedDateTimeFormatOptions & {
      hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
    };
    return hourCycle === 'h11' || hourCycle === 'h12' ? 'h12' : 'h23';
  }

  const t = document.createElement('input');
  t.type = 'time';
  t.value = '15:00';
  t.style.visibility = 'hidden';
  document.body.append(t);
  const offsetWidth = t.offsetWidth;
  t.remove();
  const timeFormat = offsetWidth > 110 ? 'h12' : 'h23';
  // console.log('timeFormat', timeFormat, offsetWidth);
  return timeFormat;
}
