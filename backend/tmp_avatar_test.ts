import mongoose from 'mongoose';
import config from './src/config/env.js';
import UserModel from './src/modules/auth/auth.model.js';
import { verificationService } from './src/modules/verification/verification.service.js';

const DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8ALf8A/8QAFBABAAAAAAAAAAAAAAAAAAAACf/aAAgBAQABBf/AJ//2Q==';

const run = async () => {
  await mongoose.connect(config.mongodb_uri, { dbName: config.mongodb_db_name });
  console.log('DB connected');

  const user = (await UserModel.findOne({ role: 'provider', track: { $exists: true } }))
    ?? await UserModel.findOne({ role: 'provider', 'categories_selected.0': { $exists: true } });
  if (!user) {
    console.log('NO TRACKED PROVIDER USER FOUND');
    process.exit(0);
  }
  const userId = user.id as string;
  console.log('Using provider:', userId, 'track:', user.get('track'), 'has track_data:', Object.keys((user.get('track_data') ?? {}) as object).length);

  // Step 1: simulate mobile uploadAvatar (base64 data URL)
  const afterUpload = await verificationService.uploadAvatarFile(userId, DATA_URL);
  console.log('1) after uploadAvatarFile, avatar_url present:', afterUpload.provider_profile.avatar_url === DATA_URL, 'completeness:', afterUpload.completeness);

  // Step 2: getProfile -> confirm persisted server-side
  const afterGet = await verificationService.getProfile(userId);
  console.log('2) getProfile avatar_url present:', afterGet.provider_profile.avatar_url === DATA_URL);
  const rawAfterUpload = await UserModel.findById(userId).lean();
  console.log('2b) RAW DB provider_profile:', rawAfterUpload?.provider_profile);

  // Step 3: simulate mobile Save & Continue updateProfile with avatar_url in the payload
  const payload = {
    provider_profile: {
      headline: 'Test Headline',
      bio: 'Test bio',
      city: 'Lahore',
      public_profile: true,
      avatar_url: DATA_URL,
      languages: [{ code: 'en', level: 'fluent' }],
      availability: { days: ['Tue'], shifts: ['Afternoon'], hours_per_week: 35 },
    },
    track_data: {
      errand: {
        transport_mode: 'bicycle',
        base_fee: 2,
        per_km_fee: 0.5,
        working_hours: { days: ['Tue'], shifts: ['Afternoon'], hours_per_week: 35 },
        same_day_express: true,
        delivery_capabilities: ['Documents'],
        max_payload_kg: 20,
        goods_insurance: { covered: true },
      },
    },
  };
  const afterSave = await verificationService.updateProfile(userId, payload as never);
  console.log('3) after updateProfile, avatar_url present:', afterSave.provider_profile.avatar_url === DATA_URL, 'completeness:', afterSave.completeness);

  // Step 4: re-fetch after save
  const afterSaveGet = await verificationService.getProfile(userId);
  console.log('4) getProfile after save, avatar_url present:', afterSaveGet.provider_profile.avatar_url === DATA_URL, 'completeness:', afterSaveGet.completeness);

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERROR', e);
    process.exit(1);
  });