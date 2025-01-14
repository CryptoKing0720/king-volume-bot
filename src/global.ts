import dotenv from "dotenv";
import { Connection } from "@solana/web3.js";

import * as config from "./config";

dotenv.config();

let connections: Connection[] = [];

export const rankingEmojis = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

export const error = (summary: string, error: any): void => {
  if (error?.response?.body?.description) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      `[error] ${summary} ${error.response.body.description}`
    );
  } else {
    console.log("\x1b[31m%s\x1b[0m", `[error] ${summary} ${error}`);
  }
};

export const parseError = (error: any): string => {
  let msg = "";
  try {
    error = JSON.parse(JSON.stringify(error));
    msg =
      error?.error?.reason ||
      error?.reason ||
      JSON.parse(error)?.error?.error?.response?.error?.message ||
      error?.response ||
      error?.message ||
      error;
  } catch (_error) {
    msg = error;
  }

  return msg;
};

export const getBotLink = () => {
  return `https://t.me/${process.env.BOT_USERNAME}`;
};

export const getMainnetConn = () => {
  if (!connections.length) {
    for (let rpc of config.MAINNET_RPCS) {
      const conn = new Connection(rpc, "processed");
      connections.push(conn);
    }
  }

  const random: number = Math.floor(Math.random() * connections.length);
  return connections[random];
};

export const getDisperseWalletPrivkey = () => {
  return process.env.DISPERSE_WALLET_KEY as string;
};

export const getTaxWalletAddress = () => {
  return process.env.TAX_WALLET as string;
};
