import { Connection, clusterApiUrl } from "@solana/web3.js";

import * as bot from "./bot";
import * as global from "./global";

const conn: Connection = new Connection(clusterApiUrl("testnet"), "confirmed");
// const conn = new Connection(process.env.MAINNET_RPC, "processed");

global.setWeb3(conn);

bot.init();
