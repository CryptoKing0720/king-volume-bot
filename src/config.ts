import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const MAINNET_RPCS = [
  "https://alpha-icy-shard.solana-mainnet.quiknode.pro/5f10f58492f1c7ce112dade31f08b685eed9eb0f/",
];

export const JITO_TIP_ACCOUNTS = [
  "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
];
export const JITO_TIMEOUT = 30000;
export const JITO_LIMIT_REQUEST_PER_SEC = 4;
export const JITO_BUNDLE_LIMIT_SIZE = 5;
export const JITO_BUNDLE_TIP = 0.0001;

export const BOT_WORKING_WALLET_SIZE = 20;

export const PRIORITY_RATE = 0.00001 * LAMPORTS_PER_SOL;
export const SOL_TRANSFER_FEE = 0.000005;
export const LIMIT_REST_SOL_BALANCE = 0;
export const EXCHANGE_SOL = 0.0001;

export const MAX_TRANSFER_INST_COUNT = 8;
export const MIN_BUY_AMOUNT = 0.000001;
export const MAX_BUY_AMOUNT = 0.00001;
export const SEND_SOL_AMOUNT = 0.0002;

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const VOLUME_UNIT = 1000000;

export const TAX = 0;

export enum ResultCode {
  SUCCESS = 0,
  INTERNAL,
  PARAMETER,
  USER_INSUFFICIENT_SOL,
  USER_INSUFFICIENT_JITO_FEE_SOL,
  USER_INSUFFICIENT_ENOUGH_SOL,
  INVALIDE_USER,
  INVALIDE_TOKEN,
}
