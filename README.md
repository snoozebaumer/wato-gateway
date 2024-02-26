# wato-gateway
Backend Gateway For ["What are the Odds"](https://github.com/snoozebaumer/wato).

## Project setup
1. Run the following command to install all dependencies:
```
npm install
```
2. Set up the corresponding microservices ([wato-game](https://github.com/snoozebaumer/wato-game), [wato-user](https://github.com/snoozebaumer/wato-user)) and run them.
3. Copy the `.env.example` file and rename it to `.env`. Then fill in the required environment variables.

## Run the gateway server
Run the following command to start the server:
```
npm run start
```
Now you can either use the frontend application ([wato-frontend](https://github.com/snoozebaumer/wato-game)) or curl / Postman to test the API.

## Run the whole backend stack at once
Run the following command to start the the whole backend application in docker (gateway, game, user):
```
docker compose up --build
````
this requires .env files to be present, as well as the microservices to be at ../wato-game and ../wato-user.

## API Documentation
| # | Endpoint                                               | Method | Description                                                                                | Request Body                                                                                      | Response Body                                                                                                                                                                                                                                                                                                              |
|---|--------------------------------------------------------| ------ |--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | `/`                                                    | GET    | Get API Status                                                                             | -                                                                                                 | "wato API is running."                                                                                                                                                                                                                                                                                                     |
| 2 | `/api/challenges`                                      | POST   | Create Challenge                                                                           | `challenge` (string, required)<br>`name` (string, required)<br>`challengeStatus` (enum, required) | `id` (string)                                                                                                                                                                                                                                                                                                              |
| 3 | `/api/challenges/:id`<br>param: `id`(string, required) | GET    | Get Challenge by ID                                                                        | -                                                                                                 | `id` (string)<br>`challenge` (string)<br>`challengerId` (string)<br>`challengerName` (string)<br>`challengeeId` (string, optional)<br>`challengeeName` (string, optional)<br>`challengeStatus` (string)<br>`maxRange` (number, optional)<br>`challengerNumber` (number, optional)<br>`challengeeNumber` (number, optional) |
| 4 | `/api/challenges/:id`<br>param: `id`(string, required)                                  | PUT    | <br>Set Game number range for challenge by ID<br>**Prerequisite:**<br> challengeStatus: NEW | `maxRange` (number, required)<br>`challengeeName` (string, required)                                                                     | `id` (string)<br>`challengerId` (string)<br>`challengerName` (string)<br>`challengeeId` (string, optional)<br>`challengeeName` (string, optional)<br>`challengeStatus` (string)<br>`maxRange` (number, optional)<br>`challengerNumber` (number, optional)<br>`challengeeNumber` (number, optional)                         |
| 5 | `/api/challenges/:id`<br>param: `id`(string, required)                                  | PUT    | Update Challenge by ID<br>**Prerequisite:**<br> challengeStatus: GUESS_TO_BE_SET                                        | `challengeeNumber` (number, required)                      | `id` (string)<br>`challengerId` (string)<br>`challengerName` (string)<br>`challengeeId` (string, optional)<br>`challengeeName` (string, optional)<br>`challengeStatus` (string)<br>`maxRange` (number, optional)<br>`challengerNumber` (number, optional)<br>`challengeeNumber` (number, optional)                         |
| 4 | `/api/challenges/:id`<br>param: `id`(string, required)                                  | PUT    | Update Challenge by ID  <br>**Prerequisite:**<br> challengeStatus: CHALLENGER_TO_MOVE                                     | `challengerNumber` (number, required)                                                             | `id` (string)<br>`challengerId` (string)<br>`challengerName` (string)<br>`challengeeId` (string, optional)<br>`challengeeName` (string, optional)<br>`challengeStatus` (string)<br>`maxRange` (number, optional)<br>`challengerNumber` (number, optional)<br>`challengeeNumber` (number, optional)                         |
| 7 | `/api/user`                                            | GET    | Get Currently Logged in User                                                               | -                                                                                                 | `id` (string)<br>`name` (string)                                                                                                                                                                                                                                                                                           |


