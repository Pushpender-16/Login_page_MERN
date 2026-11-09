import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "dns";

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// ES Module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// Frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// Rate Limiters
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});


const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Try again later."
    }
});

// ---------------- Contact Schema & Model ----------------
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 }
}, {
    timestamps: true
});

const Contact = mongoose.model("Contact", contactSchema);

// ---------------- User Schema & Model (Login) ----------------
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
        match: [/^[^\s@]+@gmail\.com$/, "Only Gmail address is allowed."]
    },


    // Sample project: plain text password
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 16,
        validate: {
            validator: (value) => /[^A-Za-z0-9]/.test(value),
            message: "Password must contain at least one special character."
        }
    }
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

// ---------------- Contact Form API ----------------
app.post("/api/contact", contactLimiter, async (req, res) => {

    try {

        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof subject !== "string" ||
            typeof message !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid form details."
            });
        }

        // Clean data
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanSubject = subject.trim();
        const cleanMessage = message.trim();

        const cleanPhone =
            phone == null ? "" :
            typeof phone === "string" ? phone.trim() : null;

        if (cleanPhone === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number."
            });
        }

        // Empty field validation
        if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
            });
        }

        // Length validation
        if (
            cleanName.length > 100 ||
            cleanEmail.length > 254 ||
            cleanPhone.length > 20 ||
            cleanSubject.length > 150 ||
            cleanMessage.length > 3000
        ) {
            return res.status(400).json({
                success: false,
                message: "Input exceeds allowed length."
            });
        }

        // Save to MongoDB
        const newContact = await Contact.create({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            subject: cleanSubject,
            message: cleanMessage
        });

        return res.status(201).json({
            success: true,
            message: "Contact submitted successfully!",
            id: newContact._id
        });

    } catch (error) {

        console.error("Contact API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
    }
});

// ---------------- Login API ----------------
app.post("/api/login", loginLimiter, async (req, res) => {

    try {

        const { username, password } = req.body;

        // Type check
        if (typeof username !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Please enter valid login details."
            });
        }

        // Clean data (password ko trim nahi kar rahe)
        const cleanUsername = username.trim().toLowerCase();

        // Empty check
        if (!cleanUsername || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Length check
        if (
            cleanUsername.length < 3 ||
            cleanUsername.length > 30 ||
            password.length < 6 ||
            password.length > 16
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Find user
        const user = await User.findOne({ username: cleanUsername });

        // Plain text compare (sample project)
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            id: user._id,
            username: user.username
        });

    } catch (error) {

        console.error("Login API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
    }
});

// ---------------- Register API (user DB me add karne ke liye) ----------------
app.post("/api/register", registerLimiter, async (req, res) => {

    try {

        const { username, email, password, confirmPassword } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid details."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const newUser = await User.create({
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            password
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully!",
            id: newUser._id
        });

    } catch (error) {

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: field === "email"
                    ? "Email already registered."
                    : "Username already exists."
            });
        }

        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                success: false,
                message: firstError
            });
        }

        console.error("Register API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
    }
});

// ---------------- Start Server ----------------
const startServer = async () => {

    try {

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully!");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error("MongoDB Connection Failed:", error.message);

        process.exit(1);
    }
};

startServer();