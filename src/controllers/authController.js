// backend/controllers/authController.js
import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register new user
export const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await pool.query(
      "INSERT INTO users (fullName, email, password) VALUES ($1, $2, $3) RETURNING *",
      [fullName, email, hashedPassword]
    );

    res.json({ success: true, message: "User created", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation for email
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

   res.json({
  success: true,
  message: "Login successful",
  token,
  user: {
    id: user.id,  
    fullName: user.fullname || user.fullName, // postgres is lowercase by default
    email: user.email
  }
});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

