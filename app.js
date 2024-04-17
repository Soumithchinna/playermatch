const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
const app = express()
app.use(express.json())

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running at http//:3000/')
    })
  } catch (e) {
    console.log(`Db Error:${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()
const convertPlayersDetailsToPascalCase = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const convertMatchDetailsToPascalCase = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
app.get('/players/', async (request, response) => {
  const getAllThePlayers = `
  SELECT
  *
  FROM
  player_details;`
  const playersArray = await db.all(getAllThePlayers)
  response.send(
    playersArray.map(eachItem => convertPlayersDetailsToPascalCase(eachItem)),
  )
})
app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getPlayer = `
  SELECT
  *
  FROM
  player_details
  WHERE
  player_id=${playerId};`
  const player = await db.get(getPlayer)
  response.send(convertPlayersDetailsToPascalCase(player))
})
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
  UPDATE
  player_details
  SET
  player_name='${playerName}'
  WHERE
  player_id=${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getAllMatches = `
  SELECT
  match_id AS matchId,
  match,
  year
  FROM
  match_details
  WHERE
  match_id=${matchId};`
  const match = await db.get(getAllMatches)
  response.send(match)
})
app.get('/players/:playerId/matches', async (request, response) => {
  const {player_id} = request.params
  const getPlayersMtchQuery = `
  SELECT
  *
  FROM
  player_match_score NATURAL JOIN match_details
  WHERE
  player_id=${player_id};`
  const playerMatches = await db.all(getPlayersMtchQuery)
  response.send(
    playerMatches.map(eachItem => convertMatchDetailsToPascalCase(eachItem)),
  )
})
app.get('/matches/:matchId/players', async (request, response) => {
  const {match_id} = request.params
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerMatches = await db.all(getMatchPlayersQuery)
  response.send(
    playerMatches.map(eachItem => convertPlayersDetailsToPascalCase(eachItem)),
  )
})
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayersQuery = `
  SELECT
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM
  player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id
  WHERE
  player_details.player_id=${playerId};`
  const playerScores = await db.get(getMatchPlayersQuery)
  response.send(playerScores)
})

module.exports = app
