import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const [isSigningOut, setIsSigningOut] = useState(false);

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link to="/login">Sign In</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">{session.user.name}</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive cursor-pointer"
					disabled={isSigningOut}
					onClick={async (e) => {
						e.preventDefault();
						try {
							setIsSigningOut(true);
							console.log('Starting sign out...');
							
							const result = await authClient.signOut();
							
							console.log('Sign out result:', result);
							toast.success("Signed out successfully");
							
							// Force a full page reload to clear all state and caches
							// This ensures the session is completely cleared
							window.location.href = '/';
							
						} catch (error: any) {
							console.error("Sign out error details:", error);
							const errorMessage = error?.message || error?.toString() || "Unknown error";
							toast.error(`Failed to sign out: ${errorMessage}`);
							setIsSigningOut(false);
						}
					}}
				>
					{isSigningOut ? "Signing out..." : "Sign Out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
