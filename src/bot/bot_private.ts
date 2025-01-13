import assert from "assert";
import dotenv from "dotenv";

import * as instance from ".";
import * as botLogic from "./bot_logic";
import * as config from "../config";
import * as utils from "../utils";

dotenv.config();

const parseCode = async (database: any, session: any, wholeCode: string) => {
  let codes: string[] = wholeCode.split("_");
  console.log(codes);

  if (codes.length % 2 === 0) {
    for (let i = 0; i < codes.length; i += 2) {
      const type = codes[i];
      const code = codes[i + 1];

      if (type === "ref") {
        if (!session.referredBy) {
          let referredBy: string = "";

          referredBy = utils.decodeChatId(code);
          if (referredBy === "" || referredBy === session.chatid) {
            continue;
          }

          if (referredBy.length > 0) {
            const refSession = instance.sessions.get(referredBy);
            if (refSession) {
              console.log(
                `${session.username} has been invited by @${refSession.username} (${refSession.chatid})`
              );
            }

            instance.sendInfoMessage(
              referredBy,
              `Great news! You have invited @${session.username}
You can earn 1.5% of their earning forever!`
            );

            session.referredBy = referredBy;
            session.referredTimestamp = new Date().getTime();

            await database.user.updateUser(session);
          }
        }
      }
    }
  }
  return false;
};

const processSettings = async (msg: any, database: any) => {
  const sessionId = msg.chat?.id.toString();
  let messageId = msg?.messageId;

  const session = instance.sessions.get(sessionId);
  if (!session) {
    return;
  }

  let stateNode = instance.getStateMapFocus(sessionId);
  if (!stateNode) {
    instance.setStateMapFocus(sessionId, instance.StateCode.IDLE, {
      sessionId: sessionId,
    });
    stateNode = instance.getStateMap(sessionId);

    assert(stateNode);
  }

  const stateData = stateNode.data;

  if (stateNode.state === instance.StateCode.WAIT_SET_TARGET_VOLUME) {
    const value = Number(msg.text.trim());
    if (isNaN(value) || value < 0.1) {
      instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the target volume amount you entered is invalid. Please try again`
      );
      return;
    }
    const token: any = await database.token.selectToken({
      chatid: sessionId,
      addr: session.addr,
    });
    token.target = value;
    await token.save();
    const menu: any = await instance.jsonMain(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.message_id,
      title,
      menu.options
    );
  } else if (stateNode.state === instance.StateCode.WAIT_SET_DELAY) {
    const value = Number(msg.text.trim());
    if (isNaN(value) || value < 1) {
      instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the delay time you entered is invalid. Please try again`
      );
      return;
    }
    const token: any = await database.token.selectToken({
      chatid: sessionId,
      addr: session.addr,
    });
    token.delay = value;
    await token.save();
    const menu: any = await instance.jsonMain(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.message_id,
      title,
      menu.options
    );
  } else if (stateNode.state === instance.StateCode.WAIT_SET_STEP_AMOUNT) {
    const value = Number(msg.text.trim());
    if (isNaN(value) || value < 0.1) {
      instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the sol amount you entered is invalid. Please try again`
      );
      return;
    }
    const token: any = await database.token.selectToken({
      chatid: sessionId,
      addr: session.addr,
    });
    token.solAmount = value;
    await token.save();
    const menu: any = await instance.jsonMain(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.message_id,
      title,
      menu.options
    );
  } else if (stateNode.state === instance.StateCode.WAIT_WALLET_ADRR) {
    const value = msg.text.trim();
    if (!value || value === "" || !utils.isValidAddress(value)) {
      instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the wallet address you entered is invalid. Please try again`
      );
      return;
    }
    await botLogic.withdraw(sessionId, value);
    const menu: any = await instance.jsonMain(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.message_id,
      title,
      menu.options
    );
  }
};

export const procMessage = async (message: any, database: any) => {
  let chatid = message.chat.id.toString();
  let session = instance.sessions.get(chatid);
  let userName = message?.chat?.username;
  let messageId = message?.messageId;
  let stateNode = instance.getStateMapFocus(chatid);
  const stateData = stateNode?.data;

  if (instance.busy) {
    return;
  }

  if (message.photo) {
    console.log(message.photo);
    processSettings(message, database);
  }

  if (message.animation) {
    console.log(message.animation);
    processSettings(message, database);
  }

  if (!message.text) return;

  let command = message.text;
  if (message.entities) {
    for (const entity of message.entities) {
      if (entity.type === "bot_command") {
        command = command.substring(
          entity.offset,
          entity.offset + entity.length
        );
        break;
      }
    }
  }

  if (command.startsWith("/")) {
    if (!session) {
      if (!userName) {
        console.log(
          `Rejected anonymous incoming connection. chatid = ${chatid}`
        );
        instance.sendMessage(
          chatid,
          `Welcome to ${process.env.BOT_TITLE} bot. We noticed that your telegram does not have a username. Please create username [Setting]->[Username] and try again.`
        );
        return;
      }

      session = await instance.createSession(chatid, userName);
      await database.user.updateUser(session);
      console.log(`@${userName} has been joined.\n${session.depositWallet}`);
    }

    if (userName && session.username !== userName) {
      session.username = userName;
      await database.user.updateUser(session);
    }

    let params = message.text.split(" ");
    if (params.length > 0 && params[0] === command) {
      params.shift();
    }

    command = command.slice(1);

    if (command === instance.COMMAND_START) {
      let hideWelcome: boolean = false;
      if (params.length == 1 && params[0].trim() !== "") {
        let wholeCode = params[0].trim();
        hideWelcome = await parseCode(database, session, wholeCode);

        await instance.removeMessage(chatid, message.message_id);
      }

      instance.openMessage(
        chatid,
        "",
        0,
        `You are welcome, To get quick start, please input token address.`
      );
    }
    // instance.removeStateMap(chatid)
  } else if (message.reply_to_message) {
    processSettings(message, database);
    await instance.removeMessage(chatid, message.message_id); //TGR
    await instance.removeMessage(chatid, message.reply_to_message.message_id);
  } else if (utils.isValidAddress(command)) {
    if (!session) {
      session = await instance.createSession(chatid, userName);
      await database.user.updateUser(session);
      console.log(`@${userName} session has been logged.\n${session}`);
    }
    await instance.removeMessage(chatid, messageId);
    const token: any = await database.token.selectToken({
      chatid,
      addr: command,
    });
    if (!token) {
      const { exist, symbol, decimal }: any = await utils.getTokenInfo(command);
      if (!exist) {
        await instance.openMessage(
          chatid,
          "",
          0,
          `❌ Token is invalide. Please try again later.`
        );
        return;
      }
      const registered = await botLogic.registerToken(
        chatid,
        command,
        symbol,
        decimal
      );
      if (registered === config.ResultCode.SUCCESS) {
        await instance.removeMessage(chatid, messageId);
        await instance.openMessage(
          chatid,
          "",
          0,
          `✔️ Token is registered successfully.`
        );
      } else {
        await instance.openMessage(
          chatid,
          "",
          0,
          `❌ Failed to register token.`
        );
        return;
      }
    }
    session.addr = command;
    await database.user.updateUser(session);
    await instance.executeCommand(chatid, undefined, undefined, {
      c: instance.OptionCode.MAIN_MENU,
      k: `${chatid}`,
    });
  } else {
    instance.openMessage(
      chatid,
      "",
      0,
      `😉 You are welcome, To get quick start, please enter token address.`
    );
  }
};
