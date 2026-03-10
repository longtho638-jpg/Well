/**
 * Booking/Appointment Service — Cal.com-inspired booking system
 *
 * Supports: create, reschedule, cancel appointments with notification events
 * Pattern: Cal.com booking API + Well domain event integration
 */

import { domainEventDispatcher } from '@/lib/vibe-agent/domain-event-dispatcher';
import { supabase } from '@/lib/supabase';

// ─── Booking Types ──────────────────────────────────────────

export interface Booking {
  id: string;
  userId: string;
  serviceType: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'rescheduled' | 'cancelled';
  rescheduleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  userId: string;
  serviceType: string;
  title: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
}

export interface RescheduleBookingInput {
  bookingId: string;
  newStartTime: Date;
  reason?: string;
}

export interface CancelBookingInput {
  bookingId: string;
  reason?: string;
}

// ─── Booking Service ────────────────────────────────────────

class BookingService {
  /**
   * Create a new booking/appointment
   * Fires: booking:created event
   */
  async create(input: CreateBookingInput): Promise<Booking> {
    const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60000);

    const booking: Booking = {
      id: `bkg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
      serviceType: input.serviceType,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime,
      status: 'confirmed',
      rescheduleCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Persist to Supabase
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id: booking.id,
        user_id: booking.userId,
        service_type: booking.serviceType,
        title: booking.title,
        description: booking.description,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        status: booking.status,
        reschedule_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    // Fire domain event for notifications and side effects
    await domainEventDispatcher.dispatch(
      'booking:created' as any,
      {
        bookingId: booking.id,
        userId: booking.userId,
        serviceType: booking.serviceType,
        title: booking.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
      'bookingService.create',
    );

    return booking;
  }

  /**
   * Reschedule an existing booking
   * Fires: booking:rescheduled event
   * Limits: Max 3 reschedules per booking
   */
  async reschedule(input: RescheduleBookingInput): Promise<Booking> {
    // Fetch existing booking
    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', input.bookingId)
      .single();

    if (fetchError || !existing) {
      throw new Error(`Booking not found: ${input.bookingId}`);
    }

    if (existing.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled booking');
    }

    if (existing.reschedule_count >= 3) {
      throw new Error('Maximum reschedule limit (3) reached');
    }

    const endTime = new Date(input.newStartTime.getTime() +
      (new Date(existing.end_time).getTime() - new Date(existing.start_time).getTime()));

    const { data, error } = await supabase
      .from('bookings')
      .update({
        start_time: input.newStartTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'rescheduled',
        reschedule_count: existing.reschedule_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reschedule booking: ${error.message}`);
    }

    // Fire domain event
    await domainEventDispatcher.dispatch(
      'booking:rescheduled' as any,
      {
        bookingId: input.bookingId,
        userId: existing.user_id,
        oldStartTime: new Date(existing.start_time),
        newStartTime: input.newStartTime,
        reason: input.reason || 'User requested',
      },
      'bookingService.reschedule',
    );

    return this.mapToBooking(data);
  }

  /**
   * Cancel a booking
   * Fires: booking:cancelled event
   */
  async cancel(input: CancelBookingInput): Promise<Booking> {
    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', input.bookingId)
      .single();

    if (fetchError || !existing) {
      throw new Error(`Booking not found: ${input.bookingId}`);
    }

    if (existing.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }

    // Fire domain event
    await domainEventDispatcher.dispatch(
      'booking:cancelled' as any,
      {
        bookingId: input.bookingId,
        userId: existing.user_id,
        reason: input.reason || 'User cancelled',
        cancelledAt: new Date(),
      },
      'bookingService.cancel',
    );

    return this.mapToBooking(data);
  }

  /**
   * Get booking by ID
   */
  async getById(bookingId: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToBooking(data);
  }

  /**
   * Get bookings by user ID
   */
  async getByUserId(userId: string, status?: Booking['status']): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return data.map((d) => this.mapToBooking(d));
  }

  /**
   * Get upcoming bookings (start time in future)
   */
  async getUpcoming(limit: number = 10): Promise<Booking[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gt('start_time', now)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch upcoming bookings: ${error.message}`);
    }

    return data.map((d) => this.mapToBooking(d));
  }

  /**
   * Private helper: Map Supabase row to Booking
   */
  private mapToBooking(row: any): Booking {
    return {
      id: row.id,
      userId: row.user_id,
      serviceType: row.service_type,
      title: row.title,
      description: row.description,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      status: row.status as Booking['status'],
      rescheduleCount: row.reschedule_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const bookingService = new BookingService();
