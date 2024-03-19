const express = require('express');
const app = express();

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

app.all('/',(req, res) => {
    res.send('The routing you sent is incorrect');
})

app.get('/hello',(req, res) => {
    res.status(200).send("Hello");
})