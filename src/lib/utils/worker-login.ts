export const WORKER_LOGIN_EMAIL_DOMAIN = 'workers.isko.uz';
export const MIN_WORKER_PASSWORD_LENGTH = 6;

export function normalizeWorkerLoginCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function workerNameForPassword(fullName: string): string {
  return fullName.replace(/\s+/g, '');
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
