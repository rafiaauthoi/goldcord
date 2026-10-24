import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const PROJECT_ID = "demo-goldcord";
const ALICE = "alice";
const BOB = "bob";
const ORG = "org-alice";
const BOB_ORG = "org-bob";
const SESSION = "session-alice";
const YEAR = "2026-2027";
const DRAFT = `${YEAR}_${ORG}`;
const LONG_AGO = Timestamp.fromDate(new Date("2020-01-01T00:00:00Z"));

let env;

function userDb(uid, email, verified = true) {
  return env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
}

const alice = () => userDb(ALICE, "alice@wmich.edu");
const bob = () => userDb(BOB, "bob@wmich.edu");

function profile(overrides = {}) {
  return {
    firstName: "Alice",
    lastName: "Tester",
    preferredName: "Alice",
    joinedTerm: "Fall 2025",
    requirements: { [YEAR]: 20 },
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function organization(overrides = {}) {
  return {
    name: "Hawkins Middle School AV Club",
    contactName: "Scott Clarke",
    mailingAddress: "1 School Road, Hawkins, IN 47000",
    contactInfo: "mr.clarke@hawkins.example",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function session(overrides = {}) {
  return {
    orgId: ORG,
    date: "2026-08-29",
    hours: 3,
    activity: "Helped run the summer radio workshop.",
    flags: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function draft(overrides = {}) {
  return {
    year: YEAR,
    orgId: ORG,
    description: "Ran a radio workshop.",
    impact: "Kids sent their first messages.",
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const now = Timestamp.now();
    await setDoc(doc(db, "users", ALICE), { ...profile(), updatedAt: now });
    await setDoc(doc(db, "users", ALICE, "organizations", ORG), {
      ...organization(),
      createdAt: now,
      updatedAt: now,
    });
    await setDoc(doc(db, "users", ALICE, "sessions", SESSION), {
      ...session(),
      createdAt: now,
      updatedAt: now,
    });
    await setDoc(doc(db, "users", ALICE, "drafts", DRAFT), { ...draft(), updatedAt: now });
    await setDoc(doc(db, "users", BOB, "organizations", BOB_ORG), {
      ...organization({ name: "Brooklyn 99th Precinct" }),
      createdAt: now,
      updatedAt: now,
    });
  });
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

after(async () => {
  await env.cleanup();
});

describe("cross-user access", () => {
  test("owner can read their own profile, organizations, sessions, and drafts", async () => {
    const db = alice();
    await assertSucceeds(getDoc(doc(db, "users", ALICE)));
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "organizations", ORG)));
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "sessions", SESSION)));
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "drafts", DRAFT)));
  });

  test("another user cannot read someone else's data", async () => {
    const db = bob();
    await assertFails(getDoc(doc(db, "users", ALICE)));
    await assertFails(getDoc(doc(db, "users", ALICE, "organizations", ORG)));
    await assertFails(getDoc(doc(db, "users", ALICE, "sessions", SESSION)));
    await assertFails(getDoc(doc(db, "users", ALICE, "drafts", DRAFT)));
    await assertFails(getDocs(collection(db, "users", ALICE, "sessions")));
  });

  test("another user cannot write or delete someone else's data", async () => {
    const db = bob();
    await assertFails(setDoc(doc(db, "users", ALICE), profile()));
    await assertFails(setDoc(doc(db, "users", ALICE, "organizations", "planted"), organization()));
    await assertFails(updateDoc(doc(db, "users", ALICE, "sessions", SESSION), { hours: 24, updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(db, "users", ALICE, "sessions", SESSION)));
    await assertFails(deleteDoc(doc(db, "users", ALICE)));
  });

  test("nobody can list the top-level users collection", async () => {
    await assertFails(getDocs(collection(alice(), "users")));
  });
});

describe("who can sign in", () => {
  test("signed-out visitors are rejected", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", ALICE)));
    await assertFails(setDoc(doc(db, "users", "visitor"), profile()));
  });

  test("an unverified @wmich.edu account is rejected", async () => {
    const db = userDb("carol", "carol@wmich.edu", false);
    await assertFails(setDoc(doc(db, "users", "carol"), profile()));
  });

  test("a verified account outside @wmich.edu is rejected", async () => {
    const db = userDb("dave", "dave@gmail.com");
    await assertFails(setDoc(doc(db, "users", "dave"), profile()));
  });

  test("a look-alike domain is rejected", async () => {
    const db = userDb("eve", "eve@wmich.edu.attacker.example");
    await assertFails(setDoc(doc(db, "users", "eve"), profile()));
  });

  test("email case does not matter for real @wmich.edu accounts", async () => {
    const db = userDb("frank", "Frank@WMICH.EDU");
    await assertSucceeds(setDoc(doc(db, "users", "frank"), profile()));
  });
});

describe("schema validation", () => {
  test("a valid profile, organization, session, and draft are accepted", async () => {
    const db = alice();
    await assertSucceeds(setDoc(doc(db, "users", ALICE), profile()));
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "organizations", "org-new"), organization()));
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "sessions", "session-new"), session()));
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "drafts", DRAFT), draft()));
  });

  test("unknown fields are rejected", async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, "users", ALICE), profile({ isAdmin: true })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "session-new"), session({ approved: true })));
  });

  test("missing required fields are rejected", async () => {
    const db = alice();
    const noLastName = profile();
    delete noLastName.lastName;
    const noActivity = session();
    delete noActivity.activity;
    await assertFails(setDoc(doc(db, "users", ALICE), noLastName));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "session-new"), noActivity));
  });

  test("strings at the limit pass and one character over fails", async () => {
    const db = alice();
    await assertSucceeds(setDoc(doc(db, "users", ALICE), profile({ firstName: "a".repeat(60) })));
    await assertFails(setDoc(doc(db, "users", ALICE), profile({ firstName: "a".repeat(61) })));
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "sessions", "s1"), session({ activity: "a".repeat(500) })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s2"), session({ activity: "a".repeat(501) })));
    await assertFails(setDoc(doc(db, "users", ALICE, "drafts", DRAFT), draft({ impact: "a".repeat(3001) })));
  });

  test("hours must be a number above 0 and at most 24", async () => {
    const db = alice();
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "sessions", "s1"), session({ hours: 24 })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s2"), session({ hours: 0 })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s3"), session({ hours: 24.25 })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s4"), session({ hours: "3" })));
  });

  test("dates and eligibility flags must use the expected formats", async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s1"), session({ date: "08/29/2026" })));
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "sessions", "s2"), session({ flags: ["paid"] })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s3"), session({ flags: ["anything"] })));
  });

  test("draft IDs must match the year and organization inside them", async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, "users", ALICE, "drafts", `${YEAR}_other`), draft()));
  });
});

describe("timestamps", () => {
  test("a backdated updatedAt is rejected", async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, "users", ALICE), profile({ updatedAt: LONG_AGO })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s1"), session({ updatedAt: LONG_AGO })));
  });

  test("a backdated createdAt is rejected on create", async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, "users", ALICE, "organizations", "org-new"), organization({ createdAt: LONG_AGO })));
    await assertFails(setDoc(doc(db, "users", ALICE, "sessions", "s1"), session({ createdAt: LONG_AGO })));
  });

  test("createdAt cannot be changed on update", async () => {
    const db = alice();
    await assertSucceeds(updateDoc(doc(db, "users", ALICE, "sessions", SESSION), { hours: 4, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, "users", ALICE, "sessions", SESSION), { createdAt: LONG_AGO, updatedAt: serverTimestamp() }));
  });
});

describe("organization ownership", () => {
  test("a session cannot point at an organization that does not exist", async () => {
    await assertFails(setDoc(doc(alice(), "users", ALICE, "sessions", "s1"), session({ orgId: "missing-org" })));
  });

  test("a session cannot point at another user's organization", async () => {
    await assertFails(setDoc(doc(alice(), "users", ALICE, "sessions", "s1"), session({ orgId: BOB_ORG })));
  });
});

describe("favorite flag", () => {
  test("favorite can be starred and unstarred as a boolean", async () => {
    const ref = doc(alice(), "users", ALICE, "sessions", SESSION);
    await assertSucceeds(updateDoc(ref, { favorite: true, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { favorite: false, updatedAt: serverTimestamp() }));
  });

  test("favorite must be a boolean", async () => {
    const ref = doc(alice(), "users", ALICE, "sessions", SESSION);
    await assertFails(updateDoc(ref, { favorite: "yes", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { favorite: 1, updatedAt: serverTimestamp() }));
  });
});

describe("account deletion", () => {
  test("owners can delete their own sessions, organizations, drafts, and profile", async () => {
    const db = alice();
    await assertSucceeds(deleteDoc(doc(db, "users", ALICE, "sessions", SESSION)));
    await assertSucceeds(deleteDoc(doc(db, "users", ALICE, "drafts", DRAFT)));
    await assertSucceeds(deleteDoc(doc(db, "users", ALICE, "organizations", ORG)));
    await assertSucceeds(deleteDoc(doc(db, "users", ALICE)));
  });
});