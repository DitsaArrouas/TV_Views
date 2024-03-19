const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = 'TV_Views';
const COLLECTION_NAME = 'Searches';

const mongoClient = new MongoClient(MONGODB_URI,{family:4});

// Function to insert user searches
async function updateUserSearches(userId, searchPhrase, date) {
    try {
        //Connect to DB
        await mongoClient.connect();
        const db = mongoClient.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        await collection.insertOne({ userId, searchPhrase, date });
    }
    catch (err) {
        throw new Error('Error updating user searches: ' + err.message);
    }
    finally {
        await mongoClient.close();
    }
}

// Check MongoDB connection status
async function checkDBConnection() {
    try {
        await mongoClient.connect();
        return true; // Connection successful
    }
    catch (error) {
        return false; // Connection failed
    }
    finally {
        await mongoClient.close();
    }
}


// Define the route handler function
async function getLastNSearches(userId, limit) {
    try {
        await mongoClient.connect();
        const db = mongoClient.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // Get date 14 days ago
    
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
        await mongoClient.close();
    }
}

async function getMostPopularSearches(limit) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7); // Get date 7 days ago

    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.aggregate([
        { $match: { date: { $gte: weekAgo } } }, // Filter searches from the last 7 days
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