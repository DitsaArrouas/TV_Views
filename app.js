const express = require('express');
const app = express();
const indexes = require("./indexes");
const router = require("./router");

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

app.use("/", router);

// Call the functions to create the indexes
indexes.createUsersIndex();

indexes.createSearchesIndex();
