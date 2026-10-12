import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";

export type Draft = {
  description: string;
  impact: string;
};

export function draftId(year: string, orgId: string) {
  return `${year}_${orgId}`;
}

export async function listDrafts(uid: string, year: string): Promise<Record<string, Draft>> {
  const snapshot = await getDocs(
    query(collection(db, "users", uid, "drafts"), where("year", "==", year))
  );
  const drafts: Record<string, Draft> = {};
  snapshot.docs.forEach((document) => {
    const data = document.data();
    drafts[data.orgId] = {
      description: data.description ?? "",
      impact: data.impact ?? "",
    };
  });
  return drafts;
}

export async function saveDraft(uid: string, year: string, orgId: string, draft: Draft) {
  await setDoc(doc(db, "users", uid, "drafts", draftId(year, orgId)), {
    year,
    orgId,
    description: draft.description,
    impact: draft.impact,
    updatedAt: serverTimestamp(),
  });
}