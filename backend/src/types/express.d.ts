import { AccessPayload } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}