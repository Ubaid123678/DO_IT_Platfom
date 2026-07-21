import { Router } from 'express';

import authRouter from '../modules/auth/auth.routes.js';
import kycRouter from '../modules/kyc/kyc.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/kyc', kycRouter);

export default apiRouter;
