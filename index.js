const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
var cors = require('cors');
const jwt = require("jsonwebtoken");
const app = express();


// middlewire
app.use(cors());
app.use(express.json());
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
        const userCollection = client.db("contactManage").collection("users");
        const shareCollection = client.db("contactManage").collection("shares");


        // ACCESS KEY JWT START
        // app.post("/jwt", (req, res) => {
        //     const user = req.body;
        //     console.log(user);
        //     const token = jwt.sign(user, process.env.ACCESS_KEY_SECRET, { expiresIn: "1h" })
        //     res.send({ token });
        // })
        // ACCESS KEY JWT END




        //  *************** userCollection ***************
        app.post("/users", async (req, res) => {
            const body = req.body;
            // console.log(body);

            // chcek user exist
            const query = { email: body.email };
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "user already exist!" });
            }

            const options = {
                weekday: 'short',   // Example: "Fri"
                year: 'numeric',    // Example: "2023"
                month: 'long',     // Example: "August"
                day: 'numeric',     // Example: "25"
                hour: '2-digit',    // Example: "08"
                minute: '2-digit',  // Example: "27"
                second: '2-digit',  // Example: "45"
                timeZoneName: 'short'  // Example: "GMT+6"
            };

            const formattedDate = new Date().toLocaleString(undefined, options);

            const userInfo = {
                userName: body.userName,
                password: body.password,
                email: body.email,
                memberAt: formattedDate,
                userRole: body.role,
            };

            const result = await userCollection.insertOne(userInfo);
            res.send(result);
        });

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        app.get("/users-name-photo", async (req, res) => {
            const options = {
                projection: {
                    userName: 1,
                    profileImg: 1,
                    email: 1,
                },
            };

            try {
                const result = await userCollection.find({}, options).toArray();
                res.json(result);
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "Unable to fetch users" });
            }
        });

        app.put("/users/:email", async (req, res) => {
            const email = req.params.email;
            const body = req.body;
            console.log(body);
            const query = { email: email };
            const person = await userCollection.findOne(query);

            const updateDoc = {
                $set: {
                    profileImg: body.image
                },
            };

            const options = { upsert: true };
            const result = await userCollection.updateOne(person, updateDoc, options);
            res.send(result);
        })






        //  *************** shareCollection ***************

        // POST route for sharing contacts
        app.post('/share-contacts', async (req, res) => {
            const { shareData } = req.body;
            const { access_type, contact_ids, share_from, share_to } = shareData;

            // Check if a document with the same combination already exists
            const query = {
                share_from: share_from,
                'share_to.email': share_to.email,
            };

            const options = {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            const formattedDate = new Date().toLocaleString(undefined, options);
            
            const existingShare = await shareCollection.findOne(query);

            if (existingShare) {
                console.log('existingShare ase');
                // The combination already exists, so update the document
                const updatedContactIds = [...existingShare.contact_ids, ...contact_ids];
                const uniqueContactIds = [...new Set(updatedContactIds)]; // Ensure unique contact_ids

                try {
                    const result = await shareCollection.updateOne(query, {
                        $set: {
                            contact_ids: uniqueContactIds,
                            shareDate: formattedDate,
                            access_type: access_type
                        }, // Update contact_ids, shareDate, access_type
                    });

                    res.send(result);
                } catch (error) {
                    console.error("Error updating share:", error);
                    res.status(500).json({ error: "Unable to update share" });
                }
            } else {
                // The combination doesn't exist, so create a new document
                console.log("existing share nai");

                const newShare = {
                    access_type: access_type,
                    contact_ids: contact_ids, // Store contact_ids as provided
                    share_from: share_from,
                    share_to: share_to,
                    shareDate: formattedDate,
                };

                try {
                    const result = await shareCollection.insertOne(newShare);
                    res.send(result);
                } catch (error) {
                    console.error("Error inserting share:", error);
                    res.status(500).json({ error: "Unable to insert share" });
                }
            }
        });









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
                if (categoryName === "all") {
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





        //  *************** TOTAL COUNTS ***************
        app.get("/count", async (req, res) => {
            const totalContacts = (await contactCollection.countDocuments());
            const totalUsers = (await userCollection.countDocuments());
            res.json({
                totalContacts,
                totalUsers
            });
        });











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