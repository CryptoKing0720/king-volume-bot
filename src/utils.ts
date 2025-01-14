import axios from "axios";
import * as bip39 from "bip39";
import base58 from "bs58";
import EventEmitter from "events";
import * as fs from "fs";
import { Metaplex } from "@metaplex-foundation/js";
import { SPL_ACCOUNT_LAYOUT } from "@raydium-io/raydium-sdk";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ENV, TokenListProvider } from "@solana/spl-token-registry";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";

dotenv.config();

import * as global from "./global";
import * as config from "./config";

const ReferralCodeBase =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const isValidAddress = (address: string) => {
  try {
    const publicKey = new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

export const isValidPrivateKey = (privateKey: string) => {
  try {
    const key = base58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(key);
    return true;
  } catch (error) {
    return false;
  }
};

export const getWalletFromPrivateKey = (privateKey: string): any | null => {
  try {
    const key: Uint8Array = base58.decode(privateKey);
    const keypair: Keypair = Keypair.fromSecretKey(key);

    const publicKey = keypair.publicKey.toBase58();
    const secretKey = base58.encode(keypair.secretKey);

    return { publicKey, secretKey, wallet: keypair };
  } catch (error) {
    return null;
  }
};

export const generateNewWallet = () => {
  try {
    const keypair: Keypair = Keypair.generate();

    const publicKey = keypair.publicKey.toBase58();
    const secretKey = base58.encode(keypair.secretKey);

    return { publicKey, secretKey, wallet: keypair };
  } catch (error) {
    if (error instanceof Error) {
      global.error("[generateNewWallet]", error);
    } else {
      global.error("[generateNewWallet]", "Error generating new wallet");
    }

    return null;
  }
};

export const isValidSeedPhrase = (seedPhrase: string) => {
  // Check if the seed phrase is valid
  const isValid = bip39.validateMnemonic(seedPhrase);

  return isValid;
};

export const roundDecimal = (number: number, digits: number = 5) => {
  return number.toLocaleString("en-US", { maximumFractionDigits: digits });
};

export const roundDecimalWithUnit = (
  number: number,
  digits: number = 5,
  unit: string = ""
) => {
  if (!number) {
    return "0 " + unit;
  }
  return (
    number.toLocaleString("en-US", { maximumFractionDigits: digits }) + unit
  );
};

export const sRoundDecimal = (number: number, digits: number) => {
  let result = roundDecimal(number, digits);
  return number > 0 ? `+${result}` : result;
};

export const sRoundDecimalWithUnitAndNull = (
  number: number | null,
  digits: number,
  unit: string
) => {
  if (!number) {
    return "None";
  }

  if (number === 0) {
    return `0${unit}`;
  }

  let result = roundDecimal(number, digits);
  return number > 0 ? `+${result}${unit}` : `${result}${unit}`;
};

export const roundSolUnit = (number: number, digits: number = 5) => {
  if (Math.abs(number) >= 0.00001 || number === 0) {
    return `${roundDecimal(number, digits)} SOL`;
  }

  number *= 1000000000;

  return `${roundDecimal(number, digits)} lamports`;
};

export const roundBigUnit = (number: number, digits: number = 5) => {
  let unitNum = 0;
  const unitName = ["", "K", "M", "B"];
  while (number >= 1000) {
    unitNum++;
    number /= 1000;

    if (unitNum > 2) {
      break;
    }
  }

  return `${roundDecimal(number, digits)}${unitName[unitNum]}`;
};

export const shortenAddress = (address: string, length: number = 6) => {
  if (address.length < 2 + 2 * length) {
    return address; // Not long enough to shorten
  }

  const start = address.substring(0, length + 2);
  const end = address.substring(address.length - length);

  return start + "..." + end;
};

export const shortenString = (str: string, length: number = 8) => {
  if (length < 3) {
    length = 3;
  }

  if (!str) {
    return "undefined";
  }

  if (str.length < length) {
    return str; // Not long enough to shorten
  }

  const temp = str.substring(0, length - 3) + "...";

  return temp;
};

export const limitString = (str: string, length: number = 8) => {
  if (length < 3) {
    length = 3;
  }

  if (!str) {
    return "undefined";
  }

  if (str.length < length) {
    return str; // Not long enough to shorten
  }

  const temp = str.substring(0, length);

  return temp;
};

export const getTimeStringUTC = (timestamp: Date) => {
  const options: any = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "UTC",
  };

  const formattedDate = timestamp.toLocaleString("en-US", options);

  return formattedDate;
};

export const getTimeStringFormat = (timestamp: number) => {
  let date = new Date(timestamp);
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  let hours = String(date.getHours()).padStart(2, "0");
  let minutes = String(date.getMinutes()).padStart(2, "0");
  // let seconds = String(date.getSeconds()).padStart(2, '0');

  // return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getTimeStringUTCFromNumber = (timestamp: number) => {
  try {
    return getTimeStringUTC(new Date(timestamp));
  } catch (error) {
    return "None";
  }
};

export const addressToHex = (address: string) => {
  const hexString = "0x" + address.slice(2).toLowerCase().padStart(64, "0");
  return hexString.toLowerCase();
};

export const createDirectoryIfNotExists = (directoryPath: string) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
    console.log(`The directory '${directoryPath}' has been created.`);
  } else {
  }
};

export const getShortenedAddress = (address: string) => {
  if (!address) {
    return "";
  }

  let str = address.slice(0, 24) + "...";

  return str;
};

export const waitForEvent = (
  eventEmitter: EventEmitter,
  eventName: string
): Promise<void> => {
  return new Promise<void>((resolve) => {
    eventEmitter.on(eventName, resolve);
  });
};

export const getFullTimeElapsedFromSeconds = (totalSecs: number) => {
  if (totalSecs < 0) {
    totalSecs = 0;
  }

  let sec = 0,
    min = 0,
    hour = 0,
    day = 0;

  sec = totalSecs;
  if (sec > 60) {
    min = Math.floor(sec / 60);
    sec = sec % 60;
  }

  if (min > 60) {
    hour = Math.floor(min / 60);
    min = min % 60;
  }

  if (hour > 24) {
    day = Math.floor(hour / 24);
    hour = hour % 60;
  }

  let timeElapsed = "";

  if (day > 0) {
    timeElapsed += `${day}d`;
  }

  if (hour > 0) {
    if (timeElapsed !== "") {
      timeElapsed += " ";
    }

    timeElapsed += `${hour}h`;
  }

  if (min > 0) {
    if (timeElapsed !== "") {
      timeElapsed += " ";
    }

    timeElapsed += `${min}m`;
  }

  if (sec > 0) {
    if (timeElapsed !== "") {
      timeElapsed += " ";
    }

    timeElapsed += `${sec}s`;
  }

  return timeElapsed;
};

export const getFullMinSecElapsedFromSeconds = (totalSecs: number) => {
  let sec = 0,
    min = 0,
    hour = 0,
    day = 0;

  sec = totalSecs;
  if (sec > 60) {
    min = Math.floor(sec / 60);
    sec = sec % 60;
  }

  let timeElapsed = `${min}:${sec}`;

  return timeElapsed;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getDateTimeFromTimestamp = (timestmp: number) => {
  const value = new Date(timestmp);
  let month = (value.getMonth() + 1).toString();
  let day = value.getDate().toString();
  let year = value.getFullYear().toString();

  return `${month}/${day}/${year}`;
};

export const getConfigString = (
  value: string,
  defaultValue: string,
  unit: string = "",
  prefix: string = "",
  digit: number = 9
) => {
  let output;

  const value2 = typeof value === "number" ? roundDecimal(value, digit) : value;

  let temp;
  if (unit === "USD") {
    temp = `$${value2}`;
  } else if (unit === "%") {
    temp = `${value2}%`;
  } else {
    temp = `${value2}${unit.length > 0 ? " " + unit : ""}`;
  }

  if (value === defaultValue) {
    output = `Default (${prefix}${temp})`;
  } else {
    output = `${prefix}${temp}`;
  }

  return output;
};

export const getConfigStringAsText = (
  text: string,
  value: number,
  autoValue: number,
  unit: string = "",
  digit: number = 9
) => {
  let output;

  if (value === autoValue) {
    output = text;
  } else {
    const value2 =
      typeof value === "number" ? roundDecimal(value, digit) : value;
    if (unit === "USD") {
      output = `$${value2}`;
    } else if (unit === "%") {
      output = `${value2}%`;
    } else {
      output = `${value2}${unit.length > 0 ? " " + unit : ""}`;
    }
  }

  return output;
};

export const getConfigStringAsChecked = (value: number) => {
  let output: string;

  if (value === 2) {
    output = "🌐";
  } else if (value === 1) {
    output = "✅";
  } else {
    output = "❌";
  }

  return output;
};

export const getConfigWalletAsChecked = (value: number) => {
  let output;

  if (value === 1) {
    output = "✅";
  } else {
    output = "";
  }

  return output;
};

export const objectDeepCopy = (obj: any, keysToExclude: string[] = []): any => {
  if (typeof obj !== "object" || obj === null) {
    return obj; // Return non-objects as is
  }

  const copiedObject: Record<string, any> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keysToExclude.includes(key)) {
      copiedObject[key] = obj[key];
    }
  }

  return copiedObject;
};

export const encodeChatId = (chatId: string) => {
  const baseLength = ReferralCodeBase.length;

  let temp = Number(chatId);
  let encoded = "";
  while (temp > 0) {
    const remainder = temp % baseLength;
    encoded = ReferralCodeBase[remainder] + encoded;
    temp = Math.floor(temp / baseLength);
  }

  // Pad with zeros to make it 5 characters
  return encoded.padStart(5, "0");
};

export const decodeChatId = (encoded: string) => {
  const baseLength = ReferralCodeBase.length;

  let decoded = 0;
  const reversed = encoded.split("").reverse().join("");

  for (let i = 0; i < reversed.length; i++) {
    const char = reversed[i];
    const charValue = ReferralCodeBase.indexOf(char);
    decoded += charValue * Math.pow(baseLength, i);
  }

  return decoded.toString();
};

export const getCurrentTimeTick = (ms: boolean = false) => {
  if (ms) {
    return new Date().getTime();
  }

  return Math.floor(new Date().getTime() / 1000);
};

export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getWalletTokenAccount = async (
  wallet: PublicKey,
  isToken2022: boolean = true
) => {
  const walletTokenAccount = await global
    .getMainnetConn()
    .getTokenAccountsByOwner(wallet, {
      programId: isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
    });

  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
};

export const getWalletTokenBalance = async (
  wallet: any,
  addr: any,
  decimal: number
): Promise<number> => {
  const walletTokenAccounts = await getWalletTokenAccount(
    new PublicKey(wallet.publicKey),
    false
  );
  let tokenBalance = 0;
  if (walletTokenAccounts && walletTokenAccounts.length > 0) {
    for (const acc of walletTokenAccounts) {
      if (acc.accountInfo.mint.toBase58() === addr) {
        tokenBalance = Number(acc.accountInfo.amount) / 10 ** decimal;
        break;
      }
    }
  }

  return tokenBalance;
};

export const getWalletSOLBalance = async (wallet: any): Promise<number> => {
  try {
    let balance: number =
      (await global
        .getMainnetConn()
        .getBalance(new PublicKey(wallet.publicKey))) / LAMPORTS_PER_SOL;
    return balance;
  } catch (error) {
    if (error instanceof Error) {
      global.error("[getWalletSOLBalance]", error);
    } else {
      global.error("[getWalletSOLBalance]", "Error fetching balance");
    }

    return 0;
  }
};

export const getSOLPrice = async (): Promise<number> => {
  try {
    const { solana } = await fetchAPI(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      "GET"
    );
    return solana.usd as number;
  } catch (error) {
    await sleep(200);
    return getSOLPrice();
  }
};

export const getPairInfo = async (mint: string) => {
  const result: any = {};

  try {
    const data = await fetchAPI(config.DEXSCREENER_TOKEN_API + mint, "GET");

    if (!data || !data.pairs) {
      throw new Error("No pairs data available");
    }

    for (let pair of data.pairs) {
      if (
        pair.chainId === "solana" &&
        pair.dexId === "raydium" &&
        pair.labels === undefined
      ) {
        result.dex = pair.dexId;
        result.pair = `${pair.baseToken.symbol} / ${pair.quoteToken.symbol}`;
        result.price = `${pair.priceUsd}$ / ${pair.priceChange.m5}%`;

        const calculateTxns = (txns: any) =>
          `${txns.buys + txns.sells} (${txns.buys} buys/${txns.sells} sells)`;

        result.trx5m = calculateTxns(pair.txns.m5);
        result.trx1h = calculateTxns(pair.txns.h1);
        result.trx6h = calculateTxns(pair.txns.h6);
        result.trx24h = calculateTxns(pair.txns.h24);

        result.volume5m = roundBigUnit(pair.volume.m5, 2);
        result.volume1h = roundBigUnit(pair.volume.h1, 2);
        result.volume6h = roundBigUnit(pair.volume.h6, 2);
        result.volume24h = roundBigUnit(pair.volume.h24, 2);
        result.lp = roundBigUnit(pair.liquidity.usd, 2);
        result.mc = roundBigUnit(pair.fdv, 2);

        // Initialize socials array
        result.socials = {};

        // Handle websites
        if (pair?.info?.websites?.length > 0) {
          result.socials.website = pair.info.websites[0]?.url;
        }

        // Handle socials
        pair?.info?.socials?.forEach((social: any) => {
          if (social.type === "telegram") {
            result.socials.telegram = social.url;
          } else if (social.type === "twitter") {
            result.socials.twitter = social.url;
          } else if (social.type === "discord") {
            result.socials.discord = social.url;
          }
        });

        return result; // Early return when we find the pair
      }
    }

    return result; // Return empty result if no valid pair is found
  } catch (error) {
    if (error instanceof Error) {
      global.error("[getPairInfo]", error);
      return { error: error.message }; // Return error message
    } else {
      global.error("[getPairInfo]", "Error fetching pair info");
      return { error: "Error fetching pair info" }; // Return error message
    }
  }
};

export const getTokenInfo = async (addr: string) => {
  const conn = global.getMainnetConn();
  const metaplex = Metaplex.make(conn);

  const mintAddress = new PublicKey(addr);

  const metadataAccount = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: mintAddress });

  const metadataAccountInfo = await conn.getAccountInfo(metadataAccount);

  if (metadataAccountInfo) {
    const token = await metaplex
      .nfts()
      .findByMint({ mintAddress: mintAddress });
    if (token) {
      return {
        exist: true,
        symbol: token.mint.currency.symbol,
        decimal: token.mint.currency.decimals,
      };
    } else {
      return { exist: false, symbol: "", decimal: 0 };
    }
  } else {
    const provider = await new TokenListProvider().resolve();
    const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
    console.log(tokenList);
    const tokenMap = tokenList.reduce((map, item) => {
      map.set(item.address, item);
      return map;
    }, new Map());

    const token = tokenMap.get(mintAddress.toBase58());

    if (token) {
      return {
        exist: true,
        symbol: token.mint.currency.symbol,
        decimal: token.mint.currency.decimals,
      };
    } else {
      return { exist: false, symbol: "", decimal: 0 };
    }
  }
};

export const isTokenAccountInWallet = async (wallet: any, addr: string) => {
  const walletTokenAccount = await global
    .getMainnetConn()
    .getTokenAccountsByOwner(wallet.wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

  for (let item of walletTokenAccount.value) {
    const accountInfo = SPL_ACCOUNT_LAYOUT.decode(item.account.data);
    if (accountInfo.mint.toString() == addr) {
      return true;
    }
  }
  return false;
};

export const seedPhraseToPrivateKey = async (
  seedPhrase: string
): Promise<string | null> => {
  try {
    const seed: Buffer = bip39.mnemonicToSeedSync(seedPhrase).slice(0, 32); // Take the first 32 bytes for the seed
    const keypair: Keypair = Keypair.fromSecretKey(Uint8Array.from(seed));
    return base58.encode(keypair.secretKey);
  } catch (error) {
    return null;
  }
};

export const fetchAPI = async (
  url: string,
  method: "GET" | "POST",
  data: Record<string, any> = {}
): Promise<any | null> => {
  return new Promise((resolve) => {
    if (method === "POST") {
      axios
        .post(url, data)
        .then((response) => {
          let json = response.data;
          resolve(json);
        })
        .catch((error) => {
          resolve(null);
        });
    } else {
      axios
        .get(url)
        .then((response) => {
          let json = response.data;
          resolve(json);
        })
        .catch((error) => {
          resolve(null);
        });
    }
  });
};

export const waitSeconds = async (seconds: number) => {
  const eventEmitter = new EventEmitter();

  setTimeout(() => {
    eventEmitter.emit("TimeEvent");
  }, seconds * 1000);

  await waitForEvent(eventEmitter, "TimeEvent");
};

export const waitMilliseconds = async (ms: number) => {
  const eventEmitter = new EventEmitter();

  setTimeout(() => {
    eventEmitter.emit("TimeEvent");
  }, ms);

  await waitForEvent(eventEmitter, "TimeEvent");
};
