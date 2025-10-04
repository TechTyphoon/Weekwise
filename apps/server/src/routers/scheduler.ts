import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc";
import { db } from "../db";

export const schedulerRouter = router({
  // Create a new recurring schedule
  createSchedule: protectedProcedure
    .input(
      z.object({
        dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Check if user already has 2 slots for this day
      const existingSlots = await db.schedule.findMany({
        where: {
          userId,
          dayOfWeek: input.dayOfWeek,
          isActive: true,
        },
      });

      if (existingSlots.length >= 2) {
        throw new Error("Maximum 2 slots allowed per day");
      }

      // Validate time format and ensure end time is after start time
      const [startHour, startMin] = input.startTime.split(":").map(Number);
      const [endHour, endMin] = input.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new Error("End time must be after start time");
      }

      const schedule = await db.schedule.create({
        data: {
          userId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });

      return schedule;
    }),

  // Get schedules for a specific week
  getSchedulesForWeek: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // ISO date string for the start of the week
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = new Date(input.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Get the full week

      // Get all active schedules for the user
      const schedules = await db.schedule.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          exceptions: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      // Generate slots for the week
      const weekSlots = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dayOfWeek = currentDate.getDay();

        // Only show slots for today and future dates
        if (currentDate < today) {
          continue; // Skip past dates
        }

        const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
        
        for (const schedule of daySchedules) {
          const exception = schedule.exceptions.find(
            e => e.date.toDateString() === currentDate.toDateString()
          );

          if (exception) {
            if (exception.isDeleted) {
              // Skip this slot - it's deleted for this date
              continue;
            } else if (exception.startTime && exception.endTime) {
              // Use exception times
              weekSlots.push({
                id: `${schedule.id}-${currentDate.toISOString().split('T')[0]}`,
                scheduleId: schedule.id,
                date: currentDate.toISOString().split('T')[0],
                startTime: exception.startTime,
                endTime: exception.endTime,
                isException: true,
                exceptionId: exception.id,
              });
            }
          } else {
            // Use regular schedule
            weekSlots.push({
              id: `${schedule.id}-${currentDate.toISOString().split('T')[0]}`,
              scheduleId: schedule.id,
              date: currentDate.toISOString().split('T')[0],
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isException: false,
            });
          }
        }
      }

      return weekSlots;
    }),

  // Update a slot (creates an exception)
  updateSlot: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        date: z.string(), // ISO date string
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const targetDate = new Date(input.date);
      const scheduleIdInt = parseInt(input.scheduleId);

      // Verify the schedule belongs to the user
      const schedule = await db.schedule.findFirst({
        where: {
          id: scheduleIdInt,
          userId,
        },
      });

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Validate time format
      const [startHour, startMin] = input.startTime.split(":").map(Number);
      const [endHour, endMin] = input.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new Error("End time must be after start time");
      }

      // Create or update exception
      const exception = await db.scheduleException.upsert({
        where: {
          scheduleId_date: {
            scheduleId: scheduleIdInt,
            date: targetDate,
          },
        },
        update: {
          startTime: input.startTime,
          endTime: input.endTime,
          isDeleted: false,
        },
        create: {
          scheduleId: scheduleIdInt,
          date: targetDate,
          startTime: input.startTime,
          endTime: input.endTime,
          isDeleted: false,
        },
      });

      return exception;
    }),

  // Delete a slot (creates an exception)
  deleteSlot: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        date: z.string(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const targetDate = new Date(input.date);
      const scheduleIdInt = parseInt(input.scheduleId);

      // Verify the schedule belongs to the user
      const schedule = await db.schedule.findFirst({
        where: {
          id: scheduleIdInt,
          userId,
        },
      });

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Create or update exception to mark as deleted
      const exception = await db.scheduleException.upsert({
        where: {
          scheduleId_date: {
            scheduleId: scheduleIdInt,
            date: targetDate,
          },
        },
        update: {
          isDeleted: true,
          startTime: null,
          endTime: null,
        },
        create: {
          scheduleId: scheduleIdInt,
          date: targetDate,
          isDeleted: true,
          startTime: null,
          endTime: null,
        },
      });

      return exception;
    }),

  // Delete an entire recurring schedule
  deleteSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const scheduleIdInt = parseInt(input.scheduleId);
      console.log('[DEBUG] deleteSchedule - scheduleIdInt:', scheduleIdInt, 'userId:', userId);

      // Verify the schedule belongs to the user
      const schedule = await db.schedule.findFirst({
        where: {
          id: scheduleIdInt,
          userId,
        },
      });

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Soft delete the schedule
      await db.schedule.update({
        where: {
          id: scheduleIdInt,
        },
        data: {
          isActive: false,
        },
      });

      return { success: true };
    }),
});
