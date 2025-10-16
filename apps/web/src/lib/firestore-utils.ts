import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	serverTimestamp,
	type Timestamp,
} from "firebase/firestore";
import { getFirebaseFirestore } from "./firebase-config";

export async function addDocument(collectionName: string, data: any) {
	const db = getFirebaseFirestore();
	const docRef = await addDoc(collection(db, collectionName), {
		...data,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});
	return docRef.id;
}

export async function updateDocument(
	collectionName: string,
	documentId: string,
	data: any,
) {
	const db = getFirebaseFirestore();
	const docRef = doc(db, collectionName, documentId);
	await updateDoc(docRef, {
		...data,
		updatedAt: serverTimestamp(),
	});
}

export async function deleteDocument(
	collectionName: string,
	documentId: string,
) {
	const db = getFirebaseFirestore();
	const docRef = doc(db, collectionName, documentId);
	await deleteDoc(docRef);
}

export function timestampToDate(timestamp: any): Date {
	if (!timestamp) return new Date();
	if (timestamp instanceof Date) return timestamp;
	if (timestamp.toDate && typeof timestamp.toDate === "function") {
		return timestamp.toDate();
	}
	return new Date(timestamp);
}
