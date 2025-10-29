import { getAllLeagueTeamIDs, getPlayerDirectory, getTeamRoster, getTeamTransfers } from "./fpl.js";
import OpenAI from "openai";
console.log("FPL AI - welcome");

const farmersLeagueID = 1504721;
const DCupLeagueID = 879533;

//const LeagueTeamSheet = getAllLeagueTeamIDs(farmersLeagueID);

// LeagueTeamSheet.then(teams => {console.log(teams)});

const myTeamID = 6182755;

// getPlayerDirectory().then(playerDirectory => {
//     getTeamTransfers(playerDirectory.playerDirectory, myTeamID).then(transferList => {
//         console.log(transferList);
//     });
// });

console.log(`here are the teams in D CUP. LeagueID is ${DCupLeagueID}`);
const listOfTeamsPromise = getAllLeagueTeamIDs(DCupLeagueID);
const playerDirectoryPromise = getPlayerDirectory();

//teamID: {name, roster, transfers}

//Note see in fpl.js :: process league teams. There I created a promise to create a new object 
//here i do the same thing but don't need to create a new promise explicitly.

Promise.all([listOfTeamsPromise, playerDirectoryPromise])
.then(([teamsInLeague, PlayerD]) => {
    
    const currentGW = PlayerD.currentGW;
    const rostersP = teamsInLeague.map(team => {
        return getTeamRoster(team.teamID, currentGW, PlayerD.playerDirectory)
        .then(roster => ({teamID: team.teamID, teamName: team.teamName, roster:roster, ranking:team.rank}));
    });
    const transfersP = teamsInLeague.map(team => {
        return getTeamTransfers(PlayerD.playerDirectory, team.teamID)
        .then(transfers => ({teamID: team.teamID, teamName:team.teamName, transfers:transfers}))
    });

    return Promise.all([Promise.all(rostersP), Promise.all(transfersP)])
    .then(([rosters,transfers]) => {
        const teamInformationPromise = new Map();
        rosters.forEach(roster => {
            teamInformationPromise.set(roster.teamID, {teamName:roster.teamName, roster:roster.roster, transfers:'', ranking:roster.ranking});
        });
        transfers.forEach(transfer => {
            teamInformationPromise.get(transfer.teamID).transfers = transfer.transfers;
        });
        return teamInformationPromise;
    });

})
.then(teamInfoMap => createPlayerOwnershipStatistics(teamInfoMap))
.then((stats) => {
    //Here we want to sort by stats.numTeams descending
    let flatMap = [...stats.entries()];
    flatMap.sort((a, b) => b[1].numTeams - a[1].numTeams);
    const sortedMap = new Map(flatMap);
    console.log("Player Ownership Statistics");
    console.log(sortedMap);
});
    
// .then(teamInfoMap => {
//     console.log(`Team Information Has been collected`);
//     teamInfoMap.forEach((team, teamID) => {
//         listRoster(team);
//     });
// });
console.log(`This message confirms that the promise waited to be resolved`);

//object {{teamName, roster, transfers}} team information map value ; key is teamID
//roster {playerID,playerName,playerPosition } roster object
//treansfers {}
//transfer {in, out, event} transfer object



function listRoster(teamInfo) {
    console.log(`Team Information for ${teamInfo.teamName}`);
    console.log(`Roster`);
    teamInfo.roster.forEach(player => console.log(`${player.playerName}`));
    teamInfo.transfers.forEach(transfer => console.log(`Player In: ${transfer.in} -> Player Out: ${transfer.out}`));
    console.log("*********************");
    
}

//Player ownership statistics
//key: playerName value: {numTeams, numTransfersIn, numTransfersOut, listOfTeams, playerID, playerRanking}

function createPlayerOwnershipStatistics(teamInfoMap) {
    const playerOwnershipMap = new Map();
    teamInfoMap.forEach((teamInfo, teamID) => {
        teamInfo.roster.forEach(player => {
            //playerOwnershipMap.has(player.playerName) ? playerOwnershipMap.get(player.playerName).numTeams++ : 
            if (playerOwnershipMap.has(player.playerName)) {
                playerOwnershipMap.get(player.playerName).numTeams++;
                playerOwnershipMap.get(player.playerName).playerID = player.playerID;
                playerOwnershipMap.get(player.playerName).listOfTeams.push(`teamName: ${teamInfo.teamName}, teamRank: ${teamInfo.ranking}`);
                playerOwnershipMap.get(player.playerName).playerRanking = player.ranking;
            }
            else {
                playerOwnershipMap.set(player.playerName, {numTeams: 1, numTransfersIn: 0, numTransfersOut: 0, listOfTeams: [`{teamName: ${teamInfo.teamName}, teamRank: ${player.ranking}}`], playerID: player.playerID});
            }
        });
        teamInfo.transfers.forEach(transfer => {
            playerOwnershipMap.has(transfer.in) ? playerOwnershipMap.get(transfer.in).numTransfersIn++ : playerOwnershipMap.set(transfer.in, {numTeams: 0, numTransfersIn: 1, numTransfersOut: 0, listOfTeams: [], playerID: ''});
            playerOwnershipMap.has(transfer.out) ? playerOwnershipMap.get(transfer.out).numTransfersOut++ : playerOwnershipMap.set(transfer.out, {numTeams: 0, numTransfersIn: 0, numTransfersOut: 1, listOfTeams: [], playerID: ''});
        });
    });

    return playerOwnershipMap;
    
}

// const client = new OpenAI();

// const response = await client.responses.create({
//     model: "gpt-5",
//     input: "Write a one-sentence bedtime story about a unicorn."
// });



// console.log(response.output_text);

//Keep this example for learning. Here I am nesting Promises, which is fine (see processLeagueTeams) but hard to reason with
//therefore bug prone. Like now, this code executes without resolution.
// Promise.all([listOfTeamsPromise, playerDirectoryPromise]).then(values => {
//     const listOfTeams = values[0];
//     const playerDirectory = values[1].playerDirectory;
//     const currentGW = values[1].currentGW;
//     let teamA = Promise.resolve(listOfTeams[0]);
//     let teamAInfo = teamA.then(team => {
//         let rosterP = getTeamRoster(team.teamID, currentGW, playerDirectory);
//         let transfersP = getTeamTransfers(playerDirectory, team.teamID);
//         Promise.all([rosterP, transfersP])
//         .then(values => {
//             return {ID: team.teamID, roster: values[0], transfers: values[1]}
//         });
//     }); 
//     teamAInfo.then(team => console.log(team));
// });

// Promise.all([listOfTeamsPromise, playerDirectoryPromise])
// .then(([teams, playerD]) => {
//     const rosterP = getTeamRoster(teams[0].teamID, playerD.currentGW, playerD.playerDirectory);
//     return rosterP.then(roster => ({teamInfo: teams[0], roster: roster}));
// })
// .then(team => console.log(team));








