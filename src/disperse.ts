import * as database from "./db";
import * as utils from "./utils";
import * as fastSwap from "./fast_swap";
import * as jitoBundler from "./bundle";
import * as global from "./global";
import * as config from "./config";

const jito_bundler = new jitoBundler.JitoBundler();

const init = async () => {
  await database.init();
  // await disperseSOLToWallets()
  let wallets: any = await database.selectWallets({});
  for (let wallet of wallets) {
    wallet.usedTokenIdx = [];
    await wallet.save();
  }
  console.log("============= Bot Wallet End ===============");
};

const disperseSOLToWallets = async () => {
  console.log("============= Bot Wallet Initializing ===============");
  const disperseWallet: any = utils.getWalletFromPrivateKey(
    global.getDisperseWalletPrivkey()
  );
  let existWallets: any = await database.selectWallets({});

  if (existWallets.length < config.BOT_WORKING_WALLET_SIZE) {
    const rest: number = config.BOT_WORKING_WALLET_SIZE - existWallets.length;
    for (let i = 0; i < rest; i++) {
      const newWallet: any = utils.generateNewWallet();
      await database.addWallet({
        pubKey: newWallet.publicKey,
        prvKey: newWallet.secretKey,
      });
    }
  }
  existWallets = await database.selectWallets({});
  const balance: number =
    (await utils.getWalletSOLBalance(disperseWallet)) -
    config.LIMIT_REST_SOL_BALANCE;
  console.log("Disperse Wallet Balance: ", balance);

  let bundleTransactions: any[] = [];
  let bundleInstructions: any[] = [];
  if (balance) {
    let canSendWalletCount: number = Math.floor(
      balance / (config.SEND_SOL_AMOUNT + config.SOL_TRANSFER_FEE)
    );
    for (let i = 0; i < existWallets.length; i++) {
      const item = existWallets[i];
      if (!canSendWalletCount) {
        break;
      }
      const wallet: any = utils.getWalletFromPrivateKey(item.prvKey);
      const solBalance: number = await utils.getWalletSOLBalance(wallet);
      if (solBalance < config.SEND_SOL_AMOUNT / 2) {
        bundleInstructions.push(
          fastSwap.getTransferSOLInst(
            disperseWallet,
            wallet.publicKey,
            config.SEND_SOL_AMOUNT
          )
        );
        canSendWalletCount--;
      } else {
        continue;
      }
      // if (bundleInstructions.length == config.MAX_TRANSFER_INST_COUNT) {
      //     const conn = global.getMainnetConn()
      //     const versionedTransaction = await fastSwap.getVersionedTransaction(conn, [disperseWallet.wallet], bundleInstructions, null)
      //     const tix = await conn.sendTransaction(versionedTransaction, {
      //         skipPreflight: true,
      //         maxRetries: 20,
      //     })
      //     // await conn.confirmTransaction(tix, "confirmed")
      //     bundleInstructions = []
      // }
      if (
        bundleInstructions.length >= config.MAX_TRANSFER_INST_COUNT ||
        i === existWallets.length - 1
      ) {
        const conn = global.getMainnetConn();
        const versionedTx = await fastSwap.getVersionedTransaction(
          conn,
          [disperseWallet.wallet],
          bundleInstructions,
          null
        );
        if (versionedTx) {
          const simulateTx = await conn.simulateTransaction(versionedTx);
          if (!simulateTx.value.err) {
            bundleTransactions.push(versionedTx);
          }
        }

        bundleInstructions = [];
      }
    }
    console.log(bundleTransactions.length);
    for (
      let i = 0;
      i < bundleTransactions.length;
      i += config.JITO_LIMIT_REQUEST_PER_SEC
    ) {
      await jito_bundler.sendBundles(
        bundleTransactions.slice(i, i + config.JITO_LIMIT_REQUEST_PER_SEC),
        disperseWallet
      );
    }
  }
  console.log("============= Bot Wallet Initialized ===============");
};

init();
