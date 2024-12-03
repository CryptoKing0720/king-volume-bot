import { Connection, clusterApiUrl } from "@solana/web3.js";

import * as bot from "./bot";
import * as global from "./global";
import { run } from "./app";

const conn: Connection = new Connection(clusterApiUrl("testnet"), "confirmed");
// const conn: Connection = new Connection(process.env.MAINNET_RPC, "processed");

global.setWeb3(conn);

bot.init();
bot.sessionInit();

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);

  try {
    await bot.bot.stopPolling();
    bot.init();
  } catch (e) {
    console.error("Error during recovery:", e);
  }
});

process.on("SIGSEGV", async (error) => {
  try {
    await bot.bot.stopPolling();
    bot.init();
  } catch (e) {
    console.error("Error during recovery:", e);
  }
});

run(bot);
