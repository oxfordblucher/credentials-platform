import { Router } from "express";
import { getCredentials, addCredential } from "../controllers/credential.js";

const credentialRouter = Router();

credentialRouter.get('/', getCredentials);
credentialRouter.post('/', addCredential);

export default credentialRouter;