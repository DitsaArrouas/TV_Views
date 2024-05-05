const express = require('express');
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = 'TV_Views';
const COLLECTION_NAME = 'Searches';

const mongoClient = new MongoClient(MONGODB_URI,{family:4});
mongoClient.connect();   
const db = mongoClient.db(DB_NAME);
const collection = db.collection(COLLECTION_NAME);

async function createUsersIndex() {
    try {
        // Create index on userId and date fields
        await collection.createIndex({ userId: 1, date: -1 });
    } 
    catch (error) {
        console.error('Error creating index:', error);
        res.status(500).send('Internal server error');
    }
    finally {
        await mongoClient.close();
    }
}

async function createSearchesIndex() {
    try {
        // Create index on searchPhrases and date fields
        await collection.createIndex({ searchPhrases: 1, date: -1 });
    } 
    catch (error) {
        console.error('Error creating index:', error);
        res.status(500).send('Internal server error');
    }
    finally {
        await mongoClient.close();
    }
}

module.exports = {
    createUsersIndex,
    createSearchesIndex }