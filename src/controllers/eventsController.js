import db from "../db.js";

export const createEvent = async (req, res) => {
  try {
    // Fields from FormData
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
    } = req.body;

    // Multer puts uploaded file info in req.file
    const flyer = req.file ? req.file.filename : null;

    // Save to database (example using MySQL)
    const result = await db.query(
      "INSERT INTO events (title, description, event_date, start_time, end_time, location, ticket_price, total_slots, available_slots, flyer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        flyer,
      ]
    );

    res.status(201).json({ message: "Event created successfully", event: result });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Failed to create event" });
  }
};
