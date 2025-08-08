import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;


let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "jwt-auth",
    });

    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

export { mongoose };
