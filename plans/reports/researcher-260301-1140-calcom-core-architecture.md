# Cal.com Core Architecture Research Report

**Date:** 2026-03-01
**Researcher:** Claude Agent (Haiku 4.5)
**Project Context:** Well Distributor Portal (RaaS Health Platform)
**Report Focus:** Architectural patterns mappable to agent-driven health scheduling system

---

## Executive Summary

Cal.com (open-source scheduling infrastructure) demonstrates enterprise-grade patterns for multi-tenant, feature-modular systems. This report extracts 7 core architectural patterns applicable to Well's agent-based health appointment platform:

1. **Monorepo organization** (Turborepo + apps/packages distinction)
2. **Type-safe tRPC + Zod validation layer**
3. **Feature module isolation** (packages/ vs app-specific modules/)
4. **Availability calculation + booking constraints**
5. **Event-driven webhooks** (15+ trigger types)
6. **Multi-tenancy via Organizations + Profile scoping**
7. **Plugin system** (Platform Atoms + REST API + integrations)

**Time to Implement:** 3-6 phases (discovery → API layer → features → multi-tenancy → webhooks → integrations)

---

## Part 1: Monorepo Structure & Organization

### Cal.com Structure

Cal.com uses Turborepo-based monorepo with clear apps/packages split:

```
root/
├── apps/                        # Deployed full applications
│   ├── web/                     # Main SaaS (app.cal.com)
│   ├── website/                 # Marketing (cal.com)
│   └── [other-deployables]
├── packages/                    # Shared, published modules
│   ├── @calcom/ui               # React component library
│   ├── @calcom/lib              # Shared utilities
│   ├── @calcom/prisma           # DB schema + migrations
│   ├── @calcom/trpc             # API procedures + routers
│   ├── @calcom/emails           # Email templates
│   ├── @calcom/embeds           # Iframe embeds
│   └── [other-reusables]
├── scripts/                     # Build/deploy automation
├── docs/                        # Architecture docs
├── specs/                       # Technical specs
└── turbo.json                   # Build pipeline + caching
```

### Key Principles

| Principle | Implementation |
|-----------|-----------------|
| **Apps = Deployed** | Each `apps/*` is a full Next.js app deployable to Vercel |
| **Packages = Shared** | Published to npm or consumed via workspace aliases |
| **Local Deps** | `@calcom/ui: *` in package.json + transpile via next.config.js |
| **Build Caching** | Turborepo graph caches outputs, skips unchanged packages |

### Mapping to Well

Well should mirror this structure:

```
apps/well/                      # Main health platform
├── packages/
│   ├── @well/ui                # Health UI components
│   ├── @well/schemas           # Zod schemas + types
│   ├── @well/api               # tRPC routers
│   ├── @well/db                # Prisma schema
│   └── @well/agent-types       # Agent orchestration types
├── src/
│   ├── agents/                 # Health agents (therapist, coach, etc.)
│   ├── hooks/                  # React hooks (useAgentChat, etc.)
│   └── services/               # Business logic
└── turbo.json
```

**Benefit:** Clean separation enables independent package testing, parallel development, shared UI/schemas across multiple apps.

---

## Part 2: tRPC API Layer with Zod Validation

### Cal.com Pattern

Cal.com structures tRPC procedures with shared Zod schemas:

```typescript
// packages/@calcom/schemas/booking.ts
export const createBookingInputSchema = z.object({
  eventTypeId: z.number(),
  startTime: z.date(),
  endTime: z.date(),
  attendees: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
  })),
  timezone: z.string(),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// packages/@calcom/trpc/routers/booking.ts
export const bookingRouter = router({
  create: publicProcedure
    .input(createBookingInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Runtime-safe: input validated against schema
      const booking = await ctx.db.booking.create({
        data: input,
      });
      return booking;
    }),

  getAvailability: publicProcedure
    .input(z.object({
      eventTypeId: z.number(),
      dateRange: z.object({
        start: z.date(),
        end: z.date(),
      }),
    }))
    .query(async ({ input, ctx }) => {
      // Return available slots
      return calculateAvailability(input);
    }),
});
```

### Validation Pattern Benefits

| Benefit | Application |
|---------|-------------|
| **Single Source of Truth** | Schema drives both types + runtime validation |
| **Branded Types** | `z.string().brand<"UserId">()` prevents ID mixups |
| **Transform Pipeline** | `.transform()` + `.pipe()` cleans data before domain logic |
| **Error Messages** | Clear validation errors bubble to client |

### Mapping to Well

Well's agent-based architecture needs **structured responses** from agents:

```typescript
// packages/@well/schemas/agent-response.ts
export const healthCoachResponseSchema = z.object({
  type: z.enum(['recommendation', 'question', 'action']),
  content: z.string(),
  metadata: z.object({
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string()).optional(),
    nextAction: z.enum(['schedule_appointment', 'send_message', 'escalate']).optional(),
  }),
});

export const appointmentBookingSchema = z.object({
  patientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  duration: z.number().min(15).max(120),
  specialization: z.enum(['therapy', 'coaching', 'nutrition']),
  notes: z.string().optional(),
  timezone: z.string().default('UTC'),
});

// packages/@well/trpc/routers/appointments.ts
export const appointmentsRouter = router({
  bookSlot: protectedProcedure
    .input(appointmentBookingSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate input + check availability in one operation
      const slot = await findAvailableSlot({
        therapistId: input.therapistId,
        duration: input.duration,
        specialization: input.specialization,
      });

      if (!slot) throw new TRPCError({ code: 'NOT_FOUND' });

      return ctx.db.appointment.create({
        data: {
          patientId: input.patientId,
          therapistId: input.therapistId,
          startTime: slot.start,
          endTime: slot.end,
          notes: input.notes,
        },
      });
    }),

  suggestAppointments: protectedProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      daysAhead: z.number().default(7),
    }))
    .query(async ({ input, ctx }) => {
      // Agent queries available slots for recommendation
      const slots = await findTherapistSlots({
        specialty: ctx.user.preferredSpecialty,
        daysAhead: input.daysAhead,
      });
      return slots;
    }),
});
```

**Key Pattern:** tRPC becomes the **agent-to-system interface**, ensuring agent responses conform to schemas before database operations.

---

## Part 3: Feature Module Pattern & App Router

### Cal.com Approach

Cal.com separates features into two layers:

**Layer 1: Shared Feature Packages**
```
packages/features/
├── event-types/          # Event type management
├── bookings/             # Booking logic
├── availability/         # Availability calculation
├── teams/                # Team management
└── workflows/            # Automation workflows
```

**Layer 2: App-Specific Modules**
```
apps/web/
├── modules/
│   ├── event-types/      # Event type UI (web-specific)
│   ├── bookings/         # Booking UI
│   └── settings/         # User settings
├── pages/                # Next.js pages or app/ routes
├── middleware.ts         # Auth + request interception
└── trpc/
    └── routers.ts        # tRPC endpoint definitions
```

### Next.js Integration

Cal.com (transitioning to App Router) uses middleware pattern:

```typescript
// middleware.ts - runs on EVERY request
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  // Redirect unauthenticated users to login
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add user context for downstream handlers
  const response = NextResponse.next();
  response.headers.set('x-user-id', token || '');
  return response;
}
```

### Mapping to Well

Well's health appointment system needs **feature modules for each clinical domain**:

```
apps/well/
├── packages/
│   ├── @well/api
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── appointments.ts      # Appointment CRUD + availability
│   │       │   ├── therapists.ts        # Provider management
│   │       │   ├── patients.ts          # Patient records
│   │       │   ├── health-coaching.ts   # Health coach workflows
│   │       │   └── webhooks.ts          # Event subscriptions
│   │       └── middleware/
│   │           ├── auth.ts              # Auth context
│   │           ├── rateLimit.ts         # Rate limiting per patient
│   │           └── logging.ts           # Request tracing
│   │
│   └── @well/features
│       ├── appointments/                # Shared appointment logic
│       │   ├── availability.ts          # Slot calculation
│       │   ├── confirmation.ts          # Email/SMS confirmation
│       │   └── types.ts
│       ├── health-coaching/             # Coach-specific workflows
│       │   ├── goals.ts
│       │   ├── progress-tracking.ts
│       │   └── recommendations.ts
│       └── webhooks/                    # Event publishing
│
├── src/
│   ├── app/                             # Next.js App Router
│   │   ├── (auth)/                      # Auth group
│   │   ├── (dashboard)/                 # Protected routes
│   │   │   ├── layout.tsx
│   │   │   ├── appointments/            # Feature UI
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── book/page.tsx
│   │   │   └── coaching/
│   │   ├── api/                         # tRPC endpoint
│   │   │   └── trpc/[trpc]/route.ts
│   │   └── middleware.ts                # Auth + context injection
│   │
│   ├── agents/                          # Agent orchestration
│   │   ├── health-coach-agent/
│   │   ├── therapist-agent/
│   │   └── agent-orchestrator.ts
│   │
│   └── hooks/
│       ├── use-agent-chat.ts            # Agent interaction
│       └── use-appointments.ts          # Appointment queries
```

**Key Pattern:** Middleware validates JWT → injects user context → enables type-safe queries downstream.

---

## Part 4: Booking Engine & Availability Logic

### Cal.com Architecture

Cal.com's booking engine operates in phases:

**Phase 1: Availability Calculation**
- Query provider's calendar (Google, Outlook, CalDAV)
- Get provider's availability schedule (hours of operation)
- Apply restriction schedules (business hours, shift limits)
- Return list of available 15/30/60-min slots

**Phase 2: Slot Reservation**
- Check for calendar conflicts
- Apply booking limits (max N bookings per day/week/month)
- Check future booking window (can't book >30 days out)
- Reserve slot (soft lock for 5 minutes during checkout)

**Phase 3: Confirmation**
- Verify payment (if required)
- Create calendar event on provider's calendar
- Send confirmation email/SMS
- Webhook triggers

### Availability Algorithm

```
PSEUDOCODE:
1. Get provider's AVAILABILITY SCHEDULE (recurring pattern)
   - Monday-Friday: 9am-5pm
   - Saturday: 10am-3pm

2. Apply RESTRICTION SCHEDULE (overrides)
   - Vacation: Jan 1-7 (no availability)
   - Team meeting: Every Tuesday 2-3pm (unavailable)

3. Query EXTERNAL CALENDARS (conflicts)
   - Google Calendar events
   - Outlook calendar events

4. Calculate AVAILABLE SLOTS
   FOR each 15-min slot in (today, today+30days):
     IF slot is in availability hours
       AND not in restriction schedule
       AND not conflicting with calendar
       AND bookings < limit
     THEN add to available_slots

5. Return available_slots to frontend
```

### Mapping to Well

Well's health appointment engine needs multi-provider + multi-specialty scheduling:

```typescript
// packages/@well/features/appointments/availability.ts

interface TherapistAvailability {
  therapistId: string;
  specialty: 'therapy' | 'coaching' | 'nutrition';
  weeklySchedule: {
    [dayOfWeek: number]: Array<{ start: string; end: string }>; // "09:00", "17:00"
  };
  blockedDates: Date[];  // Vacation, training days
  maxBookingsPerDay: number;
  sessionDuration: number; // minutes
}

interface AppointmentSlot {
  therapistId: string;
  startTime: Date;
  endTime: Date;
  specialty: string;
  confidence: number; // 0-1, based on calendar conflicts
}

export async function findAvailableSlots(
  specialty: string,
  dateRange: { start: Date; end: Date },
  requiredDuration: number
): Promise<AppointmentSlot[]> {
  // 1. Get all therapists with this specialty
  const therapists = await db.therapist.findMany({
    where: { specialties: { has: specialty } },
  });

  const slots: AppointmentSlot[] = [];

  // 2. For each therapist, calculate available slots
  for (const therapist of therapists) {
    const availability = parseAvailabilitySchedule(therapist.schedule);

    // 3. Query blocked dates (vacations)
    const blockedDates = await db.blockDate.findMany({
      where: { therapistId: therapist.id },
    });

    // 4. Query external calendars for conflicts
    const externalEvents = await fetchGoogleCalendarEvents({
      calendarId: therapist.googleCalendarId,
      timeMin: dateRange.start,
      timeMax: dateRange.end,
    });

    // 5. Calculate available slots in requested date range
    for (
      let current = dateRange.start;
      current < dateRange.end;
      current.setDate(current.getDate() + 1)
    ) {
      const daySlots = availability[current.getDay()];
      if (!daySlots) continue; // Not available this day

      // 5a. Check if day is blocked
      if (blockedDates.some(bd => isSameDay(bd.date, current))) {
        continue;
      }

      // 5b. For each available window in the day
      for (const window of daySlots) {
        const slotStart = parseTime(window.start, current);
        const slotEnd = parseTime(window.end, current);

        // 5c. Find all possible slots within the window
        for (
          let slot = slotStart;
          slot.getTime() + requiredDuration * 60000 <= slotEnd.getTime();
          slot.setMinutes(slot.getMinutes() + 15) // 15-min granularity
        ) {
          const slotEndTime = new Date(slot.getTime() + requiredDuration * 60000);

          // 5d. Check against external calendar conflicts
          const hasConflict = externalEvents.some(
            ev => !(slotEndTime <= ev.start || slot >= ev.end)
          );

          // 5e. Check booking limits
          const bookingsOnDay = await db.appointment.count({
            where: {
              therapistId: therapist.id,
              startTime: { gte: startOfDay(slot), lt: endOfDay(slot) },
            },
          });

          if (
            !hasConflict &&
            bookingsOnDay < therapist.maxBookingsPerDay
          ) {
            slots.push({
              therapistId: therapist.id,
              startTime: slot,
              endTime: slotEndTime,
              specialty,
              confidence: calculateConfidence(therapist, slot),
            });
          }
        }
      }
    }
  }

  // 6. Sort by therapist rating + time preference
  return slots.sort((a, b) => {
    const aTherapist = therapists.find(t => t.id === a.therapistId)!;
    const bTherapist = therapists.find(t => t.id === b.therapistId)!;

    // Prefer highly-rated therapists + morning times
    return (
      bTherapist.avgRating - aTherapist.avgRating ||
      a.startTime.getHours() - b.startTime.getHours()
    );
  });
}

// Helper: Calculate confidence based on lead time + calendar conflicts
function calculateConfidence(therapist: Therapist, slotStart: Date): number {
  const daysTilSlot = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const leadTimeBonus = Math.min(daysTilSlot / 30, 1); // Max bonus at 30+ days
  const baseConfidence = therapist.avgRating / 5; // 0-1 from therapist rating

  return Math.min(1, baseConfidence * 0.7 + leadTimeBonus * 0.3);
}
```

**Key Pattern:** Availability calculation is **isolated module** → called by API → cached at edge → reduces real-time database load.

---

## Part 5: Webhook System & Event Triggers

### Cal.com Webhook Architecture

Cal.com publishes **15+ event types** via webhooks:

| Event Type | Payload | Use Case |
|-----------|---------|----------|
| `booking.created` | `{booking, eventType, organizer, attendees}` | Send confirmation |
| `booking.rescheduled` | Same + `{oldTime, newTime}` | Calendar update |
| `booking.cancelled` | Same + `{cancellationReason}` | Cleanup + refund |
| `booking.rejected` | Same + `{rejectionReason}` | Notify attendee |
| `booking.paid` | `{booking, payment}` | Trigger service |
| `meeting.started` | `{booking, recordingUrl}` | Log meeting |
| `meeting.ended` | `{booking, duration, recordingUrl}` | Store recording |
| `meeting.no_show` | `{booking, reason}` | Track analytics |

### Implementation Pattern

```typescript
// packages/@calcom/trpc/routers/webhooks.ts
export const webhookRouter = router({
  create: protectedProcedure
    .input(z.object({
      subscriberUrl: z.string().url(),
      eventTriggers: z.array(z.enum([
        'booking.created',
        'booking.rescheduled',
        'booking.cancelled',
        'booking.paid',
        'meeting.started',
        'meeting.ended',
      ])),
      secret: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const webhook = await ctx.db.webhook.create({
        data: {
          subscriberId: ctx.user.id,
          subscriberUrl: input.subscriberUrl,
          eventTriggers: input.eventTriggers,
          secret: input.secret || crypto.randomUUID(),
        },
      });
      return webhook;
    }),
});

// apps/web/lib/webhooks/dispatcher.ts
export async function dispatchWebhook(
  event: 'booking.created' | 'booking.rescheduled' | 'booking.cancelled',
  payload: Record<string, any>
) {
  // 1. Find subscriptions for this event
  const webhooks = await db.webhook.findMany({
    where: {
      eventTriggers: { has: event },
    },
  });

  // 2. For each webhook, send payload with signature
  for (const webhook of webhooks) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // 3. Queue for async delivery (with retries)
    await queue.add('webhook-delivery', {
      webhookId: webhook.id,
      url: webhook.subscriberUrl,
      payload,
      signature,
      retries: 0,
    });
  }
}

// Event dispatcher (triggered from booking CRUD)
export async function createBooking(input: CreateBookingInput) {
  const booking = await db.booking.create({ data: input });

  // Async webhook dispatch
  await dispatchWebhook('booking.created', {
    booking,
    eventType: booking.eventType,
    organizer: booking.organizer,
    attendees: booking.attendees,
  });

  return booking;
}
```

### Mapping to Well

Well's health platform needs webhooks for **clinical workflows**:

```typescript
// packages/@well/schemas/webhooks.ts
export const wellWebhookEventSchema = z.enum([
  'appointment.created',        // Patient booked appointment
  'appointment.confirmed',      // Therapist confirmed
  'appointment.cancelled',      // Either party cancelled
  'appointment.completed',      // Session ended, notes uploaded
  'health-goal.created',        // Coach created patient goal
  'health-goal.updated',        // Goal progress tracked
  'medication.reminder',        // Daily med reminder needed
  'nutrition-plan.assigned',    // Coach assigned meal plan
  'progress-report.generated',  // Weekly/monthly summary
  'escalation.required',        // Patient needs clinical review
  'patient.left-session',       // Patient didn't show up
  'therapist.availability.changed', // Schedule updated
]);

export type WellWebhookEvent = z.infer<typeof wellWebhookEventSchema>;

// packages/@well/api/src/webhooks.ts
export const webhookRouter = router({
  subscribe: protectedProcedure
    .input(z.object({
      url: z.string().url(),
      events: z.array(wellWebhookEventSchema),
      secret: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const webhook = await ctx.db.webhook.create({
        data: {
          organizationId: ctx.user.organizationId,
          url: input.url,
          events: input.events,
          secret: input.secret || crypto.randomUUID(),
        },
      });
      return webhook;
    }),
});

// apps/well/src/lib/webhooks/dispatcher.ts
export async function dispatchAppointmentWebhook(
  event: 'appointment.created' | 'appointment.completed',
  appointment: Appointment,
  metadata?: Record<string, any>
) {
  const webhooks = await db.webhook.findMany({
    where: {
      events: { has: event },
      organizationId: appointment.organizationId,
    },
  });

  for (const webhook of webhooks) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      appointment: {
        id: appointment.id,
        patientId: appointment.patientId,
        therapistId: appointment.therapistId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        specialty: appointment.specialty,
        status: appointment.status,
      },
      ...metadata,
    };

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Queue for async delivery
    await eventQueue.add({
      webhookUrl: webhook.url,
      payload,
      signature,
      retries: 0,
      maxRetries: 5,
    });
  }
}
```

**Key Pattern:** Webhooks decouple **core booking logic** from **downstream systems** (email, SMS, CRM, analytics). Enables plugin ecosystem.

---

## Part 6: Multi-Tenancy & Organization Model

### Cal.com Approach

Cal.com uses **Organizations** as the multi-tenancy boundary:

```typescript
// packages/@calcom/prisma/schema.prisma

model Organization {
  id                Int         @id @default(autoincrement())
  name              String
  slug              String      @unique
  logoUrl           String?

  // Org members
  members           Profile[]
  teams             Team[]

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

model Profile {
  id                Int         @id @default(autoincrement())
  userId            Int         @unique
  organizationId    Int

  // Username scoped to org (same username can exist in multiple orgs)
  username          String

  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, username])
}

model Team {
  id                Int         @id @default(autoincrement())
  organizationId    Int
  name              String
  slug              String

  // Hierarchy: org can have teams and sub-teams
  parentTeamId      Int?
  childTeams        Team[]      @relation("TeamHierarchy")
  parentTeam        Team?       @relation("TeamHierarchy", fields: [parentTeamId], references: [id])

  members           TeamMember[]
  eventTypes        EventType[]

  organization      Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, slug])
}

model TeamMember {
  id                Int         @id @default(autoincrement())
  teamId            Int
  userId            Int
  role              Role        @default(MEMBER) // MEMBER | ADMIN | OWNER

  team              Team        @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
}

enum Role {
  MEMBER
  ADMIN
  OWNER
}

model EventType {
  id                Int         @id @default(autoincrement())
  teamId            Int?        // Can belong to team or user
  userId            Int?

  name              String
  slug              String
  description       String?

  team              Team?       @relation(fields: [teamId], references: [id])
  user              User?       @relation(fields: [userId], references: [id])

  @@unique([teamId, slug])
  @@unique([userId, slug])
}
```

### Permission Model

| Action | MEMBER | ADMIN | OWNER |
|--------|--------|-------|-------|
| View team events | ✓ | ✓ | ✓ |
| Create event type | ✓ | ✓ | ✓ |
| Manage team members | ✗ | ✓ | ✓ |
| Change team settings | ✗ | ✓ | ✓ |
| Delete team | ✗ | ✗ | ✓ |

### Mapping to Well

Well's multi-tenant health clinic system:

```typescript
// packages/@well/db/src/schema.prisma

model Organization {
  id                String        @id @default(cuid())
  name              String
  slug              String        @unique
  clinicType        String        // "physical_therapy", "mental_health", "wellness"

  // Settings
  logoUrl           String?
  primaryColor      String?

  members           OrganizationMember[]
  clinics           Clinic[]
  therapists        Therapist[]
  patients          Patient[]
  webhooks          Webhook[]

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

model OrganizationMember {
  id                String        @id @default(cuid())
  organizationId    String
  userId            String

  // Role determines access
  role              MemberRole    @default(STAFF) // OWNER | MANAGER | STAFF | VIEWER

  // Department assignment (optional)
  departmentId      String?

  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
}

enum MemberRole {
  OWNER              // Full access
  MANAGER            // Manage staff + patients
  STAFF              // Create appointments, view own patients
  VIEWER             // Read-only access to reports
}

model Clinic {
  id                String        @id @default(cuid())
  organizationId    String
  name              String

  // Multi-location support
  address           String
  timezone          String

  therapists        Therapist[]
  appointments      Appointment[]

  organization      Organization @relation(fields: [organizationId], references: [id])
}

model Therapist {
  id                String        @id @default(cuid())
  organizationId    String
  userId            String
  clinicId          String

  specialties       String[]      // ["therapy", "coaching", "nutrition"]
  licenseNumber     String?
  licenseExpiry     DateTime?
  avgRating         Float         @default(0)

  weeklySchedule    Json          // { "0": [{"start": "09:00", "end": "17:00"}] }
  maxBookingsPerDay Int           @default(8)

  appointments      Appointment[]
  reviews           Review[]

  organization      Organization @relation(fields: [organizationId], references: [id])
  user              User          @relation(fields: [userId], references: [id])
  clinic            Clinic        @relation(fields: [clinicId], references: [id])
}

model Patient {
  id                String        @id @default(cuid())
  organizationId    String
  userId            String?       // Null for intake-only patients

  firstName         String
  lastName          String
  email             String
  phone             String

  // Health profile
  medicalHistory    String?
  currentMedications String[]
  allergies         String[]

  appointments      Appointment[]
  healthGoals       HealthGoal[]

  organization      Organization @relation(fields: [organizationId], references: [id])
  user              User?         @relation(fields: [userId], references: [id])
}

model Appointment {
  id                String        @id @default(cuid())
  organizationId    String
  patientId         String
  therapistId       String
  clinicId          String

  startTime         DateTime
  endTime           DateTime
  specialty         String
  status            AppointmentStatus @default(SCHEDULED)

  notes             String?
  recordingUrl      String?

  organization      Organization @relation(fields: [organizationId], references: [id])
  patient           Patient       @relation(fields: [patientId], references: [id])
  therapist         Therapist     @relation(fields: [therapistId], references: [id])
  clinic            Clinic        @relation(fields: [clinicId], references: [id])
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

model Webhook {
  id                String        @id @default(cuid())
  organizationId    String
  url               String
  secret            String
  events            String[]      // ["appointment.created", "appointment.completed"]
  isActive          Boolean       @default(true)

  organization      Organization @relation(fields: [organizationId], references: [id])
}
```

**Key Pattern:** Organization boundary isolates data + enforces role-based access control (RBAC). All queries filtered by `organizationId` + `userId`.

---

## Part 7: Plugin & Integration System

### Cal.com Pattern

Cal.com supports three integration layers:

**Layer 1: Platform Atoms (Component SDK)**
```tsx
import { CalAtom } from '@calcom/atoms';

export function MyApp() {
  return (
    <CalAtom
      eventTypeId={123}
      organizationId="acme-corp"
      onSuccess={(booking) => console.log('Booked:', booking)}
    />
  );
}
```

**Layer 2: REST API**
```bash
POST /v2/bookings
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "eventTypeId": 123,
  "start": "2026-03-15T10:00:00Z",
  "attendees": [
    { "name": "John", "email": "john@example.com" }
  ]
}
```

**Layer 3: Webhooks + Integrations**
- Google Calendar sync
- Zoom meeting creation
- Slack notifications
- Zapier automations

### Mapping to Well

Well's **agent + integration architecture** mirrors this:

```typescript
// Layer 1: React Hook (Agent Chat Component)
export function PatientCoachChat() {
  const { messages, sendMessage } = useAgentChat({
    agentType: 'health-coach',
    organizationId: user.organizationId,
  });

  return (
    <div>
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      <input
        onSubmit={(text) => sendMessage(text)}
        placeholder="Ask coach anything..."
      />
    </div>
  );
}

// Layer 2: API Endpoints (for agents)
export const agentApiRouter = router({
  askCoach: protectedProcedure
    .input(z.object({
      question: z.string(),
      patientId: z.string().uuid(),
      context: z.object({
        medicalHistory: z.string().optional(),
        recentAppointments: z.array(z.any()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Agent processes question
      const response = await orchestrateAgent('health-coach', {
        input: input.question,
        context: input.context,
        patientId: input.patientId,
      });

      // 2. Parse response with schema
      const parsed = healthCoachResponseSchema.parse(response);

      // 3. Execute suggested action if needed
      if (parsed.metadata.nextAction === 'schedule_appointment') {
        return {
          ...parsed,
          appointmentSlots: await findAvailableSlots({
            patientId: input.patientId,
            specialty: parsed.metadata.specialty,
          }),
        };
      }

      return parsed;
    }),

  // Auto-suggest appointments based on agent analysis
  suggestAppointments: protectedProcedure
    .input(z.object({
      patientId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      // Agent analyzes patient health goals + history
      const recommendation = await orchestrateAgent('appointment-suggester', {
        patientId: input.patientId,
      });

      return {
        suggestion: recommendation,
        availableSlots: await findAvailableSlots({
          patientId: input.patientId,
          specialty: recommendation.suggestedSpecialty,
        }),
      };
    }),
});

// Layer 3: Webhook System (downstream integrations)
export async function dispatchHealthEvent(
  event: 'appointment.completed' | 'health-goal.achieved',
  data: Record<string, any>
) {
  // Send to all subscribed services (CRM, EMR, analytics)
  const webhooks = await db.webhook.findMany({
    where: {
      organizationId: data.organizationId,
      events: { has: event },
    },
  });

  for (const webhook of webhooks) {
    await queue.add('webhook', {
      url: webhook.url,
      payload: data,
      signature: computeSignature(webhook.secret, data),
    });
  }
}
```

**Key Pattern:** **Agents become first-class API consumers** → structured responses via Zod schemas → webhooks trigger downstream workflows.

---

## Part 8: Architecture Decision Map

### When to Use Cal.com Patterns

| Pattern | Well Use Case | Implementation |
|---------|---------------|-----------------|
| Monorepo (apps/packages) | Multi-team deployment (web + mobile) | Use Turborepo, separate @well/ui from business logic |
| tRPC + Zod | Type-safe agent responses | Schemas for coach/therapist agents before DB write |
| Feature modules | Clinical domains (appointments, goals, meds) | Each feature package owns domain logic |
| Availability engine | Therapist scheduling | Calc slots with multi-calendar sync |
| Webhooks | Clinic integrations (EHR, SMS, CRM) | 12+ events (appointment, goal, escalation) |
| Organizations | Multi-clinic deployments | Org boundary + RBAC |
| Integrations API | Third-party health tools | REST API + React hooks for embedding |

---

## Part 9: Implementation Phasing (Well Project)

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up monorepo (Turborepo + packages)
- [ ] Create tRPC routers + Zod schemas
- [ ] Implement auth middleware

### Phase 2: Core API (Weeks 3-4)
- [ ] Appointment CRUD + availability calculation
- [ ] Therapist/patient models
- [ ] Basic booking flow

### Phase 3: Features (Weeks 5-6)
- [ ] Health coaching agent integration
- [ ] Health goals + progress tracking
- [ ] UI components with Aura Elite theme

### Phase 4: Multi-Tenancy (Weeks 7-8)
- [ ] Organization model + RBAC
- [ ] Multi-clinic support
- [ ] Webhook subscriptions

### Phase 5: Integrations (Weeks 9-10)
- [ ] Google Calendar sync
- [ ] SMS/Email notifications
- [ ] Third-party EHR webhooks

---

## Unresolved Questions

1. **Agent State Management:** How should agent conversation history persist? Redis cache + database?
2. **Real-Time Availability:** Should availability updates push to clients via WebSocket or poll tRPC?
3. **Payment Integration:** Does Well need clinic-side billing, or patient-side payments? Affects webhook structure.
4. **Compliance:** HIPAA encryption for patient data at rest + in transit?
5. **Analytics:** Should webhook events feed into analytics pipeline (DataDog/Segment) for health metrics?

---

## Sources

- [Cal.com Repository](https://github.com/calcom/cal.com)
- [Cal.com Monorepo Handbook](https://handbook.cal.com/engineering/codebase/monorepo-turborepo)
- [Cal.com Webhooks Documentation](https://cal.com/docs/developing/guides/automation/webhooks)
- [Cal.com API Reference](https://cal.com/docs/api-reference/v2/bookings/create-a-booking)
- [Cal.com Organization Setup](https://cal.com/docs/self-hosting/guides/organization/organization-setup)
- [tRPC Output Validation](https://trpc.io/docs/v9/output-validation)
- [Zod Documentation](https://zod.dev/)

---

**Report End**
