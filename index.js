const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
var cors = require('cors')
const jwt = require("jsonwebtoken");

const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}

const app = express()
app.use(cors());
app.use(express.json())
const port = process.env.PORT || 4000;





// Jwt verigy function
// const verifyJWT = (req, res, next) => {
//     console.log("hitting JWT")
//     const autorization = req.headers.autorization;
//     if (!autorization) {
//         return res.status(401).send({ error: true, message: "unautorized access" })
//     }
//     const token = autorization.split(" ")[1];
//     jwt.verify(token, process.env.ACCESS_KEY_SECRET, (error, decoded) => {
//         if (error) {
//             return res.status(401).send({ error: true, message: "unautorized access" })
//         }
//         req.decoded = decoded;
//         next();
//     })
// }








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

        // await client.connect();

        // contactManage
        // contacts

        const contactCollection = client.db("contactManage").collection("contacts");


        // ACCESS KEY JWT START
        // app.post("/jwt", (req, res) => {
        //     const user = req.body;
        //     console.log(user);
        //     const token = jwt.sign(user, process.env.ACCESS_KEY_SECRET, { expiresIn: "1h" })
        //     res.send({ token });
        // })
        // ACCESS KEY JWT END



        //  *************** contactCollection ***************
        app.post("/contacts", async (req, res) => {
            const userInfo = req.body;
            console.log(userInfo)
            const data = {
                name: userInfo?.name,
                email: userInfo?.email,
                phone: userInfo?.phone,
                image: userInfo?.image,
                category: userInfo?.category,
                timeAt: userInfo?.timeAt,
            }
            const result = await contactCollection.insertOne(data);
            res.send(result);
        })

        app.get("/contacts", async (req, res) => {
            const result = await contactCollection.find().toArray();
            res.send(result);
        })

        app.get("/contacts/search", async (req, res) => {
            try {
                const { query } = req.query;
                // console.log(query);

                if (query) {
                    const searchResult = await contactCollection.find({
                        name: { $regex: new RegExp(query, 'i') } // 'i' makes it case-insensitive
                    }).toArray();
                    res.send(searchResult);
                } else {
                    const searchResult = await contactCollection.find().toArray();
                    res.send(searchResult);
                }

            } catch (error) {
                console.error('Error searching contacts:', error);
                res.status(500).send({ error: 'Internal server error' });
            }
        });

        // total contacts
        app.get("/contacts/count", async (req, res) => {
            const totalCount = (await contactCollection.countDocuments());
            res.json({ totalCount });
        });

        app.get("/contacts/categories", async (req, res) => {
            try {
                const options = {
                    projection: { category: 1 }
                };
                const result = await contactCollection.find({}, options).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching categories:", error);
                res.status(500).send("Error fetching categories");
            }
        });

        app.get("/contacts/category/:categoryName", async (req, res) => {
            const { categoryName } = req.params;
            try {
                if(categoryName === "all"){
                    const result = await contactCollection.find({}).toArray();
                    return res.send(result);
                }
                const result = await contactCollection.find({ category: categoryName }).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching contacts by category:", error);
                res.status(500).send("Error fetching contacts by category");
            }
        });


        app.put("/contacts/:id", async (req, res) => {
            const id = req.params.id;
            const body = req.body;

            try {
                const filter = { _id: new ObjectId(id) };
                const update = {
                    $set: {
                        name: body.name,
                        email: body.email,
                        phone: body.phone,
                        category: body.category,
                    }
                };

                const result = await contactCollection.updateOne(filter, update);
                res.send(result);
            } catch (error) {
                console.error("Error updating contact:", error);
                res.status(500).send("Error updating contact");
            }
        });

        app.delete("/contacts/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await contactCollection.deleteOne(query);
            res.send(result);
        })




















        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

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