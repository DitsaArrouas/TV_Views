const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = 'TV_Views';
const COLLECTION_NAME = 'Searches';

const client = new MongoClient(MONGODB_URI,{family:4});

async function createUsersIndex() {
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

async function createSearchesIndex() {
    try {
        await client.connect();   
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        let count = 0;
        // Create index on userId and date fields
        await collection.createIndex({ searchPhrases: 1, date: -1 });
            //{data: {$gte: new Date(Date.now()).getDate() - 7} , count: count++});
    } 
    catch (error) {
        console.error('Error creating index:', error);
        res.status(500).send('Internal server error');
    }
    finally {
        await client.close();
    }
}

module.exports = {
    createUsersIndex,
    createSearchesIndex }