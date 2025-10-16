import { createContext, useContext, useEffect, useState } from "react";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import {
	getFirebaseAuth,
	getFirebaseFirestore,
	initializeFirebase,
} from "@/lib/firebase-config";
import {
	signInAnonymously,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
} from "firebase/auth";

interface FirebaseContextType {
	auth: Auth;
	db: Firestore;
	user: User | null;
	loading: boolean;
	signInAnonymous: () => Promise<void>;
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
	const [auth] = useState(() => getFirebaseAuth());
	const [db] = useState(() => getFirebaseFirestore());
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		initializeFirebase();

		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user);
			setLoading(false);
		});

		return () => unsubscribe();
	}, [auth]);

	const signInAnonymous = async () => {
		await signInAnonymously(auth);
	};

	const signInWithEmail = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password);
	};

	const signUpWithEmail = async (email: string, password: string) => {
		await createUserWithEmailAndPassword(auth, email, password);
	};

	const signOut = async () => {
		await firebaseSignOut(auth);
	};

	return (
		<FirebaseContext.Provider
			value={{
				auth,
				db,
				user,
				loading,
				signInAnonymous,
				signInWithEmail,
				signUpWithEmail,
				signOut,
			}}
		>
			{children}
		</FirebaseContext.Provider>
	);
}

export function useFirebase() {
	const context = useContext(FirebaseContext);
	if (!context) {
		throw new Error("useFirebase must be used within a FirebaseProvider");
	}
	return context;
}
