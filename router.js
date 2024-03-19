const express = require('express');
const app = express();
const router = express.Router();
const controller = require("./controller.js");
const bodyParser = require('body-parser');

router.use(bodyParser.json());

router.get('/hello',(req, res) => {
    res.status(200).send("Hello");
})

// POST route to save search data to MongoDB
router.post('/lastSearch', async (req, res) => {
    const { userId, searchPhrase } = req.body;

    if (!userId || !searchPhrase) {
        return res.status(400).send('Both userId and searchPhrase are required');
    }

    const date = new Date(Date.now());

    try {
        await controller.updateUserSearches(userId, searchPhrase, date);
        res.status(201).send('Search saved successfully');
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error saving search');
    }
});

//API3_GET
// Health endpoint
router.get('/health', async (req, res) => {
    try {
        const isConnected = await controller.checkDBConnection();
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
router.get('/lastSearches', async (req, res) => {
    try {
        const userId = req.query.userId;
        const limit = parseInt(req.query.limit);

        const lastSearches = await controller.getLastNSearches(userId, limit);

        res.status(200).send(lastSearches); // Connection to DB is OK empty response body
    }
    catch (error) {
        console.error('Error checking DB connection:', error);
        res.status(500).send('Internal server error');
    }
});

//API4_GET the most popular search and number of hits for that search
router.get('/mostPopular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit);

        const mostPopular = await getMostPopularSearches(limit);

        res.status(200).send(mostPopular); // Connection to DB is OK empty response body
    }
    catch (error) {
        console.error('Error checking DB connection:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;