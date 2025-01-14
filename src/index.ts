import dotenv from "dotenv";

dotenv.config();

import * as instance from "./bot";

process.on("SIGSEGV", async (e) => {
  console.log(e);

  await instance.bot.stopPolling();
  await instance.bot.closeWebHook();
  await instance.bot.deleteWebHook();
  await instance.init();
  await instance.sessionInit();
});

process.on("uncaughtException", async (e) => {
  console.log(e);
  await instance.bot.stopPolling();
  await instance.bot.closeWebHook();
  await instance.bot.deleteWebHook();
  await instance.init();
});

const main = async () => {
  await instance.init();
  await instance.sessionInit();
};

main();
