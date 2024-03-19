const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = 'TV_Views';
const COLLECTION_NAME = 'Searches';

const client = new MongoClient(MONGODB_URI,{family:4});

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

async function getMostPopularSearches(limit) {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Get date 7 days ago

    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.aggregate([
        { $match: { date: { $gte: date } } }, // Filter searches from the last 7 days
        { $group: { _id: '$searchPhrase', hits: { $sum: 1 } } }, // Count occurrences of each search phrase
        { $sort: { hits: -1 } }, // Sort by hits in descending order
        { $limit: limit } // Limit the results to the specified limit
    ]).toArray();

    return result.map(({ _id, hits }) => ({ searchPhrase: _id, hits }));
}

module.exports = {
    updateUserSearches,
    checkDBConnection,
    checkDBConnection,
    getLastNSearches,
    getMostPopularSearches }