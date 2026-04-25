// import { Router } from "express";
// import pool from "../db.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const router = Router();

// router.post(
//   "/booking",
//   asyncHandler(async (req, res) => {
//     const { passenger_id, flight_id, amount, seats } = req.body;

//     const passengerId = Number(passenger_id);
//     const flightId = Number(flight_id);
//     const totalAmount = Number(amount);

//     if (!Number.isInteger(passengerId) || passengerId <= 0) {
//       return res.status(400).json({ error: "Invalid passenger_id" });
//     }

//     if (!Number.isInteger(flightId) || flightId <= 0) {
//       return res.status(400).json({ error: "Invalid flight_id" });
//     }

//     if (!Number.isFinite(totalAmount) || totalAmount < 0) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     if (!Array.isArray(seats) || seats.length === 0) {
//       return res.status(400).json({ error: "At least one seat is required" });
//     }

//     const normalizedSeats = seats.map((seat) => String(seat).trim()).filter(Boolean);
//     const uniqueSeats = [...new Set(normalizedSeats)];
//     if (uniqueSeats.length !== normalizedSeats.length) {
//       return res.status(400).json({ error: "Duplicate seat numbers in request" });
//     }

//     const connection = await pool.getConnection();

//     try {
//       await connection.beginTransaction();

//       const [flightRows] = await connection.execute(
//         "SELECT available_seats FROM `Flight` WHERE flight_id = ? FOR UPDATE",
//         [flightId]
//       );

//       if (flightRows.length === 0) {
//         await connection.rollback();
//         return res.status(404).json({ error: "Flight not found" });
//       }

//       const availableSeats = Number(flightRows[0].available_seats);
//       if (availableSeats < uniqueSeats.length) {
//         await connection.rollback();
//         return res.status(409).json({ error: "Not enough available seats" });
//       }

//       const placeholders = uniqueSeats.map(() => "?").join(", ");
//       const [takenSeatRows] = await connection.execute(
//         `SELECT seat_no FROM \`Booking_Seat\` WHERE flight_id = ? AND seat_no IN (${placeholders})`,
//         [flightId, ...uniqueSeats]
//       );

//       if (takenSeatRows.length > 0) {
//         await connection.rollback();
//         return res.status(409).json({
//           error: "One or more seats are already booked",
//           seats: takenSeatRows.map((row) => row.seat_no),
//         });
//       }

//       const [bookingResult] = await connection.execute(
//         "INSERT INTO `Booking` (passenger_id, flight_id, amount, status) VALUES (?, ?, ?, ?)",
//         [passengerId, flightId, totalAmount, "PENDING"]
//       );

//       const bookingId = bookingResult.insertId;
//       const seatParams = [];
//       const seatTuples = uniqueSeats
//         .map((seatNo) => {
//           seatParams.push(bookingId, seatNo, flightId);
//           return "(?, ?, ?)";
//         })
//         .join(", ");

//       await connection.execute(
//         `INSERT INTO \`Booking_Seat\` (booking_id, seat_no, flight_id) VALUES ${seatTuples}`,
//         seatParams
//       );

//       await connection.execute(
//         "UPDATE `Flight` SET available_seats = available_seats - ? WHERE flight_id = ?",
//         [uniqueSeats.length, flightId]
//       );

//       await connection.commit();

//       return res.status(201).json({
//         message: "Booking created successfully",
//         booking_id: bookingId,
//         booked_seats: uniqueSeats,
//       });
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     } finally {
//       connection.release();
//     }
//   })
// );

// router.get(
//   "/my-bookings/:passenger_id",
//   asyncHandler(async (req, res) => {
//     const passengerId = Number(req.params.passenger_id);
//     if (!Number.isInteger(passengerId) || passengerId <= 0) {
//       return res.status(400).json({ error: "Invalid passenger_id" });
//     }

//     const [rows] = await pool.execute(
//       `SELECT
//         b.booking_id,
//         b.passenger_id,
//         b.flight_id,
//         b.amount,
//         b.status AS booking_status,
//         f.source,
//         f.destination,
//         f.departure_time,
//         f.arrival_time,
//         f.flight_date,
//         p.payment_id,
//         p.method AS payment_method,
//         p.status AS payment_status,
//         GROUP_CONCAT(bs.seat_no ORDER BY bs.seat_no) AS seats
//       FROM \`Booking\` b
//       JOIN \`Flight\` f ON f.flight_id = b.flight_id
//       LEFT JOIN \`Payment\` p ON p.booking_id = b.booking_id
//       LEFT JOIN \`Booking_Seat\` bs ON bs.booking_id = b.booking_id
//       WHERE b.passenger_id = ?
//       GROUP BY
//         b.booking_id,
//         b.passenger_id,
//         b.flight_id,
//         b.amount,
//         b.status,
//         f.source,
//         f.destination,
//         f.departure_time,
//         f.arrival_time,
//         f.flight_date,
//         p.payment_id,
//         p.method,
//         p.status
//       ORDER BY b.booking_id DESC`,
//       [passengerId]
//     );

//     const result = rows.map((row) => ({
//       ...row,
//       seats: row.seats ? row.seats.split(",") : [],
//     }));

//     return res.json(result);
//   })
// );

// export default router;
import { Router } from "express";
import pool from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// ================== BOOKING ==================
router.post(
  "/booking",
  asyncHandler(async (req, res) => {
    const { passenger_id, flight_id, amount, seats, class: bookingClass } = req.body;

    const passengerId = Number(passenger_id);
    const flightId = Number(flight_id);
    const totalAmount = Number(amount);

    // ✅ CHECK PASSENGER EXISTS
    const [passengerRows] = await pool.execute(
      "SELECT passenger_id FROM Passenger WHERE passenger_id = ?",
      [passengerId]
    );

    if (passengerRows.length === 0) {
      return res.status(400).json({ error: "Passenger does not exist" });
    }

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return res.status(400).json({ error: "Invalid passenger_id" });
    }

    if (!Number.isInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ error: "Invalid flight_id" });
    }

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "At least one seat is required" });
    }

    const normalizedSeats = seats.map((seat) => String(seat).trim()).filter(Boolean);
    const uniqueSeats = [...new Set(normalizedSeats)];

    if (uniqueSeats.length !== normalizedSeats.length) {
      return res.status(400).json({ error: "Duplicate seat numbers in request" });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [classColumnRows] = await connection.execute(
        "SHOW COLUMNS FROM `Booking` LIKE 'class'"
      );
      const hasClassColumn = classColumnRows.length > 0;

      const [flightRows] = await connection.execute(
        "SELECT available_seats FROM `Flight` WHERE flight_id = ? FOR UPDATE",
        [flightId]
      );

      if (flightRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Flight not found" });
      }

      const availableSeats = Number(flightRows[0].available_seats);

      if (availableSeats < uniqueSeats.length) {
        await connection.rollback();
        return res.status(409).json({ error: "Not enough available seats" });
      }

      const placeholders = uniqueSeats.map(() => "?").join(", ");

      const [takenSeatRows] = await connection.execute(
        `SELECT seat_no FROM \`Booking_Seat\` WHERE flight_id = ? AND seat_no IN (${placeholders})`,
        [flightId, ...uniqueSeats]
      );

      if (takenSeatRows.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          error: "One or more seats are already booked",
          seats: takenSeatRows.map((row) => row.seat_no),
        });
      }

      const bookingInsertQuery = hasClassColumn
        ? "INSERT INTO `Booking` (passenger_id, flight_id, amount, status, `class`) VALUES (?, ?, ?, ?, ?)"
        : "INSERT INTO `Booking` (passenger_id, flight_id, amount, status) VALUES (?, ?, ?, ?)";

      const bookingInsertParams = hasClassColumn
        ? [passengerId, flightId, totalAmount, "PENDING", String(bookingClass || "").trim() || null]
        : [passengerId, flightId, totalAmount, "PENDING"];

      const [bookingResult] = await connection.execute(
        bookingInsertQuery,
        bookingInsertParams
      );

      const bookingId = bookingResult.insertId;

      const seatParams = [];
      const seatTuples = uniqueSeats
        .map((seatNo) => {
          seatParams.push(bookingId, seatNo, flightId);
          return "(?, ?, ?)";
        })
        .join(", ");

      await connection.execute(
        `INSERT INTO \`Booking_Seat\` (booking_id, seat_no, flight_id) VALUES ${seatTuples}`,
        seatParams
      );

      await connection.execute(
        "UPDATE `Flight` SET available_seats = available_seats - ? WHERE flight_id = ?",
        [uniqueSeats.length, flightId]
      );

      await connection.commit();

      return res.status(201).json({
        message: "Booking created successfully",
        booking_id: bookingId,
        booked_seats: uniqueSeats,
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

// ================== GET MY BOOKINGS ==================
router.get(
  "/my-bookings/:passenger_id",
  asyncHandler(async (req, res) => {
    const passengerId = Number(req.params.passenger_id);

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return res.status(400).json({ error: "Invalid passenger_id" });
    }

    const [rows] = await pool.execute(
      `
      SELECT 
        b.booking_id,
        b.flight_id,
        b.amount,
        b.status,
        f.source,
        f.destination,
        f.status AS flight_status,
        f.source_terminal,
        f.destination_terminal,
        f.departure_time,
        f.arrival_time,
        src.name AS source_airport_name,
        src.status AS source_airport_status,
        src.city AS source_city,
        dest.name AS destination_airport_name,
        dest.status AS destination_airport_status,
        dest.city AS destination_city,
        al.name AS airline_name
      FROM booking b
      LEFT JOIN flight f ON b.flight_id = f.flight_id
      LEFT JOIN airport src ON f.source = src.airport_code
      LEFT JOIN airport dest ON f.destination = dest.airport_code
      LEFT JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      LEFT JOIN airline al ON ac.airline_id = al.airline_id
      WHERE b.passenger_id = ?
      `,
      [passengerId]
    );

    console.log("Bookings API:", rows);

// 🔽 ADD THIS BLOCK HERE
const updatedRows = rows.map(b => {
  if (
    !b.flight_id ||
    b.flight_status === 'INACTIVE' ||
    b.source_airport_status === 'INACTIVE' ||
    b.destination_airport_status === 'INACTIVE'
  ) {
    return {
      ...b,
      status: 'FLIGHT CANCELLED'
    };
  }
  return b;
});

// 🔽 REPLACE res.json(rows)
res.json(updatedRows);
  })
);

// ================== CANCEL BOOKING ==================
router.post(
  "/cancel-booking/:booking_id",
  asyncHandler(async (req, res) => {
    const bookingId = Number(req.params.booking_id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: "Invalid booking_id" });
    }

    await pool.execute(
      "UPDATE Booking SET status = 'CANCELLED' WHERE booking_id = ?",
      [bookingId]
    );

    res.json({ message: "Booking cancelled successfully" });
  })
);

// ================== PASSENGER DASHBOARD ==================
router.get(
  "/passenger-dashboard/:passenger_id",
  asyncHandler(async (req, res) => {
    const passengerId = Number(req.params.passenger_id);

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return res.status(400).json({ error: "Invalid passenger_id" });
    }

    // total bookings
    const [[totalBookings]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM Booking WHERE passenger_id = ?",
      [passengerId]
    );

    // total spent (only CONFIRMED)
    const [[totalSpent]] = await pool.execute(
  `
  SELECT SUM(b.amount) AS total_spent
  FROM booking b
  JOIN flight f ON b.flight_id = f.flight_id
  JOIN airport src ON f.source = src.airport_code
  JOIN airport dest ON f.destination = dest.airport_code
  WHERE b.passenger_id = ?
    AND b.status = 'CONFIRMED'
    AND f.status = 'ACTIVE'
    AND src.status = 'ACTIVE'
    AND dest.status = 'ACTIVE'
  `,
  [passengerId]
);

    // upcoming flights
    const [upcomingFlights] = await pool.execute(
      `
      SELECT 
        f.source,
        f.destination,
        f.departure_time,
        f.flight_date
      FROM Booking b
      LEFT JOIN Flight f ON b.flight_id = f.flight_id
      LEFT JOIN airport src ON f.source = src.airport_code
      LEFT JOIN airport dest ON f.destination = dest.airport_code
      WHERE b.passenger_id = ? 
        AND b.status = 'CONFIRMED'
        AND f.status = 'ACTIVE'
        AND src.status = 'ACTIVE'
        AND dest.status = 'ACTIVE'
        AND f.flight_date >= CURDATE()
      ORDER BY f.flight_date ASC
      `,
      [passengerId]
    );

    res.json({
      totalBookings: totalBookings.count,
      totalSpent: totalSpent.total_spent || 0,
      upcomingFlights
    });
  })
);

export default router;