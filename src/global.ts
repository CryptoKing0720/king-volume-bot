import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

export let web3Conn: Connection;

export const setWeb3 = (conn: Connection) => {
  web3Conn = conn;
};

export const errorLog = (summary: string, error: any): void => {
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
      error?.reason ||
      error.error?.reason ||
      JSON.parse(error)?.error?.error?.response?.error?.message ||
      error?.response ||
      error?.message ||
      error;
  } catch (error) {
    msg = error as string;
  }

  return msg;
};

export const getBotLink = () => {
  return `https://t.me/${process.env.BOT_USERNAME}`;
};

export const getJitoBlockApi = () => {
  return process.env.JITO_BLOCK_ENGINE_URL as string;
};

export const getTaxWalletAddress = () => {
  return process.env.TAX_WALLET as string;
};
