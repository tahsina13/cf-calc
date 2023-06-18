import enqueueRequest from "./timedRequest";

let memContest = null; 
let memRatingChanges = null; 
let memStandings = null; 
const memRanks = Array(8001); 

class Contestant {
  constructor(handle, rating, points, penalty) {
    this.handle = handle; 
    this.rating = rating; 
    this.points = points; 
    this.penalty = penalty; 
    this.rank = 0; 
    this.seed = 0; 
    this.needRating = 0; 
    this.delta = 0; 
    this.performance = 0; 
  }
}; 

function getEloWinProbability(ra, rb) {
  return 1.0 / (1 + Math.pow(10, (rb - ra) / 400.0)); 
}

function getSeed(contestants, rating) {
  if(!memRanks[rating]) {
    memRanks[rating] = contestants.reduce((acc, cur) => acc + getEloWinProbability(cur.rating, rating), 1);
  }
  return memRanks[rating]; 
}

function getRatingToRank(contestants, rank) {
  let left = 1, right = 8000; 
  while(right - left > 1) {
    const mid = Math.floor((left + right) / 2); 
    if(getSeed(contestants, mid) < rank) {
      right = mid; 
    } else {
      left = mid; 
    }
  }
  return left; 
}

function compareContestants(type, ca, cb) {
  if(type === 'CF') {
    return ca.points - cb.points; 
  } else {
    if(ca.points !== cb.points) {
      return ca.points - cb.points; 
    } else {
      return cb.penalty - ca.penalty; 
    }
  }
}

function reassignRanks(type, contestants) {
  contestants.sort((ca, cb) => -compareContestants(type, ca, cb));
  let first = 0; 
  for(let i = 1; i < contestants.length; ++i) {
    if(compareContestants(type, contestants[first], contestants[i])) {
      for(let j = first; j < i; ++j) {
        contestants[j].rank = i; 
      }
      first = i; 
    }
  }
  for(let i = first; i < contestants.length; ++i) {
    contestants[i].rank = contestants.length; 
  }
  return contestants; 
}

function adjustRatingChanges(contestants) {
  contestants.sort((a, b) => b.rating - a.rating); 
  const allSum = contestants.reduce((acc, cur) => acc + cur.delta, 0); 
  const allInc = Math.trunc(-allSum / contestants.length) - 1; 
  contestants.forEach(elem => elem.delta += allInc); 

  const topCount = Math.min(contestants.length, 4 * Math.round(Math.sqrt(contestants.length)));     
  const topSum = contestants.slice(0, topCount).reduce((acc, cur) => acc + cur.delta, 0); 
  const topInc = Math.min(Math.max(Math.trunc(-topSum / topCount), -10), 0); 
  for(let i = 0; i < topCount; i++) {
    contestants[i].delta += topInc; 
  }
  return contestants.sort((a, b) => a.rank - b.rank); 
}

export default async function getRatingChange(handle, contestId, oldRating, points, penalty) {
  try {
    if(!memContest || memContest.id !== contestId) {
      const standings = await enqueueRequest(
        `https://codeforces.com/api/contest.standings?` + 
        `contestId=${contestId}&showUnofficial=true`
      ).ready;   
      if(standings.status === 'FAILED') {
        throw Error(standings.comment); 
      }
      const ratingChanges = await enqueueRequest(
        `https://codeforces.com/api/contest.ratingChanges?contestId=${contestId}`
      ).ready; 
      if(ratingChanges.status === 'FAILED') {
        throw Error(ratingChanges.comment); 
      }
      if(!ratingChanges.result.length) {
        throw Error('No rating changes found. Presumably rolled back or not updated yet.'); 
      }
      standings.result.rows.sort((a, b) => {
        if(a.rank === b.rank) {
          return a.party.members[0].handle.localeCompare(b.party.members[0].handle); 
        } else {
          return a.rank - b.rank; 
        }
      }); 
      ratingChanges.result.sort((a, b) => {
        if(a.rank === b.rank) {
          return a.handle.localeCompare(b.handle); 
        } else {
          return a.rank - b.rank; 
        }
      }); 
      memContest = standings.result.contest; 
      memRatingChanges = ratingChanges.result; 
      memStandings = []; 
      let cur = 0; 
      for(const row of standings.result.rows) {
        if(cur < memRatingChanges.length && memRatingChanges[cur].handle === row.party.members[0].handle) {
          row.rank = memRatingChanges[cur].rank; 
          memStandings.push(row); 
          cur++; 
        }
      }   
      memRanks.fill(0); 
    }
  } catch(err) {
    memContest = null; 
    throw err; 
  }
   
  const contestants = []; 
  for(let i = 0; i < memRatingChanges.length; ++i) {
    if(memRatingChanges[i].handle !== handle) {
      contestants.push(new Contestant(
        memRatingChanges[i].handle, memRatingChanges[i].oldRating, 
        memStandings[i].points, memStandings[i].penalty));     
    }
  }
  contestants.push(new Contestant(handle, oldRating, points, penalty)); 
  reassignRanks(memContest.type, contestants); 
  for(const c of contestants) {
    c.seed = getSeed(contestants, c.rating) - 0.5; 
    const midRank = Math.sqrt(c.rank * c.seed); 
    c.needRating = getRatingToRank(contestants, midRank); 
    c.delta = Math.trunc((c.needRating - c.rating) / 2); 
    c.performance = getRatingToRank(contestants, c.rank); 
  }
  return adjustRatingChanges(contestants).find((elem) => elem.handle === handle); 
}
