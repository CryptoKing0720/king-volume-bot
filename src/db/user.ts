import mongoose from "mongoose";

export const User = mongoose.model(
  "User",
  new mongoose.Schema({
    chatid: String,
    username: String,
    depositWallet: String,
    addr: String,
    timestamp: Number,
  })
);

export const updateUser = (params: any) => {
  return new Promise(async (resolve, reject) => {
    User.findOne({ chatid: params.chatid }).then(async (user: any) => {
      if (!user) {
        user = new User();
      }

      user.chatid = params.chatid;
      user.username = params.username ?? "";
      // if (user.depositWallet == "" || !user.depositWallet) {
      user.depositWallet = params.depositWallet;
      // }
      user.addr = params.addr ?? "";

      await user.save();

      resolve(user);
    });
  });
};

export const removeUser = (params: any) => {
  return new Promise((resolve, reject) => {
    User.deleteOne({ chatid: params.chatid }).then(() => {
      resolve(true);
    });
  });
};

export const selectUser = async (params: any) => {
  return new Promise(async (resolve, reject) => {
    User.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
};

export const selectUsers = async (params: any = {}) => {
  return new Promise(async (resolve, reject) => {
    User.find(params).then(async (users) => {
      resolve(users);
    });
  });
};

export const countUsers = async (params: any = {}) => {
  return new Promise(async (resolve, reject) => {
    User.countDocuments(params).then(async (users) => {
      resolve(users);
    });
  });
};
