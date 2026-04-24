import { Router } from "express";
import pool from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
	"/signup",
	asyncHandler(async (req, res) => {
		const {
			first_name,
			middle_name = null,
			last_name,
			email_id,
			phone_no,
			dob,
			passport_no,
			password,
		} = req.body;

		if (!first_name || !last_name || !email_id || !phone_no || !dob || !passport_no || !password) {
			return res.status(400).json({
				error:
					"first_name, last_name, email_id, phone_no, dob, passport_no, and password are required",
			});
		}

		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();

			const [existingEmailRows] = await connection.execute(
				"SELECT passenger_id FROM `Passenger` WHERE email_id = ? LIMIT 1",
				[email_id]
			);

			if (existingEmailRows.length > 0) {
				await connection.rollback();
				return res.status(409).json({ error: "Email already exists" });
			}

			const [idRows] = await connection.execute(
				"SELECT COALESCE(MAX(passenger_id), 0) + 1 AS next_passenger_id FROM `Passenger`"
			);

			const passengerId = Number(idRows[0]?.next_passenger_id || 1);

			await connection.execute(
				`INSERT INTO \`Passenger\` (
					passenger_id,
					first_name,
					middle_name,
					last_name,
					email_id,
					phone_no,
					dob,
					passport_no,
					password
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					passengerId,
					first_name,
					middle_name,
					last_name,
					email_id,
					phone_no,
					dob,
					passport_no,
					password,
				]
			);

			await connection.commit();

			return res.status(201).json({
				message: "Passenger signed up successfully",
				passenger_id: passengerId,
				first_name,
				last_name,
				email_id,
			});
		} catch (error) {
			await connection.rollback();

			if (error.code === "ER_DUP_ENTRY") {
				return res.status(409).json({ error: "Email already exists" });
			}

			throw error;
		} finally {
			connection.release();
		}
	})
);

router.post(
	"/login",
	asyncHandler(async (req, res) => {
		const { email_id, password } = req.body;

		if (!email_id || !password) {
			return res.status(400).json({ error: "email_id and password are required" });
		}

		// 🔥 CHECK USER TABLE (ADMIN)
		const [adminRows] = await pool.execute(
			"SELECT * FROM `User` WHERE email = ? AND password = ?",
			[email_id, password]
		);

		if (adminRows.length > 0) {
			const user = adminRows[0];
			return res.json({
				user: {
					id: user.user_id,
					name: "Admin",
					email: user.email,
					role: "admin",
				},
			});
		}

		// 🔥 CHECK PASSENGER TABLE
		const [passengerRows] = await pool.execute(
			"SELECT * FROM `Passenger` WHERE email_id = ? AND password = ?",
			[email_id, password]
		);

		if (passengerRows.length > 0) {
			const user = passengerRows[0];
			return res.json({
				user: {
					id: user.passenger_id,
					name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
					email: user.email_id,
					role: "passenger",
				},
			});
		}

		// 🔥 BOTH FAILED
		return res.status(401).json({ error: "Invalid credentials" });
	})
);

export default router;