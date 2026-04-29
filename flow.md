# Airline Management System - Complete Project Flow (Frontend + Backend + DB)

## 1) Project Purpose and Runtime Architecture

This project is a full-stack airline booking system with:

- Frontend: React + TypeScript (Vite), route-based UI
- Backend: Node.js + Express, REST APIs
- Database: MySQL (relational schema in `queries.sql`)

High-level runtime path for almost every user action:

1. User clicks/input on frontend page.
2. Page/component executes `fetch(...)` to backend endpoint.
3. Express route validates input, executes one or more SQL queries.
4. DB returns rows / writes data.
5. Backend returns JSON.
6. Frontend updates component state and rerenders UI.

---

## 2) Bootstrap and Core Wiring

### Frontend boot

- `src/main.tsx:1-5`
  - Mounts `<App />` into DOM root.

- `src/app/App.tsx:20-138`
  - `DashboardRedirect` sends admins to admin dashboard and passengers to passenger dashboard.
  - App wraps routes in `AuthProvider` and `DataProvider` (`src/app/App.tsx:37-38`).
  - `ProtectedRoute` guards role-based pages.

- `src/app/components/ProtectedRoute.tsx:9-19`
  - If not authenticated -> `/login`.
  - If role mismatch -> `/dashboard`.

- `src/app/components/Layout.tsx:34-49`
  - Nav menu differs by role (`passengerNavItems` vs `adminNavItems`).
  - `handleLogout` clears auth state and navigates to `/login` (`src/app/components/Layout.tsx:29-31`).

### Backend boot

- `backend/db.js:9-17`
  - Creates mysql pool.
- `backend/db.js:26-33`
  - `testConnection()` runs `connection.ping()` before server starts.

- `backend/server.js:73`
  - Loads `.env` from backend folder.
- `backend/server.js:79-81`
  - `cors`, `bodyParser.json`, `bodyParser.urlencoded` enabled.
- `backend/server.js:90`
  - Health route `GET /health`.
- `backend/server.js:95-99`
  - Mounts routes: flights, auth, booking, payment, admin.
- `backend/server.js:102-114`
  - 404 and global error middleware.
- `backend/server.js:123-125`
  - Calls `testConnection()`, then `app.listen`.

---

## 3) Database Schema and Relationships

Source of truth used by runtime code: `queries.sql`.

### Schema init

- `queries.sql:5` drop DB if exists
- `queries.sql:6` create DB
- `queries.sql:7` use DB

### Core tables (with where defined)

- `airline` (`queries.sql:12`)
- `airport` (`queries.sql:29`)
- `aircraft` (`queries.sql:50`, FK to airline at `queries.sql:57`)
- `flight` (`queries.sql:70`, FKs at `queries.sql:84-86`)
- `passenger` (`queries.sql:99`)
- `booking` (`queries.sql:119`, FKs at `queries.sql:126-127`)
- `booking_seat` (`queries.sql:138`, FKs at `queries.sql:143-144`)
- `payment` (`queries.sql:155`, FK at `queries.sql:160`)
- `user` (admin credentials, `queries.sql:171`)

### Seed data

- Seed `INSERT` statements are present for all tables (`queries.sql:19, 37, 60, 89, 111, 130, 147, 163, 178`).

---

## 4) Frontend Pages and Exact Behaviors (Buttons, Inputs, Side Effects)

## 4.1 Login Page

File: `src/app/pages/Login.tsx`

- Submit button (`handleSubmit`, `src/app/pages/Login.tsx:14`)
  - Calls `useAuth().login(email, password)`.
  - Success -> `navigate('/dashboard')` (`src/app/pages/Login.tsx:22`).
  - Failure -> sets error UI message.

- Register link button (`src/app/pages/Login.tsx:92`)
  - Navigates to `/register`.

Auth request details:

- Request is sent in `src/app/context/AuthContext.tsx:26` to `POST /login`.
- On valid response, `setUser(...)` at `src/app/context/AuthContext.tsx:48`.

DB/Backend on login:

- `backend/routes/auth.js:169` query admin table first.
- `backend/routes/auth.js:187` query passenger table second.

---

## 4.2 Register Page

File: `src/app/pages/Register.tsx`

- Register submit (`src/app/pages/Register.tsx:20`)
  - Client-side checks required fields + phone length.
  - Calls `POST /register` (`src/app/pages/Register.tsx:39`).
  - On success -> navigate `/login` (`src/app/pages/Register.tsx:62`).

- Sign In button (`src/app/pages/Register.tsx:221`)
  - Navigate `/login`.

Backend/DB path:

- Route: `backend/routes/auth.js:8`.
- Query 1: email duplicate check at `backend/routes/auth.js:28`.
- Query 2: manual next passenger id at `backend/routes/auth.js:38`.
- Query 3: insert passenger row at `backend/routes/auth.js:45`.

Reasoning:

- Duplicate prevention, deterministic ID creation, final persistence.

---

## 4.3 Passenger Dashboard

File: `src/app/pages/PassengerDashboard.tsx`

- On mount (`useEffect`, `src/app/pages/PassengerDashboard.tsx:20`):
  - Fetch `GET /passenger-dashboard/:passenger_id` (`src/app/pages/PassengerDashboard.tsx:23`).

- Buttons:
  - View All upcoming bookings -> `/bookings` (`src/app/pages/PassengerDashboard.tsx:107`)
  - Book a Flight -> `/flights` (`src/app/pages/PassengerDashboard.tsx:119`)
  - Quick Actions:
    - Search Flights (`src/app/pages/PassengerDashboard.tsx:158`)
    - My Bookings (`src/app/pages/PassengerDashboard.tsx:165`)
    - Payment History (`src/app/pages/PassengerDashboard.tsx:172`)

Backend/DB route:

- Route at `backend/routes/booking.js:395`.
- SQL count bookings: `backend/routes/booking.js:405`.
- SQL sum spend (confirmed + active flight/airports): `backend/routes/booking.js:411`.
- SQL upcoming flights: `backend/routes/booking.js:428`.

Reasoning:

- Dashboard KPIs and recent itinerary need aggregated and filtered data.

---

## 4.4 Flights Search Page

File: `src/app/pages/Flights.tsx`

- On mount fetch all flights: `src/app/pages/Flights.tsx:16-17` (`GET /flights`).
- Search inputs for source and destination update local filters only.
- Search button is visual; filtering is already reactive based on state.
- Book button (`src/app/pages/Flights.tsx:139`) calls `handleBookFlight`, navigates to `/book/:flightId` (`src/app/pages/Flights.tsx:45`).

Backend/DB route:

- Route `GET /flights` in `backend/routes/flights.js:36`.
- Main SQL join query in `backend/routes/flights.js:8`.

Reasoning:

- Build a rich flight card with flight + aircraft + airline + airport data.
- `WHERE f.status='ACTIVE'` ensures soft-deleted flights are hidden.

---

## 4.5 Book Flight (multi-step booking + payment)

File: `src/app/pages/BookFlight.tsx`

Step flow:

1. Details step
- On mount fetch flight list and select one by route param (`src/app/pages/BookFlight.tsx:30-35`).
- Also fetch booked seats from `GET /booked-seats/:flight_id` (`src/app/pages/BookFlight.tsx:41-42`).
- Continue button to seat selection (`src/app/pages/BookFlight.tsx:298`).

2. Seats step
- Seat button click -> `handleSeatClick` (`src/app/pages/BookFlight.tsx:315`).
- Next button to review (`src/app/pages/BookFlight.tsx:332`).

3. Review step
- Back to seats (`src/app/pages/BookFlight.tsx:417`).
- Proceed to payment (`src/app/pages/BookFlight.tsx:425`).

4. Payment step
- Complete Payment triggers `handlePayment` (`src/app/pages/BookFlight.tsx:506`, function starts at line 108).

5. Success step
- Book Another Flight (`src/app/pages/BookFlight.tsx:574`) -> `/flights`.
- View My Bookings (`src/app/pages/BookFlight.tsx:581`) -> `/my-bookings/:userId`.

### What `handlePayment` does exactly

- Frontend safety checks for card/UPI, selected seats, logged-in user.
- Calls `POST /booking` first (`src/app/pages/BookFlight.tsx:161`).
- If booking succeeds, calls `POST /payment` (`src/app/pages/BookFlight.tsx:191`).
- On both success -> show success screen and booking id.

### Backend + DB for booking call

Route: `backend/routes/booking.js:177`

Queries in order and why:

1. `SELECT passenger_id FROM Passenger WHERE passenger_id=?` (`backend/routes/booking.js:187`)
- Reason: reject invalid passenger.

2. Begin transaction (`backend/routes/booking.js:222`)
- Reason: keep seat lock, booking insert, and inventory update atomic.

3. `SHOW COLUMNS FROM Booking LIKE 'class'` (`backend/routes/booking.js:224`)
- Reason: schema compatibility check.

4. `SELECT available_seats FROM Flight ... FOR UPDATE` (`backend/routes/booking.js:229`)
- Reason: row lock to prevent overbooking race.

5. `SELECT seat_no FROM Booking_Seat WHERE flight_id=? AND seat_no IN (...)` (`backend/routes/booking.js:248`)
- Reason: seat conflict detection.

6. Insert booking (`backend/routes/booking.js:269`)
- Reason: create booking parent row.

7. Bulk insert into booking-seat (`backend/routes/booking.js:284`)
- Reason: persist selected seats.

8. `UPDATE Flight SET available_seats = available_seats - ?` (`backend/routes/booking.js:289`)
- Reason: inventory decrement.

9. Commit (`backend/routes/booking.js:294`) or rollback on any error (`backend/routes/booking.js:303`).

### Backend + DB for payment call

Route: `backend/routes/payment.js:92`

Queries in order and why:

1. Begin transaction (`backend/routes/payment.js:114`)
2. `SELECT booking_id FROM Booking WHERE booking_id=? FOR UPDATE` (`backend/routes/payment.js:116`)
- Reason: lock target booking row.
3. `INSERT INTO Payment (method, status, booking_id)` (`backend/routes/payment.js:126`)
- Reason: record payment row.
4. `UPDATE Booking SET status=? WHERE booking_id=?` (`backend/routes/payment.js:133`)
- Reason: move booking to CONFIRMED or PAYMENT_FAILED.
5. Commit (`backend/routes/payment.js:138`) / rollback (`backend/routes/payment.js:147`).

Status mapping function:

- `deriveBookingStatus` in `backend/routes/payment.js:7-13`.
- `SUCCESS | COMPLETED | PAID` => `CONFIRMED`.

---

## 4.6 My Bookings Page

File: `src/app/pages/MyBookings.tsx`

- On mount fetch bookings (`src/app/pages/MyBookings.tsx:185, 190`) from `GET /my-bookings/:passenger_id`.
- Cancel Booking button (`src/app/pages/MyBookings.tsx:371`) -> `handleCancelBooking` (`src/app/pages/MyBookings.tsx:382`) -> `POST /cancel-booking/:booking_id` (`src/app/pages/MyBookings.tsx:386`).

UI grouping logic:

- Computes `upcoming`, `past`, `cancelled`, `deleted flights` buckets.
- Marks deleted/cancelled combinations using `flight_status`, airport statuses, and missing airline.

Backend routes:

- `GET /my-bookings/:passenger_id` at `backend/routes/booking.js:312`.
  - Main join query at `backend/routes/booking.js:321`.
- `POST /cancel-booking/:booking_id` at `backend/routes/booking.js:376`.
  - SQL update at `backend/routes/booking.js:385`.

Reasoning:

- Preserve booking history while allowing cancellation by status change.

---

## 4.7 My Payments Page

File: `src/app/pages/MyPayments.tsx`

- On mount (`src/app/pages/MyPayments.tsx:14`) fetches `GET /payments/:passenger_id` (`src/app/pages/MyPayments.tsx:17`).
- Builds UI status:
  - If booking cancelled or flight inactive -> display `Refunded`.
  - Else based on payment status map.

Backend route:

- `GET /payments/:passenger_id` at `backend/routes/payment.js:156`.
- SQL join query at `backend/routes/payment.js:165`.

Reasoning:

- Payment rows need booking and flight context to display refunded business state.

---

## 4.8 Admin Dashboard

File: `src/app/pages/AdminDashboard.tsx`

- On mount (`src/app/pages/AdminDashboard.tsx:230`) calls in parallel:
  - `GET /admin-stats` (`line 232`)
  - `GET /airlines` (`line 233`)
  - `GET /airports` (`line 234`)
  - `GET /admin-analytics` (`line 235`)

- Quick action cards navigate to admin feature pages (`src/app/pages/AdminDashboard.tsx:422`).

Backend routes + key queries:

- `/admin-stats` (`backend/routes/admin.js:531`)
  - count bookings (`line 534`)
  - confirmed revenue (`line 538`)
  - passenger count (`line 542`)
  - active flights count (`line 546`)

- `/airlines` (`backend/routes/admin.js:720`, SQL at line 723)
- `/airports` (`backend/routes/admin.js:774`, SQL at line 777)
- `/admin-analytics` (`backend/routes/admin.js:811`, SQL at lines 815 and 821)

---

## 4.9 Manage Flights (Admin)

File: `src/app/pages/admin/ManageFlights.tsx`

### Read paths

- Fetch flights list (`line 70`) -> `GET /flights`.
- Fetch airlines + active airports (`lines 87-88`) -> `GET /airlines`, `GET /active-airports`.
- Fetch aircraft by airline (`line 197` and line 260) -> `GET /aircrafts/:airline_id`.

### Buttons and actions

- Add Flight button opens modal (`line 461`).
- Submit add/update form (`handleSubmit` at line 345, fetch at line 404):
  - POST `/add-flight` or PUT `/update-flight/:id`.
- Edit button (`line 769`) pre-fills form and toggles edit mode.
- Delete button (`line 770`) calls `DELETE /delete-flight/:id` via `handleDelete` (`line 273`, fetch at 279).

Backend side:

- Add flight route `backend/routes/admin.js:145`.
  - duplicate-flight conflict check at `line 206`.
  - manual flight id generation at `line 221`.
  - insert at `line 228`.

- Update flight route `backend/routes/admin.js:313`.
  - update SQL at `line 353`.

- Delete flight (soft delete) route `backend/routes/admin.js:420`.
  - set flight INACTIVE at `line 431`.
  - cancel related bookings at `line 442`.

Reasoning:

- Admin deletes are soft deletes to preserve history and align with booking visibility logic.

---

## 4.10 Manage Airlines (Admin)

File: `src/app/pages/admin/ManageAirlines.tsx`

Read/actions:

- Initial fetch airlines (`line 41`) and per-airline aircraft (`line 54`).
- Add airline submit (`handleSubmit` line 113):
  - POST `/add-airline` (`line 173`)
  - then POST `/add-aircraft` for each aircraft (`line 193`).

Backend:

- Add airline route at `backend/routes/admin.js:560`.
  - duplicate check `line 586`
  - transaction start `line 604`
  - code uniqueness check loop `line 610`
  - insert airline `line 623`
  - insert aircraft list `line 640`
  - commit/rollback `line 647/654`

- Add aircraft standalone route at `backend/routes/admin.js:667`.
  - insert at `line 708`.

Reasoning:

- Airline + aircraft setup is normalized and supports one-to-many.

---

## 4.11 Manage Airports (Admin)

File: `src/app/pages/admin/ManageAirports.tsx`

Actions:

- Fetch airports list (`line 30`) from `/airports`.
- Add/update submit (`handleSubmit` line 95, fetch at 118):
  - POST `/add-airport` or PUT `/update-airport/:airport_code`.
- Delete airport (`line 72`, fetch at line 78) -> `DELETE /delete-airport/:code`.

Backend:

- Update airport route at `backend/routes/admin.js:301` (update SQL at line 305).
- Add airport route at `backend/routes/admin.js:731`.
  - existing code/status check line 745
  - restore inactive airport line 754
  - insert new airport line 765
- Delete airport route at `backend/routes/admin.js:386`.
  - soft delete airport line 390
  - set related flights INACTIVE line 401
  - set related bookings CANCELLED line 407

Reasoning:

- Airport deletion cascades to flight and booking status to keep business state consistent.

---

## 4.12 All Bookings (Admin)

File: `src/app/pages/admin/AllBookings.tsx`

Actions:

- Fetch all bookings (`line 37`) -> `/all-bookings`.
- Fetch booking stats by airline (`line 58`) -> `/booking-stats`.
- UI search and status filter are local memory operations.

Backend:

- `/all-bookings` at `backend/routes/admin.js:452`, SQL at `line 455`.
- `/booking-stats` at `backend/routes/admin.js:489`, SQL at `line 492`.

Reasoning:

- Admin gets both row-level booking list and grouped summary metrics.

---

## 4.13 Analytics Page (Not routed in current app)

File exists: `src/app/pages/admin/Analytics.tsx`.

- Uses `DataContext` (in-memory sample data), not backend fetch.
- Not mounted in `App.tsx` route table.

Impact:

- This page does not currently affect runtime DB/backend behavior.

---

## 5) Backend API Inventory with Query Purpose

### Auth APIs (`backend/routes/auth.js`)

1. `POST /register` (`line 8`)
- `SELECT email_id ...` (`line 28`) -> duplicate email check
- `SELECT MAX(passenger_id)` (`line 38`) -> manual id generation
- `INSERT INTO passenger ...` (`line 45`) -> persist user

2. `POST /signup` (`line 69`)
- Transactional variant with:
  - duplicate email (`line 95`)
  - next id (`line 105`)
  - insert passenger (`line 111`)

3. `POST /login` (`line 159`)
- admin table check (`line 169`)
- passenger table check (`line 187`)

### Flights APIs (`backend/routes/flights.js`)

1. `GET /flights` (`line 36`)
- Big join select (`line 8`) for active flights.

2. `GET /booked-seats/:flight_id` (`line 61`)
- booked seats list (`line 70`).

3. `GET /seats/:flight_id` (`line 79`)
- alternate seat payload query (`line 88`).

### Booking APIs (`backend/routes/booking.js`)

1. `POST /booking` (`line 177`)
- passenger existence (`line 187`)
- transaction start (`line 222`)
- class column check (`line 224`)
- row lock (`line 229`)
- seat conflict (`line 248`)
- insert booking (`line 269`)
- insert booking seats (`line 284`)
- decrement inventory (`line 289`)
- commit/rollback (`line 294/303`)

2. `GET /my-bookings/:passenger_id` (`line 312`)
- joined booking detail query (`line 321`)

3. `POST /cancel-booking/:booking_id` (`line 376`)
- status update cancel (`line 385`)

4. `GET /passenger-dashboard/:passenger_id` (`line 395`)
- count bookings (`line 405`)
- sum spend (`line 411`)
- upcoming flights (`line 428`)

### Payment APIs (`backend/routes/payment.js`)

1. `POST /payment` (`line 92`)
- transaction start (`line 114`)
- lock booking (`line 116`)
- insert payment (`line 126`)
- update booking status (`line 133`)
- commit/rollback (`line 138/147`)

2. `GET /payments/:passenger_id` (`line 156`)
- joined payment list (`line 165`)

### Admin APIs (`backend/routes/admin.js`)

- `POST /add-flight` (`line 145`)
- `GET /admin-flights` (`line 271`)
- `PUT /update-airport/:airport_code` (`line 301`)
- `PUT /update-flight/:id` (`line 313`)
- `DELETE /delete-airport/:code` (`line 386`)
- `DELETE /delete-flight/:id` (`line 420`)
- `GET /all-bookings` (`line 452`)
- `GET /booking-stats` (`line 489`)
- `GET /all-payments` (`line 509`)
- `GET /admin-stats` (`line 531`)
- `POST /add-airline` (`line 560`)
- `POST /add-aircraft` (`line 667`)
- `GET /airlines` (`line 720`)
- `POST /add-airport` (`line 731`)
- `GET /airports` (`line 774`)
- `GET /active-airports` (`line 784`)
- `GET /aircrafts/:airline_id` (`line 795`)
- `GET /admin-analytics` (`line 811`)

---

## 6) Query Dependency Graph (How Queries Relate)

### Registration -> Login -> Booking -> Payment

1. Register inserts into `passenger`.
2. Login checks `user` (admin) else `passenger`.
3. Booking inserts into `booking` and `booking_seat`, updates `flight.available_seats`.
4. Payment inserts into `payment`, updates `booking.status`.
5. MyBookings/MyPayments join these tables for user-visible history.

### Airport/Flight soft-delete cascade

1. Deleting airport sets `airport.status='INACTIVE'`.
2. Related flights set `flight.status='INACTIVE'`.
3. Related bookings set `booking.status='CANCELLED'`.
4. Frontend pages mark flights as cancelled/deleted or refunded.

### Airline/Aircraft/Flight relationship

1. Add airline inserts airline.
2. Add aircraft inserts one or more aircraft tied by `airline_id`.
3. Add flight references `aircraft_id`.
4. Flight listing joins back to airline through aircraft.

---

## 7) End-to-End Test Cases (Frontend + Backend + DB Expected Outcome)

## Legend

- FE: user-visible frontend behavior
- BE: backend response/logic
- DB: table-level effects

1. Valid passenger login
- Input: valid passenger email/password on Login page.
- FE: navigates to `/dashboard` passenger view.
- BE: `/login` returns `role: passenger`.
- DB: read-only query against `Passenger`.

2. Invalid login
- Input: wrong password.
- FE: error banner shown.
- BE: 401 Invalid credentials.
- DB: no writes.

3. Register with existing email
- Input: same email as existing passenger.
- FE: error shown.
- BE: 400 Email already exists.
- DB: duplicate-check select only.

4. Successful register
- FE: redirected to login.
- BE: 200 with `passenger_id`.
- DB: one new row in `passenger`.

5. Dashboard load for passenger
- FE: stats cards + upcoming trips show data.
- BE: `/passenger-dashboard/:id` aggregates metrics.
- DB: count/sum/select from `booking`+`flight`+`airport`.

6. Flights page load
- FE: active flights list shown.
- BE: `/flights` returns joined rows.
- DB: select join with `WHERE f.status='ACTIVE'`.

7. Book button navigation
- FE: goes to `/book/:flightId`.
- BE: no call at click itself beyond route change.
- DB: none.

8. BookFlight initial load
- FE: seat map disables booked seats.
- BE: `/flights` + `/booked-seats/:id`.
- DB: select from `flight` and `booking_seat`.

9. Try booking without seats
- FE: validation alert/error.
- BE: booking API not called (or fails if forced).
- DB: no writes.

10. Successful booking + payment
- FE: success step with booking id.
- BE: `/booking` then `/payment` both success.
- DB:
  - insert booking
  - insert booking_seat rows
  - decrement flight.available_seats
  - insert payment
  - update booking.status CONFIRMED

11. Seat conflict booking
- FE: payment error shown.
- BE: `/booking` 409 with conflicting seats.
- DB: transaction rolled back, no new rows.

12. Over-capacity booking
- FE: error from backend.
- BE: `/booking` rejects insufficient seats.
- DB: no writes.

13. Payment with invalid booking_id
- FE: payment error.
- BE: `/payment` returns 404 Booking not found.
- DB: no writes.

14. Cancel booking from My Bookings
- FE: booking card status changes to Cancelled.
- BE: `/cancel-booking/:id` updates status.
- DB: `booking.status='CANCELLED'`.

15. My Payments load
- FE: payment table + refunded amount calculation.
- BE: `/payments/:passenger_id` joined rows.
- DB: read `payment` + `booking` + `flight`.

16. Admin add airport new code
- FE: airport appears in list.
- BE: `/add-airport` insert.
- DB: new row in `airport` ACTIVE.

17. Admin add airport existing inactive code
- FE: success message, airport restored.
- BE: `/add-airport` restore path.
- DB: `airport.status` toggled to ACTIVE.

18. Admin delete airport
- FE: airport removed from active list; related flights/bookings later appear cancelled.
- BE: `/delete-airport/:code` soft-delete cascade.
- DB:
  - airport -> INACTIVE
  - matching flights -> INACTIVE
  - matching bookings -> CANCELLED

19. Admin add flight with past departure
- FE: alert with backend error.
- BE: `/add-flight` returns 400.
- DB: no insert.

20. Admin delete flight
- FE: flight disappears from active lists.
- BE: `/delete-flight/:id`.
- DB:
  - flight.status INACTIVE
  - booking.status CANCELLED for that flight

21. Admin add airline with aircraft
- FE: new airline and aircraft visible.
- BE: `/add-airline` then `/add-aircraft`.
- DB: new airline row + one/more aircraft rows.

22. Admin dashboard load
- FE: stats and charts rendered.
- BE: uses 4 APIs in parallel.
- DB: aggregate reads only.

23. All Bookings screen filters
- FE: search/filter updates rows instantly.
- BE: one-time fetch `/all-bookings` and `/booking-stats`.
- DB: joined reads only.

24. Role-protected route access
- FE: passenger attempting admin route gets redirected.
- BE: no extra API needed for guard.
- DB: none.

25. Logout
- FE: returned to login and protected pages blocked.
- BE: no logout API call.
- DB: none.

---

## 8) Important Consistency and Design Notes

1. Soft delete strategy is heavily used.
- Airport and Flight delete operations are status updates, not hard deletes.
- Frontend logic explicitly checks these statuses to display cancelled/deleted state.

2. Transactions protect critical paths.
- Booking and payment both use transaction + rollback on failure.

3. Seat race condition handling exists.
- `FOR UPDATE` + seat conflict check avoids most concurrent booking issues.

4. `DataContext` is mostly legacy/in-memory for current runtime.
- Real pages call backend APIs directly.
- Admin `Analytics.tsx` uses `DataContext` but is not routed.

5. Passwords are plain-text compared currently.
- Works functionally but not production-safe.

6. `AirlineDB.sql` appears as a SQL dump file in UTF-16 format, while runtime schema and seed flow used by this project aligns with `queries.sql`.

---

## 9) Complete Navigation Matrix (Page -> API -> DB)

1. `/login`
- API: `/login`
- DB: `User`, `Passenger` selects

2. `/register`
- API: `/register`
- DB: `Passenger` select+insert

3. `/dashboard` (passenger)
- API: `/passenger-dashboard/:id`
- DB: booking/flight/airport aggregates

4. `/dashboard` (admin)
- API: `/admin-stats`, `/airlines`, `/airports`, `/admin-analytics`
- DB: aggregates + list reads

5. `/flights`
- API: `/flights`
- DB: flight+aircraft+airline+airport join

6. `/book/:flightId`
- API: `/flights`, `/booked-seats/:id`, `/booking`, `/payment`
- DB: reads + booking/payment writes

7. `/bookings` or `/my-bookings/:passenger_id`
- API: `/my-bookings/:id`, `/cancel-booking/:booking_id`
- DB: booking detail read + status update

8. `/payments`
- API: `/payments/:id`
- DB: payment/booking/flight joins

9. `/admin/flights`
- API: `/flights`, `/airlines`, `/active-airports`, `/aircrafts/:id`, `/add-flight`, `/update-flight/:id`, `/delete-flight/:id`
- DB: flight CRUD(soft-delete) + related lookups

10. `/admin/airlines`
- API: `/airlines`, `/aircrafts/:id`, `/add-airline`, `/add-aircraft`
- DB: airline + aircraft writes/reads

11. `/admin/airports`
- API: `/airports`, `/add-airport`, `/update-airport/:code`, `/delete-airport/:code`
- DB: airport writes + cascade status changes

12. `/admin/bookings`
- API: `/all-bookings`, `/booking-stats`
- DB: joined reads + group-by stats

---

## 10) Final End-to-End Story in One Pass

1. User registers (Passenger inserted).
2. User logs in (role identified via User or Passenger table).
3. User opens flights (active flights join query).
4. User opens book flow (flight details + booked seats loaded).
5. User selects seats and pays.
6. Booking transaction writes booking + seats + decrements flight seats.
7. Payment transaction writes payment + updates booking status.
8. My Bookings and My Payments show joined outcomes.
9. Admin can alter master data (airports, airlines, flights).
10. Soft deletes and status updates propagate into passenger views as cancelled/deleted/refunded states.

This is the complete running behavior of the current codebase as implemented in frontend pages, backend route handlers, and SQL schema.
