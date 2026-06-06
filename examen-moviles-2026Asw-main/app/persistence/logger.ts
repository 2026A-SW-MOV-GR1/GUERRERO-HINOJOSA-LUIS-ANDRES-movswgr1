export type LogLevel = 'DEBUG' | 'INFO' | 'ERROR';

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const metaText = meta ? ` | ${JSON.stringify(meta)}` : '';
  console.log(`[${level}] ${message}${metaText}`);
}

export function logDebug(message: string, meta?: Record<string, unknown>) {
  log('DEBUG', message, meta);
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  log('INFO', message, meta);
}

export function logError(message: string, meta?: Record<string, unknown>) {
  log('ERROR', message, meta);
}
