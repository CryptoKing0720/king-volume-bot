import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

import * as database from "./db";
import { StateCode } from "./utils/constant";

export let busy = true;
export let bot: TelegramBot;
export const sessions = new Map();
export const stateMap = new Map();

export const init = async () => {
  busy = true;
  bot = new TelegramBot(process.env.BOT_TOKEN as string, {
    polling: true,
  });

  bot.on("message", async (message: any) => {
    const chatId = message.chat.id;
    const messageTxt = message.text;
    const messageType = message?.chat?.type;

    if (messageTxt == "/start") {
      bot.sendMessage(chatId, "Welcome to the bot!");
    }

    if (messageType == "private") {
      console.log(message);
    } else if (messageType == "group" || messageType == "supergroup") {
    } else if (messageType == "channel") {
    }
  });

  bot.on("callback_query", (callbackQuery: TelegramBot.CallbackQuery) => {
    const message = callbackQuery.message;
    if (!message) {
      return;
    }

    console.log("++++++++++ callback_query ++++++++++", message);
    const option = JSON.parse(callbackQuery.data as string);
    let chatId = message.chat.id.toString();
    executeCommand(chatId, message.message_id, callbackQuery.id, option);
  });

  console.log("++++++++++ bot started ++++++++++");
  busy = false;
};

export const executeCommand = async (
  chatId: string,
  _messageId: number | undefined,
  _callbackQueryId: string | undefined,
  option: any
) => {};

export const sessionInit = async () => {
  await database.init();
};

export const stateMap_init = (chatId: string) => {
  let item = {
    focus: { state: StateCode.IDLE, data: { sessionId: chatId } },
    message: new Map(),
  };

  stateMap.set(chatId, item);

  return item;
};

export const stateMap_getFocus = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let focusItem = item.focus;
    return focusItem;
  }

  return null;
};

export const stateMap_setFocus = (
  chatId: string,
  state: any,
  data: any = {}
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = stateMap_init(chatId);
  }

  if (!data) {
    let focusData = {};
    if (item.focus && item.focus.data) {
      focusData = item.focus.data;
    }

    item.focus = { state, data: focusData };
  } else {
    item.focus = { state, data };
  }
};
