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

export const initStateMap = (chatId: string) => {
  let item = {
    focus: { state: StateCode.IDLE, data: { sessionId: chatId } },
    message: new Map(),
  };

  stateMap.set(chatId, item);

  return item;
};

export const getStateMapFocus = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let focusItem = item.focus;
    return focusItem;
  }

  return null;
};

export const setStateMapFocus = (
  chatId: string,
  state: any,
  data: any = {}
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = initStateMap(chatId);
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

export const getStateMap = (chatId: string) => {
  stateMap.get(chatId);
};

export const openMessage = async (
  chatId: string,
  bannerId: string,
  messageType: number,
  menuTitle: string
) => {
  await removeMenu(chatId, messageType);

  try {
    let msg: TelegramBot.Message;

    if (bannerId) {
      msg = await bot.sendPhoto(chatId, bannerId, {
        caption: menuTitle,
        parse_mode: "HTML",
      });
    } else {
      msg = await bot.sendMessage(chatId, menuTitle, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    }

    setStateMapMessageId(chatId, messageType, msg.message_id);
    return { messageId: msg.message_id, chatId: msg.chat.id };
  } catch (error) {
    global.errorLog("openMenu", error);
    return null;
  }
};

export const removeMenu = async (chatId: string, messageType: number) => {
  const msgId = getStateMapMessageId(chatId, messageType);
  if (msgId) {
    try {
      await bot.deleteMessage(chatId, msgId);
    } catch (error) {}
  }
};

export const setStateMapMessageId = (
  chatId: string,
  messageType: number,
  messageId: number
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = initStateMap(chatId);
  }

  item.message.set(`t${messageType}`, messageId);
};

export const getStateMapMessageId = (chatId: string, messageType: number) => {
  const messageItem = getStateMapMessage(chatId);
  if (messageItem) {
    return messageItem.get(`t${messageType}`);
  }

  return null;
};

export const getStateMapMessage = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let messageItem = item.message;
    return messageItem;
  }

  return null;
};
