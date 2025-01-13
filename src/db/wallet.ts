import mongoose from "mongoose";

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
  return new Promise(async (resolve, reject) => {
    const item = new Wallet();
    item.timestamp = new Date().getTime();

    item.pubKey = params.pubKey;
    item.prvKey = params.prvKey;
    item.usedTokenIdx = [];

    await item.save();

    resolve(item);
  });
};

export const selectWallets = async (params: any = {}, limit: number = 0) => {
  return new Promise(async (resolve, reject) => {
    if (limit) {
      Wallet.find(params)
        .limit(limit)
        .then(async (dcas) => {
          resolve(dcas);
        });
    } else {
      Wallet.find(params).then(async (dcas) => {
        resolve(dcas);
      });
    }
  });
};

export const deleteWallets = async (params: any = {}) => {
  return new Promise(async (resolve, reject) => {
    Wallet.deleteMany(params).then(async (dcas) => {
      resolve(dcas);
    });
  });
};
