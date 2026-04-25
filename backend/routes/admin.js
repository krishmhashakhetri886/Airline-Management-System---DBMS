// import { Router } from "express";
// import pool from "../db.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const router = Router();

// router.post(
//   "/add-flight",
//   asyncHandler(async (req, res) => {
//     const {
//       source,
//       destination,
//       departure_time,
//       arrival_time,
//       source_terminal,
//       destination_terminal,
//       flight_date,
//       available_seats,
//       price,
//       aircraft_id,
//     } = req.body;

//     const seats = Number(available_seats);
//     const amount = Number(price);
//     const aircraftId = Number(aircraft_id);

//     if (!source || !destination || !departure_time || !arrival_time || !flight_date) {
//       return res.status(400).json({ error: "Missing required flight fields" });
//     }

//     if (!Number.isInteger(seats) || seats < 0) {
//       return res.status(400).json({ error: "Invalid available_seats" });
//     }

//     if (!Number.isFinite(amount) || amount < 0) {
//       return res.status(400).json({ error: "Invalid price" });
//     }

//     if (!Number.isInteger(aircraftId) || aircraftId <= 0) {
//       return res.status(400).json({ error: "Invalid aircraft_id" });
//     }

//     const [result] = await pool.execute(
//       `INSERT INTO \`Flight\` (
//         source,
//         destination,
//         departure_time,
//         arrival_time,
//         source_terminal,
//         destination_terminal,
//         flight_date,
//         available_seats,
//         price,
//         aircraft_id
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         source,
//         destination,
//         departure_time,
//         arrival_time,
//         source_terminal || null,
//         destination_terminal || null,
//         flight_date,
//         seats,
//         amount,
//         aircraftId,
//       ]
//     );

//     return res.status(201).json({
//       message: "Flight added successfully",
//       flight_id: result.insertId,
//     });
//   })
// );

// router.get(
//   "/all-bookings",
//   asyncHandler(async (_req, res) => {
//     const [rows] = await pool.execute(
//       `SELECT
//         b.booking_id,
//         b.passenger_id,
//         ps.name AS passenger_name,
//         ps.email AS passenger_email,
//         b.flight_id,
//         f.source,
//         f.destination,
//         f.flight_date,
//         b.amount,
//         b.status AS booking_status,
//         p.payment_id,
//         p.method AS payment_method,
//         p.status AS payment_status,
//         GROUP_CONCAT(bs.seat_no ORDER BY bs.seat_no) AS seats
//       FROM \`Booking\` b
//       LEFT JOIN \`Passenger\` ps ON ps.passenger_id = b.passenger_id
//       LEFT JOIN \`Flight\` f ON f.flight_id = b.flight_id
//       LEFT JOIN \`Payment\` p ON p.booking_id = b.booking_id
//       LEFT JOIN \`Booking_Seat\` bs ON bs.booking_id = b.booking_id
//       GROUP BY
//         b.booking_id,
//         b.passenger_id,
//         ps.name,
//         ps.email,
//         b.flight_id,
//         f.source,
//         f.destination,
//         f.flight_date,
//         b.amount,
//         b.status,
//         p.payment_id,
//         p.method,
//         p.status
//       ORDER BY b.booking_id DESC`
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

function generateCode(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return String(name || "").trim().substring(0, 2).toUpperCase();
}

// ================== ADD FLIGHT ==================
router.post(
  "/add-flight",
  asyncHandler(async (req, res) => {
    const {
      source,
      destination,
      departure_time,
      arrival_time,
      source_terminal,
      destination_terminal,
      flight_date,
      available_seats,
      economy_price,
      business_price,
      aircraft_id,
    } = req.body;

    const seats = Number(available_seats);
    const economyPrice = Number(economy_price);
    const businessPrice = Number(business_price);
    const aircraftId = Number(aircraft_id);
    const derivedFlightDate = flight_date || String(departure_time).split(" ")[0] || null;

    if (!source || !destination || !departure_time || !arrival_time) {
      return res.status(400).json({ error: "Missing required flight fields" });
    }

    if (!derivedFlightDate) {
      return res.status(400).json({ error: "Unable to derive flight_date from departure_time" });
    }

    if (!Number.isInteger(seats) || seats < 0) {
      return res.status(400).json({ error: "Invalid available_seats" });
    }

    if (!Number.isFinite(economyPrice) || economyPrice < 0) {
      return res.status(400).json({ error: "Invalid economy_price" });
    }

    if (!Number.isFinite(businessPrice) || businessPrice < 0) {
      return res.status(400).json({ error: "Invalid business_price" });
    }

    if (!Number.isInteger(aircraftId) || aircraftId <= 0) {
      return res.status(400).json({ error: "Invalid aircraft_id" });
    }

    // 🔥 FIX: MANUAL flight_id GENERATION
    const [maxIdRow] = await pool.execute(
      "SELECT MAX(flight_id) AS maxId FROM Flight"
    );

    const newFlightId = (maxIdRow[0].maxId || 200) + 1;

    // 🔥 INSERT WITH flight_id
    await pool.execute(
      `INSERT INTO \`Flight\` (
        flight_id,
        source,
        destination,
        departure_time,
        arrival_time,
        source_terminal,
        destination_terminal,
        flight_date,
        available_seats,
        economy_price,
        business_price,
        aircraft_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newFlightId,
        source,
        destination,
        departure_time,
        arrival_time,
        source_terminal || null,
        destination_terminal || null,
        derivedFlightDate,
        seats,
        economyPrice,
        businessPrice,
        aircraftId,
      ]
    );

    return res.status(201).json({
      message: "Flight added successfully",
      flight_id: newFlightId,
    });
  })
);

// ================== ADMIN FLIGHTS ==================
router.get(
  "/admin-flights",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(`
      SELECT 
        f.*,
        sa.name AS source_airport_name,
        sa.city AS source_city,
        da.name AS destination_airport_name,
        da.city AS destination_city,
        ac.model,
        ac.economy_seats,
        ac.business_seats,
        ac.airline_id,
        al.name AS airline_name
      FROM flight f
      LEFT JOIN airport sa ON f.source = sa.airport_code
      LEFT JOIN airport da ON f.destination = da.airport_code
      LEFT JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      LEFT JOIN airline al ON ac.airline_id = al.airline_id
      ORDER BY f.flight_id DESC
    `);

    console.log("Admin Flights:", rows);

    return res.json(rows);
  })
);

router.put("/update-airport/:airport_code", asyncHandler(async (req, res) => {
  const { airport_code } = req.params;
  const { name, city, terminal } = req.body;

  await pool.execute(
    "UPDATE airport SET name = ?, city = ?, terminal = ? WHERE airport_code = ?",
    [name, city, terminal, airport_code]
  );

  res.json({ message: "Airport updated successfully" });
}));

router.put(
  "/update-flight/:id",
  asyncHandler(async (req, res) => {
    const flightId = Number(req.params.id);
    const {
      source,
      destination,
      departure_time,
      arrival_time,
      economy_price,
      business_price,
      aircraft_id,
      source_terminal,
      destination_terminal,
    } = req.body;

    if (!Number.isInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ error: "Invalid flight id" });
    }

    if (!source || !destination || !departure_time || !arrival_time) {
      return res.status(400).json({ error: "Missing required flight fields" });
    }

    const economyPrice = Number(economy_price);
    const businessPrice = Number(business_price);
    const aircraftId = Number(aircraft_id);

    if (!Number.isFinite(economyPrice) || economyPrice < 0) {
      return res.status(400).json({ error: "Invalid economy_price" });
    }

    if (!Number.isFinite(businessPrice) || businessPrice < 0) {
      return res.status(400).json({ error: "Invalid business_price" });
    }

    if (!Number.isInteger(aircraftId) || aircraftId <= 0) {
      return res.status(400).json({ error: "Invalid aircraft_id" });
    }

    const [result] = await pool.execute(
      `UPDATE flight
       SET source = ?,
           destination = ?,
           departure_time = ?,
           arrival_time = ?,
           economy_price = ?,
           business_price = ?,
           aircraft_id = ?,
           source_terminal = ?,
           destination_terminal = ?
       WHERE flight_id = ?`,
      [
        source,
        destination,
        departure_time,
        arrival_time,
        economyPrice,
        businessPrice,
        aircraftId,
        source_terminal || null,
        destination_terminal || null,
        flightId,
      ]
    );

    return res.json({
      message: "Flight updated successfully",
      affectedRows: result.affectedRows,
    });
  })
);

router.delete("/delete-airport/:code", asyncHandler(async (req, res) => {
  const { code } = req.params;

  await pool.execute(
    "UPDATE airport SET status = 'INACTIVE' WHERE airport_code = ?",
    [code]
  );

  console.log("Airport soft deleted:", code);

  res.json({ message: "Airport marked inactive successfully" });
}));

router.delete(
  "/delete-flight/:id",
  asyncHandler(async (req, res) => {
    const flightId = Number(req.params.id);

    if (!Number.isInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ error: "Invalid flight id" });
    }

    const [result] = await pool.execute(
      "UPDATE flight SET status = 'INACTIVE' WHERE flight_id = ?",
      [flightId]
    );

    await pool.execute(
      "UPDATE booking SET status = 'CANCELLED' WHERE flight_id = ?",
      [flightId]
    );

    return res.json({
      message: "Flight marked inactive successfully",
      affectedRows: result.affectedRows,
    });
  })
);

// ================== ALL BOOKINGS ==================
router.get(
  "/all-bookings",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      `SELECT 
  b.booking_id,
  b.status,   -- ✅ IMPORTANT (THIS IS THE FIX)
  p.first_name,
  p.last_name,
  f.source,
  f.destination,
  f.status AS flight_status,
  src.status AS source_airport_status,
  dest.status AS destination_airport_status,
  al.name AS airline_name,
  f.departure_time,
  f.arrival_time,
  b.amount AS price
FROM booking b
JOIN passenger p ON b.passenger_id = p.passenger_id
LEFT JOIN flight f ON b.flight_id = f.flight_id
LEFT JOIN airport src ON f.source = src.airport_code
LEFT JOIN airport dest ON f.destination = dest.airport_code
LEFT JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
LEFT JOIN airline al ON ac.airline_id = al.airline_id
ORDER BY b.booking_id DESC;`
    );

    const result = rows.map((row) => ({
      ...row,
      seats: row.seats ? row.seats.split(",") : [],
    }));

    return res.json(result);
  })
);

router.get(
  "/booking-stats",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      `SELECT 
        al.name AS airline_name,
        COUNT(b.booking_id) AS total_bookings,
        COUNT(DISTINCT b.passenger_id) AS total_passengers
      FROM booking b
      JOIN flight f ON b.flight_id = f.flight_id
      JOIN aircraft ac ON f.aircraft_id = ac.aircraft_id
      JOIN airline al ON ac.airline_id = al.airline_id
      GROUP BY al.name`
    );

    return res.json(rows);
  })
);

// ================== ALL PAYMENTS ==================
router.get(
  "/all-payments",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      `SELECT 
        p.payment_id,
        p.method,
        p.status,
        b.booking_id,
        CONCAT(ps.first_name, ' ', ps.last_name) AS passenger_name,
        b.amount
      FROM Payment p
      JOIN Booking b ON p.booking_id = b.booking_id
      JOIN Passenger ps ON b.passenger_id = ps.passenger_id
      ORDER BY p.payment_id DESC`
    );

    return res.json(rows);
  })
);

// ================== ADMIN DASHBOARD STATS ==================
router.get(
  "/admin-stats",
  asyncHandler(async (_req, res) => {
    const [[totalBookings]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM Booking"
    );

    const [[totalRevenue]] = await pool.execute(
      "SELECT SUM(amount) AS total FROM Booking WHERE status = 'CONFIRMED'"
    );

    const [[totalPassengers]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM Passenger"
    );

    const [[totalFlights]] = await pool.execute(
      "SELECT COUNT(*) AS total_flights FROM flight WHERE status = 'ACTIVE'"
    );

    res.json({
      totalBookings: totalBookings.count,
      totalRevenue: totalRevenue.total || 0,
      totalPassengers: totalPassengers.count,
      totalFlights: totalFlights.total_flights
    });
  })
);

// ================== AIRLINES ==================
router.post(
  "/add-airline",
  asyncHandler(async (req, res) => {
    const { name, aircrafts } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Airline name is required" });
    }

    const trimmedName = String(name).trim();

    if (Array.isArray(aircrafts) && aircrafts.length > 0) {
      for (const aircraft of aircrafts) {
        const model = String(aircraft?.model || "").trim();
        const seats = Number(aircraft?.total_seats);

        if (!model) {
          return res.status(400).json({ error: "Aircraft model is required" });
        }

        if (!Number.isInteger(seats) || seats <= 0) {
          return res.status(400).json({ error: "Aircraft total_seats must be a positive number" });
        }
      }
    }

    const [existingRows] = await pool.execute(
      "SELECT airline_id FROM Airline WHERE LOWER(name) = LOWER(?) LIMIT 1",
      [trimmedName]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: "Airline already exists" });
    }

    const generatedCode = generateCode(trimmedName);

    if (!generatedCode) {
      return res.status(400).json({ error: "Unable to generate airline code" });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let finalCode = generatedCode;
      let suffix = 0;

      while (true) {
        const [codeRows] = await connection.execute(
          "SELECT code FROM Airline WHERE code = ? LIMIT 1",
          [finalCode]
        );

        if (codeRows.length === 0) {
          break;
        }

        suffix += 1;
        finalCode = `${generatedCode}${suffix}`;
      }

      const [result] = await connection.execute(
        "INSERT INTO Airline (name, code) VALUES (?, ?)",
        [trimmedName, finalCode]
      );

      const airlineId = result.insertId;

      if (Array.isArray(aircrafts) && aircrafts.length > 0) {
        for (const aircraft of aircrafts) {
          const totalSeats = Number(aircraft.total_seats);
          const economySeats = Number(aircraft.economy_seats ?? totalSeats);
          const businessSeats = Number(aircraft.business_seats ?? 0);

          if (economySeats + businessSeats !== totalSeats) {
            throw new Error("Total seats must equal economy + business");
          }

          await connection.execute(
            "INSERT INTO Aircraft (model, airline_id, total_seats, economy_seats, business_seats) VALUES (?, ?, ?, ?, ?)",
            [String(aircraft.model).trim(), airlineId, totalSeats, economySeats, businessSeats]
          );
        }
      }

      await connection.commit();

      return res.status(201).json({
        message: "Airline added successfully",
        airline_id: airlineId,
      });
    } catch (error) {
      await connection.rollback();

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Airline already exists" });
      }

      throw error;
    } finally {
      connection.release();
    }
  })
);

router.post(
  "/add-aircraft",
  asyncHandler(async (req, res) => {
    const {
      model,
      airline_id,
      total_seats,
      economy_seats,
      business_seats,
    } = req.body;

    const trimmedModel = String(model || "").trim();
    const airlineId = Number(airline_id);
    const totalSeats = Number(total_seats);
    const economySeats = Number(economy_seats);
    const businessSeats = Number(business_seats);

    if (!trimmedModel) {
      return res.status(400).json({ error: "Aircraft model is required" });
    }

    if (!Number.isInteger(airlineId) || airlineId <= 0) {
      return res.status(400).json({ error: "Invalid airline_id" });
    }

    if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
      return res.status(400).json({ error: "Invalid total_seats" });
    }

    if (!Number.isInteger(economySeats) || economySeats < 0) {
      return res.status(400).json({ error: "Invalid economy_seats" });
    }

    if (!Number.isInteger(businessSeats) || businessSeats < 0) {
      return res.status(400).json({ error: "Invalid business_seats" });
    }

    if (economySeats + businessSeats !== totalSeats) {
      return res.status(400).json({ error: "Total seats must equal economy + business" });
    }

    const [result] = await pool.execute(
      "INSERT INTO Aircraft (model, airline_id, total_seats, economy_seats, business_seats) VALUES (?, ?, ?, ?, ?)",
      [trimmedModel, airlineId, totalSeats, economySeats, businessSeats]
    );

    return res.status(201).json({
      message: "Aircraft added successfully",
      aircraft_id: result.insertId,
    });
  })
);

router.get(
  "/airlines",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      "SELECT * FROM Airline"
    );
    res.json(rows);
  })
);

// ================== AIRPORTS ==================
router.post(
  "/add-airport",
  asyncHandler(async (req, res) => {
    const { airport_code, name, city, terminal } = req.body;

    if (!airport_code || !name || !city) {
      return res.status(400).json({ error: "airport_code, name, and city are required" });
    }

    const code = String(airport_code).trim().toUpperCase();
    const trimmedName = String(name).trim();
    const trimmedCity = String(city).trim();
    const trimmedTerminal = terminal ? String(terminal).trim() : null;

    const [existingRows] = await pool.execute(
      "SELECT airport_code, status FROM airport WHERE airport_code = ? LIMIT 1",
      [code]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];

      if (existing.status === "INACTIVE") {
        await pool.execute(
          "UPDATE airport SET status = 'ACTIVE', name = ?, city = ?, terminal = ? WHERE airport_code = ?",
          [trimmedName, trimmedCity, trimmedTerminal, code]
        );

        return res.json({ message: "Airport restored successfully" });
      }

      return res.status(409).json({ error: "Airport code already exists" });
    }

    await pool.execute(
      "INSERT INTO airport (airport_code, name, city, terminal) VALUES (?, ?, ?, ?)",
      [code, trimmedName, trimmedCity, trimmedTerminal]
    );

    res.json({ message: "Airport added" });
  })
);

router.get(
  "/airports",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      "SELECT * FROM airport WHERE status = 'ACTIVE'"
    );
    res.json(rows);
  })
);

router.get(
  "/active-airports",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      "SELECT airport_code, name, city, terminal FROM Airport WHERE status = 'ACTIVE'"
    );
    res.json(rows);
  })
);

// ================== AIRCRAFTS BY AIRLINE ==================
router.get("/aircrafts/:airline_id", asyncHandler(async (req, res) => {
  const airlineId = Number(req.params.airline_id);

  if (!airlineId) {
    return res.status(400).json({ error: "Invalid airline_id" });
  }

  const [rows] = await pool.execute(
    "SELECT * FROM Aircraft WHERE airline_id = ?",
    [airlineId]
  );

  res.json(rows);
}));

// ================== ADMIN ANALYTICS ==================
router.get(
  "/admin-analytics",
  asyncHandler(async (_req, res) => {

    const [statusRows] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM Booking
      GROUP BY status
    `);

    const [airlineRows] = await pool.execute(`
      SELECT al.name, COUNT(*) as bookings
      FROM Booking b
      JOIN Flight f ON b.flight_id = f.flight_id
      JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
      JOIN Airline al ON ac.airline_id = al.airline_id
      GROUP BY al.name
    `);

    res.json({
      statusData: statusRows,
      airlineData: airlineRows
    });
  })
);

export default router;