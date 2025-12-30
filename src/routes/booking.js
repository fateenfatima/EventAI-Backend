import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ---------------- BOOK EVENT ----------------
router.post("/", async (req, res) => {
  try {
    const { user_id, event_id, quantity } = req.body;

    if (!user_id || !event_id || !quantity) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    // Check event availability
    const eventResult = await pool.query(
      "SELECT available_slots, ticket_price FROM events WHERE id=$1",
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const { available_slots, ticket_price } = eventResult.rows[0];

    if (quantity > available_slots) {
      return res.status(400).json({ success: false, error: "Not enough slots" });
    }

    const total_price = quantity * ticket_price;

    // Insert booking
    const booking = await pool.query(
      `INSERT INTO booked_events (user_id, event_id, quantity, total_price)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [user_id, event_id, quantity, total_price]
    );

    // Update slots
    await pool.query(
      "UPDATE events SET available_slots = available_slots - $1 WHERE id=$2",
      [quantity, event_id]
    );

    res.json({ success: true, booking: booking.rows[0] });
  } catch (err) {
    console.error("BOOK EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Failed to book event" });
  }
});

// ---------------- GET USER BOOKINGS ----------------
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        b.id,
        b.quantity,
        b.total_price,
        e.title,
        e.event_date,
        e.location
      FROM booked_events b
      JOIN events e ON b.event_id = e.id
      WHERE b.user_id = $1
      ORDER BY e.event_date ASC
      `,
      [userId]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error("FETCH BOOKINGS ERROR:", err);
    res.status(500).json({ success: false, error: "Failed to fetch bookings" });
  }
});

// ---------------- CANCEL BOOKING ----------------
router.delete("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking details
    const bookingResult = await pool.query(
      "SELECT event_id, quantity FROM booked_events WHERE id=$1",
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const { event_id, quantity } = bookingResult.rows[0];

    // Delete booking
    await pool.query(
      "DELETE FROM booked_events WHERE id=$1",
      [bookingId]
    );

    // Restore event slots
    await pool.query(
      "UPDATE events SET available_slots = available_slots + $1 WHERE id=$2",
      [quantity, event_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});


export default router;
