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

export interface Alert {
	id: string;
	message: string;
	type: "info" | "warning" | "error" | "success";
	timestamp: Date;
	userId?: string;
	read?: boolean;
	[key: string]: any;
}

interface UseAlertsFeedOptions {
	filters?: Array<{
		field: string;
		operator: WhereFilterOp;
		value: any;
	}>;
	orderByField?: string;
	orderDirection?: "asc" | "desc";
	limitCount?: number;
}

export function useAlertsFeed(options: UseAlertsFeedOptions = {}) {
	const { db, user } = useFirebase();
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!db) {
			setLoading(false);
			return;
		}

		try {
			let q: Query<DocumentData> = collection(db, "events");

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
			} else {
				q = query(q, orderBy("timestamp", "desc"));
			}

			if (options.limitCount) {
				q = query(q, limit(options.limitCount));
			}

			const unsubscribe = onSnapshot(
				q,
				(snapshot) => {
					const alertsData: Alert[] = snapshot.docs.map((doc) => {
						const data = doc.data();
						return {
							id: doc.id,
							message: data.message || "",
							type: data.type || "info",
							timestamp:
								data.timestamp?.toDate?.() || new Date(data.timestamp) || new Date(),
							userId: data.userId,
							read: data.read,
							...data,
						};
					});
					setAlerts(alertsData);
					setLoading(false);
					setError(null);
				},
				(err) => {
					console.error("Error fetching alerts:", err);
					setError(err as Error);
					setLoading(false);
				},
			);

			return () => unsubscribe();
		} catch (err) {
			console.error("Error setting up alerts subscription:", err);
			setError(err as Error);
			setLoading(false);
		}
	}, [
		db,
		user,
		JSON.stringify(options.filters),
		options.orderByField,
		options.orderDirection,
		options.limitCount,
	]);

	return { alerts, loading, error };
}
