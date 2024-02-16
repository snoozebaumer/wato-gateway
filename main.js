const bodyParser = require("body-parser");
const express = require("express");
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const server = express();
const port = 8080;

server.use(cors({origin: true, credentials: true}));
server.use(cookieParser());
server.use(bodyParser.json());

server.get('/', async(req, res) => {
    res.send("wato API is running.");
});

server.post('/api/challenge', async(req, res) => {
    const { challenge, name } = req.body;

    // input validation
    if (!challenge || !name) {
        return res.status(400).send('Bad Request');
    }

    let userId;

    // Check if user exists, if not create user
    if (!req.cookies || !req.cookies.id) {
        try {
            const response = await axios.post(process.env.USER_SERVICE_ADDR, {name});
            userId = response.data.id;
            res.cookie('id', userId, {httpOnly: true, sameSite: 'none', secure: true});
            console.log(`GATEWAY: Created user: ${name} with id: ${userId} from IP: ${req.ip}`);
        } catch (error) {
            console.error(`GATEWAY: failed to create user: ${name} from IP: ${req.ip} with error: ${error.message}`);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        userId = req.cookies.id;
    }

    // Send request to game service
    try {
        const response = await axios.post(process.env.GAME_SERVICE_ADDR, { "challenger": userId, challenge });
        const gameId = response.data.id;
        console.log("GATEWAY: Created challenge with id: ${gameId} from IP: " + req.ip);
        res.send({ id: gameId });
    } catch (error) {
        console.error("GATEWAY: failed to create challenge from IP: ${req.ip} with error: ", error.message);
        return res.status(500).send("Internal Server Error");
    }
});

server.listen(port, () => {
    console.log("GATEWAY: listening on port ", port);
});