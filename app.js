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

        await collection.insertOne({ userId, searchPhrase, date });
    }
    catch (err) {
        throw new Error('Error updating user searches: ' + err.message);
    }
    finally {
        await client.close();
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

//API3_GET

// Check MongoDB connection status
async function checkDBConnection() {
    try {
        await client.connect();
        return true; // Connection successful
    }
    catch (error) {
        return false; // Connection failed
    }
    finally {
        await client.close();
    }
}

// Health endpoint
app.get('/health', async (req, res) => {
    try {
        const isConnected = await checkDBConnection();
        if (isConnected) {
            res.status(200).send(); // Connection to DB is OK empty response body
        } 
        else {
            res.status(500).send('Error connecting to DB');// Connection to DB is not OK error response body
        }
    }
    catch (error) {
        console.error('Error checking DB connection:', error);
        res.status(500).send('Internal server error');
    }
});

//API4_GET get the last N searches for user X

async function createIndex() {
    try {
        await client.connect();   
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Create index on userId and date fields
        await collection.createIndex({ userId: 1, date: -1 });
    } 
    catch (error) {
        console.error('Error creating index:', error);
        res.status(500).send('Internal server error');
    }
    finally {
        await client.close();
    }
}
// Call the function to create the index
createIndex();

// Define the route handler function
async function getLastNSearches(userId, limit) {
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Get the current date
        const currentDate = new Date(Date.now());
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(currentDate.getDate() - 14);

        // Retrieve last N searches for the user
        const documents = await collection.find({ userId: userId, date: {$gte: twoWeeksAgo }})
        .sort({ date: -1 })
        .limit(limit)
        .toArray();

        const searchPhrases = documents.map(doc => doc.searchPhrase);

        return `${userId}: ${searchPhrases}`;
    } 
    catch (error) {
        console.error('Error retrieving last N searches: ', error);
        throw new Error('Internal server error');
    }
    finally {
        await client.close();
    }
}

// Define the route for retrieving the N last searches for a user
app.get('/lastSearches', async (req, res) => {
    try {
        const userId = req.query.userId;
        const limit = parseInt(req.query.limit);

        const lastSearches = await getLastNSearches(userId, limit);

        res.status(200).send(lastSearches); // Connection to DB is OK empty response body
    }
    catch (error) {
        console.error('Error checking DB connection:', error);
        res.status(500).send('Internal server error');
    }
});