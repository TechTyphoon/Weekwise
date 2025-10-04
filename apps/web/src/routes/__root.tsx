import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { trpc, trpcClient, queryClient } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Outlet,
	createRootRouteWithContext,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";

export interface RouterAppContext {
	trpc: typeof trpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "assignment",
			},
			{
				name: "description",
				content: "assignment is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const isFetching = useRouterState({
		select: (s) => s.isLoading,
	});

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem={true}
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				{/* Root layout uses flexible column instead of fixed viewport height to avoid scroll trapping */}
				<div className="flex min-h-svh flex-col">
					<Header />
					<div className="flex-1 flex flex-col">
						{isFetching ? <Loader /> : <Outlet />}
					</div>
				</div>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</trpc.Provider>
	);
}
