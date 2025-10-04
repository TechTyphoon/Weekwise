import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  onDeleteOne: () => void;
  onDeleteAll: () => void;
  onCancel: () => void;
  slotDate?: string;
}

export default function DeleteConfirmationDialog({
  onDeleteOne,
  onDeleteAll,
  onCancel,
  slotDate,
}: DeleteConfirmationDialogProps) {
  // Lock body scroll while dialog is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Delete Schedule</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {slotDate && (
                <>
                  You're about to delete a slot on{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(slotDate)}
                  </span>
                  .
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              What would you like to do?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={onDeleteOne}
          >
            <div>
              <div className="font-medium">Delete this occurrence only</div>
              <div className="text-sm text-muted-foreground">
                Removes the slot for this specific date
              </div>
            </div>
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={onDeleteAll}
          >
            <div>
              <div className="font-medium">Delete all future occurrences</div>
              <div className="text-sm text-muted-foreground">
                Removes this recurring schedule completely
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
