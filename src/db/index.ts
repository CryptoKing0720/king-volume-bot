import mongoose from "mongoose";

export const User = mongoose.model(
  "User",
  new mongoose.Schema({
    chatId: String,
    username: String,
    depositWallet: String,
    timestamp: Number,
    referrId: String,
    referrRewardWallet: String,
  })
);

export const init = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log("Connected to MongoDB...");
  } catch (err) {
    console.error("Could not connect to MongoDB...", err);
    throw err; // Re-throw the error to propagate it to the caller
  }
};

export const selectUsers = async (params: any = {}) => {
  try {
    await User.find(params);
  } catch (error) {}
};
