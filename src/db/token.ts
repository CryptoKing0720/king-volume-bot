import mongoose from "mongoose";

import * as global from "../global";

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

export const registerToken = async (params: any) => {
  try {
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
    return item;
  } catch (error) {
    global.error("[registerToken]", error);
    throw error;
  }
};

export const removeToken = async (params: any) => {
  try {
    await Token.deleteOne(params);
    return true;
  } catch (error) {
    global.error("[removeToken]", error);
    throw error;
  }
};

export const selectToken = async (params: any) => {
  try {
    const token = await Token.findOne(params);
    return token;
  } catch (error) {
    global.error("[selectToken]", error);
    throw error;
  }
};

export const selectTokens = async (params: any = {}, limit: number = 0) => {
  try {
    const query = Token.find(params);
    if (limit > 0) {
      query.limit(limit);
    }
    const tokens = await query;
    return tokens;
  } catch (error) {
    global.error("[selectTokens]", error);
    throw error;
  }
};

export const updateToken = async (params: any) => {
  try {
    const result = await Token.updateOne(params);
    return result;
  } catch (error) {
    global.error("[updateToken]", error);
    throw error;
  }
};
