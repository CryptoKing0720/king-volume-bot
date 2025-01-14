import mongoose from "mongoose";

import * as global from "../global";

export const Wallet = mongoose.model(
  "Wallet",
  new mongoose.Schema({
    pubKey: String,
    prvKey: String,
    usedTokenIdx: Array,
    timestamp: Number,
  })
);

export const addWallet = async (params: any) => {
  try {
    const item = new Wallet();
    item.timestamp = new Date().getTime();
    item.pubKey = params.pubKey;
    item.prvKey = params.prvKey;
    item.usedTokenIdx = [];
    await item.save();
    return item;
  } catch (error) {
    global.error("[addWallet]", error);
    throw error;
  }
};

export const selectWallets = async (params: any = {}, limit: number = 0) => {
  try {
    const query = Wallet.find(params);
    if (limit) {
      query.limit(limit);
    }
    const wallets = await query.exec();
    return wallets;
  } catch (error) {
    global.error("[selectWallets]", error);
    throw error;
  }
};

export const deleteWallets = async (params: any = {}) => {
  try {
    const result = await Wallet.deleteMany(params);
    return result;
  } catch (error) {
    global.error("[deleteWallets]", error);
    throw error;
  }
};
