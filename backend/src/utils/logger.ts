import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.body.password',
      'req.body.token',
      '*.file_key',
      '*.submitted_metadata',
    ],
    censor: '[REDACTED]',
  },
});
