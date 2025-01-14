import mongoose from "mongoose";

import * as user from "./user";
import * as token from "./token";
import * as wallet from "./wallet";
import * as global from "../global";

export const init = () => {
  return new Promise(async (resolve: any, reject: any) => {
    mongoose
      .connect(`mongodb://localhost:27017/${process.env.DB_NAME}`)
      .then(() => {
        console.log(`Connected to MongoDB "${process.env.DB_NAME}"...`);

        resolve();
      })
      .catch((err) => {
        global.error("[db init]", err);
        reject();
      });
  });
};

export { user, token, wallet };
