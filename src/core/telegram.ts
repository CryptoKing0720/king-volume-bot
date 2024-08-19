import assert from "assert";

import * as bot from "../bot";
import { StateCode } from "../utils/constant";
import * as utils from "../utils/utils";

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

  let stateNode = bot.getStateMapFocus(sessionId);
  if (!stateNode) {
    bot.setStateMapFocus(sessionId, StateCode.IDLE, { sessionId: sessionId });
    stateNode = bot.getStateMap(sessionId);

    assert(stateNode);
  }

  const stateData = stateNode.data;
  if (stateNode.state === StateCode.WAIT_WITHDRAW_WALLET_ADDRESS) {
    const addr = message.text.trim();
    if (!addr || addr === "" || !utils.isValidAddress(addr)) {
      bot.openMessage(
        sessionId,
        "",
        0,
        "⛔ Sorry, the token address you entered is invalid, Please try again"
      );
      return;
    }
  }
};
