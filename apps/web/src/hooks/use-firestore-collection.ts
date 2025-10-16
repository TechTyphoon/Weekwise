import { useEffect, useState } from "react";
import {
	collection,
	query,
	where,
	orderBy,
	onSnapshot,
	type Query,
	type DocumentData,
	type WhereFilterOp,
	limit,
} from "firebase/firestore";
import { useFirebase } from "@/components/firebase-provider";

interface UseFirestoreCollectionOptions {
	collectionName: string;
	filters?: Array<{
		field: string;
		operator: WhereFilterOp;
		value: any;
	}>;
	orderByField?: string;
	orderDirection?: "asc" | "desc";
	limitCount?: number;
}

export function useFirestoreCollection<T = any>(
	options: UseFirestoreCollectionOptions,
) {
	const { db } = useFirebase();
	const [data, setData] = useState<(T & { id: string })[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!db) {
			setLoading(false);
			return;
		}

		try {
			let q: Query<DocumentData> = collection(db, options.collectionName);

			if (options.filters && options.filters.length > 0) {
				for (const filter of options.filters) {
					q = query(q, where(filter.field, filter.operator, filter.value));
				}
			}

			if (options.orderByField) {
				q = query(
					q,
					orderBy(options.orderByField, options.orderDirection || "desc"),
				);
			}

			if (options.limitCount) {
				q = query(q, limit(options.limitCount));
			}

			const unsubscribe = onSnapshot(
				q,
				(snapshot) => {
					const documents = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as (T & { id: string })[];
					setData(documents);
					setLoading(false);
					setError(null);
				},
				(err) => {
					console.error(
						`Error fetching collection ${options.collectionName}:`,
						err,
					);
					setError(err as Error);
					setLoading(false);
				},
			);

			return () => unsubscribe();
		} catch (err) {
			console.error(
				`Error setting up subscription for ${options.collectionName}:`,
				err,
			);
			setError(err as Error);
			setLoading(false);
		}
	}, [
		db,
		options.collectionName,
		JSON.stringify(options.filters),
		options.orderByField,
		options.orderDirection,
		options.limitCount,
	]);

	return { data, loading, error };
}
