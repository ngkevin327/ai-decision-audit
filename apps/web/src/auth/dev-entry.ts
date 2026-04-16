export const DEV_ENTRY_KEY = 'audit-trail-dev-console-entry';

export function hasDevConsoleEntry() {
  return sessionStorage.getItem(DEV_ENTRY_KEY) === '1';
}

export function setDevConsoleEntry() {
  sessionStorage.setItem(DEV_ENTRY_KEY, '1');
}

export function clearDevConsoleEntry() {
  sessionStorage.removeItem(DEV_ENTRY_KEY);
}
