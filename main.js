const bodyParser = require("body-parser");
const express = require("express");
const server = express();

server.use(bodyParser.json());

server.get('/', async(req, res) => {
    res.send("Hello World");
});

server.listen(8080);