// import { notifyCredReq, notifyCredReviewed, notifyCredSubmit, notifyInvitee, notifyInviter } from "../services/notification.serv.js";
// import { evtEmitter } from "./emitter.js";
// import { EventPayloads, Events } from "./event.js";

// evtEmitter.on(Events.CREDENTIAL_REQUIRED, async (data: EventPayloads[typeof Events.CREDENTIAL_REQUIRED]) => {
//   await notifyCredReq(data);
// })

// evtEmitter.on(Events.CREDENTIAL_SUBMITTED, async (data: EventPayloads[typeof Events.CREDENTIAL_SUBMITTED]) => {
//   await notifyCredSubmit(data);
// })

// evtEmitter.on(Events.CREDENTIAL_VERIFIED, async (data: EventPayloads[typeof Events.CREDENTIAL_VERIFIED]) => {
//   await notifyCredReviewed(data);
// })

// evtEmitter.on(Events.CREDENTIAL_REVOKED, async (data: EventPayloads[typeof Events.CREDENTIAL_REVOKED]) => {
//   await notifyCredReviewed(data);
// })

// evtEmitter.on(Events.INVITE_CREATED, async (data: EventPayloads[typeof Events.INVITE_CREATED]) => {
//   await notifyInvitee(data);
// })

// evtEmitter.on(Events.INVITE_ACCEPTED, async (data: EventPayloads[typeof Events.INVITE_ACCEPTED]) => {
//   await notifyInviter(data);
// })