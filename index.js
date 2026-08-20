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
      const result = await ticketsCollection.insertOne(ticket);
      //   console.log(`A document was inserted with the _id: ${result.insertedId}`);
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
