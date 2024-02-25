const bodyParser = require('body-parser');
const express = require('express');
const axios = require('axios');
require('dotenv').config();
require('log-timestamp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {ChallengeStatus} = require('./models/challenge-status');

const server = express();
const port = 8080;

server.use(cors({origin: 'http://localhost:4200', credentials: true}));
server.use(cookieParser());
server.use(bodyParser.json());

server.get('/', async (req, res) => {
    res.send('wato API is running.');
});

server.post('/api/challenges', async (req, res) => {
    const {challenge, name, challengeStatus} = req.body;

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
            res.cookie('id', userId, {httpOnly: false, sameSite: 'none', secure: true});
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
        const response = await axios.post(process.env.GAME_SERVICE_ADDR, {
            'challengerId': userId,
            challenge,
            challengeStatus
        });
        const gameId = response.data.id;
        console.log(`GATEWAY: Created challenge with id: ${gameId} from IP: ` + req.ip);
        res.send({id: gameId});
    } catch (error) {
        console.error(`GATEWAY: failed to create challenge from IP: ${req.ip} with error: `, error.message);
        return res.status(500).send('Internal Server Error');
    }
});

server.get('/api/challenges/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const response = await axios.get(process.env.GAME_SERVICE_ADDR + '/' + id);

        // "security": don't send numbers to client if game isn't finished so cheaters can't read from js
        if (response.data.challengeStatus !== ChallengeStatus.SUCCESS &&
            response.data.challengeStatus !== ChallengeStatus.FAILURE) {
            delete response.data['challengerNumber'];
            delete response.data['challengeeNumber'];
        }

        // _id -> id
        delete Object.assign(response.data, {id: response.data._id})._id;

        try {
            const challengerUserResponse = await axios.get(process.env.USER_SERVICE_ADDR + '/' +
                response.data.challengerId);
            response.data.challengerName = challengerUserResponse.data.name;
        } catch {
            response.data.challengerName = 'Unknown';
        }

        if (response.data.challengeeId) {
            try {
                const challengeeUserResponse = await axios.get(process.env.USER_SERVICE_ADDR + '/' +
                    response.data.challengeeId);
                response.data.challengeeName = challengeeUserResponse.data.name;
            } catch {
                response.data.challengeeName = 'Unknown';
            }
        }

        console.log(`GATEWAY: Fetched challenge with id: ${id} for IP: ` + req.ip);
        res.send(response.data);
    } catch (error) {
        console.error(`GATEWAY: failed to fetch challenge for IP: ${req.ip} with error: `, error.message);
        return res.status(500).send('Internal Server Error');
    }
});

server.put('/api/challenges/:id', async (req, res) => {
    const id = req.params.id;
    let challengeeId;

    // if range is provided, which means the challengee interacts with the game for the first time
    if(req.body.maxRange) {
        // Check if user exists, if not, try and create user
        if (!req.cookies || !req.cookies.id) {
            if (!req.body.challengeeName) {
                return res.status(400).send('Please provide username');
            }

            const name = req.body.challengeeName;

            try {
                const response = await axios.post(process.env.USER_SERVICE_ADDR, {name});
                challengeeId = response.data.id;
                res.cookie('id', challengeeId, {httpOnly: false, sameSite: 'none', secure: true});
                console.log(`GATEWAY: Created user: ${name} with id: ${challengeeId} from IP: ${req.ip}`);
            } catch (error) {
                console.error(`GATEWAY: failed to create user: ${name} from IP: ${req.ip} with error: ${error.message}`);
                return res.status(500).send('Internal Server Error');
            }
        } else {
            challengeeId = req.cookies.id;
        }
        delete req.body.challengeeName;
    }

    try {
        const response = await axios.put(process.env.GAME_SERVICE_ADDR + '/' + id,
            {...(challengeeId ? {challengeeId} : {}), ...req.body});

        try {
            const challenger = await axios.get(process.env.USER_SERVICE_ADDR + '/' +
                response.data.challengerId);
            response.data.challengerName = challenger.data.name;
        } catch (error) {
            response.data.challengerName = "Unknown";
        }


        if (response.data.challengeeId) {
            try {
                const challengeeUserResponse = await axios.get(process.env.USER_SERVICE_ADDR + '/' +
                    response.data.challengeeId);
                response.data.challengeeName = challengeeUserResponse.data.name;
            } catch {
                response.data.challengeeName = 'Unknown';
            }
        }


        console.log(`GATEWAY: Edited challenge with id: ${id} for IP: ` + req.ip);
        res.send(response.data);
    } catch (error) {
        console.error(`GATEWAY: failed to edit challenge for IP: ${req.ip} with error: `, error.message);
        return res.status(500).send('Internal Server Error');
    }
});

server.get('/api/user', async (req, res) => {
    if (!req.cookies || !req.cookies.id) {
        console.log(`GATEWAY: no cookie set for user for ip ${req.ip}.`)
        return res.status(404).send("User not found");
    }

    const id = req.cookies.id
    try {
        const response = await axios.get(process.env.USER_SERVICE_ADDR + '/' + id);
        console.log(`GATEWAY: fetched user ${id} for ip ${req.ip}.`);
        res.send(response.data);
    } catch (error) {
        console.error(`GATEWAY: failed to fetch user for IP: ${req.ip} with error: `, error.message);
        return res.status(500).send('Internal Server error');
    }
});

server.listen(port, () => {
    console.log('GATEWAY: listening on port ', port);
});