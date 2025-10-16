import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { Calendar, Clock, Repeat, Edit3, Trash2, Infinity, Heart, ArrowRight, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
    component: HomeComponent,
});

function HomeComponent() {
    const { data: healthCheck, isLoading } = trpc.healthCheck.useQuery();

    return (
        <div className="container mx-auto max-w-5xl px-6 py-8">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="mb-3 text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    Weekwise
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                    Modern recurring schedule management
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link to="/scheduler">
                        <Button size="lg" className="group">
                            <Calendar className="h-5 w-5 mr-2" />
                            Open Scheduler
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                            <Share2 className="h-5 w-5 mr-2" />
                            Network Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* API Status Card */}
            <Card className="mb-8 p-6 bg-gradient-to-br from-background to-muted/20">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">API Status</h2>
                    <div className="flex items-center gap-3">
                        <div
                            className={`h-3 w-3 rounded-full ${healthCheck ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                        />
                        <span className="text-sm font-medium">
                            {isLoading
                                ? "Checking..."
                                : healthCheck
                                    ? "Connected"
                                    : "Disconnected"}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Features Section */}
            <div className="mb-8">
                <h2 className="mb-6 text-3xl font-bold">How It Works</h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Feature 1 */}
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <Repeat className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold">Recurring Schedules</h3>
                                <p className="text-sm text-muted-foreground">
                                    Create a schedule for any day (e.g., Monday at 9:00 AM - 11:00 AM). 
                                    It automatically replicates for all upcoming occurrences of that day.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Feature 2 */}
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold">Smart Slot Management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Each date supports up to 2 time slots. Perfect for managing morning 
                                    and afternoon schedules without conflicts.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Feature 3 */}
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <Edit3 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold">Exception Handling</h3>
                                <p className="text-sm text-muted-foreground">
                                    Edit or delete individual slots without affecting other recurring instances. 
                                    Changes apply only to the specific date you modify.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Feature 4 */}
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <Infinity className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold">Infinite Scroll</h3>
                                <p className="text-sm text-muted-foreground">
                                    Seamlessly browse through weeks with smooth infinite scrolling. 
                                    Automatically loads more weeks as you scroll down past 70%.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* UI Features */}
            <Card className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-background">
                <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    User Interface
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Current week displayed with all scheduled slots</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Today's date highlighted with gradient background and ring indicator</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Load next weeks automatically by scrolling forward (infinite scroll)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Navigate backward with "Previous Week" button for historical viewing</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Real-time updates with optimistic UI - see changes instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Dark/Light theme support for comfortable viewing anytime</span>
                    </li>
                </ul>
            </Card>

            {/* Footer */}
            <div className="text-center pt-8 pb-4">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    Made with <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" /> by 
                    <a 
                        href="https://github.com/techtyphoon" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                        TechTyphoon
                    </a>
                </p>
            </div>
        </div>
    );
}
