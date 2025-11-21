// web-service.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5555;

// middleware
app.use(cors());
app.use(express.json());

// serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// === MONGO SETUP ===
const uri = process.env.MONGODB_URI;      // from .env
const DB_NAME = "photography";           // 👈 your DB name
const COLLECTION_NAME = "res";           // 👈 your collection name

let client;
let reservationsCollection;

async function start() {
  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME);
    reservationsCollection = db.collection(COLLECTION_NAME);

    console.log("Connected to MongoDB:", DB_NAME, "/", COLLECTION_NAME);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}
start();

// optional health check
app.get("/api", (req, res) => res.send("API running"));

// ==== ROUTES ====

// CREATE reservation
app.post("/create", async (req, res) => {
  try {
    console.log("CREATE body:", req.body);
    const result = await reservationsCollection.insertOne(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).send("Error creating reservation");
  }
});

// GET reservations for a given email
app.get("/my/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log("MY for email:", email);
    const docs = await reservationsCollection.find({ email }).toArray();
    res.json(docs);
  } catch (err) {
    console.error("Error retrieving reservations:", err);
    res.status(500).send("Error retrieving reservations");
  }
});

// UPDATE first reservation for an email
app.put("/update-one", async (req, res) => {
  try {
    const { email, updates } = req.body;
    console.log("UPDATE for email:", email, "updates:", updates);

    const result = await reservationsCollection.updateOne(
      { email },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Not found");
    }

    res.json({ message: "Updated" });
  } catch (err) {
    console.error("Error updating reservation:", err);
    res.status(500).send("Error updating reservation");
  }
});

// DELETE first reservation for an email
app.delete("/delete-one", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("DELETE for email:", email);

    const result = await reservationsCollection.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).send("Not found");
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).send("Error deleting reservation");
  }
});

// cleanup
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  if (client) await client.close();
  process.exit(0);
});