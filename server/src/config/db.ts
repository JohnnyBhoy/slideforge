import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('bufferCommands', false); // fail fast instead of buffering
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
