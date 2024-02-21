const bodyParser = require("body-parser");
const express = require("express");
const axios = require("axios");
require("dotenv").config();
require("log-timestamp");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const server = express();
const port = 8080;

server.use(cors({origin: true, credentials: true}));
server.use(cookieParser());
server.use(bodyParser.json());

server.get('/', async(req, res) => {
    res.send("wato API is running.");
});

server.post('/api/challenges', async(req, res) => {
    const { challenge, name, challengeStatus  } = req.body;

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
            return res.status(500).send("Internal Server Error");
        }
    } else {
        userId = req.cookies.id;
    }

    // Send request to game service
    try {
        const response = await axios.post(process.env.GAME_SERVICE_ADDR, { "challengerId": userId, challenge, challengeStatus });
        const gameId = response.data.id;
        console.log(`GATEWAY: Created challenge with id: ${gameId} from IP: ` + req.ip);
        res.send({ id: gameId });
    } catch (error) {
        console.error(`GATEWAY: failed to create challenge from IP: ${req.ip} with error: `, error.message);
        return res.status(500).send("Internal Server Error");
    }
});

server.get('/api/challenges/:id', async(req, res) => {
    const id = req.params.id;

    try {
        const response = await axios.get(process.env.GAME_SERVICE_ADDR + "/"+ id);

        // "security": don't send numbers to client if game isn't finished so cheaters can't read from js
        if (response.data.challengeStatus !== "GAME.FINISHED_SUCCESSFULLY_TITLE" ||
            response.data.challengeStatus !== "GAME.FINISHED_NOTHING_HAPPENS_TITLE" ) {
            delete response.data["challengerNumber"];
            delete response.data["challengeeNumber"];
        }

        // _id -> id
        delete Object.assign(response.data, {id: response.data._id })._id;

        try {
            const challengerUserResponse = await axios.get(process.env.USER_SERVICE_ADDR + "/"+
                response.data.challengerId);
            response.data.challengerName = challengerUserResponse.data.name;
        } catch {
            response.data.challengerName = "Unknown";
        }


        console.log(`GATEWAY: Fetched challenge with id: ${id} for IP: ` + req.ip);
        res.send(response.data);
    } catch (error) {
        console.error(`GATEWAY: failed to fetch challenge for IP: ${req.ip} with error: `, error.message);
        return res.status(500).send("Internal Server Error");
    }
});

server.listen(port, () => {
    console.log("GATEWAY: listening on port ", port);
});