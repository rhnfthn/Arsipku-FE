/** Keep SDI primary recipients separate from the API's CC-only recipients. */
export function splitSdiRecipientItems<T extends { group?: string; raw?: { group?: string } }>(items: T[]) {
  const groupOf = (item: T) => item.group ?? item.raw?.group;
  return {
    tertuju: items.filter(item => groupOf(item) === 'REKAN'),
    tembusan: items.filter(item => ['REKAN', 'TEMBUSAN'].includes(groupOf(item) ?? '')),
  };
}
