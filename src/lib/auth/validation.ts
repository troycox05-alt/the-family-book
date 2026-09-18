export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PIN_RE = /^\d{4,8}$/;

export function validateUsername(username: string): string | null {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_RE.test(username)) {
    return "Username can only contain letters, numbers, and underscores.";
  }
  return null;
}

export function validatePin(pin: string): string | null {
  if (!PIN_RE.test(pin)) {
    return "PIN must be 4-8 digits.";
  }
  return null;
}

export function isAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === "troy";
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
