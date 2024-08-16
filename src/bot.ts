import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

export let busy = true;

export const init = () => {
  const bot = new TelegramBot(process.env.BOT_TOKEN as string, {
    polling: true,
  });

  bot.on("message", (message: any) => {
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

export const executeCommand = (
  chatId: string,
  _messageId: number | undefined,
  _callbackQueryId: string | undefined,
  option: any
) => {};
