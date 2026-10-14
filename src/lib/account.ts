import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential } from "firebase/auth";
import type { User } from "firebase/auth";
import { db } from "./firebase";

const SUBCOLLECTIONS = ["sessions", "drafts", "organizations"];
const BATCH_LIMIT = 400;

async function deleteSubcollection(uid: string, name: string) {
  const snapshot = await getDocs(collection(db, "users", uid, name));
  for (let start = 0; start < snapshot.docs.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    snapshot.docs.slice(start, start + BATCH_LIMIT).forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
}

export async function deleteAccountAndData(user: User, password: string) {
  if (!user.email) throw new Error("missing-email");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  for (const name of SUBCOLLECTIONS) {
    await deleteSubcollection(user.uid, name);
  }
  await deleteDoc(doc(db, "users", user.uid));
  await deleteUser(user);
}