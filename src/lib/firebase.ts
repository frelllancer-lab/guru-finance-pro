import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
    });
  }
  return (window as any).recaptchaVerifier;
};

export const sendPhoneCode = async (phoneNumber: string, appVerifier: any) => {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

export type { ConfirmationResult } from 'firebase/auth';
