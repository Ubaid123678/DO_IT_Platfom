import mongoose from 'mongoose';

import { connectDatabase } from '../src/config/database.js';
import UserModel from '../src/modules/auth/auth.model.js';
import KycDocumentModel, {
  type KycStatus,
} from '../src/modules/kyc/kyc.model.js';

const main = async (): Promise<void> => {
  await connectDatabase();

  try {
    await UserModel.updateMany({}, { $set: { kyc_status: 'missing' } });

    const latestDocuments = await KycDocumentModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      status: KycStatus;
    }>([
      { $sort: { createdAt: -1, _id: -1 } },
      { $group: { _id: '$userId', status: { $first: '$status' } } },
    ]);

    if (latestDocuments.length > 0) {
      await UserModel.bulkWrite(
        latestDocuments.map(({ _id, status }) => ({
          updateOne: {
            filter: { _id },
            update: { $set: { kyc_status: status } },
          },
        })),
        { ordered: false },
      );
    }

    console.log(
      `[migrate:kyc-status] Backfilled KYC status for ${latestDocuments.length} users with KYC documents; all others set to missing.`,
    );
  } finally {
    await mongoose.disconnect();
  }
};

void main().catch((error: unknown) => {
  console.error('[migrate:kyc-status] Migration failed.', error);
  process.exitCode = 1;
});
