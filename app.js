const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = 'TV_Views';
const COLLECTION_NAME = 'Searches';

const client = new MongoClient(MONGODB_URI,{family:4});

const host = 'localhost';
const port = 8080;

app.listen(port,() => {
    console.log(`listening on http://${host}: ${port}`);
});

const requestTime = function(req, res, next) {
    console.log(`url: ${req.url}, time: ${new Date(Date.now())}`);
    next();
}

app.use(requestTime);

app.use(bodyParser.json());

app.all('/',(req, res) => {
    res.send('The routing you sent is incorrect');
})

app.get('/hello',(req, res) => {
    res.status(200).send("Hello");
})


// Function to update or insert user searches
async function updateUserSearches(userId, searchPhrase, date) {
    try {
        //Connect to DB
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Find if user already exists
        const userSearches = await collection.findOne({ userId });

        if (userSearches) {
            // Update user searches
            const index = userSearches.searches.length;
            await collection.updateOne({ userId }, { $push: { searches: { searchPhrase, date, index } } });
        } 
        else {
            // Insert new user searches
            await collection.insertOne({ userId, searches: [{ searchPhrase, date, index: 0 }] });
        }
        //Close DB
        client.close();
    }
    catch (err) {
        throw new Error('Error updating user searches: ' + err.message);
    }
}

// POST route to save search data to MongoDB
app.post('/lastSearch', async (req, res) => {
    const { userId, searchPhrase } = req.body;

    if (!userId || !searchPhrase) {
        return res.status(400).send('Both userId and searchPhrase are required');
    }

    const date = new Date(Date.now());

    try {
        await updateUserSearches(userId, searchPhrase, date);
        res.status(201).send('Search saved successfully');
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error saving search');
    }
});