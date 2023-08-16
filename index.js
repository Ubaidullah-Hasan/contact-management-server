const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
var cors = require('cors')


const app = express()
app.use(cors());
app.use(express.json())
const port = process.env.PORT || 4000;











//  MONGODB connection start ******************************

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.clipjzr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // contactManage
        // contacts

        const contactCollection = client.db("contactManage").collection("contacts");


        //  *************** contactCollection ***************
        app.post("/contacts", async(req, res)=>{
            const userInfo = req.body;
            console.log(userInfo)
            const data = {
                name: userInfo?.name,
                email: userInfo?.email,
                phone: userInfo?.number,
                image: userInfo?.imgURL,
            }
            const result = await contactCollection.insertOne(data);
            res.send(result);
        })





















    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

//  MONGODB connection end ******************************




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})