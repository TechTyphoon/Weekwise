import { useFirebase } from "./firebase-provider";
import { useAlertsFeed } from "@/hooks/use-alerts-feed";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { FirebaseAuthDemo } from "./firebase-auth-demo";
import { Card } from "./ui/card";
import { Bell, RefreshCw, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function DashboardComponent() {
    const { user, loading: authLoading, signInAnonymous } = useFirebase();

    const { alerts, loading: alertsLoading, error: alertsError } = useAlertsFeed({
        limitCount: 10,
    });

    const {
        data: events,
        loading: eventsLoading,
        error: eventsError,
    } = useFirestoreCollection({
        collectionName: "events",
        orderByField: "timestamp",
        orderDirection: "desc",
        limitCount: 20,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            signInAnonymous().catch((err) => {
                console.error("Failed to sign in anonymously:", err);
            });
        }
    }, [authLoading, user, signInAnonymous]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-6 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                    Real-time data from Firebase Firestore
                </p>
            </div>

            <div className="mb-6">
                <FirebaseAuthDemo />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <Bell className="h-6 w-6" />
                            Alerts Feed
                        </h2>
                        {alertsLoading && (
                            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {alertsError && (
                        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-destructive">
                                        Error loading alerts
                                    </p>
                                    <p className="text-xs text-destructive/80 mt-1">
                                        {alertsError.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!alertsLoading && !alertsError && alerts.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                            No alerts yet. Alerts will appear here in real-time.
                        </p>
                    )}

                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-3 rounded-lg border ${
                                    alert.type === "error"
                                        ? "bg-destructive/10 border-destructive/20"
                                        : alert.type === "warning"
                                            ? "bg-yellow-500/10 border-yellow-500/20"
                                            : alert.type === "success"
                                                ? "bg-green-500/10 border-green-500/20"
                                                : "bg-muted border-border"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm flex-1">{alert.message}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {alert.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <Activity className="h-6 w-6" />
                            Live Events
                        </h2>
                        {eventsLoading && (
                            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {eventsError && (
                        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-destructive">
                                        Error loading events
                                    </p>
                                    <p className="text-xs text-destructive/80 mt-1">
                                        {eventsError.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!eventsLoading && !eventsError && events.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                            No events yet. Events will appear here in real-time.
                        </p>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {events.map((event: any) => (
                            <div
                                key={event.id}
                                className="p-3 rounded-lg bg-muted/50 border border-border"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {event.type || "Event"}
                                        </p>
                                        {event.message && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {event.message}
                                            </p>
                                        )}
                                    </div>
                                    {event.timestamp && (
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(
                                                event.timestamp.seconds * 1000,
                                            ).toLocaleTimeString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="mt-8 p-6 border border-border rounded-lg bg-muted/20">
                <h3 className="text-lg font-semibold mb-3">Firebase Integration</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>
                            Real-time data synchronization with Firestore
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>
                            Anonymous authentication for security rules
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>
                            Live updates without manual refresh
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>
                            Filtered and ordered queries with custom hooks
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
