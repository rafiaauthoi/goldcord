import { getFirestore } from "firebase/firestore";
import { app, startAppCheck } from "./firebase";

startAppCheck();

export const db = getFirestore(app);