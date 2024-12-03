import { PublicKey } from "@solana/web3.js";

export const isValidAddress = (address: string) => {
  try {
    const publicKey = new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

export const objectDeepCopy = (obj: any, keysToExclude: string[] = []): any => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const copiedObject: Record<string, any> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keysToExclude.includes(key)) {
      copiedObject[key] = obj[key];
    }
  }

  return copiedObject;
};
