import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

export let web3Conn: Connection;

export const setWeb3 = (conn: Connection) => {
  web3Conn = conn;
};
