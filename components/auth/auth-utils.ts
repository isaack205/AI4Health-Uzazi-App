import type { FirebaseError } from "firebase/app";
import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { getDefaultRouteForRole, getRequiredRole } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";
import type { AppUser, Mother, UserRole } from "@/lib/types";

export const PHONE_REGEX = /^\+[1-9]\d{8,14}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_ALIAS_DOMAIN = "phone.uzazi.app";
export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
];

export const LANGUAGE_TOGGLE_OPTIONS = [
  { code: "EN", label: "English", uiLabel: "EN" },
  { code: "SW", label: "Swahili", uiLabel: "SW" },
  { code: "KI", label: "Kikuyu", uiLabel: "KI" },
] as const;

export const PREFERRED_LANGUAGES = ["Swahili", "Kikuyu", "English", "Hausa", "Amharic"] as const;
export const TESTIMONIAL_PILLS = [
  { name: "Amina", text: "Niko hapa, najihisi kusikizwa." },
  { name: "Wanjiku", text: "Uzazi inanipa utulivu wa usiku." },
  { name: "Zawadi", text: "Najua msaada uko karibu." },
];

let persistencePromise: Promise<void> | null = null;

export function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function isPhoneNumber(value: string) {
  return PHONE_REGEX.test(normalizePhoneNumber(value));
}

export function isEmailAddress(value: string) {
  return EMAIL_REGEX.test(value.trim().toLowerCase());
}

export function toAuthEmail(identifier: string, emailOverride?: string) {
  const candidate = (emailOverride || identifier).trim().toLowerCase();

  if (isEmailAddress(candidate)) {
    return candidate;
  }

  const phone = normalizePhoneNumber(candidate);
  return `${phone.replace(/^\+/, "")}@${PHONE_ALIAS_DOMAIN}`;
}

export function getStoredLocale() {
  if (typeof window === "undefined") {
    return "EN";
  }

  return localStorage.getItem("uzazi-language") ?? "EN";
}

export function storeLocale(locale: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("uzazi-language", locale);
  }
}

export function localeToLanguage(locale: string) {
  if (locale === "SW") {
    return "Swahili";
  }

  if (locale === "KI") {
    return "Kikuyu";
  }

  return "English";
}

export function calculatePostpartumDay(dateOfBirth: string) {
  if (!dateOfBirth) {
    return 0;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  birthDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - birthDate.getTime()) / 86_400_000));
}

export function resolvePasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, label: "Soft", className: "bg-rose-300" };
  }

  if (score === 2) {
    return { score, label: "Steady", className: "bg-amber-300" };
  }

  if (score === 3) {
    return { score, label: "Strong", className: "bg-emerald-400" };
  }

  return { score, label: "Very strong", className: "bg-emerald-500" };
}

export function resolveDestination(role: UserRole, returnTo?: string) {
  if (!returnTo) {
    return getDefaultRouteForRole(role);
  }

  const requiredRole = getRequiredRole(returnTo);
  return !requiredRole || requiredRole === role ? returnTo : getDefaultRouteForRole(role);
}

export function getWarmFirebaseMessage(error: unknown, mode: "login" | "register" | "google" | "reset") {
  const code = (error as FirebaseError | undefined)?.code;

  switch (code) {
    case "auth/popup-blocked":
    case "auth/cancelled-popup-request":
      return {
        title: "Google sign-in needs a gentler route",
        description: "Your browser blocked the pop-up, so Uzazi can switch to a full-page Google sign-in instead.",
      };
    case "auth/unauthorized-domain":
      return {
        title: "This website is not yet approved in Firebase Auth",
        description: "Add the current domain to Firebase Authentication > Settings > Authorized domains, then try again.",
      };
    case "auth/operation-not-allowed":
      return {
        title: "Google sign-in is not enabled yet",
        description: "Turn on the Google provider in Firebase Authentication before using this sign-in method.",
      };
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return {
        title: "We couldn’t sign you in just yet",
        description: "Please check your details and try again. If the night feels long, you can try once more in a moment.",
      };
    case "auth/email-already-in-use":
      return {
        title: "That account already has a home here",
        description: "Try signing in instead, or reset your password if it has slipped away.",
      };
    case "auth/popup-closed-by-user":
      return {
        title: "Google sign-in was closed",
        description: "No problem. You can open it again whenever you’re ready.",
      };
    case "auth/too-many-requests":
      return {
        title: "Let’s pause for a moment",
        description: "There have been several attempts in a short time. Please wait a bit, then try again.",
      };
    default:
      if (mode === "reset") {
        return {
          title: "We couldn’t send the reset link",
          description: "Please confirm the email address and try again when you’re ready.",
        };
      }

      if (mode === "register") {
        return {
          title: "We couldn’t start your journey yet",
          description: "Your details are still here. Please try again in a moment.",
        };
      }

      if (mode === "google") {
        return {
          title: "Google sign-in needs another try",
          description: "The connection did not settle cleanly. Please try again.",
        };
      }

      return {
        title: "Something small went off track",
        description: "Please try again in a moment. Your progress has not been lost.",
      };
  }
}

export async function ensureLocalAuthPersistence() {
  if (typeof window === "undefined") {
    return;
  }

  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).then(() => undefined);
  }

  await persistencePromise;
}

export async function syncSession(firebaseUser: FirebaseUser, role: UserRole) {
  const token = await firebaseUser.getIdToken(true);

  await fetch("/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, role }),
  });
}

export async function readUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as AppUser) : null;
}

export async function ensureUserProfile(
  firebaseUser: FirebaseUser,
  options?: {
    language?: string;
  },
): Promise<AppUser> {
  const existing = await readUserProfile(firebaseUser.uid);
  const today = new Date().toISOString().split("T")[0];

  if (existing) {
    if (existing.role === "mother") {
      const mother = existing as Mother;
      const lastLogin = mother.lastLoginDate;

      if (lastLogin !== today) {
        const loginReward = 2; // Daily sign-in reward
        
        const updates: Partial<Mother> = {
          lastLoginDate: today,
          gardenPetals: (mother.gardenPetals || 0) + loginReward,
          currentStreak: mother.currentStreak || 0,
        };

        try {
          await updateDoc(doc(db, "users", mother.uid), updates);
          return { ...mother, ...updates } as Mother;
        } catch (error) {
          console.error("Failed to apply daily login reward", error);
        }
      }
    }

    return existing;
  }

  const fallbackProfile: Mother = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    phone: "",
    role: "mother" as const,
    name: firebaseUser.displayName ?? "UZAZI Member",
    language: options?.language ?? "English",
    county: "Nairobi",
    postpartumDay: 0,
    assignedCHW: "unassigned",
    riskLevel: "low" as const,
    gardenPetals: 2, // start with a small reward
    badges: [],
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
    currentStreak: 0,
    lastCheckInDate: "",
    lastLoginDate: today,
  };

  await setDoc(doc(db, "users", firebaseUser.uid), fallbackProfile, { merge: true });
  return fallbackProfile;
}

export async function hydrateAuthenticatedUser(
  firebaseUser: FirebaseUser,
  options?: {
    language?: string;
  },
) {
  const profile = await ensureUserProfile(firebaseUser, options);
  await syncSession(firebaseUser, profile.role);
  return profile;
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  return provider;
}

function shouldPreferRedirectFlow() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|android|mobile/.test(userAgent);
}

export async function finishGoogleRedirectFlow(options?: { language?: string }) {
  await ensureLocalAuthPersistence();
  const result = await getRedirectResult(auth);

  if (!result?.user) {
    return null;
  }

  const profile = await hydrateAuthenticatedUser(result.user, options);
  return { credential: result, profile };
}

export async function signInWithGoogleFlow(options?: { language?: string }) {
  await ensureLocalAuthPersistence();
  const provider = createGoogleProvider();

  if (shouldPreferRedirectFlow()) {
    await signInWithRedirect(auth, provider);
    return { redirected: true as const };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const profile = await hydrateAuthenticatedUser(result.user, options);
    return { redirected: false as const, credential: result, profile };
  } catch (error) {
    const code = (error as FirebaseError | undefined)?.code;

    if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      return { redirected: true as const };
    }

    throw error;
  }
}

export async function signInWithIdentifier(identifier: string, password: string) {
  await ensureLocalAuthPersistence();
  const credential = await signInWithEmailAndPassword(auth, toAuthEmail(identifier), password);
  const profile = await hydrateAuthenticatedUser(credential.user);
  return { credential, profile };
}

export async function sendResetLink(identifier: string) {
  if (!isEmailAddress(identifier)) {
    throw new Error("reset-email-only");
  }

  await sendPasswordResetEmail(auth, identifier.trim().toLowerCase());
}
