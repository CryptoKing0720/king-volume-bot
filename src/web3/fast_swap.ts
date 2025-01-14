import { Market, MARKET_STATE_LAYOUT_V3 } from "@project-serum/serum";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Liquidity,
  LiquidityPoolKeys,
  MAINNET_PROGRAM_ID,
  Percent,
  Token,
  TOKEN_PROGRAM_ID,
  TokenAccount,
  TokenAmount,
} from "@raydium-io/raydium-sdk";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import {
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import * as global from "../global";
import * as config from "../config";
import * as utils from "../utils";

const SOLANA_NATIVE_DECIMAL = 9;

export const poolKeysMap = new Map();

const getTokenAccountByOwnerAndMint = (mint: PublicKey) => {
  return {
    programId: TOKEN_PROGRAM_ID,
    pubkey: PublicKey.default,
    accountInfo: {
      mint: mint,
      amount: 0,
    },
  } as unknown as TokenAccount;
};

const calcAmountOut = async (
  poolKeys: LiquidityPoolKeys,
  rawAmountIn: number,
  swapInDirection: boolean
) => {
  const poolInfo = await Liquidity.fetchInfo({
    connection: global.getMainnetConn(),
    poolKeys,
  });

  let currencyInMint = poolKeys.baseMint;
  let currencyInDecimals = poolInfo.baseDecimals;
  let currencyOutMint = poolKeys.quoteMint;
  let currencyOutDecimals = poolInfo.quoteDecimals;

  if (!swapInDirection) {
    currencyInMint = poolKeys.quoteMint;
    currencyInDecimals = poolInfo.quoteDecimals;
    currencyOutMint = poolKeys.baseMint;
    currencyOutDecimals = poolInfo.baseDecimals;
  }

  const currencyIn = new Token(
    TOKEN_PROGRAM_ID,
    currencyInMint,
    currencyInDecimals
  );
  const amountIn = new TokenAmount(currencyIn, rawAmountIn, false);
  const currencyOut = new Token(
    TOKEN_PROGRAM_ID,
    currencyOutMint,
    currencyOutDecimals
  );
  const slippage = new Percent(10, 100); // 5% slippage

  const {
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn,
    currencyOut,
    slippage,
  });

  return {
    amountIn,
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  };
};

const fetchRaydiumPairAddress = async (
  base: string
): Promise<string | null> => {
  try {
    const data = await utils.fetchAPI(
      config.DEXSCREENER_TOKEN_API + base,
      "GET"
    );
    for (const pair of data.pairs) {
      if (pair.chainId === "solana" && pair.dexId === "raydium") {
        return pair.pairAddress;
      }
    }
  } catch (error) {
    console.error("Error fetching Raydium pair address:", error);
  }
  return null;
};

const fetchPoolKeys = async (
  base: string,
  baseDecimal: number,
  raydiumPairAddr: string
): Promise<any | null> => {
  const conn = global.getMainnetConn();
  try {
    const { accounts, direction } = await findMarketAccounts(conn, base);
    for (const account of accounts) {
      const marketInfo = MARKET_STATE_LAYOUT_V3.decode(
        account.accountInfo.data
      );

      const poolKeys = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        baseMint: direction ? new PublicKey(base) : NATIVE_MINT,
        quoteMint: direction ? NATIVE_MINT : new PublicKey(base),
        baseDecimals: direction ? baseDecimal : SOLANA_NATIVE_DECIMAL,
        quoteDecimals: direction ? SOLANA_NATIVE_DECIMAL : baseDecimal,
        marketId: account.publicKey,
        programId: MAINNET_PROGRAM_ID.AmmV4,
        marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
      });

      if (poolKeys.id.toString() === raydiumPairAddr) {
        Object.assign(poolKeys, {
          marketBaseVault: marketInfo.baseVault,
          marketQuoteVault: marketInfo.quoteVault,
          marketBids: marketInfo.bids,
          marketAsks: marketInfo.asks,
          marketEventQueue: marketInfo.eventQueue,
        });
        return poolKeys;
      }
    }
  } catch (error) {
    console.error("Error fetching pool keys:", error);
  }
  return null;
};

const findMarketAccounts = async (
  conn: any,
  base: string
): Promise<{ accounts: any[]; direction: boolean }> => {
  let accounts = await Market.findAccountsByMints(
    conn,
    new PublicKey(base),
    NATIVE_MINT,
    MAINNET_PROGRAM_ID.OPENBOOK_MARKET
  );

  if (accounts.length) return { accounts, direction: true };

  accounts = await Market.findAccountsByMints(
    conn,
    NATIVE_MINT,
    new PublicKey(base),
    MAINNET_PROGRAM_ID.OPENBOOK_MARKET
  );
  return { accounts, direction: false };
};

export const getPriorityFeeInst = () => {
  const PRIORITY_FEE_INSTRUCTIONS = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: config.PRIORITY_RATE,
  });
  return PRIORITY_FEE_INSTRUCTIONS;
};

export const createAccountTransactionInst = (
  payer: any,
  wallet: any,
  addr: string
) => {
  const associatedToken = getAssociatedTokenAddressSync(
    new PublicKey(addr),
    wallet.wallet.publicKey,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return createAssociatedTokenAccountInstruction(
    payer.wallet.publicKey,
    associatedToken,
    wallet.wallet.publicKey,
    new PublicKey(addr),
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
};

export const getTransferSOLInst = (
  fromWallet: any,
  toAddr: string,
  amount: number
) => {
  return SystemProgram.transfer({
    fromPubkey: fromWallet.wallet.publicKey,
    toPubkey: new PublicKey(toAddr),
    lamports: Math.floor(amount * LAMPORTS_PER_SOL),
  });
};

export const loadPoolKeysFromMarket = async (
  base: string,
  baseDecimal: number
): Promise<boolean> => {
  const poolKeys = poolKeysMap.get(base);
  if (poolKeys) return true;

  try {
    const raydiumPairAddr = await fetchRaydiumPairAddress(base);
    if (!raydiumPairAddr) return false;

    const poolKeys = await fetchPoolKeys(base, baseDecimal, raydiumPairAddr);
    if (poolKeys) {
      poolKeysMap.set(base, poolKeys);
      return true;
    }
  } catch (error) {
    global.error("[loadPoolKeysFromMarket]", error);
  }

  return false;
};

export const createLookUpTableTransaction = async (
  payer: any,
  poolKeys: any
) => {
  const conn = global.getMainnetConn();
  const slot = await conn.getSlot();
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: payer.wallet.publicKey,
      payer: payer.wallet.publicKey,
      recentSlot: slot,
    });
  const extendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: payer.wallet.publicKey,
    authority: payer.wallet.publicKey,
    lookupTable: lookupTableAddress,
    addresses: [
      SystemProgram.programId,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      poolKeys.id,
      poolKeys.baseMint,
      poolKeys.quoteMint,
      poolKeys.lpMint,
      poolKeys.programId,
      poolKeys.authority,
      poolKeys.baseVault,
      poolKeys.quoteVault,
      poolKeys.lpVault,
      poolKeys.openOrders,
      poolKeys.targetOrders,
      poolKeys.withdrawQueue,
      poolKeys.marketProgramId,
      poolKeys.configId,
      poolKeys.marketId,
      poolKeys.marketAuthority,
      poolKeys.marketBaseVault,
      poolKeys.marketQuoteVault,
      poolKeys.marketBids,
      poolKeys.marketAsks,
      poolKeys.marketEventQueue,
    ],
  });
  const extraExtendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: payer.wallet.publicKey,
    authority: payer.wallet.publicKey,
    lookupTable: lookupTableAddress,
    addresses: [
      payer.wallet.publicKey,
      new PublicKey("ComputeBudget111111111111111111111111111111"),
      new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
      new PublicKey("Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"),
      new PublicKey("SysvarRent111111111111111111111111111111111"),
      new PublicKey("SysvarC1ock11111111111111111111111111111111"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      new PublicKey("EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o"),
      new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"),
      new PublicKey("RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr"),
      new PublicKey("27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv"),
      new PublicKey("5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h"),
      new PublicKey("CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK"),
      new PublicKey("routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS"),
      new PublicKey("EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"),
      new PublicKey("CBuCnLe26faBpcBP2fktp4rp8abpcAnTWft6ZrP5Q4T"),
      new PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"),
      new PublicKey("6FJon3QE27qgPVggARueB22hLvoh22VzJpXv4rBEoSLF"),
      new PublicKey("CC12se5To1CdEuw7fDS27B7Geo5jJyL7t5UK2B44NgiH"),
      new PublicKey("9HzJyW1qZsEiSfMUf6L2jo3CcTKAyBmSyKdwQeYisHrC"),
    ],
  });

  const recentBlockhash = await conn.getLatestBlockhash("finalized");

  const versionedTransaction1 = new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer.wallet.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [lookupTableInst, extendInstruction],
    }).compileToV0Message()
  );
  versionedTransaction1.sign([payer.wallet]);
  const versionedTransaction2 = new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer.wallet.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [extraExtendInstruction],
    }).compileToV0Message()
  );
  versionedTransaction2.sign([payer.wallet]);
  return {
    transactions: [versionedTransaction1, versionedTransaction2],
    address: lookupTableAddress,
  };
};

export const getBuyTransactionInsts = async (
  wallet: any,
  amount: number,
  poolKeys: LiquidityPoolKeys
) => {
  const fixedSide: "in" | "out" = "in";

  const directionIn = NATIVE_MINT.toString() == poolKeys.baseMint.toString();

  const { minAmountOut: tokenMinAmount, amountIn: solAmountIn } =
    await calcAmountOut(poolKeys, amount, directionIn);

  const userTokenAccounts = await utils.getWalletTokenAccount(
    wallet.wallet.publicKey,
    false
  );

  const swapToTokenTransaction = await Liquidity.makeSwapInstructionSimple({
    connection: global.getMainnetConn(),
    makeTxVersion: 0,
    poolKeys: {
      ...poolKeys,
    },
    userKeys: {
      tokenAccounts: userTokenAccounts,
      owner: wallet.wallet.publicKey,
    },
    amountIn: solAmountIn,
    amountOut: tokenMinAmount,
    fixedSide: fixedSide,
    config: {
      bypassAssociatedCheck: false,
    },
    computeBudgetConfig: {
      microLamports: config.PRIORITY_RATE,
    },
  });

  const instructions =
    swapToTokenTransaction.innerTransactions[0].instructions.filter(Boolean);
  return { instructions, amount: tokenMinAmount };
};

export const getSellTransactionInsts = async (
  payer: any,
  amount: number,
  poolKeys: LiquidityPoolKeys,
  maxLamports: number = config.PRIORITY_RATE,
  fixedSide: "in" | "out" = "in"
) => {
  const directionIn = NATIVE_MINT.toString() == poolKeys.baseMint.toString();

  const {
    amountOut: solAmount,
    minAmountOut: solMinAmount,
    amountIn: tokenAmountIn,
  } = await calcAmountOut(poolKeys, amount, !directionIn);

  const userTokenAccounts = await utils.getWalletTokenAccount(
    payer.wallet.publicKey,
    false
  );
  const swapToSolTransaction = await Liquidity.makeSwapInstructionSimple({
    connection: global.getMainnetConn(),
    makeTxVersion: 0,
    poolKeys: {
      ...poolKeys,
    },
    userKeys: {
      tokenAccounts: userTokenAccounts,
      owner: payer.wallet.publicKey,
    },
    amountIn: tokenAmountIn,
    amountOut: solMinAmount,
    fixedSide: fixedSide,
    config: {
      bypassAssociatedCheck: false,
    },
    computeBudgetConfig: {
      microLamports: maxLamports,
    },
  });

  const instructions =
    swapToSolTransaction.innerTransactions[0].instructions.filter(Boolean);

  return { instructions, amount: solAmount };
};

export const sendVersionedTransaction = async (
  tx: VersionedTransaction,
  maxRetries?: number
) => {
  const txid = await global.getMainnetConn().sendTransaction(tx, {
    skipPreflight: true,
    maxRetries: maxRetries,
  });

  return txid;
};

export const simulateVersionedTransaction = async (
  tx: VersionedTransaction
) => {
  const txid = await global.getMainnetConn().simulateTransaction(tx);

  return txid;
};

export const getVersionedTransaction = async (
  conn: Connection | any,
  payers: any[],
  insts: any[],
  lookupAddr: any
): Promise<any> => {
  try {
    const recentBlockhashForSwap = await conn.getLatestBlockhash("finalized");

    const versionedTransaction = new VersionedTransaction(
      new TransactionMessage({
        payerKey: payers[0].publicKey,
        recentBlockhash: recentBlockhashForSwap.blockhash,
        instructions: insts,
      }).compileToV0Message(lookupAddr ? [lookupAddr] : [])
    );
    versionedTransaction.sign(payers);

    return versionedTransaction;
  } catch (error) {
    return await getVersionedTransaction(conn, payers, insts, lookupAddr);
  }
};

export const getTransferTokenInst = async (
  fromWallet: any,
  toAddr: string,
  token: any,
  amount: number
) => {
  return createTransferCheckedInstruction(
    fromWallet.wallet.publicKey,
    new PublicKey(token.addr),
    new PublicKey(toAddr),
    fromWallet.wallet.publicKey,
    Math.floor(amount * Math.pow(10, token.decimal)),
    token.decimal,
    [],
    TOKEN_PROGRAM_ID
  );
};
