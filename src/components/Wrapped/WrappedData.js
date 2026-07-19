// ============================================================
// src/components/Wrapped/WrappedData.js
// ============================================================

const flagMap = {
  'مکزیک': 'mx', 'آفریقای جنوبی': 'za', 'کره جنوبی': 'kr', 'جمهوری چک': 'cz',
  'بوسنی و هرزگوین': 'ba', 'کانادا': 'ca', 'استرالیا': 'au', 'ترکیه': 'tr',
  'آلمان': 'de', 'کوراسائو': 'cw', 'هلند': 'nl', 'ژاپن': 'jp',
  'ساحل عاج': 'ci', 'اکوادور': 'ec', 'سوئد': 'se', 'تونس': 'tn',
  'اسپانیا': 'es', 'کیپ ورد': 'cv', 'بلژیک': 'be', 'مصر': 'eg',
  'عربستان': 'sa', 'اروگوئه': 'uy', 'فرانسه': 'fr', 'سنگال': 'sn',
  'عراق': 'iq', 'نروژ': 'no', 'اتریش': 'at', 'اردن': 'jo',
  'انگلیس': 'gb-eng', 'کرواسی': 'hr', 'غنا': 'gh', 'پاناما': 'pa',
  'پرتغال': 'pt', 'کنگو': 'cd', 'ازبکستان': 'uz', 'کلمبیا': 'co',
  'برزیل': 'br', 'مراکش': 'ma', 'قطر': 'qa', 'سوئیس': 'ch',
  'ایران': 'ir', 'نیوزیلند': 'nz', 'آرژانتین': 'ar', 'الجزایر': 'dz',
  'آمریکا': 'us', 'پاراگوئه': 'py', 'هائیتی': 'ht', 'اسکاتلند': 'gb-sct'
};

const knockoutTeams = [
  'کانادا', 'مراکش', 'پاراگوئه', 'فرانسه', 'برزیل', 'نروژ', 
  'مکزیک', 'انگلیس', 'پرتغال', 'اسپانیا', 'آمریکا', 'بلژیک', 
  'مصر', 'سوئیس', 'آرژانتین', 'کلمبیا'
];

// ============================================================
// ✅ تابع کمکی برای استخراج امتیاز (مقاوم در برابر نام‌های مختلف)
// ============================================================
const getPoints = (user) => {
  if (!user) return 0;
  const points = user.total_points ?? user.totalPoints ?? user.points ?? 0;
  return typeof points === 'number' && !isNaN(points) ? points : 0;
};

// ============================================================
// ✅ منطق رتبه‌بندی فشرده (Dense Ranking) - مقاوم‌سازی شده
// ============================================================
const getTrueRank = (points, leaderboard) => {
  if (!leaderboard || !Array.isArray(leaderboard) || leaderboard.length === 0) return 0;
  
  // استخراج امتیازها با متد مقاوم
  const validScores = leaderboard
    .map(u => getPoints(u))
    .filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
  
  if (validScores.length === 0) return 0;
  
  const uniqueHigherScores = new Set(validScores.filter(p => p > (points || 0)));
  return uniqueHigherScores.size + 1;
};

// ============================================================
// تابع اصلی تولید داده‌های کارنامه (Wrapped)
// ============================================================
export const generateWrappedData = (userId, matches, predictions, profiles, leaderboard) => {
  const finishedMatches = matches?.filter(m => m.home_score !== null && m.away_score !== null) || [];

  if (finishedMatches.length === 0 || !userId) {
    return getEmptyData(leaderboard);
  }

  const userData = leaderboard?.find(p => p.user_id === userId);
  const userPoints = getPoints(userData);
  const totalUsers = leaderboard?.length || 0;
  const userRank = getTrueRank(userPoints, leaderboard);

  // ====== محاسبه توزیع امتیازات ======
  let threes = 0, twos = 0, ones = 0, zeros = 0, missed = 0;
  const userPredictions = [];
  let bestMatch = null, worstMatch = null;
  let bestPoints = -1, worstError = -1;

  finishedMatches.forEach(m => {
    const pred = m.predictions?.find(p => p.user_id === userId);
    if (pred) {
      userPredictions.push({
        ...pred,
        matchId: m.id, homeTeam: m.home_team, awayTeam: m.away_team,
        homeScore: m.home_score, awayScore: m.away_score,
        advancedTeam: m.advanced_team, matchTime: m.match_time,
        allPredictions: m.predictions
      });
      
      const pts = pred.points_earned || 0;
      if (pts === 3) threes++; 
      else if (pts === 2) twos++; 
      else if (pts === 1) ones++; 
      else zeros++;

      // پیدا کردن بهترین پیش‌بینی
      const rarity = m.predictions?.filter(p => p.points_earned === 3).length || 0;
      if (pts > bestPoints || (pts === 3 && bestPoints === 3 && rarity < (bestMatch?.rarity || 999))) {
        bestPoints = pts;
        bestMatch = {
          homeTeam: m.home_team, awayTeam: m.away_team,
          homeScore: m.home_score, awayScore: m.away_score,
          predHome: pred.pred_home, predAway: pred.pred_away,
          points: pts, rarity: rarity
        };
      }

      // پیدا کردن بدترین سوتی
      const error = Math.abs(pred.pred_home - m.home_score) + Math.abs(pred.pred_away - m.away_score);
      if (error > worstError) {
        worstError = error;
        worstMatch = {
          homeTeam: m.home_team, awayTeam: m.away_team,
          homeScore: m.home_score, awayScore: m.away_score,
          predHome: pred.pred_home, predAway: pred.pred_away, error: error
        };
      }
    } else {
      missed++;
    }
  });

  // ====== محاسبه آمار کل کاربران ======
  const allUsersStats = leaderboard.map(u => {
    let t=0, tw=0, o=0, z=0, preds=0, draws=0;
    finishedMatches.forEach(m => {
      const p = m.predictions?.find(x => x.user_id === u.user_id);
      if (p) {
        preds++;
        const pts = p.points_earned || 0;
        if (pts === 3) t++; 
        else if (pts === 2) tw++; 
        else if (pts === 1) o++; 
        else z++;
        if (parseInt(p.pred_home) === parseInt(p.pred_away)) draws++;
      }
    });
    return { 
      userId: u.user_id, 
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'کاربر ناشناس', 
      threes: t, twos: tw, ones: o, zeros: z, 
      totalPreds: preds, drawsPredicted: draws 
    };
  });

  // ====== پیش‌بینی قهرمان ======
  const userProfile = profiles?.find(p => p.id === userId);
  const championPick = userProfile?.champion_prediction || userData?.champion_prediction || null;

  const aliveTeams = new Set(knockoutTeams);
  const finishedKnockoutMatches = matches?.filter(m => 
    m.home_score !== null && m.away_score !== null &&
    knockoutTeams.includes(m.home_team) && knockoutTeams.includes(m.away_team)
  ) || [];

  finishedKnockoutMatches.forEach(m => {
    if (parseInt(m.home_score) > parseInt(m.away_score)) {
      aliveTeams.delete(m.away_team);
    } else if (parseInt(m.away_score) > parseInt(m.home_score)) {
      aliveTeams.delete(m.home_team);
    } else {
      if (m.advanced_team === 'home') aliveTeams.delete(m.away_team);
      else if (m.advanced_team === 'away') aliveTeams.delete(m.home_team);
    }
  });
  const actualChampion = aliveTeams.size === 1 ? [...aliveTeams][0] : null;
  const isChampionCorrect = championPick && championPick === actualChampion;

  // ====== سناریوهای "اگه..." ======
  let extraPoints = 0;
  [...userPredictions]
    .filter(p => (p.points_earned || 0) < 3)
    .sort((a, b) => (a.points_earned || 0) - (b.points_earned || 0))
    .slice(0, 3)
    .forEach(p => extraPoints += (3 - (p.points_earned || 0)));
    
  const threeMorePoints = userPoints + extraPoints;
  const threeMoreRank = getTrueRank(threeMorePoints, leaderboard);

  const avgPointsEarned = userPredictions.length > 0 ? userPoints / userPredictions.length : 0;
  const noMissPoints = userPoints + (missed * avgPointsEarned);
  const noMissRank = getTrueRank(Math.round(noMissPoints), leaderboard);

  let drawPoints = 0;
  finishedMatches.forEach(m => { 
    if (m.home_score === m.away_score) drawPoints += 2; 
  });
  const drawRank = getTrueRank(drawPoints, leaderboard);

  // ====== ماژول‌های تحلیلی ======
  const achievements = getUserAchievements(userId, allUsersStats);
  const communityStats = getCommunityStats(leaderboard, allUsersStats);
  const mainRival = findMainRival(userId, leaderboard, finishedMatches);
  const predictionTwin = findPredictionTwin(userId, allUsersStats);
  const gamesToBeatTop = calculateGamesToBeatTop(userId, leaderboard, userPredictions);
  const championBonusEffect = calculateChampionBonusEffect(userId, leaderboard, isChampionCorrect);
  const rankTimeline = getRankTimeline(userId, matches, leaderboard);
  const teamBias = calculateTeamBias(userId, finishedMatches, userPredictions);
  const streakData = calculateStreaks(userPredictions);
  const riskProfile = calculateRiskProfile(userId, finishedMatches, userPredictions);

  return {
    user: {
      id: userId,
      first_name: userProfile?.first_name || userData?.first_name || '',
      last_name: userProfile?.last_name || userData?.last_name || '',
    },
    userRank, 
    totalUsers, 
    totalPoints: userPoints, 
    threes, twos, ones, zeros, missed, 
    bestMatch, 
    worstMatch,
    championPick, 
    isChampionCorrect, 
    actualChampion,
    ifScenarios: {
      threeMoreCorrect: { rank: threeMoreRank, points: Math.round(threeMorePoints) },
      noMiss: { rank: noMissRank, points: Math.round(noMissPoints) },
      alwaysDraw: { rank: drawRank, points: drawPoints }
    },
    achievements, 
    communityStats, 
    totalGames: finishedMatches.length, 
    mainRival, 
    predictionTwin, 
    gamesToBeatTop,
    championBonusEffect, 
    rankTimeline, 
    teamBias, 
    streakData, 
    riskProfile, 
    userPredictions
  };
};

// ============================================================
// توابع کمکی تحلیلی (همگی مقاوم‌سازی شده)
// ============================================================

// پیدا کردن همزاد پیش‌بینی
const findPredictionTwin = (userId, allUsersStats) => {
  const me = allUsersStats.find(u => u.userId === userId);
  if (!me || me.totalPreds < 5) return null;

  const myPcts = {
    t: me.totalPreds > 0 ? me.threes / me.totalPreds : 0, 
    tw: me.totalPreds > 0 ? me.twos / me.totalPreds : 0,
    o: me.totalPreds > 0 ? me.ones / me.totalPreds : 0, 
    z: me.totalPreds > 0 ? me.zeros / me.totalPreds : 0
  };

  let bestTwin = null;
  let minDiff = Infinity;

  allUsersStats.forEach(u => {
    if (u.userId === userId || u.totalPreds < 5) return;
    const uPcts = {
      t: u.totalPreds > 0 ? u.threes / u.totalPreds : 0, 
      tw: u.totalPreds > 0 ? u.twos / u.totalPreds : 0,
      o: u.totalPreds > 0 ? u.ones / u.totalPreds : 0, 
      z: u.totalPreds > 0 ? u.zeros / u.totalPreds : 0
    };
    
    const diff = Math.abs(myPcts.t - uPcts.t) + Math.abs(myPcts.tw - uPcts.tw) + 
                 Math.abs(myPcts.o - uPcts.o) + Math.abs(myPcts.z - uPcts.z);
    
    if (diff < minDiff) {
      minDiff = diff;
      bestTwin = u;
    }
  });

  if (bestTwin) {
    const similarity = Math.max(0, Math.min(100, 100 - (minDiff * 100 / 2)));
    return { name: bestTwin.name, similarity: Math.round(similarity) };
  }
  return null;
};

// دریافت آمار کلی
const getCommunityStats = (leaderboard, allUsersStats) => {
  let totalPredictions = 0;
  let totalPoints = 0;
  allUsersStats.forEach(u => {
    totalPredictions += u.totalPreds;
    totalPoints += (u.threes * 3) + (u.twos * 2) + (u.ones * 1);
  });

  const uniqueRanks = new Set(
    leaderboard.map(u => getPoints(u)).filter(p => p > 0)
  ).size;

  return { 
    totalPlayers: leaderboard?.length || 0, 
    totalPredictions, 
    avgPoints: totalPredictions > 0 ? (totalPoints / totalPredictions).toFixed(1) : 0,
    totalUniqueRanks: uniqueRanks
  };
};

// پیدا کردن رقیب اصلی
const findMainRival = (userId, leaderboard, finishedMatches) => {
  if (!leaderboard || leaderboard.length < 2) return null;
  const userData = leaderboard.find(u => u.user_id === userId);
  if (!userData) return null;

  let bestRival = null, bestScore = -Infinity;
  const userPoints = getPoints(userData);
  
  leaderboard.filter(u => u.user_id !== userId).forEach(rival => {
    let commonGames = 0, userWins = 0, rivalWins = 0, draws = 0;
    const rivalPoints = getPoints(rival);
    let pointsDiff = Math.abs(rivalPoints - userPoints);
    
    finishedMatches.forEach(m => {
      const userPred = m.predictions?.find(p => p.user_id === userId);
      const rivalPred = m.predictions?.find(p => p.user_id === rival.user_id);
      if (userPred && rivalPred) {
        commonGames++;
        const uPts = userPred.points_earned || 0;
        const rPts = rivalPred.points_earned || 0;
        if (uPts > rPts) userWins++;
        else if (rPts > uPts) rivalWins++;
        else draws++;
      }
    });

    const score = (commonGames * 2) - pointsDiff;
    if (score > bestScore) { 
      bestScore = score; 
      bestRival = { 
        ...rival, 
        commonGames, pointsDiff, userWins, rivalWins, draws,
        rank: getTrueRank(rivalPoints, leaderboard)
      }; 
    }
  });
  return bestRival;
};

// استخراج مدال‌ها
const getUserAchievements = (userId, allStats) => {
  const user = allStats.find(s => s.userId === userId);
  if (!user) return { earned: [], funBadges: [] };

  const earned = [];
  const funBadges = [];
  
  const maxThrees = Math.max(0, ...allStats.map(s => s.threes || 0));
  const maxTwos = Math.max(0, ...allStats.map(s => s.twos || 0));
  const maxOnes = Math.max(0, ...allStats.map(s => s.ones || 0));
  const maxZeros = Math.max(0, ...allStats.map(s => s.zeros || 0));
  const maxDraws = Math.max(0, ...allStats.map(s => s.drawsPredicted || 0));

  if (user.threes === maxThrees && maxThrees > 0) {
    earned.push({ title: 'تک‌تیرانداز 🎯', desc: `${user.threes} پیش‌بینی دقیق`, icon: '🎯' });
  }
  if (user.twos === maxTwos && maxTwos > 0) {
    earned.push({ title: 'خدای تفاضل ⚖️', desc: `${user.twos} پیش‌بینی با تفاضل درست`, icon: '⚖️' });
  }
  if (user.ones === maxOnes && maxOnes > 0) {
    earned.push({ title: 'پادشاه ۱ امتیازی 🐢', desc: `${user.ones} پیش‌بینی محتاطانه`, icon: '🐢' });
  }
  if (user.drawsPredicted === maxDraws && maxDraws > 0) {
    earned.push({ title: 'صلح‌طلب 🤝', desc: `${user.drawsPredicted} پیش‌بینی مساوی`, icon: '🤝' });
  }

  if (user.zeros === maxZeros && maxZeros > 0) {
    funBadges.push({ title: 'عاشق صفرها 👻', desc: 'بیشترین تخصص در حدس‌های کاملاً اشتباه', icon: '👻' });
  }
  if (user.drawsPredicted === 0 && user.totalPreds > 10) {
    funBadges.push({ title: 'دشمن مساوی ⚔️', desc: 'توی دیکشنری تو کلمه‌ای به اسم مساوی نیست', icon: '⚔️' });
  }
  if (user.totalPreds > 0 && user.totalPreds <= 10) {
    funBadges.push({ title: 'توریست جام 🧳', desc: 'فقط اومدی یه دوری بزنی و بری', icon: '🧳' });
  }
  if (funBadges.length === 0 && earned.length === 0) {
    funBadges.push({ title: 'شهروند عادی 🚶‍♂️', desc: 'نه خیلی خوب، نه خیلی بد. کاملاً معمولی!', icon: '🚶‍♂️' });
  }

  return { earned, funBadges };
};

// محاسبه تیم محبوب و منفور
const calculateTeamBias = (userId, finishedMatches, userPredictions) => {
  const teamPoints = {}, teamErrors = {}, teamCounts = {};
  
  userPredictions.forEach(pred => {
    const match = finishedMatches.find(m => m.id === pred.matchId);
    if (!match) return;
    
    const pts = pred.points_earned || 0;
    const error = Math.abs(pred.pred_home - match.home_score) + Math.abs(pred.pred_away - match.away_score);
    
    [match.home_team, match.away_team].forEach(team => {
      if (!teamCounts[team]) { 
        teamPoints[team] = 0; 
        teamErrors[team] = 0; 
        teamCounts[team] = 0; 
      }
      teamPoints[team] += pts;
      teamErrors[team] += error;
      teamCounts[team]++;
    });
  });
  
  const validTeams = Object.keys(teamCounts).filter(team => teamCounts[team] >= 3);
  let favoriteTeam = null, favoriteScore = -1, hatedTeam = null, hatedScore = -1;

  validTeams.forEach(team => {
    const avgPts = teamPoints[team] / teamCounts[team];
    const avgErr = teamErrors[team] / teamCounts[team];
    if (avgPts > favoriteScore) { 
      favoriteScore = avgPts; 
      favoriteTeam = team; 
    }
    if (avgErr > hatedScore) { 
      hatedScore = avgErr; 
      hatedTeam = team; 
    }
  });
  
  return {
    favorite: favoriteTeam,
    favoritePoints: favoriteTeam ? Math.round((teamPoints[favoriteTeam] / teamCounts[favoriteTeam]) * 10) / 10 : 0,
    hated: hatedTeam,
    hatedErrors: hatedTeam ? Math.round((teamErrors[hatedTeam] / teamCounts[hatedTeam]) * 10) / 10 : 0,
    hasEnoughData: validTeams.length >= 3
  };
};

const calculateStreaks = (userPredictions) => {
  if (!userPredictions || userPredictions.length === 0) {
    return { bestStreak: 0, worstStreak: 0, currentStreak: 0 };
  }
  
  const sorted = [...userPredictions].sort((a, b) => {
    const dateA = a.created_at || a.matchTime || 0;
    const dateB = b.created_at || b.matchTime || 0;
    return new Date(dateA) - new Date(dateB);
  });
  
  let bestStreak = 0, currentStreak = 0, currentDrought = 0, bestDrought = 0;
  
  sorted.forEach(p => {
    if ((p.points_earned || 0) >= 1) {
      currentStreak++; 
      bestStreak = Math.max(bestStreak, currentStreak); 
      currentDrought = 0;
    } else {
      currentStreak = 0; 
      currentDrought++; 
      bestDrought = Math.max(bestDrought, currentDrought);
    }
  });
  return { bestStreak, worstStreak: bestDrought, currentStreak };
};

const calculateRiskProfile = (userId, finishedMatches, userPredictions) => {
  let totalPlayed = 0, riskCount = 0;
  
  finishedMatches.forEach(m => {
    const userPred = userPredictions.find(p => p.matchId === m.id);
    if (!userPred) return;
    
    totalPlayed++;
    const userDir = userPred.pred_home > userPred.pred_away ? 'H' : 
                    userPred.pred_home < userPred.pred_away ? 'A' : 'D';
    
    if (m.predictions && m.predictions.length > 0) {
      let hCount = 0, aCount = 0, dCount = 0;
      m.predictions.forEach(p => {
        if (p.pred_home > p.pred_away) hCount++; 
        else if (p.pred_home < p.pred_away) aCount++; 
        else dCount++;
      });
      const maxVotes = Math.max(hCount, aCount, dCount);
      let majorityDir = 'D';
      if (maxVotes === hCount) majorityDir = 'H'; 
      else if (maxVotes === aCount) majorityDir = 'A';
      if (userDir !== majorityDir) riskCount++;
    }
  });
  
  const riskPercent = totalPlayed > 0 ? Math.round((riskCount / totalPlayed) * 100) : 0;
  const accuracy = userPredictions.length > 0 ? 
    Math.round((userPredictions.filter(p => (p.points_earned || 0) >= 1).length / userPredictions.length) * 100) : 0;
  
  let riskLabel = "محتاط 🐑", emoji = '🐑', color = 'text-slate-500';
  if (riskPercent >= 30) { 
    riskLabel = "شکارچی شگفتی‌ها 🐺"; 
    emoji = '🐺'; 
    color = 'text-rose-500'; 
  } else if (riskPercent >= 15) { 
    riskLabel = "متعادل ⚖️"; 
    emoji = '⚖️'; 
    color = 'text-amber-500'; 
  }
  
  return { 
    label: riskLabel, 
    emoji, 
    color, 
    riskPercent, 
    safePercent: 100 - riskPercent, 
    totalPredictions: totalPlayed, 
    upsetPredictions: riskCount, 
    accuracy 
  };
};

const calculateGamesToBeatTop = (userId, leaderboard, userPredictions) => {
  if (!leaderboard || leaderboard.length === 0) {
    return { gamesNeeded: 0, pointsDiff: 0, topUser: null };
  }
  
  const topPoints = Math.max(0, ...leaderboard.map(u => getPoints(u)));
  const topUser = leaderboard.find(u => getPoints(u) === topPoints);
  if (!topUser || topUser.user_id === userId) {
    return { gamesNeeded: 0, pointsDiff: 0, topUser: topUser };
  }

  const userPoints = getPoints(leaderboard.find(u => u.user_id === userId));
  const pointsDiff = topPoints - userPoints;
  const avgPoints = userPredictions.length > 0 ? 
    userPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0) / userPredictions.length : 1;
  
  return { 
    gamesNeeded: Math.ceil(pointsDiff / Math.max(avgPoints, 1)), 
    pointsDiff, 
    topUser 
  };
};

const calculateChampionBonusEffect = (userId, leaderboard, isChampionCorrect) => {
  const userData = leaderboard?.find(u => u.user_id === userId);
  if (!userData) return { bonusReceived: 0, rankWithBonus: 0 };
  
  const currentPoints = getPoints(userData);
  
  if (isChampionCorrect) {
    return { 
      bonusReceived: 5, 
      rankWithBonus: getTrueRank(currentPoints, leaderboard) 
    };
  }
  
  const newPoints = currentPoints + 5;
  return { 
    bonusReceived: 0, 
    rankWithBonus: getTrueRank(newPoints, leaderboard), 
    pointsWouldHave: newPoints 
  };
};

const getRankTimeline = (userId, matches, leaderboard) => {
  const sortedMatches = matches
    .filter(m => m.home_score !== null)
    .sort((a, b) => new Date(a.match_time) - new Date(b.match_time));
  
  const timeline = [];
  const cumulativePoints = {};
  leaderboard.forEach(u => cumulativePoints[u.user_id] = 0);
  
  sortedMatches.forEach((m, index) => {
    (m.predictions || []).forEach(p => {
      cumulativePoints[p.user_id] += (p.points_earned || 0);
    });
    const myPoints = cumulativePoints[userId] || 0;
    const rank = new Set(
      Object.values(cumulativePoints).filter(p => p > myPoints)
    ).size + 1;
    
    timeline.push({ 
      date: new Date(m.match_time).toLocaleDateString('fa-IR', {month:'short', day:'numeric'}), 
      rank, 
      matchNumber: index + 1 
    });
  });
  return timeline.slice(-12);
};

const getEmptyData = (leaderboard) => ({ 
  user: { first_name: '', last_name: '' }, 
  userRank: 0, 
  totalUsers: leaderboard?.length || 0, 
  totalPoints: 0, 
  threes: 0, 
  twos: 0, 
  ones: 0, 
  zeros: 0, 
  missed: 0, 
  bestMatch: null, 
  worstMatch: null, 
  championPick: null, 
  isChampionCorrect: false, 
  ifScenarios: { 
    threeMoreCorrect: { rank: 0, points: 0 }, 
    noMiss: { rank: 0, points: 0 }, 
    alwaysDraw: { rank: 0, points: 0 } 
  }, 
  achievements: { earned: [], funBadges: [] }, 
  communityStats: { 
    totalPlayers: 0, 
    totalPredictions: 0, 
    avgPoints: 0, 
    totalUniqueRanks: 0 
  }, 
  mainRival: null, 
  predictionTwin: null, 
  gamesToBeatTop: { gamesNeeded: 0, pointsDiff: 0, topUser: null }, 
  championBonusEffect: { bonusReceived: 0, rankWithBonus: 0 }, 
  rankTimeline: [], 
  teamBias: { 
    favorite: null, 
    favoritePoints: 0, 
    hated: null, 
    hatedErrors: 0, 
    hasEnoughData: false 
  }, 
  streakData: { bestStreak: 0, worstStreak: 0, currentStreak: 0 }, 
  riskProfile: { 
    label: 'محتاط 🐑', 
    emoji: '🐑', 
    color: 'text-slate-500', 
    riskPercent: 0, 
    safePercent: 0, 
    totalPredictions: 0, 
    upsetPredictions: 0, 
    accuracy: 0 
  }, 
  userPredictions: [] 
});
