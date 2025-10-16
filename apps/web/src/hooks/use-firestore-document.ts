import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useFirebase } from "@/components/firebase-provider";

interface UseFirestoreDocumentOptions {
	collectionName: string;
	documentId: string | null | undefined;
}

export function useFirestoreDocument<T = any>(
	options: UseFirestoreDocumentOptions,
) {
	const { db } = useFirebase();
	const [data, setData] = useState<(T & { id: string }) | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!db || !options.documentId) {
			setLoading(false);
			setData(null);
			return;
		}

		try {
			const docRef = doc(db, options.collectionName, options.documentId);

			const unsubscribe = onSnapshot(
				docRef,
				(docSnap) => {
					if (docSnap.exists()) {
						setData({
							id: docSnap.id,
							...docSnap.data(),
						} as T & { id: string });
					} else {
						setData(null);
					}
					setLoading(false);
					setError(null);
				},
				(err) => {
					console.error(
						`Error fetching document ${options.documentId} from ${options.collectionName}:`,
						err,
					);
					setError(err as Error);
					setLoading(false);
				},
			);

			return () => unsubscribe();
		} catch (err) {
			console.error(
				`Error setting up document subscription for ${options.documentId}:`,
				err,
			);
			setError(err as Error);
			setLoading(false);
		}
	}, [db, options.collectionName, options.documentId]);

	return { data, loading, error };
}
