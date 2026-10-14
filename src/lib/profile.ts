import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./db";

export type Requirement = 10 | 20;

export type Profile = {
  firstName: string;
  lastName: string;
  preferredName: string;
  joinedTerm: string;
  requirements: Record<string, Requirement>;
};

export const emptyProfile: Profile = {
  firstName: "",
  lastName: "",
  preferredName: "",
  joinedTerm: "",
  requirements: {},
};

export async function getProfile(uid: string): Promise<Profile | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    preferredName: data.preferredName ?? "",
    joinedTerm: data.joinedTerm ?? "",
    requirements: (data.requirements ?? {}) as Record<string, Requirement>,
  };
}

export async function saveProfile(uid: string, profile: Profile) {
  await setDoc(doc(db, "users", uid), {
    ...profile,
    updatedAt: serverTimestamp(),
  });
}