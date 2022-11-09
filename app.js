const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

let dataBase = null;

const initializeDBAndServer = async () => {
  try {
    dataBase = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started running at http://localhost/3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDBObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchDBObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

// GET ALL PLAYERS API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
        *
    FROM
        player_details;`;

  const playersArray = await dataBase.all(getPlayersQuery);
  response.send(
    playersArray.map((eachplayer) =>
      convertPlayerDBObjectToResponseObject(eachplayer)
    )
  );
});

// GET SPECIFIC PLAYER API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};`;

  const playerArray = await dataBase.get(getPlayerQuery);
  response.send(convertPlayerDBObjectToResponseObject(playerArray));
});

// UPDATE SPECIFIC PLAYER API
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET
        player_name = ${playerName}
    WHERE
        player_id = ${playerId};`;

  await dataBase.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// GET SPECIFIC MATCH API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};`;

  const matchArray = await dataBase.get(getMatchQuery);
  response.send(convertMatchDBObjectToResponseObject(matchArray));
});

// GET ALL PLAYER MATCHES API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
        match_details.match_id AS matchId,
        match_details.match AS match,
        match_details.year AS year
    FROM
        match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE 
        player_match_score.player_id = ${playerId};`;

  const playerMatchesArray = await dataBase.all(getPlayerMatchesQuery);
  response.send(playerMatchesArray);
});

// GET ALL MATCH PLAYERS API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
  SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName
  FROM
        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
  WHERE
        player_match_score.match_id = ${matchId};`;

  const matchPlayerArray = await dataBase.all(getMatchPlayersQuery);
  response.send(matchPlayerArray);
});

// GET ALL PLAYER MATCHES STATS API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesStatsQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM
        player_details INNER JOIN player_match_score 
        ON player_details.player_id = player_match_score.player_id
    WHERE 
        player_match_score.player_id = ${playerId};`;

  const playerMatchesStatsArray = await dataBase.all(
    getPlayerMatchesStatsQuery
  );
  response.send(playerMatchesStatsArray);
});

module.exports = app;
