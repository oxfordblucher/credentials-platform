import { Router } from "express";
import { getCredentials, addCredential } from "../controllers/credential.js";

const router = Router();

router.get('/', getCredentials);
router.post('/', addCredential);

export default router;