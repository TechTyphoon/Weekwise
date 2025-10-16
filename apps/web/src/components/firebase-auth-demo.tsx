import { useState } from "react";
import { useFirebase } from "./firebase-provider";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { LogIn, LogOut, UserPlus } from "lucide-react";

export function FirebaseAuthDemo() {
	const { user, loading, signInAnonymous, signInWithEmail, signUpWithEmail, signOut } = useFirebase();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);

	const handleAnonymousSignIn = async () => {
		try {
			await signInAnonymous();
			toast.success("Signed in anonymously");
		} catch (error: any) {
			toast.error(error.message || "Failed to sign in");
		}
	};

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (isSignUp) {
				await signUpWithEmail(email, password);
				toast.success("Account created successfully");
			} else {
				await signInWithEmail(email, password);
				toast.success("Signed in successfully");
			}
			setEmail("");
			setPassword("");
		} catch (error: any) {
			toast.error(error.message || "Authentication failed");
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			toast.success("Signed out successfully");
		} catch (error: any) {
			toast.error(error.message || "Failed to sign out");
		}
	};

	if (loading) {
		return (
			<Card className="p-6">
				<p className="text-center text-muted-foreground">Loading...</p>
			</Card>
		);
	}

	if (user) {
		return (
			<Card className="p-6">
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-semibold mb-2">Signed In</h3>
						<div className="space-y-1 text-sm">
							<p>
								<span className="text-muted-foreground">User ID:</span>{" "}
								<code className="text-xs bg-muted px-2 py-1 rounded">{user.uid}</code>
							</p>
							<p>
								<span className="text-muted-foreground">Type:</span>{" "}
								{user.isAnonymous ? "Anonymous" : "Email/Password"}
							</p>
							{!user.isAnonymous && user.email && (
								<p>
									<span className="text-muted-foreground">Email:</span> {user.email}
								</p>
							)}
						</div>
					</div>
					<Button onClick={handleSignOut} variant="outline" className="w-full">
						<LogOut className="h-4 w-4 mr-2" />
						Sign Out
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			<div className="space-y-6">
				<div>
					<h3 className="text-lg font-semibold mb-2">Firebase Authentication</h3>
					<p className="text-sm text-muted-foreground">
						Sign in to access real-time data
					</p>
				</div>

				<Button onClick={handleAnonymousSignIn} className="w-full" variant="outline">
					<UserPlus className="h-4 w-4 mr-2" />
					Sign In Anonymously
				</Button>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>

				<form onSubmit={handleEmailAuth} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="user@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
						/>
					</div>
					<Button type="submit" className="w-full">
						<LogIn className="h-4 w-4 mr-2" />
						{isSignUp ? "Sign Up" : "Sign In"}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						onClick={() => setIsSignUp(!isSignUp)}
					>
						{isSignUp
							? "Already have an account? Sign In"
							: "Don't have an account? Sign Up"}
					</Button>
				</form>
			</div>
		</Card>
	);
}
