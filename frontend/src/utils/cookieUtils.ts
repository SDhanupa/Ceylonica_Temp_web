/**
 * Utility helpers to read and write cookies and localStorage for user persistence.
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  try {
    localStorage.setItem(name, value);
  } catch {
    // Ignore localStorage failures
  }
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  try {
    localStorage.removeItem(name);
  } catch {
    // Ignore
  }
}

export function getUserName(): string | null {
  const cookieVal = getCookie('user_name');
  if (cookieVal && cookieVal.trim()) return cookieVal.trim();
  try {
    const localVal = localStorage.getItem('user_name');
    if (localVal && localVal.trim()) return localVal.trim();
  } catch {
    // Ignore
  }
  return null;
}

export function setUserName(name: string): void {
  const trimmed = name.trim();
  setCookie('user_name', trimmed, 365);
}
