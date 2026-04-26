import { Router } from "express";
import pool from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

async function fetchAllFlights() {
  const [rows] = await pool.execute(`
    SELECT
      f.*,
      a.model,
      a.economy_seats,
      a.business_seats,
      al.name AS airline_name,
      src.name AS source_airport,
      src.status AS source_airport_status,
      src.city AS source_city,
      dest.name AS destination_airport,
      dest.status AS destination_airport_status,
      dest.city AS destination_city
    FROM flight f
    JOIN aircraft a
      ON f.aircraft_id = a.aircraft_id
    JOIN airline al
      ON a.airline_id = al.airline_id
    LEFT JOIN airport src
      ON f.source = src.airport_code
    LEFT JOIN airport dest
      ON f.destination = dest.airport_code
    WHERE f.status = 'ACTIVE'
  `);

  return { rows, tableName: "Flight" };
}

router.get(
  "/flights",
  asyncHandler(async (req, res) => {
    console.log(`[GET /flights] Route hit from ${req.ip}`);

    try {
      const { rows, tableName } = await fetchAllFlights();
      console.log(`[GET /flights] Query ok from table ${tableName}. rows=${rows.length}`);
      return res.json(rows);

    } catch (error) {
      console.error("[GET /flights] Query failed", {
        code: error.code,
        message: error.message,
      });

      return res.status(500).json({
        error: "Failed to fetch flights",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  })
);

// ================== SEATS ==================
router.get(
  "/booked-seats/:flight_id",
  asyncHandler(async (req, res) => {
    const flightId = Number(req.params.flight_id);

    if (!Number.isInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ error: "Invalid flight_id" });
    }

    const [rows] = await pool.execute(
      "SELECT seat_no AS seat_number FROM Booking_Seat WHERE flight_id = ?",
      [flightId]
    );

    return res.json(rows);
  })
);

router.get(
  "/seats/:flight_id",
  asyncHandler(async (req, res) => {
    const flightId = Number(req.params.flight_id);

    if (!Number.isInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ error: "Invalid flight_id" });
    }

    const [rows] = await pool.execute(
      "SELECT seat_no FROM Booking_Seat WHERE flight_id = ?",
      [flightId]
    );

    const seats = rows.map((row) => row.seat_no);

    return res.json({
      flight_id: flightId,
      booked_seats: seats
    });
  })
);

export default router;