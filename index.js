const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express();
const port = process.env.port || 3500;

// Middleware procees
app.use(cors());
app.use(express.json());
console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kgrh0ns.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const verifyJWT =(req, res, next)=>{
      const authorization = req.headers.authorization;
      if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorized access'})
      }
      const token = authorization.split(' ')[1];
      console.log(token)
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
          if(error){
            return res.status(403).send({error: true, message: 'unauthorized access'})
          }
          req.decoded = decoded;
          next()
        })
    }
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const servicesCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");


    // JWT CODES
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({token})
    })


    // Services Routes
    app.get("/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      //   console.log(result);
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await servicesCollection.findOne(query, options);
      //   console.log(result);
      res.send(result);
    });


    // Bookings Routes
    app.get("/bookings", verifyJWT, async (req, res) => {
      
      console.log('came back');
      let query = {};
      if(req.query?.email){
        query= {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      //   console.log(result);
      res.send(result);
    });

     app.post("/bookings", async (req, res) => {
      const body = req.body;
      console.log(body);

      const result = await bookingCollection.insertOne(body);
      //   console.log(result);
      res.send(result);
    });

     app.delete("/bookings/:id", async (req, res)=>{
      const id = req.params.id;
      console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
     })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Routing proccess
app.get("/", (req, res) => {
  res.send("doctor server is running");
});

app.listen(port, () => {
  console.log(`doctor port satrt in port:  ${port}`);
});
