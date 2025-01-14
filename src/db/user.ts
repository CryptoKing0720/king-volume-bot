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

export const updateUser = async (params: any) => {
  try {
    let user = await User.findOne({ chatid: params.chatid });
    if (!user) {
      user = new User();
    }

    user.chatid = params.chatid;
    user.username = params.username ?? "";
    user.depositWallet = params.depositWallet;
    user.addr = params.addr ?? "";

    await user.save();
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update user: ${error.message}`);
    } else {
      throw new Error(`Failed to update user: Unknown error`);
    }
  }
};

export const removeUser = async (params: any) => {
  try {
    await User.deleteOne({ chatid: params.chatid });
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove user: ${error.message}`);
    } else {
      throw new Error(`Failed to remove user: Unknown error`);
    }
  }
};

export const selectUser = async (params: any) => {
  try {
    const user = await User.findOne(params);
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to select user: ${error.message}`);
    } else {
      throw new Error(`Failed to select user: Unknown error`);
    }
  }
};

export const selectUsers = async (params: any = {}) => {
  try {
    const users = await User.find(params);
    return users;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to select users: ${error.message}`);
    } else {
      throw new Error(`Failed to select users: Unknown error`);
    }
  }
};

export const countUsers = async (params: any = {}) => {
  try {
    const count = await User.countDocuments(params);
    return count;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to count users: ${error.message}`);
    } else {
      throw new Error(`Failed to count users: Unknown error`);
    }
  }
};
