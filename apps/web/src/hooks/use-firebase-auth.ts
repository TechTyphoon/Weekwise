import { useFirebase } from "@/components/firebase-provider";

export function useFirebaseAuth() {
	const { user, loading, signInAnonymous, signInWithEmail, signUpWithEmail, signOut } = useFirebase();

	return {
		user,
		loading,
		isAuthenticated: !!user,
		isAnonymous: user?.isAnonymous ?? false,
		signInAnonymous,
		signInWithEmail,
		signUpWithEmail,
		signOut,
	};
}
