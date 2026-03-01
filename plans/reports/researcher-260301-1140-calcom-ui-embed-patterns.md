# Cal.com UI Architecture & Embed Patterns Research Report

**Date:** 2026-03-01
**Report ID:** researcher-260301-1140-calcom-ui-embed-patterns
**Project:** Well Distributor Portal
**Context:** Research cal.com's UI architecture, embed system, and frontend patterns for Well's React/Vite/Tailwind stack

---

## EXECUTIVE SUMMARY

Cal.com implements a **three-tier component architecture** (Primitives → Particles → Atoms) combining Base UI's accessibility foundations with Tailwind CSS customization. Their embed system uses **iframe-based widgets with postMessage communication**, supports **dynamic form validation via Zod + React Hook Form**, and leverages **modern testing patterns** (Playwright E2E, Vitest unit tests, Page Object Model).

**Applicability to Well:** Well can adopt similar patterns for:
1. Component library organization (Aura Elite design tokens)
2. Agent chat widget embeddability (iframe + postMessage)
3. Form validation architecture (dynamic fields + Zod)
4. i18n/l10n system (next-intl pattern)
5. Testing strategy (Playwright + Vitest)

---

## 1. UI PACKAGE & COMPONENT LIBRARY

### 1.1 Cal.com's Three-Tier Architecture

Cal.com's `@calcom/ui` package follows a **compound component pattern** organized in three layers:

| Tier | Purpose | Technologies |
|------|---------|--------------|
| **Primitives** | Unstyled, WAI-ARIA-compliant foundational components | Base UI (Material Design ARIA implementations), React Aria hooks |
| **Particles** | Pre-composed functional units combining primitives + business logic | Tailwind CSS, custom component composition |
| **Atoms** | Customizable, brand-aware UI modules with API integration | Full control for brand customization |

#### Key Characteristics:
- **Headless component pattern:** Logic separated from styling, allowing teams to customize appearance
- **Base UI foundation:** Provides stricter ARIA role enforcement than Radix (better type safety)
- **Tailwind-first:** All styling via utility classes, no CSS-in-JS
- **Copy-paste ownership:** Components are copied into projects (like shadcn/ui), NOT installed as locked packages

### 1.2 Design Token System

Cal.com implements CSS variables + Tailwind config for design tokens:

```typescript
// Design token example (Tailwind extendable system)
@layer components {
  .tw-button-primary {
    @apply px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium;
    @apply hover:shadow-lg transition-shadow;
  }
}
```

**Token categories:**
- Colors (primary, secondary, accent, status states)
- Typography (font families, sizes, weights, line heights)
- Spacing (margins, padding, gaps)
- Shadows (elevation levels)
- Radii (border-radius scales)
- Transitions (durations, easing functions)

### 1.3 Accessibility-First Approach

Cal.com ensures WCAG 2.1 AA compliance:
- **ARIA attributes:** `role`, `aria-label`, `aria-described-by`, `aria-expanded`, etc.
- **Keyboard navigation:** Tab order, focus management, arrow key handlers
- **Semantic HTML:** Proper heading hierarchy, form labels, alt text
- **Focus management:** Focus traps for modals, focus restoration after close
- **Color contrast:** ≥4.5:1 for normal text, ≥3:1 for large text

---

## 2. EMBED SYSTEM ARCHITECTURE

### 2.1 Embed Delivery Methods

Cal.com offers **multiple embedding formats** for flexibility:

| Format | Use Case | Technology |
|--------|----------|-----------|
| **Inline Embed** | Full calendar widget inline on page | React component or iframe |
| **Floating Button** | Fixed position trigger button | iframe + postMessage |
| **Pop-up Modal** | Click-triggered overlay | iframe with z-index management |
| **Email Links** | Tracked UTM parameters in email | URL with query params |
| **Custom Atoms** | Brand-matching booking experience | React component library (`@calcom/atoms`) |

### 2.2 Technical Implementation: iframe + postMessage

Cal.com's embed system uses **postMessage API** for parent-child window communication:

```typescript
// Parent window (website hosting embed)
const embedFrame = document.getElementById('cal-embed');

// Listen for messages from embed iframe
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://cal.com') return;

  if (event.data.type === 'cal-booking-success') {
    console.log('Booking completed:', event.data.booking);
    // Update parent UI, trigger thank you, etc.
  }
});

// Embed iframe (cal.com domain)
window.parent.postMessage({
  type: 'cal-booking-success',
  booking: { id, date, attendees }
}, 'https://example.com');
```

**Advantages:**
- Cross-origin security (CORS-compliant)
- No external SDK required (pure JavaScript)
- Works in any HTML environment (WordPress, Webflow, Shopify)
- Responsive (iframe scales to parent container)
- Event-driven (loose coupling)

### 2.3 Customization via Query Parameters

Query params pre-fill forms and customize appearance:

```html
<iframe src="https://cal.com/username/event?
  name=John Doe&
  email=john@example.com&
  utm_source=website&
  utm_medium=banner&
  utm_campaign=spring-promo&
  redirect_url=https://example.com/thank-you">
</iframe>
```

**Parameters supported:**
- `name`, `email` — auto-fill attendee info
- `utm_*` — attribution tracking
- `redirect_url` — post-booking redirect
- `theme` — light/dark mode toggle
- `layout` — inline/modal selection

### 2.4 Cal.com Atoms: React Integration

For React apps, Cal.com provides **@calcom/atoms** — modular, customizable components:

```typescript
import { Booker } from '@calcom/atoms';

export function MyBookingWidget() {
  return (
    <Booker
      organization="acme"
      month={new Date()}
      rescheduleUid="123"
      onBookingSuccess={(event) => {
        // Handle booking
      }}
    />
  );
}
```

**Atoms architecture:**
- No iframe (direct React rendering)
- Full styling control via CSS-in-JS / Tailwind
- Modular: use `<BookingForm>`, `<Calendar>`, `<TimeSlots>` independently
- Real-time availability sync (Zustand store)

---

## 3. FORM BUILDER & DYNAMIC FIELD VALIDATION

### 3.1 Schema-Driven Form Architecture

Cal.com uses **declarative form schemas** with dynamic Zod validation:

```typescript
// Form schema definition
const formSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().refine(val => {
    // Custom validation: if provided, must be valid phone
    return !val || /^\+?[0-9\-\(\)\s]+$/.test(val);
  }, 'Invalid phone'),
  customField: z.enum(['option-a', 'option-b']),
  // Conditional field: only required if customField is 'option-b'
}).refine(data => {
  if (data.customField === 'option-b' && !data.phone) {
    return false;
  }
  return true;
}, {
  message: 'Phone required for Option B',
  path: ['phone']
});
```

### 3.2 Dynamic Field Generation

Fields are generated from configuration objects:

```typescript
interface FormField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  visible?: (formData: any) => boolean; // Conditional visibility
}

// Field renderer
export function FieldRenderer({ field, register, errors }: Props) {
  if (field.visible && !field.visible(formData)) return null;

  const validation = buildZodValidation(field);

  return (
    <input
      {...register(field.name, validation)}
      type={field.type}
      placeholder={field.placeholder}
      aria-invalid={!!errors[field.name]}
    />
  );
}
```

### 3.3 React Hook Form + Zod Integration

Cal.com uses **`@hookform/resolvers/zod`** for seamless Zod integration:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function BookingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onBlur' // Validate on blur for better UX
  });

  const customField = watch('customField');

  const onSubmit = async (data) => {
    try {
      const result = await submitBooking(data);
      // Success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* Dynamic field visibility based on watch() */}
      {customField === 'option-b' && (
        <input {...register('phone')} required />
      )}
      <button type="submit">Book</button>
    </form>
  );
}
```

### 3.4 Field Array for Dynamic Lists

For multiple entries (attendees, repeating questions):

```typescript
import { useFieldArray } from 'react-hook-form';

export function MultiAttendeeForm({ control }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attendees'
  });

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`attendees.${index}.name`)} />
          <input {...register(`attendees.${index}.email`)} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ name: '', email: '' })}>
        Add Attendee
      </button>
    </>
  );
}
```

---

## 4. REAL-TIME FEATURES & OPTIMISTIC UI

### 4.1 State Management with Zustand

Cal.com uses **Zustand** for lightweight, reactive state:

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface BookingStore {
  bookings: Booking[];
  loading: boolean;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
}

export const useBookingStore = create<BookingStore>()(
  immer((set) => ({
    bookings: [],
    loading: false,

    addBooking: (booking) => set((state) => {
      state.bookings.push(booking);
    }),

    updateBooking: (id, updates) => set((state) => {
      const booking = state.bookings.find(b => b.id === id);
      if (booking) Object.assign(booking, updates);
    }),

    removeBooking: (id) => set((state) => {
      state.bookings = state.bookings.filter(b => b.id !== id);
    })
  }))
);
```

### 4.2 Optimistic UI Pattern

Immediate UI updates before server confirmation:

```typescript
export function BookingAction({ bookingId }) {
  const updateBooking = useBookingStore(s => s.updateBooking);

  const handleConfirm = async () => {
    // 1. Optimistic update (instant)
    updateBooking(bookingId, { status: 'confirmed' });

    try {
      // 2. Server request
      const result = await api.confirmBooking(bookingId);

      // 3. Sync with server response (if different)
      updateBooking(bookingId, result);
    } catch (error) {
      // 4. Rollback on error
      updateBooking(bookingId, { status: 'pending' });
      showError('Confirmation failed');
    }
  };

  return <button onClick={handleConfirm}>Confirm</button>;
}
```

### 4.3 Presence Tracking (Real-time)

For collaborative features (multiple users viewing same calendar):

```typescript
// Supabase real-time presence (if integrated)
const channel = supabase.channel('calendar-presence');

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // Update UI with who's viewing
}).subscribe();

// Custom WebSocket approach (pure JS)
const ws = new WebSocket('wss://api.example.com/presence');

ws.onmessage = (event) => {
  const { user, action, timestamp } = JSON.parse(event.data);
  if (action === 'viewed-slot') {
    // Update UI: show which slots are being viewed
  }
};
```

### 4.4 React 19 useOptimistic Hook

Modern React 19 alternative to manual optimistic updates:

```typescript
'use client';

import { useOptimistic } from 'react';

export function BookingListItem({ booking }) {
  const [optimisticBooking, updateOptimistic] = useOptimistic(
    booking,
    (state, newStatus) => ({ ...state, status: newStatus })
  );

  const handleStatusChange = async (newStatus) => {
    // Optimistic update happens immediately
    updateOptimistic(newStatus);

    try {
      await api.updateBookingStatus(booking.id, newStatus);
    } catch (error) {
      // Rolls back automatically on error
      updateOptimistic(booking.status);
    }
  };

  return (
    <div>
      Status: {optimisticBooking.status}
      <button onClick={() => handleStatusChange('confirmed')}>
        Confirm
      </button>
    </div>
  );
}
```

---

## 5. INTERNATIONALIZATION (i18n) & LOCALIZATION

### 5.1 Cal.com's i18n Strategy

Cal.com uses **next-intl** (formerly `react-intl`) combined with **Crowdin** for translations:

| Component | Purpose |
|-----------|---------|
| **next-intl** | Provides `useTranslations()` hook, routing, formatting |
| **Crowdin API** | Synchronizes translation strings from code → Crowdin platform |
| **namespace pattern** | Organize keys hierarchically (e.g., `booking.form.name`) |

### 5.2 Translation Key Structure

Hierarchical organization by feature/domain:

```typescript
// locales/en.json
{
  "booking": {
    "form": {
      "name": "Your Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "submit": "Book Now"
    },
    "confirmation": {
      "title": "Booking Confirmed",
      "message": "Your appointment is set for {{date}}"
    }
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email"
  }
}
```

### 5.3 useTranslations Hook Usage

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function BookingForm() {
  const t = useTranslations();

  return (
    <form>
      <label>{t('booking.form.name')}</label>
      <input placeholder={t('booking.form.name')} />

      <label>{t('booking.form.email')}</label>
      <input type="email" placeholder={t('booking.form.email')} />

      <button>{t('booking.form.submit')}</button>

      {errors.name && (
        <span>{t('validation.required')}</span>
      )}
    </form>
  );
}
```

### 5.4 Dynamic Formatting

```typescript
const t = useTranslations();

// Date/time formatting
const formatted = t('booking.confirmation.message', {
  date: new Date().toLocaleDateString(locale)
});

// Pluralization
const count = 5;
const message = t('items.count', { count }); // "5 items"
```

### 5.5 Crowdin Sync Workflow

```bash
# Extract translation keys from code
npm run i18n:extract

# Upload to Crowdin
crowdin upload sources --branch main

# Download translations
crowdin download --branch main

# Commit translations
git add locales/
git commit -m "i18n: sync translations from Crowdin"
```

---

## 6. SEO & META TAGS MANAGEMENT

### 6.1 Dynamic Metadata in Next.js

Cal.com uses `generateMetadata` for dynamic SEO:

```typescript
// app/[username]/[eventname]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: { username: string; eventname: string }
}): Promise<Metadata> {
  const event = await getEvent(params.username, params.eventname);

  return {
    title: `Book ${event.title} with ${params.username}`,
    description: event.description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1
      }
    },
    openGraph: {
      type: 'website',
      title: event.title,
      description: event.description,
      url: `https://cal.com/${params.username}/${params.eventname}`,
      images: [
        {
          url: event.image || `/api/og?event=${event.id}`,
          width: 1200,
          height: 630,
          alt: event.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: [event.image || `/api/og?event=${event.id}`]
    },
    alternates: {
      canonical: `https://cal.com/${params.username}/${params.eventname}`
    }
  };
}
```

### 6.2 Dynamic OG Image Generation

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get('event');
  const event = await getEvent(eventName);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 'bold', color: 'white' }}>
          {event.title}
        </div>
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.8)' }}>
          Book time with {event.organizer}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### 6.3 Canonical URLs & Multilingual Links

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cal.com';
  const currentPath = '/john/meeting'; // From params

  return {
    alternates: {
      canonical: `${baseUrl}${currentPath}`,
      languages: {
        'en-US': `${baseUrl}/en${currentPath}`,
        'es-ES': `${baseUrl}/es${currentPath}`,
        'fr-FR': `${baseUrl}/fr${currentPath}`,
        'x-default': `${baseUrl}${currentPath}`
      }
    }
  };
}
```

### 6.4 Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cal.com';

  // Fetch all public event pages
  const events = await getAllPublicEvents();

  const eventEntries = events.map(event => ({
    url: `${baseUrl}/${event.username}/${event.slug}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    ...eventEntries
  ];
}
```

---

## 7. ERROR HANDLING & RESILIENCE

### 7.1 Sentry Integration with Error Boundaries

Cal.com uses **Sentry with React Error Boundaries**:

```typescript
import * as Sentry from '@sentry/react';

const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }) => children,
  {
    fallback: <ErrorFallback />,
    showDialog: true, // Show user feedback dialog
    dialogOptions: {
      title: 'Oops, something went wrong',
      subtitle: 'Let us know what happened'
    }
  }
);

// Wrap component tree
export function Root() {
  return (
    <SentryErrorBoundary>
      <App />
    </SentryErrorBoundary>
  );
}
```

### 7.2 Granular Error Boundaries

Different boundaries for different sections:

```typescript
export function BookingPage() {
  return (
    <div>
      {/* Header never needs recovery */}
      <Header />

      {/* Calendar can fail independently */}
      <Sentry.ErrorBoundary
        fallback={<CalendarError />}
        showDialog={false}
      >
        <Calendar />
      </Sentry.ErrorBoundary>

      {/* Form can fail independently */}
      <Sentry.ErrorBoundary
        fallback={<FormError />}
      >
        <BookingForm />
      </Sentry.ErrorBoundary>
    </div>
  );
}
```

### 7.3 API Error Handling

```typescript
export async function submitBooking(data: BookingData) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();

      // Context-specific error messages
      if (response.status === 409) {
        throw new Error('Time slot already booked');
      }

      if (response.status === 422) {
        throw new ValidationError(error.validationErrors);
      }

      throw new Error(error.message || 'Booking failed');
    }

    return response.json();
  } catch (error) {
    // Report to Sentry with context
    Sentry.captureException(error, {
      tags: { feature: 'booking_form' },
      extra: { formData: data }
    });
    throw error;
  }
}
```

### 7.4 Fallback UI Components

```typescript
export function ErrorFallback({
  error,
  resetError
}: FallbackProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h2 className="font-semibold text-red-900">Something went wrong</h2>
      <p className="text-sm text-red-800 mt-2">{error.message}</p>
      <button
        onClick={resetError}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

export function SkeletonLoader() {
  return (
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
```

---

## 8. TESTING PATTERNS

### 8.1 Test Organization Structure

Cal.com uses organized test directories:

```
tests/
├── e2e/
│   ├── booking.spec.ts
│   ├── auth.spec.ts
│   └── fixtures/
│       ├── user.fixture.ts
│       └── event.fixture.ts
├── unit/
│   ├── utils/
│   │   └── format-date.test.ts
│   └── hooks/
│       └── use-booking-form.test.ts
├── pages/
│   ├── booking.page.ts
│   ├── dashboard.page.ts
│   └── auth.page.ts
├── shared/
│   ├── constants.ts
│   └── test-utils.ts
└── playwright.config.ts
```

### 8.2 Playwright E2E with Page Object Model

```typescript
// tests/pages/booking.page.ts
import { Page, expect } from '@playwright/test';

export class BookingPage {
  constructor(private page: Page) {}

  async goto(username: string, eventSlug: string) {
    await this.page.goto(`/${username}/${eventSlug}`);
  }

  async fillForm(data: {
    name: string;
    email: string;
    phone?: string;
  }) {
    await this.page.fill('[data-testid="name-input"]', data.name);
    await this.page.fill('[data-testid="email-input"]', data.email);

    if (data.phone) {
      await this.page.fill('[data-testid="phone-input"]', data.phone);
    }
  }

  async selectTime(timeSlot: string) {
    await this.page.click(`[data-testid="time-${timeSlot}"]`);
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-button"]');
  }

  async expectSuccess() {
    await expect(
      this.page.locator('[data-testid="success-message"]')
    ).toBeVisible();
  }

  async getErrorMessage() {
    return this.page.textContent('[data-testid="error-message"]');
  }
}

// tests/e2e/booking.spec.ts
import { test, expect } from '@playwright/test';
import { BookingPage } from '../pages/booking.page';

test.describe('Booking Flow', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
    await bookingPage.goto('john', '30min-meeting');
  });

  test('should complete booking successfully', async () => {
    await bookingPage.fillForm({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0123'
    });

    await bookingPage.selectTime('14:00');
    await bookingPage.submitForm();

    await bookingPage.expectSuccess();
  });

  test('should show validation errors', async () => {
    await bookingPage.fillForm({
      name: '',
      email: 'invalid-email'
    });

    await bookingPage.submitForm();

    const error = await bookingPage.getErrorMessage();
    expect(error).toContain('required');
  });
});
```

### 8.3 Fixtures for Shared Setup

```typescript
// tests/fixtures/user.fixture.ts
import { test as base, expect } from '@playwright/test';

type UserFixture = {
  user: {
    email: string;
    password: string;
    login: () => Promise<void>;
  };
};

export const test = base.extend<UserFixture>({
  user: async ({ page }, use) => {
    const user = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      login: async () => {
        await page.goto('/login');
        await page.fill('[name="email"]', user.email);
        await page.fill('[name="password"]', user.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
      }
    };

    await use(user);

    // Cleanup: logout
    await page.goto('/logout');
  }
});
```

### 8.4 Vitest Unit Tests

```typescript
// src/utils/format-date.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { formatDate, formatTime } from './format-date';

describe('formatDate', () => {
  const testDate = new Date('2026-03-15T14:30:00Z');

  it('should format date as MM/DD/YYYY', () => {
    expect(formatDate(testDate)).toBe('03/15/2026');
  });

  it('should handle locale-specific formatting', () => {
    expect(formatDate(testDate, 'es-ES')).toBe('15/3/2026');
  });

  it('should throw for invalid dates', () => {
    expect(() => formatDate(new Date('invalid'))).toThrow();
  });
});

describe('formatTime', () => {
  it('should format time in 24-hour format', () => {
    const time = new Date('2026-03-15T14:30:00Z');
    expect(formatTime(time, '24h')).toBe('14:30');
  });

  it('should format time in 12-hour format with AM/PM', () => {
    const time = new Date('2026-03-15T14:30:00Z');
    expect(formatTime(time, '12h')).toBe('2:30 PM');
  });
});
```

### 8.5 Custom Hook Testing

```typescript
// src/hooks/use-booking-form.test.ts
import { renderHook, act } from '@testing-library/react';
import { useBookingForm } from './use-booking-form';

describe('useBookingForm', () => {
  it('should initialize with empty form', () => {
    const { result } = renderHook(() => useBookingForm());

    expect(result.current.form.getValues()).toEqual({
      name: '',
      email: '',
      phone: ''
    });
  });

  it('should validate form on submit', async () => {
    const { result } = renderHook(() => useBookingForm());

    await act(async () => {
      await result.current.form.handleSubmit(
        () => {},
        (errors) => {
          expect(errors.name?.message).toBe('Name required');
        }
      )();
    });
  });

  it('should submit valid form', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useBookingForm({ onSubmit }));

    await act(async () => {
      result.current.form.setValue('name', 'John Doe');
      result.current.form.setValue('email', 'john@example.com');
      await result.current.form.handleSubmit(onSubmit)();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com'
      })
    );
  });
});
```

---

## 9. MAPPING CAL.COM PATTERNS TO WELL

### 9.1 UI Component Library → Aura Elite

| Cal.com Pattern | Well Implementation |
|-----------------|-------------------|
| **Primitives (Base UI)** | Core shadcn/ui + custom wrappers |
| **Particles (pre-composed)** | Dashboard cards, panels, modals |
| **Atoms (customizable)** | Agent chat widget, health metrics |
| **Design tokens** | Aura Elite color/spacing/typography |
| **Accessibility** | WCAG 2.1 AA via shadcn/ui + manual ARIA |

### 9.2 Embed System → Agent Chat Widget

| Feature | Implementation |
|---------|-----------------|
| **Iframe embed** | `<AgentChatEmbed url="..." />` |
| **postMessage protocol** | Parent ↔ iframe communication |
| **Query params** | `?userId=123&theme=dark` |
| **React component** | `<AgentChat />` (no iframe) |
| **Customization** | Tailwind theme overrides |

### 9.3 Form Validation → Booking Flow

| Aspect | Well's Approach |
|--------|-----------------|
| **Schema** | Zod for all forms (health metrics, preferences) |
| **Dynamic fields** | useFieldArray for health history |
| **Validation** | React Hook Form + Zod resolver |
| **Conditional visibility** | watch() + computed logic |
| **Custom validation** | refine() for cross-field checks |

### 9.4 i18n → Vietnamese/English Support

| Feature | Well's Setup |
|---------|--------------|
| **Translation key structure** | `dashboard.health.metrics.*` |
| **Provider** | next-intl (already integrated) |
| **Namespaces** | Split by feature (agents, health, settings) |
| **Formatting** | Locale-aware dates/numbers |
| **Crowdin** | Optional future integration |

### 9.5 Testing → 349+ Test Suite

| Layer | Approach |
|-------|----------|
| **E2E** | Playwright + Page Object Model |
| **Component** | Vitest + React Testing Library |
| **Unit** | Vitest for utilities, hooks |
| **Fixtures** | Shared test data, authenticated users |
| **Organization** | tests/{e2e,unit,pages,fixtures}/ |

---

## 10. KEY INSIGHTS & RECOMMENDATIONS

### 10.1 Critical Design Patterns

1. **Compound components** — Flexibility without sacrificing usability (Cal.com Pattern #1)
2. **Schema-driven forms** — Single source of truth for validation & types (Zod)
3. **Optimistic UI** — Perceived performance (Zustand store mutations)
4. **Error boundaries** — Graceful degradation per section (Sentry integration)
5. **Page Object Model** — Maintainable E2E tests (Playwright)

### 10.2 Well-Specific Opportunities

| Opportunity | Rationale | Impact |
|-------------|-----------|--------|
| Extract `<HealthMetricCard>` as compound | Reuse across dashboard | 30% code reduction |
| Embed agent chat widget | White-label opportunity | Revenue stream |
| Dynamic health form builder | Support custom metrics | Flexibility |
| Sentry error tracking | Proactive bug detection | UX improvement |
| Playwright E2E coverage | Critical flows (booking, chat) | Confidence |

### 10.3 i18n Sync Protocol (CRITICAL)

**Implementation Rule (already in Well):**
- Every `t('key')` call MUST exist in `vi.ts` AND `en.ts`
- Grep search before commit: `grep -ro "t('[^']*')" src/`
- Compare against translation files
- **Bug precedent:** Raw keys showed on production when keys mismatched

### 10.4 Accessibility Compliance

Well should target **WCAG 2.1 AA** like Cal.com:
- Keyboard navigation (Tab, Arrow, Escape)
- Focus management (modals, popups)
- ARIA attributes (role, aria-label, aria-expanded)
- Color contrast (≥4.5:1)
- Semantic HTML (headings, form labels)

---

## 11. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Weeks 1-2)
- [ ] Audit existing components against Cal.com patterns
- [ ] Document Aura Elite design tokens in Tailwind config
- [ ] Set up Sentry integration with error boundaries
- [ ] Organize test structure (E2E, unit, fixtures)

### Phase 2: Forms & Validation (Weeks 3-4)
- [ ] Implement schema-driven form architecture (Zod)
- [ ] Build dynamic field renderer with useFieldArray
- [ ] Add cross-field validation (refine patterns)
- [ ] Write form unit tests (Vitest)

### Phase 3: Embed & Real-time (Weeks 5-6)
- [ ] Design postMessage protocol for agent chat widget
- [ ] Implement Zustand store for optimistic updates
- [ ] Build agent chat embed iframe
- [ ] E2E test embed communication (Playwright)

### Phase 4: i18n & SEO (Weeks 7-8)
- [ ] Audit all t() calls against translation files
- [ ] Set up dynamic metadata (generateMetadata)
- [ ] Implement OG image generation
- [ ] Add sitemap + canonical URLs
- [ ] Create Crowdin workflow (optional)

### Phase 5: Testing & Polish (Weeks 9-10)
- [ ] Achieve 80%+ test coverage (349 tests)
- [ ] Run full Playwright suite against staging
- [ ] Accessibility audit (axe, Lighthouse)
- [ ] Performance profiling (Core Web Vitals)

---

## UNRESOLVED QUESTIONS

1. **Agent Chat Widget Customization:** How granular should theme overrides be? (CSS variables vs. prop API?)
2. **Real-time Presence:** Is presence tracking needed for health coaching? (Multi-user scenario unclear)
3. **Crowdin Integration:** Should Well integrate Crowdin now or wait for product maturity?
4. **Embed Revenue Model:** White-label agent chat widget pricing strategy?
5. **Sentry Sampling:** What's the optimal error sampling rate for cost management?

---

## SOURCES

- [Cal.com UI Architecture - coss.com ui](https://www.productcool.com/product/coss-com-ui)
- [Cal.com Embed Documentation](https://cal.com/embed)
- [Cal.com Help - Embedding](https://cal.com/help/embedding/adding-embed)
- [Cal.com GitHub Repository](https://github.com/calcom/cal.com)
- [React Hook Form + Zod Integration](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)
- [Dynamic Forms with Zustand + React Hook Form](https://medium.com/@rahulshukla_9187/dynamic-forms-in-react-with-zustand-react-hook-form-zod-c866cb4f7a69)
- [React 19 useOptimistic](https://codefinity.com/blog/React-19-useOptimistic)
- [Sentry React Error Boundaries](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
- [Next.js SEO & Metadata Guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Playwright Page Object Model](https://playwright.dev/docs/pom)
- [Playwright Best Practices](https://frontends.shopware.com/best-practices/testing/e2e-testing.html)
- [React Aria Accessibility](https://react-spectrum.adobe.com/react-aria/index.html)
- [shadcn/ui with Glassmorphism](https://ui.shadcn.com/)

---

**Report Generated:** 2026-03-01 10:40 UTC
**Duration:** ~15 min research + analysis
**Token Usage:** ~47K (research + synthesis)
