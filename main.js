const bodyParser = require("body-parser");
const express = require("express");
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');

const server = express();

server.use(bodyParser.json());
server.use(cors());

server.get('/', async(req, res) => {
    res.send("Hello World");
});

server.post('/api/challenge', async(req, res) => {
    const { challenge, name } = req.body;

    // Send request to user service
    try {
        await axios.post(process.env.USER_SERVICE_ADDR, { name });
        console.log('User service responded successfully. Requesting IP: ' + req.ip);
    } catch (error) {
        console.error('Error in user service:', error.message);
        return res.status(500).send('Internal Server Error');
    }

    // Send request to game service
    try {
        await axios.post(process.env.GAME_SERVICE_ADDR, { challenge });
        console.log('Game service responded successfully. Requesting IP: ' + req.ip);
    } catch (error) {
        console.error('Error in game service:', error.message);
        return res.status(500).send('Internal Server Error');
    }

    res.send('Challenge and User created successfully');
});

server.listen(8080);