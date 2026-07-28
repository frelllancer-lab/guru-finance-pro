import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BankAccount, Transaction } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if available
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Helper: Google Sign In
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw error;
  }
};

// Helper: Apple Sign In
export const loginWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Apple login error:', error);
    throw error;
  }
};

// Helper: Email Login / Register
export const loginWithEmail = async (email: string, pass: string, isRegistering: boolean = false) => {
  try {
    if (isRegistering) {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      return result.user;
    } else {
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
      } catch (err: any) {
        // If user not found, try registering automatically
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const result = await createUserWithEmailAndPassword(auth, email, pass);
          return result.user;
        }
        throw err;
      }
    }
  } catch (error: any) {
    console.error('Email login error:', error);
    throw error;
  }
};

// Helper: Phone Auth Recaptcha
export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
    });
  }
  return (window as any).recaptchaVerifier;
};

export const sendPhoneCode = async (phoneNumber: string, appVerifier: any): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

// Helper: Sign Out
export const logoutUser = async () => {
  await signOut(auth);
};

// FIRESTORE USER DATA SYNCING

export interface UserAppData {
  accounts: BankAccount[];
  transactions: Transaction[];
  categoryLimits: Record<string, number>;
}

// Subscribe to User Data in Firestore
export const subscribeToUserData = (
  userId: string,
  onData: (data: UserAppData) => void
) => {
  const userDocRef = doc(db, 'users', userId);

  return onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onData({
        accounts: data.accounts || [],
        transactions: data.transactions || [],
        categoryLimits: data.categoryLimits || {},
      });
    } else {
      // User document doesn't exist yet
      onData({
        accounts: [],
        transactions: [],
        categoryLimits: {},
      });
    }
  }, (err) => {
    console.error('Firestore subscription error:', err);
  });
};

// Save entire state or migrate initial state to Firestore
export const saveUserDataToFirestore = async (userId: string, data: UserAppData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      accounts: data.accounts,
      transactions: data.transactions,
      categoryLimits: data.categoryLimits,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving user data to Firestore:', err);
  }
};

// Check if user has data in Firestore
export const checkUserDocExists = async (userId: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    return snap.exists();
  } catch (err) {
    return false;
  }
};
