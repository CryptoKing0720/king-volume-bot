import { PublicKey } from "@solana/web3.js";

import * as instance from ".";
import * as database from "../db";
import * as fastSwap from "../web3/fast_swap";
import * as global from "../global";
import * as bundle from "../web3/bundle";
import * as config from "../config";
import * as utils from "../utils";

const jitoBundler = new bundle.JitoBundler();

const lookUpTableMap = new Map();

let solPrice = 0;

const makeTransactionAndSendBundle = async (
  depositWallet: any,
  wallets: any[],
  token: any,
  maxRetry: number = 4
) => {
  let buyAmount: number = parseFloat(
    (await utils.getWalletSOLBalance(depositWallet)).toFixed(5)
  );
  if (buyAmount < config.LIMIT_REST_SOL_BALANCE * 5) {
    return;
  }
  const tokenBalance: number = await utils.getWalletTokenBalance(
    depositWallet,
    token.addr,
    token.decimal
  );
  const bundleTransactions: any[] = [];
  if (buyAmount < token.solAmount + config.LIMIT_REST_SOL_BALANCE) {
    buyAmount -= config.LIMIT_REST_SOL_BALANCE;
  } else {
    buyAmount = token.solAmount;
  }
  if (buyAmount <= 0) return;
  const conn = global.getMainnetConn();
  let totalSwapSolAmount: number = buyAmount;
  for (let i = 0; i < wallets.length; i++) {
    try {
      const wallet: any = utils.getWalletFromPrivateKey(wallets[i].prvKey);

      let instructions: any[] = [];
      const transferToWallet = fastSwap.getTransferSOLInst(
        depositWallet,
        wallet.publicKey,
        config.EXCHANGE_SOL
      );
      const transferFromWallet = fastSwap.getTransferSOLInst(
        wallet,
        depositWallet.publicKey,
        config.EXCHANGE_SOL
      );
      instructions.push(transferFromWallet);
      instructions.push(transferToWallet);
      console.log("buy amount", buyAmount);

      const buyInsts = await fastSwap.getBuyTransactionInsts(
        depositWallet,
        buyAmount,
        fastSwap.PoolKeysMap.get(token.addr)
      );
      instructions = instructions.concat(buyInsts.instructions.slice(1, 5));
      const sellTokenAmount = parseFloat(
        buyInsts.amount.toFixed(token.decimal)
      );
      const sellInsts: any = await fastSwap.getSellTransactionInsts(
        depositWallet,
        i >= wallets.length - 1
          ? sellTokenAmount + tokenBalance
          : sellTokenAmount,
        fastSwap.PoolKeysMap.get(token.addr)
      );
      instructions = instructions.concat(sellInsts.instructions.slice(1, 5));

      buyAmount = parseFloat(sellInsts.amount.toFixed(5));
      totalSwapSolAmount += buyAmount;
      if (i >= wallets.length - 1) {
        const tax = parseFloat(
          (totalSwapSolAmount * 2 * config.TAX).toFixed(9)
        );
        if (tax > 0) {
          instructions.push(
            fastSwap.getTransferSOLInst(
              depositWallet,
              global.getTaxWalletAddress(),
              tax
            )
          );
        }
        const tipAccounts = config.JITO_TIP_ACCOUNTS;
        const tipAccount =
          tipAccounts[utils.getRandomNumber(0, tipAccounts.length - 1)];
        instructions.push(
          fastSwap.getTransferSOLInst(
            depositWallet,
            tipAccount,
            config.JITO_BUNDLE_TIP
          )
        );
      }
      console.log("Instruction Length: ", instructions.length);
      const versionedTransaction = await fastSwap.getVersionedTransaction(
        conn,
        [wallet.wallet, depositWallet.wallet],
        instructions,
        lookUpTableMap.get(token.addr)
      );
      if (versionedTransaction) {
        const simulateTx = await conn.simulateTransaction(versionedTransaction);
        if (!simulateTx.value.err) {
          bundleTransactions.push(versionedTransaction);
        }
      }
      // bundleTransactions.push(versionedTransaction)
    } catch (error) {
      console.log("Tx Error: ", error);
      i--;
    }
  }
  console.log("BundleTx Length: ", bundleTransactions.length);
  if (
    !(await jitoBundler.sendBundles(bundleTransactions, null, 2)) &&
    maxRetry
  ) {
    makeTransactionAndSendBundle(depositWallet, wallets, token, maxRetry - 1);
  } else {
    const _token: any = await database.token.selectToken({
      chatid: token.chatid,
      addr: token.addr,
    });
    _token.reqCount += 1;
    _token.volume += totalSwapSolAmount * 2 * solPrice;
    await _token.save();
  }
};

const sellAllTokens = async (chatid: string, addr: string) => {
  const user: any = await database.user.selectUser({ chatid });
  const depositWallet: any = utils.getWalletFromPrivateKey(user.depositWallet);
  const token: any = await database.token.selectToken({ chatid, addr });
  const loadPoolKeys: boolean = await fastSwap.loadPoolkeysFromMarket(
    token.addr,
    token.decimal
  );
  if (loadPoolKeys) {
    const tokenBalance: number = await utils.getWalletTokenBalance(
      depositWallet,
      token.addr,
      token.decimal
    );
    if (!tokenBalance || tokenBalance < 1) {
      return;
    }
    const sellInsts: any = await fastSwap.getSellTransactionInsts(
      depositWallet,
      tokenBalance,
      fastSwap.PoolKeysMap.get(token.addr)
    );
    const versionedTransaction = await fastSwap.getVersionedTransaction(
      global.getMainnetConn(),
      [depositWallet.wallet],
      sellInsts.instructions,
      null
    );
    await jitoBundler.sendBundles([versionedTransaction], depositWallet, 4);
  }
};

export const registerToken = async (
  chatid: string, // this value is not filled in case of web request, so this could be 0
  addr: string,
  symbol: string,
  decimal: number
) => {
  if (await database.token.selectToken({ chatid, addr })) {
    return config.ResultCode.SUCCESS;
  }
  const tokens: any = await database.token.selectTokens({});
  const regist = await database.token.registToken({
    chatid,
    addr,
    symbol,
    decimal,
    idx: tokens.length + 1,
  });
  if (!regist) {
    return config.ResultCode.INTERNAL;
  }
  return config.ResultCode.SUCCESS;
};

export const run = async (chatid: string, addr: string) => {
  const user: any = await database.user.selectUser({ chatid });
  const depositWallet: any = utils.getWalletFromPrivateKey(user.depositWallet);
  let token: any = await database.token.selectToken({ chatid, addr });

  const wallets: any = await database.wallet.selectWallets({});

  let reqWallets: any[] = [];
  let lastWorkingTime = new Date().getDate();
  for (let i = 0; i < wallets.length; i++) {
    token = await database.token.selectToken({ chatid, addr });
    if (token.volume / config.VOLUME_UNIT >= token.target) {
      await instance.sendMessage(
        chatid,
        "😀 Congratulation, Bot achieved target."
      );
      await stop(chatid, addr);
      break;
    }
    if (!token.botId) {
      break;
    }
    let usedTokens = wallets[i].usedTokenIdx;
    if (usedTokens.indexOf(token.idx) >= 0) {
      continue;
    }
    reqWallets.push(wallets[i]);
    if (reqWallets.length == 5) {
      const solBalance: number = await utils.getWalletSOLBalance(depositWallet);
      if (solBalance < config.LIMIT_REST_SOL_BALANCE) {
        await instance.sendMessage(
          chatid,
          "⚠️ Warning, There is not enough SOL. Please deposit more SOL if you wanna make volume and try again."
        );
        break;
      }
      for (let wallet of reqWallets) {
        wallet.usedTokenIdx.push(token.idx);
        await wallet.save();
      }
      makeTransactionAndSendBundle(depositWallet, reqWallets, token);
      reqWallets = [];
      const now = new Date().getDate();
      token.workingTime += now - lastWorkingTime;
      lastWorkingTime = now;
      await token.save();
      await utils.sleep(token.delay * 1000);
    }
  }
};

export const start = async (
  chatid: string,
  addr: string,
  force: boolean = false
) => {
  console.log("----------starting--------", addr);

  solPrice = await utils.getSOLPrice();
  if (!solPrice) {
    solPrice = await utils.getSOLPrice();
  }
  const user: any = await database.user.selectUser({ chatid });
  const depositWallet: any = utils.getWalletFromPrivateKey(user.depositWallet);
  const token: any = await database.token.selectToken({ chatid, addr });
  const solBalance: number = await utils.getWalletSOLBalance(depositWallet);
  if (solBalance < config.LIMIT_REST_SOL_BALANCE * 5) {
    await instance.sendMessage(
      chatid,
      "⚠️ Warning, There is not enough SOL. Please deposit more SOL if you wanna make volume and try again."
    );
    return config.ResultCode.USER_INSUFFICIENT_ENOUGH_SOL;
  }
  const conn = global.getMainnetConn();

  if (token.botId) {
    return config.ResultCode.SUCCESS;
  }
  token.botId = 1;
  await token.save();
  const loadPoolKeys: boolean = await fastSwap.loadPoolkeysFromMarket(
    token.addr,
    token.decimal
  );
  if (loadPoolKeys) {
    if (token.lookupTableAddr && token.lookupTableAddr != "") {
      const lookupTableAccount: any = (
        await conn.getAddressLookupTable(new PublicKey(token.lookupTableAddr), {
          commitment: "finalized",
        })
      ).value;
      lookUpTableMap.set(token.addr, lookupTableAccount);
    }
    if (!token.lookupTableAddr || token.lookupTableAddr == "") {
      const poolKeys = fastSwap.PoolKeysMap.get(token.addr);
      const createLookupTable = await fastSwap.getCreateLookUpTableTransaction(
        depositWallet,
        poolKeys
      );
      await jitoBundler.sendBundles(
        createLookupTable.transactions,
        depositWallet,
        10
      );
      token.lookupTableAddr = createLookupTable.address.toString();

      for (let index = 0; index < 20; index++) {
        await utils.sleep(1000);
        const lookupTableAccount: any = (
          await conn.getAddressLookupTable(
            new PublicKey(token.lookupTableAddr),
            { commitment: "finalized" }
          )
        ).value;
        if (lookupTableAccount) {
          lookUpTableMap.set(token.addr, lookupTableAccount);
          break;
        }
      }
    }

    if (!(await utils.isTokenAccountInWallet(depositWallet, addr))) {
      const insts = [
        fastSwap.getCreateAccountTransactionInst(
          depositWallet,
          depositWallet,
          token.addr
        ),
      ];
      const versionedTransaction = await fastSwap.getVersionedTransaction(
        conn,
        [depositWallet.wallet],
        insts,
        lookUpTableMap.get(token.addr)
      );
      await jitoBundler.sendBundles([versionedTransaction], depositWallet, 10);
      await utils.sleep(4000);
    }

    try {
      await fastSwap.getBuyTransactionInsts(
        depositWallet,
        config.MIN_BUY_AMOUNT,
        fastSwap.PoolKeysMap.get(token.addr)
      );
    } catch (error) {
      console.log(error);

      await token.save();
      await instance.sendMessage(
        chatid,
        "Sorry, Bot cann't buy this token now. Please try again later."
      );
      token.botId = 0;
      await token.save();
      return config.ResultCode.INTERNAL;
    }

    console.log("----------running--------");
    run(chatid, addr);
  }
  return config.ResultCode.SUCCESS;
};

export const stop = async (chatid: string, addr: string) => {
  const token: any = await database.token.selectToken({ chatid, addr });
  await sellAllTokens(chatid, addr);
  token.botId = 0;
  await token.save();
  return config.ResultCode.SUCCESS;
};

export const withdraw = async (chatid: string, addr: string) => {
  const user: any = await database.user.selectUser({ chatid });
  const depositWallet: any = utils.getWalletFromPrivateKey(user.depositWallet);
  const depositWalletSOLBalance: number = await utils.getWalletSOLBalance(
    depositWallet
  );
  if (depositWalletSOLBalance <= config.SOL_TRANSFER_FEE) {
    return false;
  }
  return await jitoBundler.sendBundles(
    [
      await fastSwap.getVersionedTransaction(
        global.getMainnetConn(),
        [depositWallet.wallet],
        [
          fastSwap.getTransferSOLInst(
            depositWallet,
            addr,
            depositWalletSOLBalance - 0.002
          ),
        ],
        null
      ),
    ],
    depositWallet
  );
};
