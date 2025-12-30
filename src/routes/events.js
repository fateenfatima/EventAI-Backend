import express from "express";
import { pool } from "../db.js";


const router = express.Router();
// ---------------- ADD EVENT ----------------
router.post("/add", async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      ticket_price,
      total_slots,
      available_slots,
      flyer
    } = req.body;

    const result = await pool.query(
  `INSERT INTO events (title, description, event_date, start_time, end_time, location, ticket_price, total_slots, available_slots, flyer)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
   RETURNING *`,
  [title, description, event_date, start_time, end_time, location, ticket_price, total_slots, available_slots, flyer]
);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// ---------------- GET EVENTS ----------------
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ---------------- UPDATE EVENT ----------------
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      ticket_price,
      total_slots,
      flyer  // new field for image filename
    } = req.body;

    // Get current available_slots from DB
    const currentEvent = await pool.query("SELECT available_slots, total_slots FROM events WHERE id=$1", [req.params.id]);
    if (currentEvent.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    let available_slots = currentEvent.rows[0].available_slots;

    // If total_slots changed, adjust available_slots accordingly
    if (total_slots && total_slots !== currentEvent.rows[0].total_slots) {
      const slotDiff = total_slots - currentEvent.rows[0].total_slots;
      available_slots += slotDiff;
      if (available_slots < 0) available_slots = 0; // prevent negative slots
    }

    const result = await pool.query(
      `UPDATE events SET
        title=$1,
        description=$2,
        event_date=$3,
        start_time=$4,
        end_time=$5,
        location=$6,
        ticket_price=$7,
        total_slots=$8,
        available_slots=$9,
        flyer=$10
       WHERE id=$11
       RETURNING *`,
      [
        title,
        description,
        event_date,
        start_time,
        end_time,
        location,
        ticket_price,
        total_slots,
        available_slots,
        flyer || currentEvent.rows[0].flyer, // keep existing flyer if not updated
        req.params.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE EVENT ERROR:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
});


// ---------------- DELETE EVENT ----------------
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id=$1", [req.params.id]);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
