const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

// adding google dns to resolve dns issues
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT;

const cors = require("cors");
// Middleware
app.use(cors());
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.get("/", (req, res) => {
  res.send("Hello World! from ticket lagbe server");
});

const uri = process.env.MONGO_BD_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// //jwt key set
// const JWKS = createRemoteJWKSet(
//   new URL(`${process.env.JWTKS_URL}/api/auth/jwks`),
// );

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //my collections
    const db = client.db(process.env.MONGODB_NAME);
    // collections for api
    const ticketsCollection = db.collection("tickets");
    const bookedTicketsCollection = db.collection("bookedTickets");
    const userTransitionCollection = db.collection("userTransition");

    // create ticket post apis
    app.post("/api/tickets", async (req, res) => {
      const ticket = req.body;
      const newTicket = {
        ...ticket,
        createdAt: new Date(),
      };
      const result = await ticketsCollection.insertOne(newTicket);
      //   console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.send(result);
    });

    // api to get vendors tickets
    app.get("/api/vendor/tickets", async (req, res) => {
      const query = {};
      if (req.query.vendorId) {
        query.vendorId = req.query.vendorId;
      }
      const result = await ticketsCollection.find(query).toArray();
      res.send(result);
    });

    // delete api to delete ticket by id
    app.delete("/api/vendor/tickets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ticketsCollection.deleteOne(query);
      res.send(result);
    });

    // api for update vendor ticket by vendor
    app.patch("/api/vendor/tickets/:id", async (req, res) => {
      const id = req.params.id;
      const updatedTicket = { ...req.body };

      // immutable fields
      delete updatedTicket._id;
      delete updatedTicket.updatedAt;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updatedTicket,
          updatedAt: new Date(),
        },
      };

      const result = await ticketsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // api to get all tickets by admin
    app.get("/api/admin/tickets", async (req, res) => {
      const result = await ticketsCollection.find({}).toArray();
      res.send(result);
    });

    // api to update ticket status by admin
    app.patch("/api/admin/tickets/update/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { status, advertisementStatus } = req.body;

        if (!id || !ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ error: "Invalid or missing ticket ID" });
        }

        // Dynamic update object
        const updateFields = {};

        if (status !== undefined) {
          updateFields.status = status;
        }

        if (advertisementStatus !== undefined) {
          updateFields.advertisementStatus = advertisementStatus;
        }

        // Checking if at least one field is provided
        if (Object.keys(updateFields).length === 0) {
          return res
            .status(400)
            .json({ error: "No valid fields provided for update" });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updateFields,
        };

        const result = await ticketsCollection.updateOne(query, updateDoc);
        return res.json(result);
      } catch (error) {
        console.error("Failed to update ticket status:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // all tickets where status is approved
    app.get("/api/all/tickets/approved", async (req, res) => {
      try {
        const result = await ticketsCollection
          .find({ status: "approved" })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch approved tickets:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // all tickets where status is active advertisementStatus is active
    app.get("/api/all/tickets/active", async (req, res) => {
      try {
        const result = await ticketsCollection
          .find({ advertisementStatus: "active" })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch active tickets:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // get single ticket for details by ticket id
    app.get("/api/tickets/:id", async (req, res) => {
      const { id } = req.params;
      // console.log("Fetching ticket with ID:", id);
      const query = { _id: new ObjectId(id) };
      const ticket = await ticketsCollection.findOne(query);
      res.send(ticket);
    });

    //api to post booked ticket by user
    app.post("/api/booked/tickets", async (req, res) => {
      const bookedTicket = req.body;
      const newBookedTicket = { ...bookedTicket, bookedAt: new Date() };
      const result = await bookedTicketsCollection.insertOne(newBookedTicket);
      res.send(result);
    });

    // get api for booked tickets by userId
    app.get("/api/my/booked/tickets", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.bookedBy = req.query.userId;
      }
      const result = await bookedTicketsCollection.find(query).toArray();
      res.send(result);
    });

    // api for get all booked tickets for vendor
    app.get("/api/vendor/booked/tickets", async (req, res) => {
      const query = {};
      if (req.query.vendorId) {
        query.vendorId = req.query.vendorId;
      }
      const result = await bookedTicketsCollection.find(query).toArray();
      res.send(result);
    });

    //api to update booked ticket status by vendor
    app.patch("/api/vendor/tickets/update/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { status: updatedStatus } = req.body;
        console.log(
          "Updating ticket with ID:",
          id,
          "to status:",
          updatedStatus,
        );

        if (!id || !ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ error: "Invalid or missing ticket ID" });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: updatedStatus,
          },
        };

        const result = await bookedTicketsCollection.updateOne(
          query,
          updateDoc,
        );
        return res.json(result);
      } catch (error) {
        console.error("Failed to update ticket status:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    //api to get all latest 6 tickets for home page
    app.get("/api/latest/tickets", async (req, res) => {
      try {
        const result = await ticketsCollection
          .find({})
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch latest tickets:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    //api for user transition collection
    app.post("/api/checkout_sessions", async (req, res) => {
      const sessionData = req.body;
      const newSession = { ...sessionData, createdAt: new Date() };
      const result = await userTransitionCollection.insertOne(newSession);
      res.send(result);
    });

    //api to get all the transition by userId
    app.get("/api/user/transition", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      const result = await userTransitionCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
