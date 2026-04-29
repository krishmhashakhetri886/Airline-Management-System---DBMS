# Airline Management System - Detailed Flow & DBMS Project Documentation

**Project Type:** DBMS Project (Relational Database Management System)  
**Technology Stack:** Node.js + Express Backend, React + TypeScript Frontend, MySQL Database  
**Database:** MySQL 8.0+

---

## Table of Contents
1. [DBMS Concepts Used](#dbms-concepts-used)
2. [Database Schema & Normalization](#database-schema--normalization)
3. [Module-Wise Documentation](#module-wise-documentation)
4. [Important Queries with Explanations](#important-queries-with-explanations)
5. [Backend Operations (CRUD)](#backend-operations-crud)
6. [Frontend Forms & Input Validation](#frontend-forms--input-validation)
7. [Data Flow & Relationships](#data-flow--relationships)

---

## DBMS Concepts Used

### 1.1 Relational Data Modeling
The system uses **Relational DBMS** concepts to organize airline data into multiple related tables:
- **Normalization:** Data is split into entities (Passenger, Flight, Booking, etc.) to avoid redundancy
- **Primary Keys:** Uniquely identify each record (passenger_id, flight_id, booking_id)
- **Foreign Keys:** Establish relationships between tables
- **Referential Integrity:** Ensures data consistency across tables

### 1.2 CRUD Operations
- **CREATE:** Register passengers, add flights, create bookings, process payments
- **READ:** Fetch flights, view bookings, get payment history
- **UPDATE:** Modify passenger info, update flight status, change booking status
- **DELETE:** Logical delete using status = 'INACTIVE' or 'CANCELLED' (Soft Delete Pattern)

### 1.3 Transactions & ACID Properties
**Used in Critical Operations:**
- **Signup/Registration:** Begins transaction → validates → inserts → commits/rollbacks
- **Booking Creation:** Locks flight row → checks seats → inserts booking → updates seat count
- **Payment Processing:** Locks booking → inserts payment → updates booking status

**Benefits:**
- All operations succeed together or fail together (Atomicity)
- Prevents inconsistent states (Consistency)
- Handles concurrent requests (Isolation)
- Data persists after success (Durability)

```javascript
// Example Transaction Flow
await connection.beginTransaction();
try {
  // All operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
}
```

### 1.4 Concurrency Control
**SELECT ... FOR UPDATE** locks rows during critical operations:
```sql
SELECT available_seats FROM Flight WHERE flight_id = ? FOR UPDATE
```
- Prevents race conditions when multiple users book simultaneously
- Ensures seat availability is accurate

### 1.5 Connection Pooling
**MySQL Connection Pool** configuration:
```javascript
connectionLimit: 10,  // Max concurrent connections
queueLimit: 0,        // Queue unlimited requests
waitForConnections: true
```
- Efficiently reuses database connections
- Improves performance under load

### 1.6 JOIN-Based Query Composition
**Complex queries combine multiple tables:**
```sql
SELECT f.*, a.model, al.name, src.city, dest.city
FROM flight f
JOIN aircraft a ON f.aircraft_id = a.aircraft_id
JOIN airline al ON a.airline_id = al.airline_id
LEFT JOIN airport src ON f.source = src.airport_code
LEFT JOIN airport dest ON f.destination = dest.airport_code
```
- Returns rich API payloads with minimal network requests
- Single query provides all data needed for frontend screens

### 1.7 Aggregation Functions
**For Admin Analytics & Dashboard:**
- COUNT(*) - Total bookings/flights/passengers
- SUM(amount) - Total revenue
- GROUP BY - Breakdown by airline, status, date
- AVG() - Average booking amount

### 1.8 Soft Delete Pattern
Instead of physical deletion, status is updated:
- `flight.status = 'INACTIVE'`
- `booking.status = 'CANCELLED'`
- `airport.status = 'INACTIVE'`

**Advantages:**
- Maintains historical data for auditing
- Enables analytics on historical records
- Prevents accidental permanent deletion

---

## Database Schema & Normalization

### Normalization: 3NF (Third Normal Form)

The database is normalized to 3NF to eliminate redundancy:

#### **1NF (Atomic Values)**
- All columns contain atomic (non-repeating) values
- Example: Passenger.phone_no is a single value, not comma-separated

#### **2NF (Remove Partial Dependencies)**
- Foreign keys ensure no partial dependencies
- Example: Aircraft properties don't repeat in Flight table

#### **3NF (Remove Transitive Dependencies)**
- No column depends on non-key attributes
- Example: Airline name is in Airline table, not duplicated in Aircraft

---

### Core Tables & Relationships

#### **1. PASSENGER**
```sql
CREATE TABLE passenger (
  passenger_id INT PRIMARY KEY,           -- Unique identifier
  first_name VARCHAR(50) NOT NULL,        -- Personal info
  middle_name VARCHAR(50),
  last_name VARCHAR(50) NOT NULL,
  email_id VARCHAR(100) UNIQUE NOT NULL,  -- Unique constraint
  phone_no VARCHAR(15),
  dob DATE,
  passport_no VARCHAR(50),
  password VARCHAR(255) NOT NULL          -- Encrypted in production
);
```
**Purpose:** Stores passenger profile and login credentials  
**Used By:** Authentication, Booking, Dashboard  
**Key Constraint:** email_id must be unique (prevents duplicate registrations)

---

#### **2. USER (Admin)**
```sql
CREATE TABLE user (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100),
  role ENUM('admin', 'passenger')
);
```
**Purpose:** Admin authentication separate from passengers  
**Used By:** Admin login, admin-only operations  
**Design Note:** Separate table allows different password policies

---

#### **3. AIRLINE**
```sql
CREATE TABLE airline (
  airline_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),           -- e.g., "IndiGo", "Air India"
  code VARCHAR(20),            -- e.g., "6E", "AI"
  rating DECIMAL(2,1)          -- e.g., 4.5 stars
);
```
**Purpose:** Master data for airlines  
**Relationship:** 1 Airline → Many Aircraft  
**Used By:** Flight display, Admin management

---

#### **4. AIRPORT**
```sql
CREATE TABLE airport (
  airport_code VARCHAR(10) PRIMARY KEY,  -- e.g., "DEL", "BOM"
  name VARCHAR(100),                      -- Full name
  city VARCHAR(100),                      -- City location
  terminal VARCHAR(50),                   -- Terminal info
  status VARCHAR(20) DEFAULT 'ACTIVE'    -- Soft delete
);
```
**Purpose:** Master data for airports  
**Relationship:** Referenced by Flight (source/destination)  
**Key:** airport_code is primary key (unique identifier)

---

#### **5. AIRCRAFT**
```sql
CREATE TABLE aircraft (
  aircraft_id INT PRIMARY KEY AUTO_INCREMENT,
  model VARCHAR(100),              -- e.g., "Airbus A320"
  airline_id INT NOT NULL,
  total_seats INT,
  economy_seats INT,
  business_seats INT,
  FOREIGN KEY (airline_id) REFERENCES airline(airline_id)
);
```
**Purpose:** Stores aircraft models and seat configuration  
**Relationship:** Many Aircraft → 1 Airline  
**Used By:** Flight scheduling, seat availability

---

#### **6. FLIGHT**
```sql
CREATE TABLE flight (
  flight_id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(10) NOT NULL,              -- FROM airport
  destination VARCHAR(10) NOT NULL,         -- TO airport
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  aircraft_id INT NOT NULL,
  source_terminal VARCHAR(10),
  destination_terminal VARCHAR(10),
  flight_date DATE,
  available_seats INT,                      -- Dynamic, updated on booking
  status VARCHAR(20) DEFAULT 'ACTIVE',
  economy_price DECIMAL(10,2),              -- Separate pricing per class
  business_price DECIMAL(10,2),
  FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id),
  FOREIGN KEY (source) REFERENCES airport(airport_code),
  FOREIGN KEY (destination) REFERENCES airport(airport_code)
);
```
**Purpose:** Represents scheduled flights  
**Relationships:** 
- Many Flights → 1 Aircraft
- Many Flights → 2 Airports (source & destination)

**Important Fields:**
- `available_seats`: Decremented on booking (updated with transaction lock)
- `status`: 'ACTIVE' or 'INACTIVE' (soft delete)
- Separate economy/business pricing

---

#### **7. BOOKING**
```sql
CREATE TABLE booking (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  class VARCHAR(20),               -- "Economy" or "Business"
  amount DECIMAL(10,2),            -- Total booking amount
  status VARCHAR(20),              -- "PENDING", "CONFIRMED", "CANCELLED"
  passenger_id INT NOT NULL,
  flight_id INT,
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
  FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE SET NULL
);
```
**Purpose:** Represents a passenger's booking for a flight  
**Relationships:**
- Many Bookings → 1 Passenger
- Many Bookings → 1 Flight

**Lifecycle:**
1. Created with status = 'PENDING'
2. After payment success → status = 'CONFIRMED'
3. After payment failure → status = 'PAYMENT_FAILED'
4. User cancellation → status = 'CANCELLED'

---

#### **8. BOOKING_SEAT**
```sql
CREATE TABLE booking_seat (
  booking_id INT NOT NULL,
  seat_no VARCHAR(10) NOT NULL,    -- e.g., "1A", "2B", "E1"
  flight_id INT NOT NULL,
  PRIMARY KEY (booking_id, seat_no),
  FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE CASCADE
);
```
**Purpose:** Junction table linking Booking to specific seat numbers  
**Design Note:**
- Composite primary key (booking_id, seat_no) ensures unique seats per booking
- ON DELETE CASCADE: Deleting booking automatically removes seat records
- Allows multiple seats per booking (e.g., booking 1 seat has [1A, 1B, 1C])

---

#### **9. PAYMENT**
```sql
CREATE TABLE payment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  method VARCHAR(50),              -- "card", "credit_card", "upi", etc.
  status VARCHAR(20),              -- "Success", "Failed", "Pending"
  booking_id INT UNIQUE NOT NULL,  -- UNIQUE ensures 1 payment per booking
  FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
);
```
**Purpose:** Records payment transactions  
**Relationship:** 1 Booking → 1 Payment (UNIQUE constraint)

**On Payment Success:**
- Payment status = 'Success'
- Booking status → 'CONFIRMED'

**On Payment Failure:**
- Payment status = 'Failed'
- Booking status → 'PAYMENT_FAILED'

---

### ER Diagram (Entity Relationships)
```
AIRLINE (1) ──── (Many) AIRCRAFT
   ↓
   └─────── Used in ──────→ FLIGHT

AIRPORT (1) ──── (Many) FLIGHT (source/destination)

PASSENGER (1) ──── (Many) BOOKING
                     ↓
FLIGHT (1) ──────── (Many) BOOKING
                     ↓
BOOKING_SEAT (Many) ──→ FLIGHT (track booked seats)

BOOKING (1) ──── (1) PAYMENT
```

---

## Module-Wise Documentation

### Module 1: Authentication & User Management

#### **A. Passenger Registration**
**Frontend Form:** [Register.tsx](src/app/pages/Register.tsx)
```jsx
Fields:
- First Name (Required)
- Middle Name (Optional)
- Last Name (Required)
- Email (Required, unique validation)
- Phone Number (Optional)
- Date of Birth (Optional)
- Passport Number (Optional)
- Password (Required)
```

**Backend Route:** `POST /register` or `POST /signup`
```javascript
1. Validate all required fields
2. Check if email already exists
   Query: SELECT email_id FROM passenger WHERE email_id = ?
3. Auto-generate next passenger_id
   Query: SELECT MAX(passenger_id) as max FROM passenger
4. Insert new passenger record
   Query: INSERT INTO passenger (passenger_id, ...) VALUES (?, ...)
5. Return passenger_id and success message
```

**Database Operations:**
```sql
-- Check email uniqueness
SELECT COUNT(*) FROM passenger WHERE email_id = 'user@email.com';

-- Get next ID
SELECT MAX(passenger_id) + 1 AS next_id FROM passenger;

-- Insert new passenger
INSERT INTO passenger 
(passenger_id, first_name, middle_name, last_name, email_id, phone_no, dob, passport_no, password)
VALUES (304, 'John', 'M', 'Doe', 'john@test.com', '9876543213', '2001-01-15', 'P10004', 'password123');
```

---

#### **B. User Login**
**Frontend Form:** [Login.tsx](src/app/pages/Login.tsx)
```jsx
Fields:
- Email (Required)
- Password (Required)
```

**Backend Route:** `POST /login`
```javascript
1. Check if email exists in user table (for admin)
2. If exists, verify password against admin credentials
3. If not admin, check passenger table
4. Return passenger_id/user_id and role
```

**Database Queries:**
```sql
-- Admin login check
SELECT user_id, email, role FROM user 
WHERE email = 'admin@airline.com' AND password = 'admin123';

-- Passenger login check
SELECT passenger_id, email_id, first_name 
FROM passenger 
WHERE email_id = 'krish@test.com' AND password = '123';
```

---

### Module 2: Flight Management

#### **A. View All Flights**
**Frontend Page:** [Flights.tsx](src/app/pages/Flights.tsx) / [BookFlight.tsx](src/app/pages/BookFlight.tsx)

**Backend Route:** `GET /flights`
```javascript
1. Fetch all active flights with related aircraft/airline/airport info
2. Use JOIN to get comprehensive flight details
3. Return list of flights
```

**Critical Query:**
```sql
SELECT
  f.*,                              -- All flight columns
  a.model,                          -- Aircraft model
  a.economy_seats,
  a.business_seats,
  al.name AS airline_name,          -- Airline name
  src.name AS source_airport,       -- Source airport details
  src.city AS source_city,
  dest.name AS destination_airport, -- Destination airport details
  dest.city AS destination_city
FROM flight f
JOIN aircraft a ON f.aircraft_id = a.aircraft_id
JOIN airline al ON a.airline_id = al.airline_id
LEFT JOIN airport src ON f.source = src.airport_code
LEFT JOIN airport dest ON f.destination = dest.airport_code
WHERE f.status = 'ACTIVE';

-- Why JOIN?
-- - Avoids fetching flight data separately, then aircraft, then airline, then airports
-- - Single query returns everything needed for frontend
-- - Better performance (1 query vs 5 queries)
```

**Result Set Example:**
```json
{
  "flight_id": 1,
  "source": "DEL",
  "destination": "BOM",
  "departure_time": "2026-05-01 10:00:00",
  "arrival_time": "2026-05-01 12:00:00",
  "model": "Airbus A320",
  "economy_seats": 150,
  "business_seats": 30,
  "airline_name": "IndiGo",
  "source_airport": "Indira Gandhi Airport",
  "source_city": "Delhi",
  "destination_airport": "Mumbai Airport",
  "destination_city": "Mumbai",
  "available_seats": 180,
  "economy_price": 5000,
  "business_price": 9000
}
```

---

#### **B. Get Booked Seats for a Flight**
**Frontend Component:** Seat selection in [BookFlight.tsx](src/app/pages/BookFlight.tsx)

**Backend Route:** `GET /seats/:flight_id`
```javascript
1. Get all booked seat numbers for the flight
2. Return array of seat numbers
3. Frontend marks these seats as unavailable
```

**Query:**
```sql
-- Get all booked seats for a flight
SELECT seat_no FROM booking_seat WHERE flight_id = 1;

-- Returns: ["1A", "1B", "2A", "E1", "B1", "B2"]
```

---

### Module 3: Booking Management

#### **A. Create a Booking**
**Frontend Form:** [BookFlight.tsx](src/app/pages/BookFlight.tsx)
```jsx
Fields:
- Select Flight
- Select Class (Economy/Business)
- Select Seats (multiple)
- Auto-calculated amount
```

**Backend Route:** `POST /booking`
```javascript
-- TRANSACTION BEGIN
1. Get flight details and lock for concurrent access
   Query: SELECT available_seats FROM Flight WHERE flight_id = ? FOR UPDATE

2. Validate seat availability
   if (availableSeats < selectedSeats.length) {
     ROLLBACK and return error
   }

3. Check if any seats are already booked
   Query: SELECT seat_no FROM Booking_Seat WHERE flight_id = ? AND seat_no IN (?)

4. Create booking record
   Query: INSERT INTO Booking (passenger_id, flight_id, class, amount, status) VALUES (?)

5. Insert seat reservations
   Query: INSERT INTO Booking_Seat (booking_id, seat_no, flight_id) VALUES (?, ?, ?)

6. Decrement available seats in flight
   Query: UPDATE Flight SET available_seats = available_seats - ? WHERE flight_id = ?

7. TRANSACTION COMMIT
-- TRANSACTION END
```

**Why Transaction?**
- If any step fails, all changes rollback
- Prevents booking creation without seat reservation
- Prevents seat count from becoming negative

**SQL Example:**
```sql
START TRANSACTION;

-- Lock flight row for update
SELECT available_seats FROM Flight WHERE flight_id = 1 FOR UPDATE;
-- Result: 180 available seats

-- Check if seats are free
SELECT seat_no FROM Booking_Seat WHERE flight_id = 1 AND seat_no IN ('1A', '1B', '1C');
-- Result: [] (empty, seats are free)

-- Create booking
INSERT INTO Booking (passenger_id, flight_id, class, amount, status)
VALUES (301, 1, 'Economy', 15000, 'PENDING');
-- New booking_id: 8

-- Reserve seats
INSERT INTO Booking_Seat (booking_id, seat_no, flight_id) VALUES
(8, '1A', 1),
(8, '1B', 1),
(8, '1C', 1);

-- Update available seats
UPDATE Flight SET available_seats = available_seats - 3 WHERE flight_id = 1;
-- available_seats: 180 - 3 = 177

COMMIT;
```

---

#### **B. View My Bookings**
**Frontend Page:** [MyBookings.tsx](src/app/pages/MyBookings.tsx)

**Backend Route:** `GET /my-bookings/:passenger_id`

**Complex JOIN Query:**
```sql
SELECT
  b.booking_id,
  b.passenger_id,
  b.flight_id,
  b.class,
  b.amount,
  b.status AS booking_status,
  f.source,
  f.destination,
  f.departure_time,
  f.arrival_time,
  f.flight_date,
  f.economy_price,
  f.business_price,
  a.model AS aircraft_model,
  al.name AS airline_name,
  src.city AS source_city,
  dest.city AS destination_city,
  p.payment_id,
  p.method AS payment_method,
  p.status AS payment_status,
  GROUP_CONCAT(bs.seat_no ORDER BY bs.seat_no) AS booked_seats
FROM Booking b
JOIN Flight f ON f.flight_id = b.flight_id
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Airline al ON a.airline_id = al.airline_id
LEFT JOIN Airport src ON f.source = src.airport_code
LEFT JOIN Airport dest ON f.destination = dest.airport_code
LEFT JOIN Payment p ON p.booking_id = b.booking_id
LEFT JOIN Booking_Seat bs ON bs.booking_id = b.booking_id
WHERE b.passenger_id = 301
GROUP BY b.booking_id;
-- Includes seats as comma-separated: "1A,1B,1C"
```

**Result includes:**
- Booking details (ID, class, amount, status)
- Flight information (route, times, dates)
- Aircraft & airline details
- Payment information
- All booked seat numbers

---

### Module 4: Payment Management

#### **A. Process Payment**
**Frontend Component:** Payment in [MyBookings.tsx](src/app/pages/MyBookings.tsx)

**Backend Route:** `POST /payment`
```javascript
Request:
{
  method: "credit_card",      // or "upi", "debit_card"
  status: "Success",          // or "Failed"
  booking_id: 8
}

-- TRANSACTION BEGIN
1. Lock booking for update
   Query: SELECT booking_id FROM Booking WHERE booking_id = ? FOR UPDATE

2. Validate booking exists
   if (no booking found) ROLLBACK and return 404

3. Create payment record
   Query: INSERT INTO Payment (method, status, booking_id) VALUES (?, ?, ?)

4. Update booking status based on payment result
   if (payment status = 'Success') {
     Query: UPDATE Booking SET status = 'CONFIRMED' WHERE booking_id = ?
   } else {
     Query: UPDATE Booking SET status = 'PAYMENT_FAILED' WHERE booking_id = ?
   }

5. TRANSACTION COMMIT
-- TRANSACTION END
```

**SQL Example:**
```sql
START TRANSACTION;

-- Lock booking
SELECT booking_id FROM Booking WHERE booking_id = 8 FOR UPDATE;

-- Insert payment
INSERT INTO Payment (method, status, booking_id)
VALUES ('credit_card', 'Success', 8);
-- payment_id: 8

-- Update booking status
UPDATE Booking SET status = 'CONFIRMED' WHERE booking_id = 8;

COMMIT;
```

**Business Logic:**
```javascript
function deriveBookingStatus(paymentStatus) {
  const normalized = paymentStatus.toUpperCase();
  
  if (['SUCCESS', 'COMPLETED', 'PAID'].includes(normalized)) {
    return 'CONFIRMED';        // Booking confirmed
  }
  return 'PAYMENT_FAILED';     // Booking failed
}
```

---

#### **B. View Payment History**
**Frontend Page:** [MyPayments.tsx](src/app/pages/MyPayments.tsx)

**Backend Route:** `GET /payments/:passenger_id`

**Query:**
```sql
SELECT 
  p.payment_id,
  p.method,
  p.status,
  p.booking_id,
  b.amount,
  b.status AS booking_status,
  f.status AS flight_status,
  f.source,
  f.destination,
  f.departure_time,
  f.flight_date
FROM Payment p
JOIN Booking b ON p.booking_id = b.booking_id
LEFT JOIN Flight f ON b.flight_id = f.flight_id
WHERE b.passenger_id = 301
ORDER BY p.payment_id DESC;
```

---

### Module 5: Admin Dashboard

#### **A. View All Bookings**
**Frontend Page:** [AdminDashboard.tsx](src/app/pages/AdminDashboard.tsx) → [AllBookings.tsx](src/app/pages/admin/AllBookings.tsx)

**Backend Route:** `GET /all-bookings`

**Complex Query:**
```sql
SELECT
  b.booking_id,
  b.passenger_id,
  ps.first_name,
  ps.last_name,
  ps.email_id,
  b.flight_id,
  f.source,
  f.destination,
  f.departure_time,
  f.flight_date,
  b.class,
  b.amount,
  b.status AS booking_status,
  p.payment_id,
  p.method AS payment_method,
  p.status AS payment_status,
  GROUP_CONCAT(bs.seat_no ORDER BY bs.seat_no) AS seats,
  al.name AS airline_name,
  a.model AS aircraft_model
FROM Booking b
LEFT JOIN Passenger ps ON ps.passenger_id = b.passenger_id
LEFT JOIN Flight f ON f.flight_id = b.flight_id
LEFT JOIN Payment p ON p.booking_id = b.booking_id
LEFT JOIN Booking_Seat bs ON bs.booking_id = b.booking_id
LEFT JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
LEFT JOIN Airline al ON a.airline_id = al.airline_id
GROUP BY
  b.booking_id,
  b.passenger_id,
  ps.first_name,
  ps.last_name,
  ps.email_id,
  b.flight_id,
  f.source,
  f.destination,
  f.departure_time,
  f.flight_date,
  b.class,
  b.amount,
  b.status,
  p.payment_id,
  p.method,
  p.status,
  al.name,
  a.model
ORDER BY b.booking_id DESC;
```

---

#### **B. Add/Manage Flights**
**Frontend Page:** [ManageFlights.tsx](src/app/pages/admin/ManageFlights.tsx)

**Backend Route:** `POST /add-flight`
```javascript
Request:
{
  source: "DEL",
  destination: "BOM",
  departure_time: "2026-06-01 10:00:00",
  arrival_time: "2026-06-01 12:00:00",
  aircraft_id: 1,
  source_terminal: "T1",
  destination_terminal: "T2",
  flight_date: "2026-06-01",
  available_seats: 180,
  economy_price: 5000,
  business_price: 9000
}

Backend:
1. Validate all required fields
2. Validate numeric fields
3. Check aircraft exists
4. Check airports exist
5. INSERT into flight table
```

**Query:**
```sql
INSERT INTO Flight 
(source, destination, departure_time, arrival_time, aircraft_id, 
 source_terminal, destination_terminal, flight_date, available_seats, 
 economy_price, business_price, status)
VALUES 
('DEL', 'BOM', '2026-06-01 10:00:00', '2026-06-01 12:00:00', 1,
 'T1', 'T2', '2026-06-01', 180, 5000, 9000, 'ACTIVE');
```

---

#### **C. Manage Airlines, Airports, Aircraft**
**Backend Routes:**
- `POST /add-airline`
- `POST /add-airport`
- `POST /add-aircraft`

---

#### **D. Analytics Dashboard**
**Frontend Page:** [Analytics.tsx](src/app/pages/admin/Analytics.tsx)

**Sample Aggregation Queries:**

```sql
-- Total Revenue
SELECT SUM(b.amount) AS total_revenue
FROM Booking b
WHERE b.status = 'CONFIRMED';
-- Result: 88000

-- Total Bookings by Status
SELECT 
  b.status,
  COUNT(*) AS count,
  SUM(b.amount) AS revenue
FROM Booking b
GROUP BY b.status;
-- Result:
-- CONFIRMED  | 2 | 73000
-- CANCELLED  | 1 | 5000
-- PENDING    | 3 | 10000

-- Revenue by Airline
SELECT 
  al.name AS airline,
  COUNT(b.booking_id) AS total_bookings,
  SUM(b.amount) AS revenue
FROM Booking b
JOIN Flight f ON b.flight_id = f.flight_id
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Airline al ON a.airline_id = al.airline_id
WHERE b.status = 'CONFIRMED'
GROUP BY al.airline_id, al.name
ORDER BY revenue DESC;

-- Popular Routes
SELECT 
  f.source,
  f.destination,
  COUNT(b.booking_id) AS bookings,
  SUM(b.amount) AS revenue
FROM Flight f
LEFT JOIN Booking b ON f.flight_id = b.flight_id
GROUP BY f.source, f.destination
ORDER BY bookings DESC;

-- Seat Occupancy Rate
SELECT 
  f.flight_id,
  f.source,
  f.destination,
  a.total_seats,
  (a.total_seats - f.available_seats) AS booked_seats,
  ROUND(((a.total_seats - f.available_seats) / a.total_seats * 100), 2) AS occupancy_percentage
FROM Flight f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id;
```

---

## Important Queries with Explanations

### 1. Flight Search with All Details (Most Complex)
```sql
SELECT
  f.*,
  a.model,
  a.economy_seats,
  a.business_seats,
  al.name AS airline_name,
  src.name AS source_airport,
  src.city AS source_city,
  dest.name AS destination_airport,
  dest.city AS destination_city
FROM flight f
JOIN aircraft a ON f.aircraft_id = a.aircraft_id
JOIN airline al ON a.airline_id = al.airline_id
LEFT JOIN airport src ON f.source = src.airport_code
LEFT JOIN airport dest ON f.destination = dest.airport_code
WHERE f.status = 'ACTIVE'
ORDER BY f.departure_time;

-- Explanation:
-- - INNER JOINs: aircraft, airline are required (every flight must have these)
-- - LEFT JOINs: airports are optional (edge case if airport deleted but flight exists)
-- - WHERE status = 'ACTIVE': filters out cancelled/inactive flights
-- - ORDER BY: returns chronologically ordered flights
```

---

### 2. My Bookings with Full Details (Complex JOIN)
```sql
SELECT
  b.booking_id,
  b.class,
  b.amount,
  b.status AS booking_status,
  f.flight_id,
  f.source,
  f.destination,
  f.departure_time,
  f.arrival_time,
  f.flight_date,
  CONCAT(ps.first_name, ' ', ps.last_name) AS passenger_name,
  a.model AS aircraft,
  al.name AS airline,
  p.payment_id,
  p.method AS payment_method,
  p.status AS payment_status,
  GROUP_CONCAT(bs.seat_no ORDER BY bs.seat_no SEPARATOR ', ') AS seats
FROM Booking b
JOIN Passenger ps ON b.passenger_id = ps.passenger_id
JOIN Flight f ON b.flight_id = f.flight_id
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Airline al ON a.airline_id = al.airline_id
LEFT JOIN Payment p ON b.booking_id = p.booking_id
LEFT JOIN Booking_Seat bs ON b.booking_id = bs.booking_id
WHERE ps.passenger_id = 301
GROUP BY b.booking_id
ORDER BY b.booking_id DESC;

-- Explanation:
-- - Multiple INNER JOINs: ensure we only get valid bookings with all details
-- - LEFT JOIN Payment: booking might not have payment yet
-- - LEFT JOIN Booking_Seat: booking might not have seats reserved
-- - GROUP_CONCAT: aggregates multiple seat numbers into single row
-- - GROUP BY: essential with GROUP_CONCAT to consolidate multiple seat rows into one
```

---

### 3. Check Seat Availability (Pre-Booking)
```sql
SELECT 
  bs.seat_no,
  COUNT(bs.booking_id) AS times_booked
FROM Booking_Seat bs
WHERE bs.flight_id = 1
  AND bs.seat_no IN ('1A', '1B', '1C', '2A', '2B')
GROUP BY bs.seat_no
HAVING COUNT(bs.booking_id) > 0;

-- Explanation:
-- - Checks which of the requested seats are already booked
-- - HAVING clause: only returns seats that are booked
-- - If result is empty, all seats are available
```

---

### 4. Revenue Report by Airline (Aggregation)
```sql
SELECT 
  al.airline_id,
  al.name AS airline_name,
  COUNT(DISTINCT b.booking_id) AS total_bookings,
  COUNT(DISTINCT f.flight_id) AS total_flights,
  SUM(b.amount) AS total_revenue,
  AVG(b.amount) AS avg_booking_amount,
  ROUND(SUM(b.amount) / COUNT(DISTINCT b.booking_id), 2) AS avg_revenue_per_booking
FROM Airline al
LEFT JOIN Aircraft a ON al.airline_id = a.airline_id
LEFT JOIN Flight f ON a.aircraft_id = f.aircraft_id
LEFT JOIN Booking b ON f.flight_id = b.flight_id AND b.status = 'CONFIRMED'
GROUP BY al.airline_id, al.name
ORDER BY total_revenue DESC;

-- Explanation:
-- - LEFT JOINs: airlines with no flights/bookings still appear (with NULL values)
-- - SUM, AVG, COUNT: aggregate functions for financial metrics
-- - WHERE b.status = 'CONFIRMED': only counts confirmed bookings (not pending/failed)
-- - GROUP BY: groups results by airline
```

---

### 5. Transaction: Complete Booking Flow
```sql
START TRANSACTION;

-- 1. Lock flight for update (prevent concurrent booking of same seats)
SELECT flight_id, available_seats FROM Flight WHERE flight_id = 1 FOR UPDATE;

-- 2. Verify sufficient seats available
-- Pseudo-code: IF available_seats < 3 THEN ROLLBACK

-- 3. Check requested seats are not already booked
SELECT seat_no FROM Booking_Seat 
WHERE flight_id = 1 AND seat_no IN ('1A', '1B', '1C');
-- Must return empty result

-- 4. Create booking
INSERT INTO Booking (passenger_id, flight_id, class, amount, status)
VALUES (301, 1, 'Economy', 15000, 'PENDING');
SET @booking_id = LAST_INSERT_ID();

-- 5. Reserve specific seats
INSERT INTO Booking_Seat (booking_id, seat_no, flight_id) VALUES
(@booking_id, '1A', 1),
(@booking_id, '1B', 1),
(@booking_id, '1C', 1);

-- 6. Decrement available seats
UPDATE Flight SET available_seats = available_seats - 3 WHERE flight_id = 1;

COMMIT;

-- Explanation:
-- - FOR UPDATE: locks flight row, preventing other queries from accessing it
-- - TRANSACTION: if any step fails, entire transaction rolls back
-- - LAST_INSERT_ID(): captures the auto-generated booking_id
-- - This ensures atomicity: all succeed or all fail
```

---

## Backend Operations (CRUD)

### CRUD Mapping

| Operation | Module | Route | Method | Query Type | Status |
|-----------|--------|-------|--------|-----------|--------|
| **Create** |
| Register Passenger | Auth | `/register` | POST | INSERT | ✅ Active |
| Create Booking | Booking | `/booking` | POST | INSERT + UPDATE | ✅ Active |
| Process Payment | Payment | `/payment` | POST | INSERT + UPDATE | ✅ Active |
| Add Flight | Admin | `/add-flight` | POST | INSERT | ✅ Active |
| Add Airline | Admin | `/add-airline` | POST | INSERT | ✅ Active |
| Add Aircraft | Admin | `/add-aircraft` | POST | INSERT | ✅ Active |
| Add Airport | Admin | `/add-airport` | POST | INSERT | ✅ Active |
| **Read** |
| Get All Flights | Flight | `/flights` | GET | SELECT (JOIN) | ✅ Active |
| Get Booked Seats | Flight | `/seats/:flight_id` | GET | SELECT | ✅ Active |
| View My Bookings | Booking | `/my-bookings/:passenger_id` | GET | SELECT (JOIN) | ✅ Active |
| Get Payment History | Payment | `/payments/:passenger_id` | GET | SELECT (JOIN) | ✅ Active |
| View All Bookings | Admin | `/all-bookings` | GET | SELECT (JOIN) | ✅ Active |
| **Update** |
| Update Booking Status | Booking | `/cancel-booking/:booking_id` | PUT | UPDATE | ✅ Active |
| Update Flight Status | Admin | `/update-flight/:flight_id` | PUT | UPDATE | ✅ Active |
| **Delete** |
| Cancel Booking | Booking | (via update) | - | UPDATE status | ✅ Active |
| Deactivate Flight | Admin | (via update) | - | UPDATE status | ✅ Active |

---

## Frontend Forms & Input Validation

### 1. Registration Form
**File:** [Register.tsx](src/app/pages/Register.tsx)

**Form Fields:**
```
First Name       [Required] [Max 50 chars]
Middle Name      [Optional] [Max 50 chars]
Last Name        [Required] [Max 50 chars]
Email           [Required] [Valid email format] [Unique - backend check]
Phone           [Optional] [10-15 digits]
Date of Birth   [Optional] [Valid date]
Passport Number [Optional] [Max 50 chars]
Password        [Required] [Min 6 chars recommended]
```

**Validation Flow:**
1. Frontend: Basic required field checks
2. Frontend: Email format validation (regex)
3. Frontend: Password strength check
4. Backend: Email uniqueness check
5. Backend: Insert if all validations pass

---

### 2. Login Form
**File:** [Login.tsx](src/app/pages/Login.tsx)

**Form Fields:**
```
Email           [Required] [Valid email format]
Password        [Required] [Min 1 char]
User Type       [Radio] Admin / Passenger
```

**Validation Flow:**
1. Frontend: Required field check
2. Backend: Query user/passenger table
3. Backend: Password verification
4. Backend: Return success/error

---

### 3. Book Flight Form
**File:** [BookFlight.tsx](src/app/pages/BookFlight.tsx)

**Form Fields:**
```
Source Airport     [Select] [Required]
Destination Airport [Select] [Required]
Departure Date     [Date picker] [Required]
Return Date        [Date picker] [Optional]
Passenger Type     [Select] [Economy/Business] [Required]
Number of Seats    [Number] [1-9] [Required]
```

**After Flight Selection:**
```
Selected Flight    [Display] Route, time, aircraft
Available Seats    [Visual] Seat map with booking status
Seat Selection     [Interactive] Click to select (max selected count)
Pricing            [Auto-calculated] Seats × Price per seat
Total Amount       [Display] Sum of all seats
```

**Validation Flow:**
1. Frontend: All fields required
2. Frontend: Departure date > today
3. Frontend: Destination ≠ Source
4. Backend: Validate flight exists and is active
5. Backend: Validate seats are available and not booked
6. Backend: Create transaction to book seats
7. Frontend: Display success/error

---

### 4. Payment Form
**File:** [MyBookings.tsx](src/app/pages/MyBookings.tsx)

**Payment Methods:**
```
Method Selection   [Select] Credit Card / Debit Card / UPI
Card Number        [Text] [Format: XXXX-XXXX-XXXX-XXXX]
Expiry Date        [Date] [MM/YY format]
CVV                [Text] [3-4 digits]
```

**Or UPI:**
```
UPI ID             [Text] [Format: user@bank]
```

**Validation:**
1. Frontend: Required field checks
2. Frontend: Card number validation (16 digits)
3. Frontend: CVV validation (3-4 digits)
4. Frontend: Expiry not in past
5. Backend: Create payment record
6. Backend: Update booking status based on payment result

---

### 5. Admin - Add Flight Form
**File:** [ManageFlights.tsx](src/app/pages/admin/ManageFlights.tsx)

**Form Fields:**
```
Source Airport          [Select] [Required]
Destination Airport     [Select] [Required]
Departure Date & Time   [DateTime picker] [Required]
Arrival Date & Time     [DateTime picker] [Required]
Aircraft               [Select] [Required]
Total Seats            [Number] [> 0] [Required]
Economy Seats          [Number] [< Total] [Required]
Business Seats         [Number] [< Total] [Required]
Economy Price          [Currency] [> 0] [Required]
Business Price         [Currency] [>= Economy] [Required]
```

**Validation:**
1. Frontend: All required fields
2. Frontend: Arrival time > Departure time
3. Frontend: Economy + Business <= Total seats
4. Backend: Verify aircraft and airports exist
5. Backend: Insert flight record

---

### 6. Admin Dashboard Analytics
**File:** [Analytics.tsx](src/app/pages/admin/Analytics.tsx)

**Displays:**
```
Total Revenue          [Dashboard Card]
Total Bookings         [Dashboard Card]
Total Passengers       [Dashboard Card]
Average Booking Value  [Dashboard Card]

Charts:
- Revenue by Airline (Bar Chart)
- Bookings by Status (Pie Chart)
- Popular Routes (Bar Chart)
- Seat Occupancy (Line Chart)
```

---

## Data Flow & Relationships

### Complete Booking Flow (User Journey)

```
1. REGISTRATION
   ├─ User fills Register form
   ├─ Frontend validates inputs
   ├─ POST /register
   ├─ Backend: Check email unique → Get next ID → INSERT passenger
   └─ Response: passenger_id + success

2. LOGIN
   ├─ User enters email + password
   ├─ POST /login
   ├─ Backend: Check user table → Check passenger table
   └─ Response: passenger_id + role + auth token

3. VIEW FLIGHTS
   ├─ GET /flights
   ├─ Backend: Complex JOIN query
   │  ├─ flight JOIN aircraft
   │  ├─ aircraft JOIN airline
   │  ├─ flight LEFT JOIN airport (source)
   │  └─ flight LEFT JOIN airport (destination)
   └─ Response: Array of enriched flight objects

4. SELECT FLIGHT
   ├─ User clicks on flight
   ├─ GET /seats/:flight_id
   ├─ Backend: SELECT booked seats from booking_seat
   └─ Response: Array of booked seat numbers

5. SELECT SEATS & BOOK
   ├─ User selects available seats
   ├─ POST /booking
   ├─ Backend: TRANSACTION BEGIN
   │  ├─ SELECT flight FOR UPDATE (lock)
   │  ├─ Validate seat count
   │  ├─ CHECK seats not booked
   │  ├─ INSERT booking
   │  ├─ INSERT booking_seat (multiple rows)
   │  ├─ UPDATE flight available_seats
   │  └─ COMMIT
   └─ Response: booking_id + status = PENDING

6. PAYMENT
   ├─ User enters payment details
   ├─ POST /payment
   ├─ Backend: TRANSACTION BEGIN
   │  ├─ SELECT booking FOR UPDATE (lock)
   │  ├─ INSERT payment
   │  ├─ UPDATE booking status based on payment
   │  └─ COMMIT
   └─ Response: payment_id + booking status (CONFIRMED/PAYMENT_FAILED)

7. VIEW BOOKINGS
   ├─ GET /my-bookings/:passenger_id
   ├─ Backend: Complex JOIN
   │  ├─ booking JOIN flight
   │  ├─ flight JOIN aircraft JOIN airline
   │  ├─ flight LEFT JOIN airport (source/dest)
   │  ├─ booking LEFT JOIN payment
   │  ├─ booking LEFT JOIN booking_seat
   │  └─ GROUP_CONCAT seats
   └─ Response: Array of bookings with all details

8. VIEW PAYMENTS
   ├─ GET /payments/:passenger_id
   ├─ Backend: SELECT payments with booking details
   └─ Response: Array of payment records
```

---

## Summary Table

| Concept | Usage | Benefit |
|---------|-------|---------|
| **Primary Keys** | passenger_id, flight_id, booking_id | Uniquely identify records |
| **Foreign Keys** | Linking tables | Maintain referential integrity |
| **Transactions** | Booking, Payment creation | Atomicity - all or nothing |
| **Connection Pool** | Backend DB connections | Performance & resource efficiency |
| **JOINs** | Fetch related data | Single query returns complete data |
| **GROUP_CONCAT** | Aggregate seat numbers | Single row result with all seats |
| **Soft Delete** | status = 'INACTIVE' | Preserve historical data |
| **Concurrency Control** | SELECT FOR UPDATE | Prevent race conditions |
| **Aggregation** | SUM, COUNT, AVG, GROUP BY | Analytics & reporting |
| **Normalization** | 3NF schema | Eliminate redundancy & ensure consistency |

---

## Database Connection Flow

```javascript
// connection-pool: backend/db.js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Piyush@07',
  database: 'AirlineDB',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Usage in Routes
const [rows] = await pool.execute('SELECT * FROM flight');
const connection = await pool.getConnection();
await connection.beginTransaction();
// ... operations ...
await connection.commit() / rollback();
connection.release();
```

---

## Key Points for DBMS Project Explanation

✅ **Relational Database Design:** 9 normalized tables with clear relationships  
✅ **ACID Properties:** Transactions ensure data consistency  
✅ **Concurrency Control:** SELECT FOR UPDATE prevents race conditions  
✅ **Complex Queries:** JOINs combine data from multiple tables efficiently  
✅ **Aggregation Functions:** Analytics queries use GROUP BY, SUM, COUNT, AVG  
✅ **Connection Pooling:** Resource-efficient database connections  
✅ **Soft Delete Pattern:** Historical data preserved via status fields  
✅ **Data Validation:** Both frontend and backend validation layers  
✅ **Error Handling:** Transaction rollback on failures  
✅ **Query Optimization:** Single JOINs retrieve complete API responses  

---

**Last Updated:** April 26, 2026  
**Project Status:** Fully Operational ✅  
**Frontend Server:** http://localhost:5173/  
**Backend Server:** http://localhost:5000/  
