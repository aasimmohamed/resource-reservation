# Resource Reservation Management System

A web app for managing shared organizational resources (meeting rooms, halls, vehicles, equipment) and reserving them without double bookings.

Built for the PrimeWave Lab Software Engineering Internship technical assessment.

## The problem

Reservations were handled through informal communication and manual records, which caused scheduling confusion, overlapping bookings, and uncertainty about availability. This app centralizes resources and reservations, makes availability visible, and prevents conflicts.

## Features

- **Resources:** create, edit, and deactivate (name, type, location, capacity, description)
- **Reservations:** book a resource for a time range, view upcoming and past bookings, cancel
- **Conflict prevention:** overlapping bookings for the same resource are rejected
- **Availability:** a day view with a timeline per resource, plus day navigation and date picker
- **Dashboard:** active resources, bookings today, upcoming bookings, and utilization per resource for the last 30 and next 7 days
- **Validation:** server-side checks for all inputs, with clear error messages

## Tech stack

- Next.js (App Router) and TypeScript
- PostgreSQL with Prisma ORM (v6)
- Zod for validation
- Tailwind CSS for styling

## Getting started

### Prerequisites

- Node.js 20 or later
- PostgreSQL 14 or later, running locally

### Setup

1. Clone the repository and install dependencies:

```bash
   git clone https://github.com/aasimmohamed/resource-reservation.git
   cd resource-reservation
   npm install
```

2. Create the database:

```bash
   psql -U postgres -c "CREATE DATABASE resource_reservation;"
```

3. Create your environment file and set your PostgreSQL password:

```bash
   cp .env.example .env
```

4. Apply the database migrations (this creates the tables and the no-overlap constraint):

```bash
   npx prisma migrate deploy
```

5. Load sample data (optional but recommended):

```bash
   npx prisma db seed
```

6. Start the app:

```bash
   npm run dev
```

   Open http://localhost:3000.

## Key design decisions

**Double booking is prevented in the database.** The app checks for conflicts first, to show a friendly message. The real guarantee is a PostgreSQL exclusion constraint on `reservations`, which rejects any two confirmed reservations for the same resource whose time ranges overlap. Because the database enforces it, it holds even when two people submit at the same instant, which an app-only check cannot guarantee. Cancelled reservations do not block a slot, and back-to-back bookings (one ending when the next starts) are allowed.

**Times are stored in UTC** using `timestamptz`, and displayed in the local time zone.

**Soft delete instead of hard delete.** Resources are deactivated and reservations are cancelled, so booking history is never lost.

**Server-side validation.** All input is validated with Zod on the server, because browser-side checks can be bypassed. Rules include: end after start, no bookings in the past, a 24-hour maximum, and unique resource names.

**Indexes** on `reservations (resource_id, start_time, end_time)` and `(user_id)` keep availability lookups fast as data grows.

**Server Components and Server Actions.** Pages query the database directly on the server, and forms submit to server actions, so no separate API layer is needed.

## Project structure

```
prisma/               schema, migrations, seed script
src/app/              pages (dashboard, availability, resources, reservations)
src/components/       shared UI (nav bar, page header)
src/lib/              database client and theme helpers
```

## Assumptions and limitations

- There is no login. "Booked by" is chosen from a list of users. Authentication with admin and member roles is the first thing I would add next.
- The dashboard assumes 10 bookable hours per day when calculating utilization (one constant in `src/app/page.tsx`).
- Dashboard statistics are calculated in application code, which is fine at this scale. At larger scale they would move into SQL aggregates.

## Future improvements

- Authentication and role-based access (admins manage resources, members book)
- Recurring reservations
- Email notifications and reminders
- Per-resource opening hours
- Automated tests for the booking rules