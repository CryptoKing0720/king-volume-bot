import mongoose from "mongoose";

export const Token = mongoose.model(
  "Token",
  new mongoose.Schema({
    chatid: String,
    idx: Number,
    addr: String,
    symbol: String,
    decimal: Number,
    timestamp: Number,
    botId: Number,
    lookupTableAddr: String,
    target: Number,
    solAmount: Number,
    delay: Number,
    volume: Number,
    workingTime: Number,
    reqCount: Number,
  })
);

export const registToken = (params: any) => {
  return new Promise(async (resolve, reject) => {
    const item = new Token();
    item.timestamp = new Date().getTime();
    item.chatid = params.chatid;
    item.idx = params.idx;
    item.addr = params.addr;
    item.symbol = params.symbol;
    item.decimal = params.decimal;
    item.botId = 0;
    item.lookupTableAddr = "";
    item.target = 1;
    item.delay = 10;
    item.solAmount = 3;
    item.volume = 0;
    item.workingTime = 0;
    item.reqCount = 0;
    await item.save();
    resolve(item);
  });
};

export const removeToken = (params: any) => {
  return new Promise((resolve, reject) => {
    Token.deleteOne(params).then(() => {
      resolve(true);
    });
  });
};

export const selectToken = async (params: any) => {
  return new Promise(async (resolve, reject) => {
    Token.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
};

export const selectTokens = async (params: any = {}, limit: number = 0) => {
  return new Promise(async (resolve, reject) => {
    if (limit) {
      Token.find(params)
        .limit(limit)
        .then(async (dcas) => {
          resolve(dcas);
        });
    } else {
      Token.find(params).then(async (dcas) => {
        resolve(dcas);
      });
    }
  });
};

export const updateToken = async (params: any) => {
  return new Promise(async (resolve, reject) => {
    Token.updateOne(params).then(async (user) => {
      resolve(user);
    });
  });
};
