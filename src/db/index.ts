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

export const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

export const WhiteList = mongoose.model(
  "WhiteList",
  new mongoose.Schema({
    chatId: String,
    limitTokenCount: Number,
    timestamp: Number,
  })
);

export const VolumeToken = mongoose.model(
  "VolumeToken",
  new mongoose.Schema({
    chatId: String,
    address: String,
    baseAddr: String,
    symbol: String,
    baseSymbol: String,
    currentVolume: Number,
    targetVolume: Number,
    timestamp: Number,
    totalPayed: Number,
    workingTime: Number,
    lastWorkedTime: Number,
    ratingPerHour: Number,
    buyAmount: Number,
    status: Boolean,
    botId: Number,
    walletSize: Number,
    mode: Number,
  })
);

export const TaxHistory = mongoose.model(
  "TaxHistory",
  new mongoose.Schema({
    chatId: String,
    addr: String,
  })
);

export const TrxHistory = mongoose.model(
  "TrxHistory",
  new mongoose.Schema({
    chatId: String,
    solAmount: Number,
    tokenAmount: Number,
    mode: String,
    trxId: String,
    tiemStamp: Number,
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
