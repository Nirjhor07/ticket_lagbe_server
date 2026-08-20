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
