import EventEmitter from 'node:event';

export const evtEmitter = new EventEmitter({ captureRejections: true });