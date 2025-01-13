import dotenv from "dotenv";

import * as bot from "./bot";

dotenv.config();

const main = async () => {
  await bot.init();
  await bot.sessionInit();
};

main();

process.on("SIGSEGV", async (e) => {
  console.log(e);

  await bot.bot.stopPolling();
  await bot.bot.closeWebHook();
  await bot.bot.deleteWebHook();
  await bot.init();
  await bot.sessionInit();
});

process.on("uncaughtException", async (e) => {
  console.log(e);
  await bot.bot.stopPolling();
  await bot.bot.closeWebHook();
  await bot.bot.deleteWebHook();
  await bot.init();
});
