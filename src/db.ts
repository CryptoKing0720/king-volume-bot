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

export const Token = mongoose.model(
  "Token",
  new mongoose.Schema({
    chatid: String,
    idx: Number,
    addr: String,
    symbol: String,
    decimal: Number,
    timestamp: Number,
    botId: Number,
    lookupTableAddr: String,
    target: Number,
    solAmount: Number,
    delay: Number,
    volume: Number,
    workingTime: Number,
    reqCount: Number,
  })
);

export const Wallet = mongoose.model(
  "Wallet",
  new mongoose.Schema({
    pubKey: String,
    prvKey: String,
    usedTokenIdx: Array,
    timestamp: Number,
  })
);

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

export const registToken = (params: any) => {
  return new Promise(async (resolve, reject) => {
    const item = new Token();
    item.timestamp = new Date().getTime();
    item.chatid = params.chatid;
    item.idx = params.idx;
    item.addr = params.addr;
    item.symbol = params.symbol;
    item.decimal = params.decimal;
    item.botId = 0;
    item.lookupTableAddr = "";
    item.target = 1;
    item.delay = 10;
    item.solAmount = 3;
    item.volume = 0;
    item.workingTime = 0;
    item.reqCount = 0;
    await item.save();
    resolve(item);
  });
};

export const removeToken = (params: any) => {
  return new Promise((resolve, reject) => {
    Token.deleteOne(params).then(() => {
      resolve(true);
    });
  });
};

export const selectToken = async (params: any) => {
  return new Promise(async (resolve, reject) => {
    Token.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
};

export const selectTokens = async (params: any = {}, limit: number = 0) => {
  return new Promise(async (resolve, reject) => {
    if (limit) {
      Token.find(params)
        .limit(limit)
        .then(async (dcas) => {
          resolve(dcas);
        });
    } else {
      Token.find(params).then(async (dcas) => {
        resolve(dcas);
      });
    }
  });
};

export const updateToken = async (params: any) => {
  return new Promise(async (resolve, reject) => {
    Token.updateOne(params).then(async (user) => {
      resolve(user);
    });
  });
};

export const addWallet = async (params: any) => {
  return new Promise(async (resolve, reject) => {
    const item = new Wallet();
    item.timestamp = new Date().getTime();

    item.pubKey = params.pubKey;
    item.prvKey = params.prvKey;
    item.usedTokenIdx = [];

    await item.save();

    resolve(item);
  });
};

export const selectWallets = async (params: any = {}, limit: number = 0) => {
  return new Promise(async (resolve, reject) => {
    if (limit) {
      Wallet.find(params)
        .limit(limit)
        .then(async (dcas) => {
          resolve(dcas);
        });
    } else {
      Wallet.find(params).then(async (dcas) => {
        resolve(dcas);
      });
    }
  });
};

export const deleteWallets = async (params: any = {}) => {
  return new Promise(async (resolve, reject) => {
    Wallet.deleteMany(params).then(async (dcas) => {
      resolve(dcas);
    });
  });
};
