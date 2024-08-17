import * as bot from "../bot";

import { StateCode } from "../utils/constant";

export const procMessage = async (message: any, database: any) => {
  let chatId = message.chat.id.toString();
  let session = bot.sessions.get(chatId);
  let username = message?.chat?.username;
  let messageId = message?.messageId;

  if (bot.busy) {
    return;
  }

  if (message.photo) {
    console.log(message.photo);
    processSettings(message, database);
  }
};

const processSettings = async (message: any, database: any) => {
  const sessionId = message.chat?.id.toString();
  let messageId = message?.messageId;
  const session = bot.sessions.get(sessionId);

  if (!session) {
    return;
  }

  let stateMode = bot.stateMap_getFocus(sessionId);
  if (!stateMode) {
    bot.stateMap_setFocus(sessionId, StateCode.IDLE);
  }
};
