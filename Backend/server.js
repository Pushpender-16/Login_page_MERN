
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from 'dns';

// Change DNS
dns.setServers(["1.1.1.1","8.8.8.8"]);


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

// Rate Limiter
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

// MongoDB Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254
    },

    phone: {
        type: String,
        trim: true,
        maxlength: 20,
        default: ""
    },

    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000
    }

}, {
    timestamps: true
});

// MongoDB Model
const Contact = mongoose.model("Contact", contactSchema);

// Contact Form API
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
        if (
            !cleanName ||
            !cleanEmail ||
            !cleanSubject ||
            !cleanMessage
        ) {
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

// Start Server
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
