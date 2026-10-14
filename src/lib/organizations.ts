import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./db";

export type OrganizationInput = {
  name: string;
  contactName: string;
  mailingAddress: string;
  contactInfo: string;
};

export type Organization = OrganizationInput & {
  id: string;
};

export const emptyOrganization: OrganizationInput = {
  name: "",
  contactName: "",
  mailingAddress: "",
  contactInfo: "",
};

function organizationsRef(uid: string) {
  return collection(db, "users", uid, "organizations");
}

export function normalizeOrganization(input: OrganizationInput): OrganizationInput {
  return {
    name: input.name.trim(),
    contactName: input.contactName.trim(),
    mailingAddress: input.mailingAddress.trim(),
    contactInfo: input.contactInfo.trim(),
  };
}

export function hasCompleteContact(organization: OrganizationInput) {
  return Boolean(
    organization.contactName && organization.mailingAddress && organization.contactInfo
  );
}

export function sortOrganizations(organizations: Organization[]) {
  return [...organizations].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export async function listOrganizations(uid: string): Promise<Organization[]> {
  const snapshot = await getDocs(organizationsRef(uid));
  const organizations = snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      name: data.name ?? "",
      contactName: data.contactName ?? "",
      mailingAddress: data.mailingAddress ?? "",
      contactInfo: data.contactInfo ?? "",
    };
  });
  return sortOrganizations(organizations);
}

export async function createOrganization(uid: string, input: OrganizationInput) {
  const reference = await addDoc(organizationsRef(uid), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateOrganization(uid: string, id: string, input: OrganizationInput) {
  await updateDoc(doc(db, "users", uid, "organizations", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrganization(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "organizations", id));
}