// import { Router } from "express";
// import pool from "../db.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const router = Router();

// function deriveBookingStatus(paymentStatus) {
//   const normalized = String(paymentStatus || "").trim().toUpperCase();
//   if (["SUCCESS", "COMPLETED", "PAID"].includes(normalized)) {
//     return "CONFIRMED";
//   }
//   return "PAYMENT_FAILED";
// }

// router.post(
//   "/payment",
//   asyncHandler(async (req, res) => {
//     const { method, status, booking_id } = req.body;
//     const bookingId = Number(booking_id);

//     if (!method || typeof method !== "string") {
//       return res.status(400).json({ error: "Payment method is required" });
//     }

//     if (!status || typeof status !== "string") {
//       return res.status(400).json({ error: "Payment status is required" });
//     }

//     if (!Number.isInteger(bookingId) || bookingId <= 0) {
//       return res.status(400).json({ error: "Invalid booking_id" });
//     }

//     const connection = await pool.getConnection();
//     try {
//       await connection.beginTransaction();

//       const [bookingRows] = await connection.execute(
//         "SELECT booking_id FROM `Booking` WHERE booking_id = ? FOR UPDATE",
//         [bookingId]
//       );

//       if (bookingRows.length === 0) {
//         await connection.rollback();
//         return res.status(404).json({ error: "Booking not found" });
//       }

//       const [paymentResult] = await connection.execute(
//         "INSERT INTO `Payment` (method, status, booking_id) VALUES (?, ?, ?)",
//         [method, status, bookingId]
//       );

//       const bookingStatus = deriveBookingStatus(status);
//       await connection.execute(
//         "UPDATE `Booking` SET status = ? WHERE booking_id = ?",
//         [bookingStatus, bookingId]
//       );

//       await connection.commit();

//       return res.status(201).json({
//         message: "Payment recorded successfully",
//         payment_id: paymentResult.insertId,
//         booking_status: bookingStatus,
//       });
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     } finally {
//       connection.release();
//     }
//   })
// );

// export default router;
import { Router } from "express";
import pool from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

function deriveBookingStatus(paymentStatus) {
  const normalized = String(paymentStatus || "").trim().toUpperCase();

  if (["SUCCESS", "COMPLETED", "PAID"].includes(normalized)) {
    return "CONFIRMED";
  }

  return "PAYMENT_FAILED";
}

// ================== PAYMENT ==================
router.post(
  "/payment",
  asyncHandler(async (req, res) => {
    const { method, status, booking_id } = req.body;

    const bookingId = Number(booking_id);

    if (!method || typeof method !== "string") {
      return res.status(400).json({ error: "Payment method is required" });
    }

    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "Payment status is required" });
    }

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: "Invalid booking_id" });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [bookingRows] = await connection.execute(
        "SELECT booking_id FROM `Booking` WHERE booking_id = ? FOR UPDATE",
        [bookingId]
      );

      if (bookingRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Booking not found" });
      }

      const [paymentResult] = await connection.execute(
        "INSERT INTO `Payment` (method, status, booking_id) VALUES (?, ?, ?)",
        [method, status, bookingId]
      );

      const bookingStatus = deriveBookingStatus(status);

      await connection.execute(
        "UPDATE `Booking` SET status = ? WHERE booking_id = ?",
        [bookingStatus, bookingId]
      );

      await connection.commit();

      return res.status(201).json({
        message: "Payment recorded successfully",
        payment_id: paymentResult.insertId,
        booking_status: bookingStatus,
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

// ================== GET PAYMENTS ==================
router.get(
  "/payments/:passenger_id",
  asyncHandler(async (req, res) => {
    const passengerId = Number(req.params.passenger_id);

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return res.status(400).json({ error: "Invalid passenger_id" });
    }

    const [rows] = await pool.execute(
      `
      SELECT 
        p.payment_id,
        p.method,
        p.status,
        p.booking_id,
        b.amount
      FROM Payment p
      JOIN Booking b ON p.booking_id = b.booking_id
      WHERE b.passenger_id = ?
      ORDER BY p.payment_id DESC
      `,
      [passengerId]
    );

    res.json(rows);
  })
);

export default router;