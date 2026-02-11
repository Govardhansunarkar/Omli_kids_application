import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });
const app = express();
app.use(cors());
app.use(express.json());

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    
    // Drop the problematic username index if it exists
    try {
      await mongoose.connection.collection('users').dropIndex('username_1');
      console.log("Dropped old username index");
    } catch (e) {
      // Index doesn't exist, that's fine
    }
  })
  .catch(err => console.log("MongoDB error:", err));

// User Model
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
}));

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Register attempt:", { name, email });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "USER_EXISTS" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    console.log("User registered successfully:", email);
    res.json({ message: "REGISTER_SUCCESS" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "SERVER_ERROR" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "USER_NOT_FOUND" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "WRONG_PASSWORD" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ 
      message: "LOGIN_SUCCESS", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "SERVER_ERROR" });
  }
});

// PROTECTED
app.get("/profile", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  res.json({ userId: decoded.id });
});

app.listen(process.env.PORT, () =>
  console.log("Server running")
);
