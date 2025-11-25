require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5555;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const uri = process.env.MONGODB_URI;      
const DB_NAME = "photography";           
const COLLECTION_NAME = "res";           

let client;
let reservationsCollection;

async function start() {
  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME);
    reservationsCollection = db.collection(COLLECTION_NAME);

    console.log("Connected to MongoDB:", DB_NAME, "/", COLLECTION_NAME);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    console.log("Starting server WITHOUT database connection...");
  } finally {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
}

start();

app.get("/api", (req, res) => res.send("API running"));

app.post("/create", async (req, res) => {
  try {
    if (!reservationsCollection) {
      return res.status(500).send("Database not connected");
    }

    console.log("CREATE body:", req.body);
    const result = await reservationsCollection.insertOne(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).send("Error creating reservation");
  }
});

app.get("/my/:email", async (req, res) => {
  try {
    if (!reservationsCollection) {
      return res.status(500).send("Database not connected");
    }

    const email = req.params.email;
    console.log("MY for email:", email);
    const docs = await reservationsCollection.find({ email }).toArray();
    res.json(docs);
  } catch (err) {
    console.error("Error retrieving reservations:", err);
    res.status(500).send("Error retrieving reservations");
  }
});

app.put("/update-one", async (req, res) => {
  try {
    if (!reservationsCollection) {
      return res.status(500).send("Database not connected");
    }

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

app.delete("/delete-one", async (req, res) => {
  try {
    if (!reservationsCollection) {
      return res.status(500).send("Database not connected");
    }

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

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  if (client) await client.close();
  process.exit(0);
});