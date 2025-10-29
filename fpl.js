function getAllLeagueTeamIDs(leagueID){
    return fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueID}/standings/?page_new_entries=1&page_standings=1&phase=1`, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\""        
        },
        "body": null,
        "method": "GET"
      })
      .then(response => response.json())
      .then((jsonResult) => {
        const teams = jsonResult.standings.results;
        const teamIDs = teams.map(entry => {return {teamName: entry.player_name, teamID: entry.entry, rank: entry.rank};});
        return teamIDs;
      });
}

function getTeamRoster(teamID, week, playerDirectory){
   
      return fetch(`https://fantasy.premierleague.com/api/entry/${teamID}/event/${week}/picks/`, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\""
        },
        "body": null,
        "method": "GET"
      })
      .then(httpres => httpres.json())
      .then(jsonres => {
        const fullRoster = jsonres.picks;
        const teamRoster = fullRoster.map(entry => {
            return {playerID: entry.element, playerName: playerDirectory.get(entry.element), playerPosition: entry.position};
        })
        return teamRoster;
      })
      .catch(() => console.log("Not able to get rosters"));
}

function getPlayerDirectory(){
  return fetch(`https://fantasy.premierleague.com/api/bootstrap-static`, {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\""
    },
    "body": null,
    "method": "GET"
  })
  .then(httpres => httpres.json())
  .then(jsonres => {
    const playerDirectory = new Map();
    jsonres.elements.forEach(player => {
      playerDirectory.set(player.id, `${player.first_name} ${player.second_name}`);
    });
    const currentGW = jsonres.events.find(event => event.is_current);
    return {playerDirectory: playerDirectory, currentGW: currentGW.id};
  });

        
}

function getTeamTransfers(playerDirectory, teamID){
  return fetch(`https://fantasy.premierleague.com/api/entry/${teamID}/transfers/`, {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\""
    },
    "body": null,
    "method": "GET"
  })
  .then(httpres => httpres.json())
  .then(jsonres => jsonres)
  .then(transfers => {
    const transferList = [];
    transfers.forEach(transfer => {
      transferList.push({in: playerDirectory.get(transfer.element_in), out: playerDirectory.get(transfer.element_out), event: transfer.event});
    });
    return transferList;
  });

}
function processLeagueTeams(leagueID, playerDirectory){

  return getAllLeagueTeamIDs(leagueID)
  .then(teams => {
    return ((teams) => {
      let getRosterPromises = [];
      
      teams.forEach(team => {
        //console.log(team.teamName);
        //getRosterPromises.push(getTeamRoster(team.teamID));
        let fullSquadPromise = new Promise(resolve => {
          getTeamRoster(team.teamID, playerDirectory)
          .then(roster => {
            resolve({manager: team.teamName, squad:roster});
          });
        });
        getRosterPromises.push(fullSquadPromise);
      });
      return Promise.all(getRosterPromises)
      .then(squads => {
        // console.log(calculatePlayerDistibutionInSquads(squads));
        return calculatePlayerDistibutionInSquads(squads);
      });
    })(teams);
  })
}

function calculatePlayerDistibution(players){
  const playerDist = new Map();
  players.forEach((id) => {
    if (playerDist.has(id)) {
      const idCount = playerDist.get(id) + 1;
      playerDist.set(id, idCount);
    }
    else {
      playerDist.set(id, 1)
    };
  });
  console.log(`Number of individual players selected is ${playerDist.size}`);
  console.log(playerDist);

  let flatMap = [...playerDist.entries()];
  flatMap.sort((a, b) => b[1] - a[1]);
  const sortedMap = new Map(flatMap);
  console.log("Sorted player distribution");
  console.log(sortedMap);
}
//roster.forEach

function calculatePlayerDistibutionInSquads(squads) {
  const playerDist = new Map();
  squads.forEach(squad => {
    squad.squad.forEach(player => {
      if (playerDist.has(player.playerID)) {
        let tempPlayer = playerDist.get(player.playerID);
        tempPlayer.managers.push(squad.manager);
        tempPlayer.count += 1;
      }
      else {
        playerDist.set(player.playerID, {playerName: player.playerName, count: 1, managers: [squad.manager]});
      }
    });
  });

  const sortingHat = [...playerDist.entries()];
  sortingHat.sort((a,b) => b[1].count - a[1].count);
  const sortedPlayerDist = new Map(sortingHat);

  return sortedPlayerDist;
}

//https://fantasy.premierleague.com/api/bootstrap-static/

    // promiseArray.forEach(element => {
    //   element.squad.then(squad => {
    //     console.log(element.manager);
    //     console.log(squad);
    //   });
    // });

    // Promise.all(promises)
    // .then(squads => {

    //   const squadMap = calculatePlayerDistibutionInSquads(promiseArray);
    //   console.log(squadMap);
    // })

    // Promise.all(promiseArray)
    // .then(rosters => {
    //   console.log(rosters);
    //   console.log("Fully Resolved");
    // });

export {getAllLeagueTeamIDs, getTeamRoster, getPlayerDirectory, getTeamTransfers, calculatePlayerDistibutionInSquads, processLeagueTeams};