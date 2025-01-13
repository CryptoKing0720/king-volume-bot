import mongoose from "mongoose";

import * as user from "./user";
import * as token from "./token";
import * as wallet from "./wallet";

export const init = () => {
  return new Promise(async (resolve: any, reject: any) => {
    mongoose
      .connect(`mongodb://localhost:27017/${process.env.DB_NAME}`)
      .then(() => {
        console.log(`Connected to MongoDB "${process.env.DB_NAME}"...`);

        resolve();
      })
      .catch((err) => {
        console.error("Could not connect to MongoDB...", err);
        reject();
      });
  });
};

export { user, token, wallet };
