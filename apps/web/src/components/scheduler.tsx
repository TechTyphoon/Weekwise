import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { trpc, queryClient, vanillaTrpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ChevronLeft, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SlotForm from "./slot-form";
import SlotModal from "./slot-modal";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import {
  getWeekStartISO,
  addDaysISO,
  nextWeekISO,
  previousWeekISO,
  formatTime,
  weekKey,
  DAYS,
} from "@/utils/date-helpers";
import type { Slot, WeekData } from "@/types/scheduler";

export default function SchedulerComponent() {
  // Initialize with current week
  const initialWeek = useMemo(() => getWeekStartISO(new Date()), []);
  // Ordered list of week start ISO strings actually rendered
  const [weeks, setWeeks] = useState<string[]>([initialWeek]);
  const inFlightWeeks = useRef<Set<string>>(new Set());
  const userInteracting = useRef(false);

  // (We rely on queryClient.ensureQueryData; no direct fetchWeek hook needed here.)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isAppending, setIsAppending] = useState(false);
  const lastMutationOriginScrollTop = useRef<number | null>(null);
  
  // Force re-render trigger for cache updates
  const [, forceUpdate] = useState({});
  const triggerRerender = useCallback(() => forceUpdate({}), []);
  
  // Query for initial week data (reactive to cache updates)
  const { data: initialWeekData, isLoading: initialLoading } = trpc.scheduler.getSchedulesForWeek.useQuery({ startDate: initialWeek });
  
  /**
   * Prefetch week data and cache it for rendering
   * Prevents duplicate fetches using in-flight tracking
   */
  const ensureWeekData = useCallback(async (weekStart: string) => {
    if (inFlightWeeks.current.has(weekStart)) return;
    inFlightWeeks.current.add(weekStart);
    try {
      await queryClient.fetchQuery({
        queryKey: weekKey(weekStart),
        queryFn: async () => {
          const result = await vanillaTrpc.scheduler.getSchedulesForWeek.query({ startDate: weekStart });
          return result;
        },
      });
    } finally {
      inFlightWeeks.current.delete(weekStart);
    }
  }, []);

  /**
   * Optimistically update week slots in the cache
   * Used for immediate UI updates before server confirmation
   * Only updates queries that already exist in cache to avoid "Missing queryFn" errors
   */
  const patchWeekSlots = (weekStart: string, fn: (slots: Slot[]) => Slot[]) => {
    const key = weekKey(weekStart);
    const prev = queryClient.getQueryData<Slot[]>(key);
    // Only update if query exists in cache
    if (prev !== undefined) {
      const next = fn(prev);
      queryClient.setQueryData(key, next);
      // Trigger re-render to show cache updates
      triggerRerender();
    }
  };

  const createScheduleMutation = trpc.scheduler.createSchedule.useMutation({
    onMutate: (vars) => {
      lastMutationOriginScrollTop.current = window.scrollY;
      
      // Find the first occurrence of this day-of-week that is >= today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDayOfWeek = today.getDay();
      
      // Calculate days to add to reach the target day-of-week from today
      let daysToAdd = vars.dayOfWeek - todayDayOfWeek;
      if (daysToAdd < 0) {
        daysToAdd += 7; // Move to next week if the day has already passed this week
      }
      
      const firstOccurrenceDate = new Date(today);
      firstOccurrenceDate.setDate(today.getDate() + daysToAdd);
      
      // Optimistically add slot for each currently rendered week matching dayOfWeek (starting from first occurrence)
      weeks.forEach(ws => {
        const dateForDay = addDaysISO(ws, vars.dayOfWeek);
        const dateObj = new Date(dateForDay + 'T00:00:00');
        
        // Only create slots for dates >= the first occurrence
        if (dateObj < firstOccurrenceDate) return;
        
        patchWeekSlots(ws, slots => {
          // Only add if <2 existing for that date (enforce client constraint to keep UI consistent)
            const daySlots = slots.filter(s => s.date === dateForDay);
            if (daySlots.length >= 2) return slots;
            const optimistic: Slot = {
              id: `optimistic-${vars.dayOfWeek}-${dateForDay}-${Math.random().toString(36).slice(2)}`,
              scheduleId: 'optimistic',
              date: dateForDay,
              startTime: vars.startTime,
              endTime: vars.endTime,
              isException: false,
            };
            return [...slots, optimistic];
        });
      });
    },
    onSuccess: () => {
      toast.success("Schedule created");
      // Force immediate refetch of all week queries
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
      setIsCreatingSlot(false);
    },
    onError: (e) => { 
      toast.error(e.message);
      // Revert optimistic updates on error
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
    },
  });

  const updateSlotMutation = trpc.scheduler.updateSlot.useMutation({
    onMutate: (vars) => {
      lastMutationOriginScrollTop.current = window.scrollY;
      
      // Optimistically update the slot
      weeks.forEach(ws => {
        patchWeekSlots(ws, slots => 
          slots.map(s => 
            s.date === vars.date && String(s.scheduleId) === String(vars.scheduleId)
              ? { ...s, startTime: vars.startTime, endTime: vars.endTime }
              : s
          )
        );
      });
    },
    onSuccess: () => {
      toast.success("Slot updated");
      setIsSlotModalOpen(false);
      setSelectedSlot(null);
      // Force immediate refetch of all week queries
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
    },
    onError: (e) => {
      toast.error(e.message);
      // Revert optimistic update on error
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
    }
  });

  const deleteSlotMutation = trpc.scheduler.deleteSlot.useMutation({
    onMutate: (vars) => {
      lastMutationOriginScrollTop.current = window.scrollY;
      
      // Optimistically remove the slot from all affected weeks
      weeks.forEach(ws => {
        patchWeekSlots(ws, slots => 
          slots.filter(s => !(s.date === vars.date && String(s.scheduleId) === String(vars.scheduleId)))
        );
      });
    },
    onSuccess: () => {
      toast.success("This occurrence deleted");
      setIsSlotModalOpen(false);
      setSelectedSlot(null);
      // Force immediate refetch of all week queries
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
    },
    onError: (e) => {
      toast.error(e.message);
      // Revert optimistic update on error
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
    }
  });

  const deleteScheduleMutation = trpc.scheduler.deleteSchedule.useMutation({
    onMutate: (vars) => {
      lastMutationOriginScrollTop.current = window.scrollY;
      
      // Optimistically remove all slots for this schedule from all weeks
      weeks.forEach(ws => {
        patchWeekSlots(ws, slots => 
          slots.filter(s => String(s.scheduleId) !== String(vars.scheduleId))
        );
      });
    },
    onSuccess: () => {
      toast.success("All future occurrences deleted");
      setIsSlotModalOpen(false);
      setSelectedSlot(null);
      // Force immediate refetch of all week queries
      queryClient.refetchQueries({ queryKey: ["scheduler","week"], exact: false, type: 'active' });
    },
    onError: (e) => {
      toast.error(e.message);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["scheduler","week"], exact: false, refetchType: 'all' });
    }
  });
  
  // Load next week with improved caching and scroll preservation
  const loadNextWeek = useCallback(async () => {
    if (isAppending) return;
    const lastWeek = weeks[weeks.length - 1];
    const next = nextWeekISO(lastWeek);
    if (weeks.includes(next)) return; // already appended
    
    setIsAppending(true);
    await ensureWeekData(next);
    setWeeks(w => [...w, next]);
    // Prefetch one more ahead silently
    const after = nextWeekISO(next);
    ensureWeekData(after);
    setIsAppending(false);
  }, [weeks, isAppending, ensureWeekData]);
  
  // Load previous week
  const loadPreviousWeek = useCallback(async () => {
    const firstWeek = weeks[0];
    const prev = previousWeekISO(firstWeek);
    if (weeks.includes(prev)) return;
    await ensureWeekData(prev);
    setWeeks(w => [prev, ...w]);
  }, [weeks, ensureWeekData]);

  // Auto-load initial weeks on mount to ensure scrollbar appears
  useEffect(() => {
    const loadInitialWeeks = async () => {
      // Load 2 more weeks after initial week to ensure scrollbar appears
      const week2 = nextWeekISO(initialWeek);
      const week3 = nextWeekISO(week2);
      
      await ensureWeekData(week2);
      await ensureWeekData(week3);
      
      setWeeks([initialWeek, week2, week3]);
    };
    
    // Only run once on mount
    if (weeks.length === 1 && weeks[0] === initialWeek) {
      loadInitialWeeks();
    }
  }, []); // Empty deps - run once on mount

  // YouTube-style scroll loading at 70% (smooth, no auto-fill)
  useEffect(() => {
    const handleScroll = () => {
      if (isAppending) return;
      
      // Use window/document scroll since we're not in a fixed container
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      
      // Calculate scroll percentage
      const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;
      
      // Trigger load when user scrolls past 70% of content
      if (scrollPercentage >= 70) {
        loadNextWeek();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadNextWeek, isAppending]);

  // Generate weeks display data with memoization for performance
  // Build display data for all weeks, subscribing to React Query cache updates
  // This ensures re-renders when cache is updated via optimistic updates or refetches
  const allWeeksDisplay: WeekData[][] = weeks.map((weekStart) => {
    // Using getQueryData inside the component body (not in useMemo) so it re-reads on every render
    // This allows React Query cache updates to trigger re-renders
    const weekSlots = queryClient.getQueryData<Slot[]>(weekKey(weekStart)) || [];
    
    const weekData: WeekData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart + 'T00:00:00'); // Force local timezone interpretation
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Format date as YYYY-MM-DD in local timezone (avoid UTC conversion issues)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const daySlots = weekSlots.filter(slot => {
        return slot.date === dateStr;
      });

      weekData.push({
        date: dateStr,
        dayName: DAYS[dayOfWeek],
        dayNumber: dayOfWeek,
        slots: daySlots,
      });
    }
    return weekData;
  });

  const handleCreateSlot = useCallback((dayOfWeek: number, date: string) => {
    setSelectedDayOfWeek(dayOfWeek);
    setSelectedDate(date);
    setIsCreatingSlot(true);
  }, []);

  const handleEditSlot = useCallback((slot: Slot) => {
    setSelectedSlot(slot);
    setIsSlotModalOpen(true);
  }, []);

  const handleDeleteSlot = useCallback((slot: Slot) => {
    // Prevent deleting optimistic slots (still being created on backend)
    if (slot.scheduleId === 'optimistic') {
      toast.error("Please wait for the slot to finish creating before deleting");
      return;
    }
    
    // Open confirmation dialog to ask user whether to delete one or all
    setSlotToDelete(slot);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteOne = useCallback(() => {
    if (!slotToDelete) return;
    
    // Validate scheduleId is a valid number
    const scheduleIdStr = String(slotToDelete.scheduleId);
    const scheduleIdInt = parseInt(scheduleIdStr);
    
    if (isNaN(scheduleIdInt)) {
      toast.error("Invalid schedule ID. Please refresh and try again.");
      setIsDeleteDialogOpen(false);
      setSlotToDelete(null);
      return;
    }
    
    // Delete only this occurrence by creating a deletion exception
    deleteSlotMutation.mutate({
      scheduleId: scheduleIdStr,
      date: slotToDelete.date,
    });
    
    setIsDeleteDialogOpen(false);
    setSlotToDelete(null);
  }, [slotToDelete, deleteSlotMutation]);

  const handleDeleteAll = useCallback(() => {
    if (!slotToDelete) return;
    
    // Validate scheduleId is a valid number
    const scheduleIdStr = String(slotToDelete.scheduleId);
    const scheduleIdInt = parseInt(scheduleIdStr);
    
    if (isNaN(scheduleIdInt)) {
      toast.error("Invalid schedule ID. Please refresh and try again.");
      setIsDeleteDialogOpen(false);
      setSlotToDelete(null);
      return;
    }
    
    // Delete entire recurring schedule
    deleteScheduleMutation.mutate({
      scheduleId: scheduleIdStr,
    });
    
    setIsDeleteDialogOpen(false);
    setSlotToDelete(null);
  }, [slotToDelete, deleteScheduleMutation]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSlotToDelete(null);
  }, []);

  const handleSlotFormSubmit = useCallback((data: { startTime: string; endTime: string }) => {
    createScheduleMutation.mutate({
      dayOfWeek: selectedDayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });
  }, [createScheduleMutation, selectedDayOfWeek]);

  const handleSlotModalSubmit = useCallback((data: { startTime: string; endTime: string }) => {
    if (selectedSlot) {
      updateSlotMutation.mutate({
        scheduleId: String(selectedSlot.scheduleId),
        date: selectedSlot.date,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    }
  }, [updateSlotMutation, selectedSlot]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 flex flex-col flex-1">{/* removed fixed viewport height calc */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <Button
          variant="outline"
          onClick={loadPreviousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Week
        </Button>
      </div>

      <div 
        className="space-y-8"
      >
        {allWeeksDisplay.map((weekData, weekIndex) => (
          <div key={weeks[weekIndex]} className="space-y-4 week-container">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b">
              <h2 className="text-xl font-semibold">
                {new Date(weeks[weekIndex]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(new Date(weeks[weekIndex]).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>
            
            <div className="grid grid-cols-7 gap-4">
              {weekData.map((day) => {
                // Check if this is today's date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayDate = new Date(day.date + 'T00:00:00');
                const isToday = dayDate.getTime() === today.getTime();
                
                return (
                  <Card 
                    key={day.date} 
                    className={`p-4 ${isToday ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/50 ring-2 ring-primary/30' : ''}`}
                  >
                    <div className="mb-3">
                      <h3 className={`font-semibold text-lg ${isToday ? 'text-primary' : ''}`}>
                        {day.dayName}
                      </h3>
                      <p className={`text-sm ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {new Date(day.date + 'T00:00:00').getDate()}
                        {isToday && <span className="ml-1 text-xs">(Today)</span>}
                      </p>
                    </div>
                  
                  <div className="space-y-2">
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-2 bg-primary/10 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                          {slot.isException && (
                            <p className="text-xs text-muted-foreground">Modified</p>
                          )}
                          {slot.scheduleId === 'optimistic' && (
                            <p className="text-xs text-primary animate-pulse">Creating...</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSlot(slot)}
                            disabled={slot.scheduleId === 'optimistic'}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSlot(slot)}
                            disabled={slot.scheduleId === 'optimistic'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {day.slots.length < 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCreateSlot(day.dayNumber, day.date)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Slot
                      </Button>
                    )}
                  </div>
                </Card>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Loading skeleton appears while next week loads (stays at bottom) */}
        {isAppending && (
          <div className="grid grid-cols-7 gap-4 opacity-60 animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="h-4 w-1/2 bg-primary/20 rounded" />
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((__, j) => (
                    <div key={j} className="h-6 w-full bg-primary/10 rounded" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Slot Creation Form */}
      {isCreatingSlot && (
        <SlotForm
          onSubmit={handleSlotFormSubmit}
          onCancel={() => setIsCreatingSlot(false)}
          isLoading={createScheduleMutation.isPending}
        />
      )}

      {/* Slot Edit Modal */}
      {isSlotModalOpen && selectedSlot && (
        <SlotModal
          slot={{
            ...selectedSlot,
            scheduleId: String(selectedSlot.scheduleId),
            exceptionId: selectedSlot.exceptionId ? String(selectedSlot.exceptionId) : undefined
          }}
          onSubmit={handleSlotModalSubmit}
          onCancel={() => {
            setIsSlotModalOpen(false);
            setSelectedSlot(null);
          }}
          onDelete={() => handleDeleteSlot(selectedSlot)}
          isLoading={updateSlotMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && slotToDelete && (
        <DeleteConfirmationDialog
          onDeleteOne={handleDeleteOne}
          onDeleteAll={handleDeleteAll}
          onCancel={handleCancelDelete}
          slotDate={slotToDelete.date}
        />
      )}
    </div>
  );
}
