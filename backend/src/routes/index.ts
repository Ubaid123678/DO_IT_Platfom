import { Router } from 'express';

import authRouter from '../modules/auth/auth.routes.js';
import kycRouter from '../modules/kyc/kyc.routes.js';
import verificationRouter from '../modules/verification/verification.routes.js';
import jobsRouter from '../modules/jobs/job.routes.js';
import proposalsRouter from '../modules/proposals/proposal.routes.js';
import walletRouter from '../modules/wallet/wallet.routes.js';
import payoutRouter from '../modules/wallet/payout.routes.js';
import disputeRouter from '../modules/disputes/dispute.routes.js';
import reviewRouter from '../modules/reviews/review.routes.js';
import fraudRouter from '../modules/fraud/fraud.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/kyc', kycRouter);
apiRouter.use('/providers', verificationRouter);
apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/proposals', proposalsRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/wallet', payoutRouter);
apiRouter.use('/disputes', disputeRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/fraud', fraudRouter);

export default apiRouter;
