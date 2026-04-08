import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import Admin from '../models/Admin';

const seed = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@classgenerator.app';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@1234';

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  await Admin.create({ name: 'Super Admin', email, password, role: 'admin' });
  console.log(`Admin created: ${email}`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
