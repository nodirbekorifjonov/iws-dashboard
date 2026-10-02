export const WORKER_LOGIN_EMAIL_DOMAIN = 'workers.isko.uz';
export const MIN_WORKER_PASSWORD_LENGTH = 6;

function normalizePasswordPunctuation(value: string): string {
  return value
    .replace(/[\u00A0\u202F]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
}

export function normalizeWorkerLoginCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function workerNameForPassword(fullName: string): string {
  return normalizePasswordPunctuation(fullName).replace(/\s+/g, '');
}

export function normalizeWorkerPasswordInput(password: string): string {
  return normalizePasswordPunctuation(password).trim();
}

export function workerDefaultPassword(loginCode: string, fullName: string): string {
  return `${normalizeWorkerLoginCode(loginCode)}${workerNameForPassword(fullName)}`;
}

export function workerLoginCodeToEmail(code: string): string {
  return `${normalizeWorkerLoginCode(code).toLowerCase()}@${WORKER_LOGIN_EMAIL_DOMAIN}`;
}

export function isWorkerLoginCode(code: string): boolean {
  return /^IWS-\d{4,}$/.test(normalizeWorkerLoginCode(code));
}
