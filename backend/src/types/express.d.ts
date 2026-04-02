import { AccessPayload } from "./types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}