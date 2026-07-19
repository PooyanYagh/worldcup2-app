import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MatchCard from './MatchCard';
import Confetti from 'react-confetti';
import { 
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  BarChart, Bar, CartesianGrid 
} from 'recharts';
import WrappedModal from './components/Wrapped/WrappedModal';

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

const getFlagUrl = (teamName) => {
  const code = flagMap[teamName];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

// ============================================================
// ✅ اینجا تابع getImageName رو اضافه کن
// ============================================================
const getImageName = (firstName, lastName) => {
  const key = `${firstName} ${lastName}`.trim();
  
  const nameMap = {
    // اسامی انگلیسی
    'Behnia Zamani': 'behnia-zamani',
    'Mojgan Naghavi': 'mojgan-naghavi',
    'Payam Naghavi': 'payam-naghavi',
    'Mohammad Amiri': 'mohammad-amiri',
    'Aria Yaghmaie': 'arya-yaghmaie',
    
    // اسامی فارسی
    'پویان یغمائیان': 'pooyan-yaghmaian',
    'آریا یغمائی': 'arya-yaghmaie',
    'محمد امیری': 'mohammad-amiri',
    'پیام نقوی': 'payam-naghavi',
    'مژگان نقوی': 'mojgan-naghavi',
    'بهنیا زمانی': 'behnia-zamani',
  };
  
  return nameMap[key] || key.replace(/ /g, '-').toLowerCase();
};

// لیست تیم‌های حاضر در مرحله حذفی
const knockoutTeams = [
  'کانادا', 'مراکش', 'پاراگوئه', 'فرانسه', 'برزیل', 'نروژ', 
  'مکزیک', 'انگلیس', 'پرتغال', 'اسپانیا', 'آمریکا', 'بلژیک', 
  'مصر', 'سوئیس', 'آرژانتین', 'کلمبیا'
];
// جایزه پیش‌بینی قهرمان
const CHAMPION_BONUS_POINTS = 5;

export default function Dashboard({ user, onLogout }) {
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastMatches, setShowPastMatches] = useState(false);
  const [showDailyLeaderboard, setShowDailyLeaderboard] = useState(false);
  
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [compareUserId, setCompareUserId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('analytics');

  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false);

  const [isTourneyModalOpen, setIsTourneyModalOpen] = useState(false);
  const [tourneyTab, setTourneyTab] = useState('summary');

  const [selectedTeamForHistory, setSelectedTeamForHistory] = useState(null);
  const [isTeamHistoryModalOpen, setIsTeamHistoryModalOpen] = useState(false);

  const [isStatsTableModalOpen, setIsStatsTableModalOpen] = useState(false);

  // استیت‌های پیش‌بینی قهرمان
  const [championPrediction, setChampionPrediction] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [savingChampion, setSavingChampion] = useState(false);
  const [showChampionAccordion, setShowChampionAccordion] = useState(false);
  const [showChampionAnalytics, setShowChampionAnalytics] = useState(false);

  // استیت‌های آنالیز قهرمان
  const [championAnalytics, setChampionAnalytics] = useState(null);
  const [eliminatedTeams, setEliminatedTeams] = useState([]);
  const [actualChampion, setActualChampion] = useState(null);

  // استیت‌های Wrapped
  const [showWrapped, setShowWrapped] = useState(null);
  const [hasSeenWrapped, setHasSeenWrapped] = useState(null);
  const [fullStoryUser, setFullStoryUser] = useState(null);

  // ددلاین قهرمان: شنبه ۱۳ تیر ۱۴۰۵ ساعت ۲۰:۳۰ ایران (17:00 UTC)
  const [nowTime, setNowTime] = useState(new Date());
  const CHAMPION_DEADLINE = new Date('2026-07-04T17:00:00Z');
  const isChampionDeadlinePassed = nowTime > CHAMPION_DEADLINE;

  // تاریخ آخرین بازی: ۲۸ تیر ۱۴۰۵ (2026-07-19)
  const LAST_MATCH_DATE = new Date('2026-07-19T23:59:59Z');

  const isAdmin = (user.first_name === 'پویان' && user.last_name === 'یغمائیان') || (user.first_name === 'Behnia' && user.last_name === 'Zamani');

  // ============================================================
  // ✅ useEffect اولیه - دریافت داده‌ها و تایمر
  // ============================================================
  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // ✅ fetchData با مدیریت خطا (try/catch)
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`*, predictions (id, user_id, pred_home, pred_away, pred_advanced_team, points_earned, profiles (first_name, last_name))`)
        .order('match_time', { ascending: true });

      if (matchesError) throw matchesError;

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false });

      if (leaderboardError) throw leaderboardError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, champion_prediction');

      if (profilesError) throw profilesError;

      if (matchesData) setMatches(matchesData);
      if (leaderboardData) setLeaderboard(leaderboardData);
      
      if (profilesData) {
        setAllProfiles(profilesData);
        const myProfile = profilesData.find(p => p.id === user.id);
        if (myProfile && myProfile.champion_prediction) {
          setChampionPrediction(myProfile.champion_prediction);
        } else if (!isChampionDeadlinePassed) {
          setIsChampionModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('خطا در دریافت اطلاعات! لطفاً صفحه را دوباره بارگذاری کنید.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ بررسی نمایش Wrapped - اصلاح شده برای نمایش به همه کاربران
  // ============================================================
  useEffect(() => {
    if (!loading && matches.length > 0 && user) {
      // کاربر تست
      const isTestUser = user.id === '23783761-4ad5-442f-8413-7498d510b552';
      
      // چک کن همه بازی‌ها تموم شده
      const allFinished = matches.every(m => m.home_score !== null && m.away_score !== null);
      const wrappedKey = `wrapped_seen_${user.id}`;
      const hasWrapped = localStorage.getItem(wrappedKey) === 'true';
      
      // ✅ حذف محدودیت ادمین - همه کاربران می‌توانند Wrapped را ببینند
      // شرط نمایش: یا کاربر تست هست یا همه بازی‌ها تموم شده
      const shouldShowWrapped = isTestUser || allFinished;
      
      if (shouldShowWrapped && !hasWrapped) {
        setShowWrapped(true);
        localStorage.setItem(wrappedKey, 'true');
        setHasSeenWrapped(false);
      } else {
        setHasSeenWrapped(hasWrapped);
      }
    }
  }, [loading, matches, user]);

  // ============================================================
  // ✅ محاسبه آنالیز قهرمان
  // ============================================================
  useEffect(() => {
    if (isChampionDeadlinePassed && allProfiles.length > 0 && matches.length > 0) {
      calculateChampionAnalytics();
    }
  }, [isChampionDeadlinePassed, allProfiles, matches]);

  const calculateChampionAnalytics = () => {
    // 1. پیدا کردن قهرمان واقعی
    const aliveTeams = new Set(knockoutTeams);
    const finishedKnockoutMatches = matches.filter(m => 
      m.home_score !== null && 
      m.away_score !== null && 
      knockoutTeams.includes(m.home_team) && 
      knockoutTeams.includes(m.away_team)
    );

    finishedKnockoutMatches.forEach(m => {
      if (m.home_score > m.away_score) {
        aliveTeams.delete(m.away_team);
      } else if (m.away_score > m.home_score) {
        aliveTeams.delete(m.home_team);
      }
    });

    const champion = aliveTeams.size === 1 ? [...aliveTeams][0] : null;
    setActualChampion(champion);

    // 2. لیست تیم‌های حذف شده
    const eliminated = new Set();
    finishedKnockoutMatches.forEach(m => {
      const loser = m.home_score > m.away_score ? m.away_team : m.home_score < m.away_score ? m.home_team : null;
      if (loser && knockoutTeams.includes(loser)) {
        eliminated.add(loser);
      }
    });
    setEliminatedTeams([...eliminated]);

    // 3. آمار انتخاب‌ها
    const predictions = allProfiles.filter(p => p.champion_prediction);
    const totalPredictions = predictions.length;
    
    const teamCounts = {};
    predictions.forEach(p => {
      const team = p.champion_prediction;
      if (team) {
        teamCounts[team] = (teamCounts[team] || 0) + 1;
      }
    });

    // 4. محاسبه درصدها
    const analyticsData = Object.keys(teamCounts).map(team => ({
      team,
      count: teamCounts[team],
      percentage: totalPredictions > 0 ? Math.round((teamCounts[team] / totalPredictions) * 100) : 0,
      isEliminated: eliminated.has(team),
      isAlive: !eliminated.has(team) && knockoutTeams.includes(team) && team !== champion,
      isChampion: team === champion,
      isUnderdog: teamCounts[team] === 1
    }));

    analyticsData.sort((a, b) => b.count - a.count);
    
    const correctPredictors = allProfiles.filter(p => 
      p.champion_prediction && p.champion_prediction === champion
    );
    
    setChampionAnalytics({
      totalPredictions,
      teams: analyticsData,
      aliveCount: analyticsData.filter(t => t.isAlive).length,
      eliminatedCount: analyticsData.filter(t => t.isEliminated).length,
      underdogs: analyticsData.filter(t => t.isUnderdog && t.isAlive),
      champion: champion,
      correctPredictors: correctPredictors,
      championBonus: CHAMPION_BONUS_POINTS
    });
  };

  const handleSaveChampion = async (team) => {
    if (isChampionDeadlinePassed) {
      alert('فرصت پیش‌بینی قهرمان به پایان رسیده است!');
      return;
    }
    
    setSavingChampion(true);
    const { error } = await supabase
      .from('profiles')
      .update({ champion_prediction: team })
      .eq('id', user.id);
      
    setSavingChampion(false);
    
    if (error) {
      alert('خطا در ثبت پیش‌بینی قهرمان!');
    } else {
      setChampionPrediction(team);
      setAllProfiles(prev => prev.map(p => p.id === user.id ? { ...p, champion_prediction: team } : p));
      setTimeout(() => setIsChampionModalOpen(false), 500);
    }
  };

  const getUserPrediction = (match) => match.predictions?.find(p => p.user_id === user.id);
  const myPoints = leaderboard.find(p => p.user_id === user.id)?.total_points || 0;

  // ============================================================
  // ✅ بررسی برف‌شادی با cleanup صحیح
  // ============================================================
  useEffect(() => {
    if (!loading && matches.length > 0) {
      const todayStr = new Date().toDateString();
      const celebratedKey = `celebrated_3pts_${user.id}_${todayStr}`;
      const hasCelebratedToday = localStorage.getItem(celebratedKey) === 'true';

      if (!hasCelebratedToday) {
        const todaysFinishedMatches = matches.filter(m => {
          if (m.home_score === null || m.away_score === null) return false;
          return new Date(m.match_time).toDateString() === todayStr;
        });

        const hasPerfectScoreToday = todaysFinishedMatches.some(m => {
          const pred = m.predictions?.find(p => p.user_id === user.id);
          return pred && pred.points_earned === 3;
        });

        if (hasPerfectScoreToday) {
          setShowConfetti(true);
          localStorage.setItem(celebratedKey, 'true');
          
          const timer = setTimeout(() => {
            setShowConfetti(false);
          }, 7000);
          
          return () => clearTimeout(timer);
        }
      }
    }
  }, [loading, matches, user.id]);

  // ============================================================
  // ✅ رتبه‌بندی با Dense Ranking
  // ============================================================
  let currentRank = 1;
  let previousPoints = null;
  const rankedLeaderboard = leaderboard.map((person, index) => {
    if (previousPoints !== null && person.total_points < previousPoints) {
      currentRank++;
    }
    previousPoints = person.total_points;
    return { ...person, rank: currentRank };
  });

  const myRank = rankedLeaderboard.find(p => p.user_id === user.id)?.rank || '-';

  const safeSearchQuery = searchQuery.trim();
  const isSearching = safeSearchQuery !== '';

  const upcomingMatchesBase = matches.filter(m => new Date(m.match_time) > nowTime);
  const pastMatchesBase = matches.filter(m => new Date(m.match_time) <= nowTime);

  const filteredUpcomingMatches = upcomingMatchesBase.filter(m => 
    m.home_team.includes(safeSearchQuery) || m.away_team.includes(safeSearchQuery)
  );
  const filteredPastMatches = pastMatchesBase.filter(m => 
    m.home_team.includes(safeSearchQuery) || m.away_team.includes(safeSearchQuery)
  );
  const sortedFilteredPastMatches = [...filteredPastMatches].reverse();

  // ============================================================
  // ✅ محاسبه آمار کاربران با مقداردهی اولیه ایمن
  // ============================================================
  let userStats = leaderboard.map(u => {
    const userPastPredsCount = pastMatchesBase.filter(m => m.predictions?.some(p => p.user_id === u.user_id)).length;
    return { 
      ...u, threes: 0, twos: 0, ones: 0, zeros: 0, 
      totalPreds: 0, drawsPredicted: 0, totalGoalsPredicted: 0,
      missed: pastMatchesBase.length - userPastPredsCount
    };
  });
  
  let matchStats = [];
  let maxBlunderScore = -1;
  let varBlunder = {};

  matches.forEach(m => {
    if (m.home_score !== null && m.away_score !== null && m.predictions?.length > 0) {
      let matchTotalPoints = 0;
      m.predictions.forEach(p => {
        matchTotalPoints += (p.points_earned || 0);
        const uStat = userStats.find(u => u.user_id === p.user_id);
        if (uStat) {
          uStat.totalPreds++;
          if (p.points_earned === 3) uStat.threes++;
          if (p.points_earned === 2) uStat.twos++;
          if (p.points_earned === 1) uStat.ones++;
          if (p.points_earned === 0) {
            uStat.zeros++;
            const errScore = Math.abs(p.pred_home - m.home_score) + Math.abs(p.pred_away - m.away_score);
            if (errScore > maxBlunderScore) {
              maxBlunderScore = errScore;
              varBlunder = {
                first_name: p.profiles?.first_name,
                last_name: p.profiles?.last_name,
                matchStr: `${m.home_team} - ${m.away_team}`,
                predStr: `${p.pred_away}-${p.pred_home}`,
                actualStr: `${m.away_score}-${m.home_score}`
              };
            }
          }
          
          const pHome = parseInt(p.pred_home);
          const pAway = parseInt(p.pred_away);
          if (!isNaN(pHome) && !isNaN(pAway)) {
            if (pHome === pAway) uStat.drawsPredicted++;
            uStat.totalGoalsPredicted += (pHome + pAway);
          }
        }
      });
      matchStats.push({ ...m, avgPoints: (matchTotalPoints / m.predictions.length).toFixed(1) });
    }
  });

  const activeUsers = userStats.filter(u => u.totalPreds > 0);

  // ============================================================
  // ✅ محاسبه تالار افتخارات با چک کردن آرایه‌های خالی
  // ============================================================
  const sniper = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => b.threes - a.threes)[0] : {};
  const diffGod = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => b.twos - a.twos)[0] : {};
  const unlucky = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => b.zeros - a.zeros)[0] : {};
  const cautious = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => b.ones - a.ones)[0] : {};
  const peaceMaker = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => b.drawsPredicted - a.drawsPredicted)[0] : {};
  const crazyStriker = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => (b.totalGoalsPredicted / b.totalPreds) - (a.totalGoalsPredicted / a.totalPreds))[0] : {};
  const busParker = activeUsers.length > 0 ? [...activeUsers].sort((a, b) => (a.totalGoalsPredicted / a.totalPreds) - (b.totalGoalsPredicted / b.totalPreds))[0] : {};
  
  const surpriseMatch = matchStats.length > 0 ? [...matchStats].sort((a, b) => a.avgPoints - b.avgPoints)[0] : {};
  const predictableMatch = matchStats.length > 0 ? [...matchStats].sort((a, b) => b.avgPoints - a.avgPoints)[0] : {};

  let loneSurvivor = null;
  if (surpriseMatch.id && surpriseMatch.predictions) {
    const smartPreds = surpriseMatch.predictions.filter(p => p.points_earned >= 2);
    if (smartPreds.length > 0) {
      const survivorPred = smartPreds.sort((a, b) => b.points_earned - a.points_earned)[0];
      loneSurvivor = {
        first_name: survivorPred.profiles?.first_name,
        last_name: survivorPred.profiles?.last_name,
        points: survivorPred.points_earned
      };
    }
  }

  const todaysMatches = matches.filter(m => {
    if (m.home_score === null || m.away_score === null) return false;
    return new Date(m.match_time).toDateString() === nowTime.toDateString();
  });

  let dailyPointsMap = {};
  todaysMatches.forEach(m => {
    m.predictions?.forEach(p => {
      if (!dailyPointsMap[p.user_id]) dailyPointsMap[p.user_id] = 0;
      dailyPointsMap[p.user_id] += (p.points_earned || 0);
    });
  });

  const rawDailyLeaderboard = leaderboard
    .map(u => ({ ...u, todayPoints: dailyPointsMap[u.user_id] || 0 }))
    .filter(u => u.todayPoints > 0)
    .sort((a, b) => b.todayPoints - a.todayPoints);

  let currentDailyRank = 1;
  let previousDailyPoints = null;
  const dailyLeaderboard = rawDailyLeaderboard.map((person) => {
    if (previousDailyPoints !== null && person.todayPoints < previousDailyPoints) {
      currentDailyRank++;
    }
    previousDailyPoints = person.todayPoints;
    return { ...person, dailyRank: currentDailyRank };
  });

  const getRadarStats = (targetUserId) => {
    if (!targetUserId) return { accuracy: 0, risk: 0, safe: 0, form: 0, bias: 0 };
    const userFinishedPreds = matches.filter(m => m.home_score !== null && m.predictions?.some(p => p.user_id === targetUserId));
    const totalPlayed = userFinishedPreds.length;
    
    if (totalPlayed === 0) return { accuracy: 0, risk: 0, safe: 0, form: 0, bias: 0 };

    let count3 = 0, riskCount = 0, drawCount = 0, formPoints = 0;
    const teamPreds = {};

    const last5 = [...userFinishedPreds].reverse().slice(0, 5);
    last5.forEach(m => {
       const p = m.predictions.find(pred => pred.user_id === targetUserId);
       if(p) formPoints += (p.points_earned || 0);
    });

    userFinishedPreds.forEach(m => {
      const p = m.predictions.find(pred => pred.user_id === targetUserId);
      if (p) {
        if (p.points_earned === 3) count3++;
        if (p.pred_home === p.pred_away) drawCount++;

        const winner = p.pred_home > p.pred_away ? m.home_team : (p.pred_away > p.pred_home ? m.away_team : 'Draw');
        if (winner !== 'Draw') {
           teamPreds[winner] = (teamPreds[winner] || 0) + 1;
        }
      }
    });

    userFinishedPreds.forEach(m => {
      if(!m.predictions || m.predictions.length === 0) return;
      const userP = m.predictions.find(p => p.user_id === targetUserId);
      const userDir = userP.pred_home > userP.pred_away ? 'H' : userP.pred_home < userP.pred_away ? 'A' : 'D';
      let hCount=0, aCount=0, dCount=0;
      m.predictions.forEach(p => {
         if(p.pred_home > p.pred_away) hCount++;
         else if(p.pred_home < p.pred_away) aCount++;
         else dCount++;
      });
      const maxVotes = Math.max(hCount, aCount, dCount);
      let majorityDir = 'D';
      if(maxVotes === hCount) majorityDir = 'H';
      else if(maxVotes === aCount) majorityDir = 'A';
      if(userDir !== majorityDir) riskCount++;
    });

    const maxTeamVotes = Object.values(teamPreds).length > 0 ? Math.max(0, ...Object.values(teamPreds)) : 0;

    const normAccuracy = Math.min(100, Math.round((count3 / totalPlayed) * 350));
    const normRisk = Math.min(100, Math.round((riskCount / totalPlayed) * 250));
    const normSafe = Math.min(100, Math.round((drawCount / totalPlayed) * 250));
    const normForm = Math.min(100, Math.round((formPoints / 12) * 100));
    const normBias = Math.min(100, Math.round((maxTeamVotes / totalPlayed) * 250));

    return {
      accuracy: normAccuracy,
      risk: normRisk,
      safe: normSafe,
      form: normForm,
      bias: normBias
    };
  };

  const getUserAnalytics = (targetUserId) => {
    if (!targetUserId) return null;

    const userFinishedPreds = matches.filter(m => m.home_score !== null && m.predictions?.some(p => p.user_id === targetUserId));
    const totalPlayed = userFinishedPreds.length;
    
    let count3 = 0, count2 = 0, count1 = 0, count0 = 0;
    userFinishedPreds.forEach(m => {
      const p = m.predictions.find(pred => pred.user_id === targetUserId);
      if (p) {
        if (p.points_earned === 3) count3++;
        else if (p.points_earned === 2) count2++;
        else if (p.points_earned === 1) count1++;
        else if (p.points_earned === 0) count0++;
      }
    });

    const correctPreds = count3 + count2 + count1;
    const accuracy = totalPlayed > 0 ? Math.round((correctPreds / totalPlayed) * 100) : 0;

    const teamGoals = {};
    matches.forEach(m => {
      const p = m.predictions?.find(x => x.user_id === targetUserId);
      if (p) {
        teamGoals[m.home_team] = (teamGoals[m.home_team] || 0) + (p.pred_home || 0);
        teamGoals[m.away_team] = (teamGoals[m.away_team] || 0) + (p.pred_away || 0);
      }
    });
    const favoriteTeam = Object.keys(teamGoals).sort((a, b) => teamGoals[b] - teamGoals[a])[0] || 'متغیر';

    let riskCount = 0;
    userFinishedPreds.forEach(m => {
      if(!m.predictions || m.predictions.length === 0) return;
      const userP = m.predictions.find(p => p.user_id === targetUserId);
      const userDir = userP.pred_home > userP.pred_away ? 'H' : userP.pred_home < userP.pred_away ? 'A' : 'D';
      let hCount=0, aCount=0, dCount=0;
      m.predictions.forEach(p => {
         if(p.pred_home > p.pred_away) hCount++;
         else if(p.pred_home < p.pred_away) aCount++;
         else dCount++;
      });
      const maxVotes = Math.max(hCount, aCount, dCount);
      let majorityDir = 'D';
      if(maxVotes === hCount) majorityDir = 'H';
      else if(maxVotes === aCount) majorityDir = 'A';
      if(userDir !== majorityDir) riskCount++;
    });

    const riskPercent = totalPlayed > 0 ? Math.round((riskCount / totalPlayed) * 100) : 0;
    
    let riskLabel = "محتاط 🐑";
    let riskColor = "text-slate-500";
    if (riskPercent >= 30) {
        riskLabel = "شکارچی شگفتی‌ها 🐺";
        riskColor = "text-rose-500";
    } else if (riskPercent >= 15) {
        riskLabel = "متعادل ⚖️";
        riskColor = "text-amber-500";
    }

    const pointsByDate = {};
    const finishedMatches = matches.filter(m => m.home_score !== null && m.away_score !== null);
    
    finishedMatches.forEach(m => {
      const dateStr = new Date(m.match_time).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
      const p = m.predictions?.find(x => x.user_id === targetUserId);
      const pts = p ? (p.points_earned || 0) : 0;
      pointsByDate[dateStr] = (pointsByDate[dateStr] || 0) + pts;
    });

    const chartData = Object.keys(pointsByDate).map(date => ({
      name: date,
      امتیاز: pointsByDate[date]
    })).slice(-5);

    return { 
      accuracy, 
      favoriteTeam, 
      chartData, 
      totalPlayed,
      riskLabel,
      riskColor,
      riskPercent,
      pointsBreakdown: { count3, count2, count1, count0 }
    };
  };

  const getUserHistory = (targetUserId) => {
    if (!targetUserId) return [];
    return matches
      .filter(m => m.home_score !== null && m.away_score !== null)
      .map(m => {
        const pred = m.predictions?.find(p => p.user_id === targetUserId);
        return {
          id: m.id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          homeScore: m.home_score,
          awayScore: m.away_score,
          advancedTeam: m.advanced_team,
          predHome: pred ? pred.pred_home : '-',
          predAway: pred ? pred.pred_away : '-',
          predAdvanced: pred ? pred.pred_advanced_team : null,
          points: pred ? pred.points_earned : 0,
          hasPred: !!pred
        };
      })
      .reverse();
  };

  const openUserModal = (person, defaultTab = 'analytics') => {
    setSelectedUser(person);
    setCompareUserId('');
    setModalTab(defaultTab);
    setIsModalOpen(true);
  };

  const handleOpenTeamHistory = (teamName) => {
    setSelectedTeamForHistory(teamName);
    setIsTeamHistoryModalOpen(true);
  };

  const handleReplayWrapped = () => {
    setShowWrapped(true);
  };

  const renderPointsBadge = (match) => {
    const prediction = getUserPrediction(match);
    if (match.home_score === null || match.away_score === null) {
      return <div className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-xl">در انتظار نتیجه</div>;
    }
    if (!prediction) {
      return <div className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-xl border-b border-r border-red-100">بدون پیش‌بینی (۰)</div>;
    }
    const pts = prediction.points_earned;
    if (pts === 3) return <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-br-lg rounded-tl-xl border-b border-r border-emerald-200">🔥 ۳ امتیاز</div>;
    if (pts === 2) return <div className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-1 rounded-br-lg rounded-tl-xl border-b border-r border-blue-200">⚽ ۲ امتیاز</div>;
    if (pts === 1) return <div className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-1 rounded-br-lg rounded-tl-xl border-b border-r border-amber-200">✔️ ۱ امتیاز</div>;
    return <div className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-xl">۰ امتیاز</div>;
  };

  const displayedLeaderboard = isLeaderboardExpanded ? rankedLeaderboard : rankedLeaderboard.slice(0, 10);

  const radarData = [];
  if (selectedUser) {
     const u1 = getRadarStats(selectedUser.user_id);
     const u2 = compareUserId ? getRadarStats(compareUserId) : null;
     
     const axes = [
       { name: 'دقت هدف‌گیری', key: 'accuracy' },
       { name: 'ریسک‌پذیری', key: 'risk' },
       { name: 'احتیاط (مساوی)', key: 'safe' },
       { name: 'آمادگی اخیر', key: 'form' },
       { name: 'تعصب تیمی', key: 'bias' }
     ];

     axes.forEach(axis => {
        radarData.push({
           subject: axis.name,
           A: u1[axis.key],
           B: u2 ? u2[axis.key] : 0
        });
     });
  }

  const compareUserObj = activeUsers.find(u => u.user_id === compareUserId);

  let tournamentSummary = null;
  let topAttackersData = [];
  let topDefendersData = [];
  let timelineData = [];
  let teamStandings = []; 

  if (isTourneyModalOpen) {
    const finished = matches.filter(m => m.home_score !== null && m.away_score !== null);
    const tStats = {};
    const timelineMap = {};
    let totalGoalsScored = 0;

    finished.forEach(m => {
        const mGoals = m.home_score + m.away_score;
        totalGoalsScored += mGoals;
        
        const dateStr = new Date(m.match_time).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
        if(!timelineMap[dateStr]) timelineMap[dateStr] = 0;
        timelineMap[dateStr] += mGoals;

        ['home', 'away'].forEach(side => {
            const tName = side === 'home' ? m.home_team : m.away_team;
            const gFor = side === 'home' ? m.home_score : m.away_score;
            const gAgn = side === 'home' ? m.away_score : m.home_score;
            
            if(!tStats[tName]) tStats[tName] = { played:0, won:0, drawn:0, lost:0, gFor:0, gAgn:0, gd:0, points:0, clean:0 };
            
            tStats[tName].played++;
            tStats[tName].gFor += gFor;
            tStats[tName].gAgn += gAgn;
            tStats[tName].gd += (gFor - gAgn);
            
            if(gAgn === 0) tStats[tName].clean++;

            if (gFor > gAgn) {
                tStats[tName].won++;
                tStats[tName].points += 3;
            } else if (gFor === gAgn) {
                tStats[tName].drawn++;
                tStats[tName].points += 1;
            } else {
                tStats[tName].lost++;
            }
        });
    });

    const tArr = Object.keys(tStats).map(name => ({name, ...tStats[name]}));
    
    teamStandings = [...tArr].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gFor - a.gFor;
    });
    
    topAttackersData = [...tArr]
      .sort((a, b) => b.gFor - a.gFor)
      .slice(0, 5)
      .map(t => ({ تیم: t.name, گل: t.gFor }));

    topDefendersData = [...tArr]
      .sort((a, b) => b.clean - a.clean || a.gAgn - b.gAgn)
      .slice(0, 5)
      .map(t => ({ تیم: t.name, کلین‌شیت: t.clean, گل‌خورده: t.gAgn }));

    timelineData = Object.keys(timelineMap).map(date => ({
      تاریخ: date,
      گل‌ها: timelineMap[date]
    }));

    const highestMatch = [...finished].sort((a,b) => (b.home_score+b.away_score)-(a.home_score+a.away_score))[0] || {};
    
    tournamentSummary = {
      totalMatches: finished.length,
      totalGoals: totalGoalsScored,
      avgGoals: finished.length ? (totalGoalsScored / finished.length).toFixed(2) : 0,
      highestMatch
    };
  }

  // ============================================================
  // ✅ محاسبه ماکسیمم‌ها با چک کردن آرایه خالی
  // ============================================================
  const maxThrees = userStats.length > 0 ? Math.max(...userStats.map(s => s.threes)) : 0;
  const maxTwos = userStats.length > 0 ? Math.max(...userStats.map(s => s.twos)) : 0;
  const maxOnes = userStats.length > 0 ? Math.max(...userStats.map(s => s.ones)) : 0;
  const maxZeros = userStats.length > 0 ? Math.max(...userStats.map(s => s.zeros)) : 0;
  const maxMissed = userStats.length > 0 ? Math.max(...userStats.map(s => s.missed)) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative" dir="rtl">
      
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} gravity={0.15} />
          <div className="bg-white/95 px-8 py-6 rounded-3xl shadow-2xl text-center animate-bounce mt-[-100px] border-2 border-emerald-400">
            <span className="text-5xl block mb-3">🎯🔥</span>
            <h2 className="text-2xl font-black text-[#00194C]">ایـول تک‌تیرانـداز!</h2>
            <p className="text-emerald-600 font-bold mt-2">تو بازی‌های امروز ۳ امتیازی گرفتی!</p>
          </div>
        </div>
      )}

      {/* هدر */}
      <div className="bg-[#00194C] rounded-b-[32px] pt-8 pb-20 px-6 shadow-lg relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[#94A3B8] text-sm mb-1">{isAdmin ? '👑 داشبورد مدیریت' : 'داشبورد پیش‌بینی'}</p>
            <h1 className="text-white text-xl font-black">{user.first_name} {user.last_name}</h1>
          </div>
          <button onClick={onLogout} className="bg-white/10 text-white w-10 h-10 rounded-xl flex justify-center items-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
        
        <div className="absolute -bottom-8 left-6 right-6 bg-[#FDBA2D] rounded-[20px] p-5 shadow-[0_8px_30px_rgba(253,186,45,0.3)] flex justify-between items-center text-[#00194C]">
          <div>
            <p className="text-sm font-bold opacity-80">امتیاز کل شما</p>
            <p className="text-3xl font-black mt-1">{myPoints} <span className="text-sm font-normal">امتیاز</span></p>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold opacity-80">رتبه در فامیل</p>
            <p className="text-3xl font-black mt-1">#{myRank}</p>
          </div>
        </div>
      </div>
{/* ======================================================== */}
{/* 📱 سکوهای قهرمانی - استوری اینستاگرام */}
{/* ======================================================== */}
{!loading && rankedLeaderboard.length >= 3 && (
  <section className="px-0 -mt-6 relative z-20">
    {/* هدر استوری */}
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <h2 className="text-[#00194C] font-black text-base">سکوهای قهرمانی</h2>
        <span className="text-[10px] bg-[#FDBA2D] text-[#00194C] font-black px-2 py-0.5 rounded-full">🔥 برترین‌ها</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-400 font-bold">برای دیدن استوری ضربه بزنید</span>
        <span className="text-lg">👆</span>
      </div>
    </div>

    {/* اسلایدر استوری */}
    <div className="relative overflow-x-auto pb-4 px-4 snap-x snap-mandatory" 
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      
      <div className="flex gap-4 w-max">
        
        {/* ============================================================ */}
        {/* 🥇 رتبه اول - همه افراد با rank === 1 */}
        {/* ============================================================ */}
        {rankedLeaderboard.filter(p => p.rank === 1).map((user) => {
          const imageName = getImageName(user.first_name, user.last_name);
          return (
            <div 
              key={user.user_id}
              className="snap-center w-[320px] sm:w-[380px] flex-shrink-0 scale-105 cursor-pointer"
              onClick={() => setFullStoryUser({ ...user, rank: 1, imageName })}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#FDBA2D] ring-4 ring-[#FDBA2D]/30 bg-gradient-to-b from-[#FDBA2D]/20 to-[#F59E0B]/10">
                <div className="relative aspect-[9/16] bg-black/5">
                  <img 
                    src={`/images/rank1-${imageName}.jpg`}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/rank1-default.jpg';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FDBA2D]/40 via-transparent to-transparent"></div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl animate-bounce">👑</span>
                        <span className="bg-[#FDBA2D] text-[#00194C] px-3 py-0.5 rounded-full text-xs font-black">
                          🥇 رتبه ۱
                        </span>
                      </div>
                      <h3 className="text-2xl font-black">{user.first_name} {user.last_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-base font-bold text-[#FDBA2D]">{user.total_points} امتیاز</span>
                        {user.champion_prediction && (
                          <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            🏆 {user.champion_prediction}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -top-2 -right-2 text-5xl animate-pulse opacity-80">👑</div>
                  
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-12 h-1 bg-white/50 rounded-full"></div>
                    <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ============================================================ */}
        {/* 🥈 رتبه دوم - همه افراد با rank === 2 */}
        {/* ============================================================ */}
        {rankedLeaderboard.filter(p => p.rank === 2).map((user) => {
          const imageName = getImageName(user.first_name, user.last_name);
          return (
            <div 
              key={user.user_id}
              className="snap-center w-[280px] sm:w-[340px] flex-shrink-0 cursor-pointer"
              onClick={() => setFullStoryUser({ ...user, rank: 2, imageName })}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-400 bg-gradient-to-b from-slate-400/10 to-slate-500/5">
                <div className="relative aspect-[9/16] bg-black/5">
                  <img 
                    src={`/images/rank2-${imageName}.jpg`}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/rank2-default.jpg';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🥈</span>
                        <span className="bg-slate-400/30 backdrop-blur-sm px-3 py-0.5 rounded-full text-xs font-bold">
                          رتبه ۲
                        </span>
                      </div>
                      <h3 className="text-xl font-black">{user.first_name} {user.last_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-slate-200">{user.total_points} امتیاز</span>
                        {user.champion_prediction && (
                          <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            🏆 {user.champion_prediction}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-12 h-1 bg-white/50 rounded-full"></div>
                    <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ============================================================ */}
        {/* 🥉 رتبه سوم - همه افراد با rank === 3 */}
        {/* ============================================================ */}
        {rankedLeaderboard.filter(p => p.rank === 3).map((user) => {
          const imageName = getImageName(user.first_name, user.last_name);
          return (
            <div 
              key={user.user_id}
              className="snap-center w-[280px] sm:w-[340px] flex-shrink-0 cursor-pointer"
              onClick={() => setFullStoryUser({ ...user, rank: 3, imageName })}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-700 bg-gradient-to-b from-amber-700/10 to-amber-800/5">
                <div className="relative aspect-[9/16] bg-black/5">
                  <img 
                    src={`/images/rank3-${imageName}.jpg`}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/rank3-default.jpg';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🥉</span>
                        <span className="bg-amber-700/30 backdrop-blur-sm px-3 py-0.5 rounded-full text-xs font-bold">
                          رتبه ۳
                        </span>
                      </div>
                      <h3 className="text-xl font-black">{user.first_name} {user.last_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-slate-200">{user.total_points} امتیاز</span>
                        {user.champion_prediction && (
                          <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            🏆 {user.champion_prediction}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-12 h-1 bg-white/50 rounded-full"></div>
                    <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
      </div>
    </div>
    
    {/* دکمه اسکرول */}
    <div className="flex justify-center mt-3">
      <button 
        onClick={() => {
          const container = document.querySelector('.overflow-x-auto');
          if (container) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          }
        }}
        className="text-[10px] text-slate-400 font-bold bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200 shadow-sm hover:bg-white transition-colors flex items-center gap-1"
      >
        <span>👈</span>
        برای دیدن همه اسکرول کنید
        <span>👉</span>
      </button>
    </div>
  </section>
)}
       {/* ✅ مودال Wrapped - برای همه کاربران */}
        
        {/* ======================================================== */}
        {/* سکشن پیش‌بینی قهرمان */}
        {/* ======================================================== */}
        {!loading && (
          <section className="px-6">
            {championPrediction ? (
              <div className="bg-gradient-to-r from-[#00194C] to-[#1e3a8a] rounded-[20px] p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#00194C]/20">
                <div className="absolute right-0 top-0 opacity-10 text-8xl -mt-4 -mr-4 pointer-events-none">🏆</div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm border border-white/20 shrink-0">
                    {getFlagUrl(championPrediction) ? (
                      <img src={getFlagUrl(championPrediction)} alt={championPrediction} className="w-full h-full object-cover rounded shadow-sm" />
                    ) : (
                      <span className="text-2xl">❓</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white/70 text-[11px] font-bold mb-1">
                      {isChampionDeadlinePassed ? 'پیش‌بینی نهایی شما برای قهرمان:' : 'پیش‌بینی شما برای قهرمان جام:'}
                    </p>
                    <h3 className="text-[#FDBA2D] font-black text-xl">{championPrediction}</h3>
                  </div>
                </div>

                {!isChampionDeadlinePassed && (
                  <button 
                    onClick={() => setIsChampionModalOpen(true)}
                    className="relative z-10 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors backdrop-blur-sm flex justify-center items-center gap-2"
                  >
                    <span>ویرایش انتخاب</span>
                    <span>✏️</span>
                  </button>
                )}
              </div>
            ) : (
              !isChampionDeadlinePassed ? (
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-[20px] p-5 shadow-lg text-white flex flex-col sm:flex-row items-center justify-between animate-pulse">
                   <div className="flex items-center gap-3 mb-3 sm:mb-0 w-full">
                      <span className="text-4xl shrink-0">🚨</span>
                      <div>
                        <h3 className="font-black text-[15px]">فراموش نکنی قهرمان رو حدس بزنی!</h3>
                        <p className="text-xs opacity-90 mt-1 leading-relaxed">فقط تا قبل از شروع بازی کانادا - مراکش وقت داری.</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setIsChampionModalOpen(true)} 
                     className="bg-white text-rose-600 font-black px-5 py-3 rounded-xl text-xs whitespace-nowrap shadow-sm hover:scale-105 transition-transform w-full sm:w-auto"
                   >
                     انتخاب قهرمان 🏆
                   </button>
                </div>
              ) : (
                <div className="bg-slate-200 rounded-[20px] p-5 border border-slate-300 flex items-center gap-3 shadow-sm">
                   <span className="text-3xl grayscale">⏳</span>
                   <div>
                     <h3 className="font-black text-slate-600 text-sm">مهلت پیش‌بینی قهرمان تمام شد</h3>
                     <p className="text-[11px] text-slate-500 mt-1 font-bold">متاسفانه شما تیمی را انتخاب نکردید.</p>
                   </div>
                </div>
              )
            )}

            {/* آکاردئون لیست قهرمان‌های بقیه */}
            {isChampionDeadlinePassed && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowChampionAccordion(!showChampionAccordion)}
                  className="w-full flex justify-between items-center bg-white border border-slate-200 text-[#00194C] font-black py-3 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕵️‍♂️</span>
                    <span className="text-xs">مشاهده پیش‌بینی قهرمانِ فامیل</span>
                  </div>
                  <span className="text-slate-400 text-xs">{showChampionAccordion ? '▲ بستن' : '▼ باز کردن'}</span>
                </button>

                {showChampionAccordion && (
                  <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1 border-b border-slate-100" style={{ scrollbarWidth: 'thin' }}>
                      {(() => {
                        const championList = allProfiles
                          .filter(p => p.champion_prediction)
                          .map(p => {
                            const userObj = leaderboard.find(l => l.user_id === p.id);
                            const isEliminated = eliminatedTeams.includes(p.champion_prediction);
                            const isCorrect = actualChampion && p.champion_prediction === actualChampion;
                            return {
                              ...p,
                              first_name: userObj?.first_name || 'کاربر',
                              last_name: userObj?.last_name || '',
                              points: userObj?.total_points || 0,
                              isEliminated,
                              isCorrect
                            };
                          })
                          .sort((a, b) => b.points - a.points);

                        if (championList.length === 0) {
                          return <div className="text-center text-xs text-slate-400 py-3 font-bold">کسی قهرمان را پیش‌بینی نکرده است!</div>;
                        }

                        return championList.map(item => (
                          <div key={item.id} className={`flex justify-between items-center p-2.5 rounded-lg border ${item.id === user.id ? 'bg-[#FFF7ED] border-[#FDBA2D]/30' : 'bg-slate-50 border-slate-100'} ${item.isEliminated && !item.isCorrect ? 'opacity-50' : ''}`}>
                            <span className="text-xs font-bold text-slate-700">
                              {item.first_name} {item.last_name}
                              {item.id === user.id && <span className="mr-2 text-[9px] bg-[#FDBA2D] text-[#00194C] px-1.5 py-0.5 rounded shadow-sm">شما</span>}
                              {item.isEliminated && !item.isCorrect && <span className="mr-2 text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded">❌ حذف</span>}
                              {item.isCorrect && <span className="mr-2 text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black">🏆 +{CHAMPION_BONUS_POINTS} امتیاز</span>}
                            </span>
                            <div className={`flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border ${item.isEliminated && !item.isCorrect ? 'border-slate-200' : item.isCorrect ? 'border-emerald-300' : 'border-slate-100'}`}>
                              <span className={`text-[11px] font-black ${item.isEliminated && !item.isCorrect ? 'text-slate-400 line-through' : item.isCorrect ? 'text-emerald-600' : 'text-[#00194C]'}`}>
                                {item.champion_prediction}
                              </span>
                              {getFlagUrl(item.champion_prediction) ? (
                                <img src={getFlagUrl(item.champion_prediction)} alt={item.champion_prediction} 
                                     className={`w-5 h-3.5 rounded-[2px] object-cover transition-all duration-500 ${item.isEliminated && !item.isCorrect ? 'grayscale opacity-30' : ''}`} />
                              ) : (
                                <span className="text-[10px]">❓</span>
                              )}
                              {item.isCorrect && <span className="text-[12px]">🏆</span>}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    {championAnalytics && (
                      <div className="p-3 bg-gradient-to-b from-slate-50 to-white">
                        <button 
                          onClick={() => setShowChampionAnalytics(!showChampionAnalytics)}
                          className="w-full flex justify-between items-center bg-[#00194C] text-white font-bold py-2.5 px-3 rounded-lg text-xs hover:bg-[#00194C]/90 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span>📊</span>
                            <span>آنالیز پیش‌بینی قهرمان</span>
                            {actualChampion && (
                              <span className="bg-emerald-500 text-[9px] px-1.5 py-0.5 rounded-full">قهرمان مشخص شد!</span>
                            )}
                          </div>
                          <span>{showChampionAnalytics ? '▲' : '▼'}</span>
                        </button>

                        {showChampionAnalytics && (
                          <div className="mt-3 space-y-3">
                            {/* قهرمان واقعی */}
                            {actualChampion && (
                              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-3 text-white text-center shadow">
                                <p className="text-[10px] font-bold opacity-90">🏆 قهرمان واقعی جام</p>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  {getFlagUrl(actualChampion) ? (
                                    <img src={getFlagUrl(actualChampion)} alt={actualChampion} className="w-7 h-5 rounded object-cover border border-white/30" />
                                  ) : (
                                    <span className="text-xl">🏳️</span>
                                  )}
                                  <span className="text-lg font-black">{actualChampion}</span>
                                </div>
                              </div>
                            )}

                            {/* آمار کلی */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white rounded-xl p-2 border border-slate-100 text-center shadow-sm">
                                <p className="text-[9px] font-bold text-slate-400">تعداد پیش‌بینی‌ها</p>
                                <p className="text-lg font-black text-[#00194C]">{championAnalytics.totalPredictions}</p>
                              </div>
                              <div className="bg-white rounded-xl p-2 border border-slate-100 text-center shadow-sm">
                                <p className="text-[9px] font-bold text-slate-400">بازماندگان 🏃</p>
                                <p className="text-lg font-black text-emerald-500">{championAnalytics.aliveCount}</p>
                              </div>
                            </div>

                            {/* پیش‌بینی‌کنندگان درست */}
                            {championAnalytics.correctPredictors.length > 0 && (
                              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-base">🎯</span>
                                  <span className="text-xs font-black text-emerald-700">پیش‌بینی‌کنندگان درست!</span>
                                  <span className="text-[8px] bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">+{CHAMPION_BONUS_POINTS} امتیاز</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {championAnalytics.correctPredictors.map(p => {
                                    const userObj = leaderboard.find(l => l.user_id === p.id);
                                    return (
                                      <div key={p.id} className="flex items-center gap-0.5 bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-200">
                                        <span className="text-xs font-bold text-emerald-600">🏆</span>
                                        <span className="text-[10px] font-bold text-slate-700">{userObj?.first_name || 'کاربر'} {userObj?.last_name || ''}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* گرگ‌های تنها */}
                            {championAnalytics.underdogs.length > 0 && (
                              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-2.5 border border-amber-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-base">🐺</span>
                                  <span className="text-[10px] font-black text-amber-700">گرگ‌های تنها</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {championAnalytics.underdogs.map(underdog => (
                                    <div key={underdog.team} className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-lg shadow-sm border border-amber-200">
                                      {getFlagUrl(underdog.team) ? (
                                        <img src={getFlagUrl(underdog.team)} alt={underdog.team} className="w-4 h-3 rounded object-cover" />
                                      ) : (
                                        <span>🏳️</span>
                                      )}
                                      <span className="text-[9px] font-bold text-slate-700">{underdog.team}</span>
                                      <span className="text-[7px] text-amber-500 font-black">(🦄)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* نمودار درصد انتخاب‌ها */}
                            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm">📊</span>
                                <h4 className="text-[11px] font-black text-slate-800">درصد انتخاب‌های فامیل</h4>
                              </div>
                              <div className="space-y-1.5">
                                {championAnalytics.teams.map(item => (
                                  <div key={item.team} className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <div className="flex items-center gap-1">
                                        {getFlagUrl(item.team) ? (
                                          <img src={getFlagUrl(item.team)} alt={item.team} className={`w-4 h-3 rounded object-cover transition-all duration-500 ${item.isEliminated && !item.isChampion ? 'grayscale opacity-40' : ''}`} />
                                        ) : (
                                          <span className="text-xs">🏳️</span>
                                        )}
                                        <span className={`font-bold ${item.isEliminated && !item.isChampion ? 'text-slate-400 line-through' : item.isChampion ? 'text-emerald-600' : 'text-[#00194C]'}`}>
                                          {item.team}
                                        </span>
                                        {item.isUnderdog && item.isAlive && (
                                          <span className="text-[7px] bg-amber-100 text-amber-600 px-1 rounded">🐺</span>
                                        )}
                                        {item.isEliminated && !item.isChampion && (
                                          <span className="text-[7px] bg-red-100 text-red-500 px-1 rounded">❌</span>
                                        )}
                                        {item.isChampion && (
                                          <span className="text-[7px] bg-emerald-100 text-emerald-600 px-1 rounded font-black">🏆</span>
                                        )}
                                      </div>
                                      <span className="font-bold text-slate-500">{item.percentage}% ({item.count} نفر)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-700 ${item.isEliminated && !item.isChampion ? 'bg-slate-300' : item.isChampion ? 'bg-emerald-500' : 'bg-[#FDBA2D]'}`}
                                        style={{ width: `${item.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* جایزه جکپات */}
                            <div className="bg-gradient-to-r from-[#FDBA2D]/20 to-[#F59E0B]/20 rounded-xl p-3 border border-[#FDBA2D]/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">🎰</span>
                                <span className="text-xs font-black text-[#00194C]">جایزه جکپات</span>
                                <span className="text-[8px] bg-[#FDBA2D] text-[#00194C] px-1.5 py-0.5 rounded-full font-black">+{CHAMPION_BONUS_POINTS} امتیاز</span>
                              </div>
                              {actualChampion && championAnalytics.correctPredictors.length > 0 ? (
                                <p className="text-[10px] text-slate-600 font-medium">
                                  🎉 {championAnalytics.correctPredictors.length} نفر {championAnalytics.correctPredictors.length === 1 ? 'شخص' : 'نفر'} موفق شدند {actualChampion} را درست پیش‌بینی کنند!
                                </p>
                              ) : actualChampion ? (
                                <p className="text-[10px] text-rose-600 font-medium">
                                  😔 هیچکس نتوانست {actualChampion} را پیش‌بینی کند!
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-600 font-medium">
                                  در انتظار مشخص شدن قهرمان...
                                </p>
                              )}
                            </div>

                            {/* دکمه مشاهده در مرکز آنالیز */}
                            <button
                              onClick={() => {
                                setIsTourneyModalOpen(true);
                                setTourneyTab('summary');
                              }}
                              className="w-full bg-[#00194C] text-white font-bold py-2 rounded-lg text-xs hover:bg-[#00194C]/90 transition-colors flex items-center justify-center gap-2"
                            >
                              <span>📊</span>
                              <span>مشاهده آمار کامل جام در مرکز آنالیز</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* تالار افتخارات - فقط اگر کاربر فعال وجود داشته باشد */}
        {!loading && activeUsers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-6">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#F59E0B] flex justify-center items-center font-bold text-sm">🌟</div>
              <h2 className="text-[#00194C] font-black text-lg">تالار افتخارات</h2>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 px-6 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`div::-webkit-scrollbar { display: none; }`}</style>
              
              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-emerald-100 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🎯</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex justify-center items-center text-xl shrink-0">🎯</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">تک‌تیرانداز فامیل</p>
                    <h3 className="text-[#00194C] font-black text-sm">{sniper.first_name} {sniper.last_name || '-'}</h3>
                    <p className="text-emerald-600 text-[10px] font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">{sniper.threes} پیش‌بینی ۳ امتیازی</p>
                  </div>
                </div>
              </div>

              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🐢</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex justify-center items-center text-xl shrink-0">🐢</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">محتاط‌ترین (پادشاه ۱ امتیازی)</p>
                    <h3 className="text-[#00194C] font-black text-sm">{cautious.first_name} {cautious.last_name || '-'}</h3>
                    <p className="text-slate-600 text-[10px] font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">{cautious.ones} پیش‌بینی ۱ امتیازی</p>
                  </div>
                </div>
              </div>

              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-cyan-100 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🤝</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex justify-center items-center text-xl shrink-0">🤝</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">صلح‌طلب فامیل</p>
                    <h3 className="text-[#00194C] font-black text-sm">{peaceMaker.first_name} {peaceMaker.last_name || '-'}</h3>
                    <p className="text-cyan-600 text-[10px] font-bold mt-1 bg-cyan-50 px-2 py-0.5 rounded-md inline-block">{peaceMaker.drawsPredicted} پیش‌بینی مساوی</p>
                  </div>
                </div>
              </div>

              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-orange-100 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">⚽</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex justify-center items-center text-xl shrink-0">⚽</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">عاشق بازی‌های پرگل</p>
                    <h3 className="text-[#00194C] font-black text-sm">{crazyStriker.first_name} {crazyStriker.last_name || '-'}</h3>
                    <p className="text-orange-600 text-[10px] font-bold mt-1 bg-orange-50 px-2 py-0.5 rounded-md inline-block">میانگین حدس: {(crazyStriker.totalGoalsPredicted / crazyStriker.totalPreds || 0).toFixed(1)} گل در بازی</p>
                  </div>
                </div>
              </div>

              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-zinc-200 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🚌</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500 flex justify-center items-center text-xl shrink-0">🚌</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">دفاع اتوبوسی (مورینیو)</p>
                    <h3 className="text-[#00194C] font-black text-sm">{busParker.first_name} {busParker.last_name || '-'}</h3>
                    <p className="text-zinc-600 text-[10px] font-bold mt-1 bg-zinc-100 px-2 py-0.5 rounded-md inline-block">میانگین حدس: {(busParker.totalGoalsPredicted / busParker.totalPreds || 0).toFixed(1)} گل در بازی</p>
                  </div>
                </div>
              </div>

              {loneSurvivor?.first_name && (
                <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-indigo-100 relative overflow-hidden">
                  <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🐺</div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex justify-center items-center text-xl shrink-0">🐺</div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold mb-1">شکارچی شگفتی‌ها (تنها بازمانده)</p>
                      <h3 className="text-[#00194C] font-black text-sm">{loneSurvivor.first_name} {loneSurvivor.last_name || '-'}</h3>
                      <p className="text-indigo-600 text-[10px] font-bold mt-1 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">دشت امتیاز از {surpriseMatch.home_team}-{surpriseMatch.away_team}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-blue-100 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">⚖️</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex justify-center items-center text-xl shrink-0">⚖️</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">خدای تفاضل</p>
                    <h3 className="text-[#00194C] font-black text-sm">{diffGod.first_name} {diffGod.last_name || '-'}</h3>
                    <p className="text-blue-600 text-[10px] font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-md inline-block">{diffGod.twos} پیش‌بینی ۲ امتیازی</p>
                  </div>
                </div>
              </div>

              {varBlunder.first_name && (
                <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-purple-100 relative overflow-hidden">
                  <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🚨</div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex justify-center items-center text-xl shrink-0">🚨</div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold mb-1">اتاق VAR (بزرگترین سوتی)</p>
                      <h3 className="text-[#00194C] font-black text-sm">{varBlunder.first_name} {varBlunder.last_name || '-'}</h3>
                      <p className="text-purple-600 text-[10px] font-bold mt-1 bg-purple-50 px-2 py-0.5 rounded-md inline-block" dir="ltr">
                        حدس: {varBlunder.predStr} | واقعی: {varBlunder.actualStr}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {predictableMatch.home_team && (
                <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-teal-100 relative overflow-hidden">
                  <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🔮</div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex justify-center items-center text-xl shrink-0">🔮</div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold mb-1">قابل پیش‌بینی‌ترین بازی</p>
                      <h3 className="text-[#00194C] font-black text-sm">{predictableMatch.home_team} - {predictableMatch.away_team}</h3>
                      <p className="text-teal-600 text-[10px] font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded-md inline-block">میانگین امتیاز: {predictableMatch.avgPoints}</p>
                    </div>
                  </div>
                </div>
              )}

              {surpriseMatch.home_team && (
                <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-rose-100 relative overflow-hidden">
                  <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🤯</div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex justify-center items-center text-xl shrink-0">🤯</div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-bold mb-1">غیرقابل پیش‌بینی‌ترین بازی</p>
                      <h3 className="text-[#00194C] font-black text-sm">{surpriseMatch.home_team} - {surpriseMatch.away_team}</h3>
                      <p className="text-rose-600 text-[10px] font-bold mt-1 bg-rose-50 px-2 py-0.5 rounded-md inline-block">میانگین امتیاز: {surpriseMatch.avgPoints}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="snap-center min-w-[240px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 text-6xl opacity-[0.04] z-0">🤦‍♂️</div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex justify-center items-center text-xl shrink-0">🤦‍♂️</div>
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold mb-1">بدشانس‌ترین (طلسم‌شده)</p>
                    <h3 className="text-[#00194C] font-black text-sm">{unlucky.first_name} {unlucky.last_name || '-'}</h3>
                    <p className="text-slate-600 text-[10px] font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">{unlucky.zeros} بازی با صفر امتیاز</p>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        <div className="px-6 space-y-8">
          
          {!loading && (
            <section>
              <button 
                onClick={() => setShowDailyLeaderboard(!showDailyLeaderboard)}
                className="w-full flex justify-between items-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black py-4 px-5 rounded-[20px] shadow-[0_8px_20px_rgba(16,185,129,0.2)] hover:opacity-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center">⚡</span>
                  <span>رده‌بندی امتیازات امروز</span>
                </div>
                <span className="text-lg bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300">
                  {showDailyLeaderboard ? '▲' : '▼'}
                </span>
              </button>

              {showDailyLeaderboard && (
                <div className="mt-4 bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,25,76,0.03)] border border-[#F1F5F9] p-4 space-y-3 transition-all duration-300">
                  {dailyLeaderboard.length > 0 ? (
                    dailyLeaderboard.map((person) => (
                      <div key={'daily'+person.user_id} className={`flex justify-between items-center p-3 rounded-xl transition-all ${person.user_id === user.id ? 'bg-[#16A34A]/10 border border-[#16A34A]/30' : 'bg-[#F8FAFC]'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-center font-black ${person.dailyRank === 1 ? 'text-[#16A34A] text-lg' : person.dailyRank === 2 ? 'text-slate-400' : 'text-slate-400'}`}>
                            {person.dailyRank}
                          </span>
                          <span className={`font-bold text-sm ${person.user_id === user.id ? 'text-[#00194C]' : 'text-slate-700'}`}>
                            {person.first_name} {person.last_name}
                          </span>
                        </div>
                        <div className="font-black text-[#16A34A] shrink-0 mr-2 flex items-center gap-1">
                          <span className="text-lg">+{person.todayPoints}</span>
                          <span className="text-[10px] font-normal opacity-70">امتیاز</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <span className="text-2xl block mb-2">🤔</span>
                      <p className="text-sm font-bold text-slate-400">هنوز کسی امروز امتیازی نگرفته است!</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <section>
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#334770] flex justify-center items-center font-bold">🏆</div>
                 <h2 className="text-[#00194C] font-black text-lg">جدول رده‌بندی کل</h2>
               </div>
               <button 
                 onClick={() => setIsStatsTableModalOpen(true)} 
                 className="flex items-center gap-1 bg-white border border-slate-200 text-slate-500 hover:text-[#00194C] hover:border-[#00194C] px-3 py-1.5 rounded-xl transition-all shadow-sm text-xs font-bold"
                 title="جدول ریز امتیازات"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
                 ریز امتیازات
               </button>
            </div>
            
            <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,25,76,0.03)] border border-[#F1F5F9] p-4 space-y-3">
              {displayedLeaderboard.map((person) => {
                const userPredictionsCount = matches.filter(m => m.predictions?.some(p => p.user_id === person.user_id)).length;
                const missedMatchesCount = pastMatchesBase.filter(m => !m.predictions?.some(p => p.user_id === person.user_id)).length;
                const userProfile = allProfiles.find(p => p.id === person.user_id);
                const isCorrectChampion = actualChampion && userProfile?.champion_prediction === actualChampion;

                return (
                  <div key={person.user_id} className={`flex justify-between items-center p-3 rounded-xl transition-all ${person.user_id === user.id ? 'bg-[#FDBA2D]/10 border border-[#FDBA2D]/30' : 'bg-[#F8FAFC]'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className={`w-5 sm:w-6 text-center font-black shrink-0 ${person.rank === 1 ? 'text-[#FDBA2D] text-lg' : person.rank === 2 ? 'text-slate-400 text-base' : person.rank === 3 ? 'text-amber-700 text-base' : 'text-slate-400'}`}>
                        {person.rank}
                      </span>
                      
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className={`font-bold text-[13px] sm:text-sm truncate ${person.user_id === user.id ? 'text-[#00194C]' : 'text-slate-700'}`}>
                            {person.first_name} {person.last_name}
                          </span>
                          
                          {/* نمایش پرچم قهرمان اگر ددلاین گذشته باشد */}
                          {isChampionDeadlinePassed && userProfile?.champion_prediction && (
                            <div className={`flex items-center gap-1 px-1 py-0.5 rounded-md border shadow-sm shrink-0 ${isCorrectChampion ? 'bg-emerald-100 border-emerald-400' : eliminatedTeams.includes(userProfile.champion_prediction) ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-[#FDBA2D]/20 border-[#FDBA2D]/30'}`} 
                                 title={`پیش‌بینی قهرمان: ${userProfile.champion_prediction}${isCorrectChampion ? ' ✅ درست!' : ''}${eliminatedTeams.includes(userProfile.champion_prediction) && !isCorrectChampion ? ' (حذف شده ❌)' : ''}`}>
                              <span className="text-[9px]">{isCorrectChampion ? '🏆' : eliminatedTeams.includes(userProfile.champion_prediction) ? '❌' : '🏆'}</span>
                              {getFlagUrl(userProfile.champion_prediction) ? (
                                <img src={getFlagUrl(userProfile.champion_prediction)} alt={userProfile.champion_prediction} 
                                     className={`w-3 h-2 sm:w-3.5 sm:h-2.5 rounded-[2px] object-cover transition-all duration-500 ${eliminatedTeams.includes(userProfile.champion_prediction) && !isCorrectChampion ? 'grayscale opacity-30' : ''}`} />
                              ) : (
                                <span className="w-3 h-2 sm:w-3.5 sm:h-2.5 flex items-center justify-center bg-white/50 rounded-[2px] text-[7px] font-black">❓</span>
                              )}
                              {isCorrectChampion && <span className="text-[8px] text-emerald-600 font-black">+{CHAMPION_BONUS_POINTS}</span>}
                              {eliminatedTeams.includes(userProfile.champion_prediction) && !isCorrectChampion && <span className="text-[8px] text-red-400 font-bold line-through hidden sm:inline">حذف</span>}
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] text-slate-500 font-medium bg-slate-200/50 px-1.5 py-0.5 rounded border border-slate-200 w-max truncate">
                          ثبت: {userPredictionsCount} | غایب: {missedMatchesCount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 shrink-0 mr-2 pl-1">
                      <div className="font-black text-[#00194C] text-left leading-none">
                        {person.total_points} <span className="text-[9px] font-normal text-slate-400">امتیاز</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <button onClick={() => openUserModal(person, 'history')} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-lg transition-colors" title="تاریخچه پیش‌بینی‌ها">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </button>
                        <button onClick={() => openUserModal(person, 'analytics')} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-lg transition-colors" title="آنالیز عملکرد">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {rankedLeaderboard.length > 10 && (
                <button
                  onClick={() => setIsLeaderboardExpanded(!isLeaderboardExpanded)}
                  className="w-full mt-2 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  {isLeaderboardExpanded ? 'بستن جدول ▲' : `مشاهده همه (${rankedLeaderboard.length} نفر) ▼`}
                </button>
              )}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-4">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F59E0B] flex justify-center items-center font-bold">⚽</div>
                 <h2 className="text-[#00194C] font-black text-lg">مسابقات</h2>
               </div>
            </div>

            <div className="mb-6 relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="جستجوی تیم (مثلاً: برزیل)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 text-[#00194C] font-bold text-sm rounded-2xl py-3 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-[#FDBA2D] focus:border-transparent transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium"
              />
            </div>
            
            {loading ? (
              <div className="text-center text-[#FDBA2D] font-bold">در حال دریافت بازی‌ها...</div>
            ) : (
              <div>
                {pastMatchesBase.length > 0 && (
                  <div className="mb-6">
                    <button 
                      onClick={() => setShowPastMatches(!showPastMatches)}
                      className="w-full flex justify-between items-center bg-white border border-[#E2E8F0] text-[#334770] font-black py-4 px-5 rounded-[20px] shadow-sm hover:bg-[#F8FAFC] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🕰️</span>
                        <span>بازی‌های گذشته ({filteredPastMatches.length})</span>
                      </div>
                      <span className="text-lg text-slate-400">{(showPastMatches || isSearching) ? '▲' : '▼'}</span>
                    </button>
                    
                    {(showPastMatches || isSearching) && (
                      <div className="mt-4 space-y-6 transition-all duration-300">
                        {sortedFilteredPastMatches.length > 0 ? (
                          sortedFilteredPastMatches.map(match => (
                            <div key={match.id} className="relative bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                              <div className="absolute right-0 top-0 z-10">
                                {renderPointsBadge(match)}
                              </div>
                              <div className="pt-2">
                                <MatchCard match={match} userId={user.id} userPrediction={getUserPrediction(match)} isAdmin={isAdmin} onTeamClick={handleOpenTeamHistory} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-400 py-4 font-bold text-sm bg-white rounded-[20px] border border-slate-100">
                            نتیجه‌ای در بازی‌های گذشته یافت نشد!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {filteredUpcomingMatches.length > 0 ? (
                    filteredUpcomingMatches.map(match => (
                      <MatchCard key={match.id} match={match} userId={user.id} userPrediction={getUserPrediction(match)} isAdmin={isAdmin} onTeamClick={handleOpenTeamHistory} />
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-4 font-bold text-sm bg-white rounded-[20px] border border-slate-100">
                      {isSearching ? 'نتیجه‌ای در بازی‌های آینده یافت نشد!' : 'در حال حاضر بازی جدیدی برای پیش‌بینی وجود ندارد!'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* دکمه شناور مرکز آنالیز */}
      <button 
        onClick={() => setIsTourneyModalOpen(true)}
        className="fixed bottom-8 left-6 z-[150] bg-gradient-to-tr from-[#00194C] to-[#3b82f6] text-white rounded-2xl p-4 shadow-xl hover:scale-105 transition-transform flex items-center gap-2 border border-white/20"
      >
        <span className="text-2xl animate-pulse">📊</span>
        <span className="font-black text-sm hidden md:inline">مرکز آنالیز</span>
      </button>

      {/* ✅ دکمه مشاهده مجدد Wrapped - برای همه کاربران */}
      {hasSeenWrapped && (
        <button 
          onClick={handleReplayWrapped}
          className="fixed bottom-32 left-6 z-[150] bg-gradient-to-r from-[#FDBA2D] to-[#F59E0B] text-[#00194C] font-bold px-4 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 border border-white/20 text-sm"
        >
          <span>🎬</span>
          مشاهده مجدد گزارش
        </button>
      )}

      {/* مودال انتخاب قهرمان */}
      {isChampionModalOpen && !isChampionDeadlinePassed && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-[#00194C]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            <div className="bg-gradient-to-r from-[#00194C] to-[#1e3a8a] p-6 text-center relative shrink-0">
              <button onClick={() => setIsChampionModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
              
              <div className="w-16 h-16 bg-[#FDBA2D] text-[#00194C] rounded-2xl mx-auto flex items-center justify-center text-4xl font-black mb-3 shadow-lg">
                🏆
              </div>
              <h3 className="text-white font-black text-xl">پیش‌بینی قهرمان جام</h3>
              <p className="text-[#93c5fd] text-[11px] mt-2 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
                ⏳ فرصت ویرایش تا: ۱۳ تیر، ساعت ۲۰:۳۰
              </p>
            </div>

            <div className="p-5 overflow-y-auto bg-slate-50 flex-1" style={{ scrollbarWidth: 'thin' }}>
              <p className="text-xs font-bold text-slate-500 text-center mb-4">
                به نظرت در نهایت کدوم تیم جام رو بالای سر می‌بره؟ <br/>
                <span className="text-[10px] text-rose-500 font-black mt-1 inline-block bg-rose-50 px-2 py-0.5 rounded">بعد از شروع بازی کانادا-مراکش، انتخابت قفل می‌شه!</span>
              </p>

              <div className="grid grid-cols-2 gap-3 pb-2">
                {knockoutTeams.map(team => (
                  <button
                    key={team}
                    onClick={() => handleSaveChampion(team)}
                    disabled={savingChampion}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      championPrediction === team 
                        ? 'bg-[#00194C] border-[#00194C] text-white shadow-md scale-[1.02]' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-[#FDBA2D] hover:shadow-sm'
                    }`}
                  >
                    {getFlagUrl(team) ? (
                      <img src={getFlagUrl(team)} alt={team} className={`w-8 h-6 rounded object-cover shadow-sm ${championPrediction === team ? 'border border-white/20' : ''}`} />
                    ) : (
                      <span className="w-8 h-6 flex items-center justify-center bg-slate-200 text-slate-500 rounded text-[10px] font-black shadow-sm">❓</span>
                    )}
                    <span className="font-bold text-xs md:text-sm truncate">{team}</span>
                    {championPrediction === team && <span className="mr-auto text-[#FDBA2D]">✔️</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مرکز آنالیز جام */}
      {isTourneyModalOpen && tournamentSummary && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#00194C]/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="bg-gradient-to-r from-[#00194C] to-[#1e3a8a] p-6 text-center relative shrink-0">
              <button onClick={() => setIsTourneyModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
              <div className="w-16 h-16 bg-[#FDBA2D] text-[#00194C] rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-3 shadow-lg rotate-3">
                📊
              </div>
              <h3 className="text-white font-black text-xl">مرکز آنالیز جام</h3>
              <p className="text-[#93c5fd] text-xs mt-1 font-medium">داشبورد اختصاصی آمار تیم‌ها و بازی‌ها</p>
            </div>

            <div className="flex border-b border-slate-200 shrink-0 bg-white">
              <button 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${tourneyTab === 'summary' ? 'text-[#00194C] border-b-2 border-[#FDBA2D]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setTourneyTab('summary')}
              >
                📊 خلاصه آمار
              </button>
              <button 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${tourneyTab === 'standings' ? 'text-[#00194C] border-b-2 border-[#FDBA2D]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setTourneyTab('standings')}
              >
                📋 جدول تیم‌ها
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-50 flex-1" style={{ scrollbarWidth: 'thin' }}>
              
              {tourneyTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">تعداد بازی برگزار شده</p>
                      <p className="text-2xl font-black text-[#00194C]">{tournamentSummary.totalMatches}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">مجموع گل‌های جام</p>
                      <p className="text-2xl font-black text-orange-500">{tournamentSummary.totalGoals}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">میانگین گل در هر بازی</p>
                      <p className="text-xl font-black text-indigo-500" dir="ltr">{tournamentSummary.avgGoals}</p>
                    </div>
                    {tournamentSummary.highestMatch.home_team && (
                      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">پرگل‌ترین بازی</p>
                        <p className="text-xs font-black text-rose-500 truncate" dir="rtl">
                          {tournamentSummary.highestMatch.home_team} {tournamentSummary.highestMatch.home_score}-{tournamentSummary.highestMatch.away_score} {tournamentSummary.highestMatch.away_team}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">📈</span>
                      <h4 className="text-sm font-black text-slate-800">روند گلزنی در روزهای جام</h4>
                    </div>
                    {timelineData.length > 0 ? (
                      <div className="h-40 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="تاریخ" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', textAlign: 'right', direction: 'rtl' }} />
                            <Line type="monotone" dataKey="گل‌ها" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-center text-slate-400 font-medium py-4">دیتای کافی موجود نیست.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🔥</span>
                      <h4 className="text-sm font-black text-slate-800">آتشبارترین تیم‌ها (گل زده)</h4>
                    </div>
                    {topAttackersData.length > 0 ? (
                      <div className="h-48 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topAttackersData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="تیم" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', textAlign: 'right', direction: 'rtl' }} />
                            <Bar dataKey="گل" fill="#f97316" radius={[6, 6, 0, 0]} barSize={25} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-center text-slate-400 font-medium py-4">دیتای کافی موجود نیست.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🧱</span>
                      <h4 className="text-sm font-black text-slate-800">دیوار بتنی (کلین‌شیت‌ها)</h4>
                    </div>
                    {topDefendersData.length > 0 ? (
                      <div className="h-48 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topDefendersData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="تیم" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{ fill: '#eff6ff' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', textAlign: 'right', direction: 'rtl' }} />
                            <Bar dataKey="کلین‌شیت" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={25} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-center text-slate-400 font-medium py-4">دیتای کافی موجود نیست.</p>
                    )}
                  </div>
                </div>
              )}

              {tourneyTab === 'standings' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-[11px]">
                      <thead className="bg-[#00194C] text-white">
                        <tr>
                          <th className="py-3 px-2 font-bold text-right w-8">#</th>
                          <th className="py-3 px-1 font-bold text-right whitespace-nowrap">نام تیم</th>
                          <th className="py-3 px-1 font-bold opacity-80" title="بازی">ب</th>
                          <th className="py-3 px-1 font-bold text-emerald-400" title="برد">ب</th>
                          <th className="py-3 px-1 font-bold text-amber-400" title="مساوی">م</th>
                          <th className="py-3 px-1 font-bold text-rose-400" title="باخت">خ</th>
                          <th className="py-3 px-1 font-bold opacity-80" title="تفاضل گل">ت</th>
                          <th className="py-3 px-2 font-black">امتیاز</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamStandings.length > 0 ? teamStandings.map((t, idx) => (
                          <tr key={t.name} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-2 font-bold text-slate-400 text-right">{idx + 1}</td>
                            <td className="py-2.5 px-1 font-bold text-[#00194C] text-right whitespace-nowrap">{t.name}</td>
                            <td className="py-2.5 px-1 font-medium text-slate-500">{t.played}</td>
                            <td className="py-2.5 px-1 font-bold text-emerald-600">{t.won}</td>
                            <td className="py-2.5 px-1 font-bold text-amber-600">{t.drawn}</td>
                            <td className="py-2.5 px-1 font-bold text-rose-600">{t.lost}</td>
                            <td className="py-2.5 px-1 font-medium text-slate-500" dir="ltr">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                            <td className="py-2.5 px-2 font-black text-[#00194C] bg-slate-50/50">{t.points}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="8" className="py-6 text-slate-400 font-medium">هنوز دیتایی برای جدول وجود ندارد</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isStatsTableModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#00194C]/70 backdrop-blur-md animate-fade-in" onClick={() => setIsStatsTableModalOpen(false)}>
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#00194C] to-[#1e3a8a] p-5 text-center relative shrink-0">
              <button onClick={() => setIsStatsTableModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
              <div className="w-12 h-12 bg-[#FDBA2D] text-[#00194C] rounded-xl mx-auto flex items-center justify-center text-2xl font-black mb-2 shadow-lg">
                🧮
              </div>
              <h3 className="text-white font-black text-lg">جزئیات امتیازات فامیل</h3>
            </div>
            
            <div className="p-0 overflow-y-auto bg-slate-50" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full text-center text-[10px] md:text-xs">
                <thead className="bg-[#00194C] text-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-1 font-bold w-6 border-l border-white/10">#</th>
                    <th className="py-3 px-2 font-bold text-right whitespace-nowrap border-l border-white/10">نام و نام خانوادگی</th>
                    <th className="py-3 px-1 font-bold text-emerald-400 border-l border-white/10" title="تعداد پیش‌بینی‌های ۳ امتیازی">۳ام</th>
                    <th className="py-3 px-1 font-bold text-blue-400 border-l border-white/10" title="تعداد پیش‌بینی‌های ۲ امتیازی">۲ام</th>
                    <th className="py-3 px-1 font-bold text-amber-400 border-l border-white/10" title="تعداد پیش‌بینی‌های ۱ امتیازی">۱ام</th>
                    <th className="py-3 px-1 font-bold text-slate-400 border-l border-white/10" title="تعداد پیش‌بینی‌های صفر امتیازی">۰ام</th>
                    <th className="py-3 px-1 font-bold text-rose-400 border-l border-white/10" title="تعداد بازی‌های از دست‌رفته (بدون پیش‌بینی)">غایب</th>
                    <th className="py-3 px-1 font-black text-[#FDBA2D]">کل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedLeaderboard.map((u, idx) => {
                    const stats = userStats.find(s => s.user_id === u.user_id) || { threes: 0, twos: 0, ones: 0, zeros: 0, missed: 0 };
                    const isMe = u.user_id === user.id; 
                    
                    return (
                      <tr key={u.user_id} className={`transition-colors ${isMe ? 'bg-[#FFF7ED] shadow-[inset_-4px_0_0_#FDBA2D] relative z-10' : 'hover:bg-slate-100 bg-white'}`}>
                        <td className={`py-2.5 px-1 font-bold border-l border-slate-50/50 ${isMe ? 'text-[#FDBA2D]' : 'text-slate-400'}`}>{u.rank}</td>
                        <td className={`py-2.5 px-2 font-bold text-right whitespace-nowrap border-l border-slate-50/50 ${isMe ? 'text-[#00194C]' : 'text-slate-700'}`}>
                          {u.first_name} {u.last_name}
                          {isMe && <span className="mr-1.5 text-[9px] bg-[#FDBA2D] text-[#00194C] px-1.5 py-0.5 rounded-md shadow-sm inline-block">شما</span>}
                        </td>
                        <td className="py-1 px-1 border-l border-slate-50/50">
                          <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black transition-all ${stats.threes === maxThrees && maxThrees > 0 ? 'bg-emerald-500 text-white shadow-md scale-110' : 'text-emerald-600 bg-emerald-50'}`}>
                            {stats.threes}
                          </div>
                        </td>
                        <td className="py-1 px-1 border-l border-slate-50/50">
                          <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black transition-all ${stats.twos === maxTwos && maxTwos > 0 ? 'bg-blue-500 text-white shadow-md scale-110' : 'text-blue-600 bg-blue-50'}`}>
                            {stats.twos}
                          </div>
                        </td>
                        <td className="py-1 px-1 border-l border-slate-50/50">
                          <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black transition-all ${stats.ones === maxOnes && maxOnes > 0 ? 'bg-amber-500 text-white shadow-md scale-110' : 'text-amber-600 bg-amber-50'}`}>
                            {stats.ones}
                          </div>
                        </td>
                        <td className="py-1 px-1 border-l border-slate-50/50">
                          <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black transition-all ${stats.zeros === maxZeros && maxZeros > 0 ? 'bg-slate-600 text-white shadow-md scale-110' : 'text-slate-500 bg-slate-100'}`}>
                            {stats.zeros}
                          </div>
                        </td>
                        <td className="py-1 px-1 border-l border-slate-50/50">
                          <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black transition-all ${stats.missed === maxMissed && maxMissed > 0 ? 'bg-rose-500 text-white shadow-md scale-110' : 'text-rose-500 bg-rose-50'}`}>
                            {stats.missed}
                          </div>
                        </td>
                        <td className={`py-2.5 px-2 font-black ${isMe ? 'text-[#00194C] bg-[#FDBA2D]/20' : 'text-[#00194C] bg-amber-50/40'}`}>
                          {u.total_points}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isTeamHistoryModalOpen && selectedTeamForHistory && (() => {
        const teamHistory = matches.filter(m => 
          (m.home_team === selectedTeamForHistory || m.away_team === selectedTeamForHistory) && 
          m.home_score !== null && m.away_score !== null
        ).sort((a, b) => new Date(b.match_time) - new Date(a.match_time));

        let wins = 0, draws = 0, losses = 0;
        teamHistory.forEach(m => {
          const isHome = m.home_team === selectedTeamForHistory;
          const teamScore = isHome ? m.home_score : m.away_score;
          const oppScore = isHome ? m.away_score : m.home_score;
          
          if (teamScore > oppScore) wins++;
          else if (teamScore === oppScore) draws++;
          else losses++;
        });

        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#00194C]/70 backdrop-blur-md animate-fade-in" onClick={() => setIsTeamHistoryModalOpen(false)}>
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#00194C] to-[#1e3a8a] p-5 text-center relative shrink-0">
                <button onClick={() => setIsTeamHistoryModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
                {getFlagUrl(selectedTeamForHistory) ? (
                  <img src={getFlagUrl(selectedTeamForHistory)} alt={selectedTeamForHistory} className="w-16 h-12 object-cover rounded-md mx-auto mb-3 shadow-lg border-2 border-white/20" />
                ) : (
                  <div className="text-4xl mb-2">🏳️</div>
                )}
                <h3 className="text-white font-black text-xl">{selectedTeamForHistory}</h3>
              </div>
              
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between text-center shrink-0">
                <div className="flex-1 border-l border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">بازی</p>
                  <p className="text-lg font-black text-[#00194C]">{teamHistory.length}</p>
                </div>
                <div className="flex-1 border-l border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">برد</p>
                  <p className="text-lg font-black text-emerald-500">{wins}</p>
                </div>
                <div className="flex-1 border-l border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">مساوی</p>
                  <p className="text-lg font-black text-amber-500">{draws}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">باخت</p>
                  <p className="text-lg font-black text-rose-500">{losses}</p>
                </div>
              </div>

              <div className="p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <p className="text-xs font-black text-slate-800 mb-3">نتایج قبلی:</p>
                {teamHistory.length > 0 ? (
                  <div className="space-y-2">
                    {teamHistory.map(m => {
                      const isHome = m.home_team === selectedTeamForHistory;
                      const isWin = isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
                      const isDraw = m.home_score === m.away_score;
                      const statusColor = isWin ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : isDraw ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700';
                      
                      return (
                        <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border ${statusColor}`}>
                          <span className="font-bold text-xs truncate w-1/3 text-right">{m.home_team}</span>
                          <span className="font-black text-lg bg-white px-3 py-1 rounded-lg shadow-sm w-1/3 text-center" dir="ltr">
                            {m.away_score} - {m.home_score}
                          </span>
                          <span className="font-bold text-xs truncate w-1/3 text-left">{m.away_team}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-xs font-bold text-slate-400 py-4">هنوز بازی‌ای برای این تیم ثبت نشده است.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#00194C]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#00194C] p-6 text-center relative shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
              <div className="w-16 h-16 bg-[#FDBA2D] text-[#00194C] rounded-full mx-auto flex items-center justify-center text-2xl font-black mb-2 shadow-lg">
                {selectedUser.first_name[0]}{selectedUser.last_name ? selectedUser.last_name[0] : ''}
              </div>
              <h3 className="text-white font-black text-xl">{selectedUser.first_name} {selectedUser.last_name}</h3>
              <p className="text-[#FDBA2D] text-sm mt-1">{selectedUser.total_points} امتیاز کل</p>
            </div>

            <div className="flex border-b border-slate-200 shrink-0">
              <button 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${modalTab === 'analytics' ? 'text-[#00194C] border-b-2 border-[#FDBA2D]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setModalTab('analytics')}
              >
                📊 آمار کلی
              </button>
              <button 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${modalTab === 'compare' ? 'text-[#00194C] border-b-2 border-[#FDBA2D]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setModalTab('compare')}
              >
                🕸️ مقایسه
              </button>
              <button 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${modalTab === 'history' ? 'text-[#00194C] border-b-2 border-[#FDBA2D]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setModalTab('history')}
              >
                📋 تاریخچه
              </button>
            </div>

            <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {modalTab === 'analytics' && (() => {
                const analytics = getUserAnalytics(selectedUser.user_id);
                return (
                  <div className="space-y-5">
                    <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 mb-1">شاخص ریسک‌پذیری</p>
                          <p className={`text-sm font-black ${analytics.riskColor}`}>{analytics.riskLabel}</p>
                       </div>
                       <div className={`text-xl font-bold opacity-80 ${analytics.riskColor}`} dir="ltr">{analytics.riskPercent}%</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">درصد دقت</p>
                        <p className="text-xl font-black text-[#16A34A]">{analytics.accuracy}٪</p>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">تیم مورد علاقه (تعداد گل)</p>
                        <p className="text-sm font-black text-[#3b82f6] truncate" title={analytics.favoriteTeam}>{analytics.favoriteTeam}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                        توزیع امتیازات کسب شده
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-600 mb-1">۳ امتیازی</p>
                          <p className="text-lg font-black text-emerald-700">{analytics.pointsBreakdown.count3}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                          <p className="text-[10px] font-bold text-blue-600 mb-1">۲ امتیازی</p>
                          <p className="text-lg font-black text-blue-700">{analytics.pointsBreakdown.count2}</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-600 mb-1">۱ امتیازی</p>
                          <p className="text-lg font-black text-amber-700">{analytics.pointsBreakdown.count1}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-500 mb-1">صفر</p>
                          <p className="text-lg font-black text-slate-600">{analytics.pointsBreakdown.count0}</p>
                        </div>
                      </div>
                    </div>

                    {analytics.chartData.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-3 text-right">📈 روند امتیازگیری (روزهای اخیر)</p>
                        <div className="h-36 w-full" dir="ltr">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.chartData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', textAlign: 'right' }} itemStyle={{ color: '#00194C', fontWeight: 'bold' }} />
                              <Line type="monotone" dataKey="امتیاز" stroke="#FDBA2D" strokeWidth={3} dot={{ fill: '#00194C', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#FDBA2D' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-bold">دیتای کافی برای نمودار وجود ندارد</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {modalTab === 'compare' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex flex-col gap-3 mb-2">
                      <p className="text-xs font-bold text-slate-500 text-center">مقایسه سبک پیش‌بینی</p>
                      
                      <div className="relative">
                        <select
                          value={compareUserId}
                          onChange={(e) => setCompareUserId(e.target.value)}
                          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-3 pr-4 pl-10 font-bold text-[#00194C] focus:outline-none focus:ring-2 focus:ring-[#FDBA2D] appearance-none"
                          dir="rtl"
                        >
                          <option value="">فقط نمودار خودم رو نشون بده</option>
                          {activeUsers
                            .filter(u => u.user_id !== selectedUser.user_id)
                            .map(u => (
                              <option key={u.user_id} value={u.user_id}>مقایسه با: {u.first_name} {u.last_name}</option>
                            ))
                          }
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div className="h-76 w-full mt-4" dir="ltr" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          cx="50%" 
                          cy="50%" 
                          outerRadius="68%" 
                          data={radarData}
                          margin={{ top: 20, right: 35, bottom: 20, left: 35 }}
                        >
                          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#334155', fontSize: 10, fontWeight: '900' }} 
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', textAlign: 'right', direction: 'rtl' }} />
                          
                          <Radar name={`${selectedUser.first_name}`} dataKey="A" stroke="#FDBA2D" strokeWidth={3} fill="#FDBA2D" fillOpacity={compareUserId ? 0.4 : 0.6} />
                          
                          {compareUserId && (
                             <Radar name={`${compareUserObj?.first_name}`} dataKey="B" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} />
                          )}
                          
                          {compareUserId && <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }} />}
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[11px] font-black text-[#00194C] mb-2 text-center">راهنمای خوندن نمودار 📖</p>
                    <ul className="text-[10px] text-slate-600 space-y-2 font-medium">
                      <li>🎯 <strong className="text-slate-800">دقت هدف‌گیری:</strong> چقدر تونستی نتایج رو دقیقاً درست حدس بزنی.</li>
                      <li>🎢 <strong className="text-slate-800">ریسک‌پذیری:</strong> چقدر برخلاف بقیه و روی برد تیم‌های ضعیف‌تر شرط بستی.</li>
                      <li>🛡️ <strong className="text-slate-800">احتیاط (مساوی):</strong> چقدر بازی‌ها رو دست به عصا پیش‌بینی کردی.</li>
                      <li>🔥 <strong className="text-slate-800">آمادگی اخیر:</strong> تو ۵ تا بازی آخرت چقدر رو دور امتیاز گرفتن بودی.</li>
                      <li>❤️ <strong className="text-slate-800">تعصب تیمی:</strong> چقدر همیشه روی برد یک تیم خاص پافشاری می‌کنی.</li>
                    </ul>
                  </div>
                </div>
              )}

              {modalTab === 'history' && (() => {
                const history = getUserHistory(selectedUser.user_id);
                return history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs">
                      <thead className="text-slate-400 bg-white sticky top-0">
                        <tr>
                          <th className="pb-3 border-b border-slate-100 text-right">بازی</th>
                          <th className="pb-3 border-b border-slate-100">حدس</th>
                          <th className="pb-3 border-b border-slate-100">نتیجه</th>
                          <th className="pb-3 border-b border-slate-100">امتیاز</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {history.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 font-bold text-[#00194C] text-right max-w-[120px] truncate" title={`${m.homeTeam} - ${m.awayTeam}`}>
                              {m.homeTeam} - {m.awayTeam}
                            </td>
                            <td className="py-3 font-bold text-slate-500">
                              {m.hasPred ? (
                                <div className="flex flex-col items-center justify-center">
                                  <span className="flex items-center justify-center gap-1" dir="ltr">
                                    <span>{m.predAway}</span>
                                    <span className="text-slate-300">-</span>
                                    <span>{m.predHome}</span>
                                  </span>
                                  {m.predHome === m.predAway && m.predHome !== '-' && m.predAdvanced && (
                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 font-medium">
                                      صعود: {m.predAdvanced === 'home' ? m.homeTeam : m.awayTeam}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                '❌'
                              )}
                            </td>
                            <td className="py-3 font-black text-slate-800">
                              <div className="flex flex-col items-center justify-center">
                                <span className="flex items-center justify-center gap-1" dir="ltr">
                                  <span>{m.awayScore}</span>
                                  <span className="text-slate-300">-</span>
                                  <span>{m.homeScore}</span>
                                </span>
                                {m.homeScore === m.awayScore && m.advancedTeam && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded mt-1 font-bold border border-emerald-100">
                                    صعود: {m.advancedTeam === 'home' ? m.homeTeam : m.awayTeam}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-md font-bold ${m.points === 3 ? 'bg-emerald-100 text-emerald-700' : m.points === 2 ? 'bg-blue-100 text-blue-700' : m.points === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                {m.points}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <span className="text-3xl block mb-2 opacity-50">📋</span>
                    <p className="text-sm font-bold text-slate-400">هیچ بازی ثبت‌شده‌ای وجود ندارد</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

            {/* ✅ مودال Wrapped - برای همه کاربران */}
      {showWrapped && (
        <WrappedModal
          isOpen={showWrapped}
          onClose={() => setShowWrapped(false)}
          user={user}
          matches={matches}
          predictions={matches.flatMap(m => m.predictions || [])}
          profiles={allProfiles}
          leaderboard={leaderboard}
        />
      )}

      {/* ======================================================== */}
      {/* ✅ مودال استوری تمام صفحه */}
      {/* ======================================================== */}
      {fullStoryUser && (
        <div 
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center"
          onClick={() => setFullStoryUser(null)}
        >
          <div className="relative w-full max-w-md h-full max-h-[800px]">
            <img 
              src={`/images/rank${fullStoryUser.rank}-${fullStoryUser.imageName}.jpg`}
              alt={`${fullStoryUser.first_name} ${fullStoryUser.last_name}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = `/images/rank${fullStoryUser.rank}-default.jpg`;
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">
                  {fullStoryUser.rank === 1 ? '👑' : fullStoryUser.rank === 2 ? '🥈' : '🥉'}
                </span>
                <span className={`text-sm font-bold ${fullStoryUser.rank === 1 ? 'text-[#FDBA2D]' : 'text-white/70'}`}>
                  رتبه {fullStoryUser.rank}
                </span>
              </div>
              <h2 className="text-2xl font-black">{fullStoryUser.first_name} {fullStoryUser.last_name}</h2>
              <p className={`text-lg font-bold ${fullStoryUser.rank === 1 ? 'text-[#FDBA2D]' : 'text-white/80'}`}>
                {fullStoryUser.total_points} امتیاز
              </p>
              {fullStoryUser.champion_prediction && (
                <p className="text-sm text-white/60 mt-1">
                  🏆 پیش‌بینی قهرمان: {fullStoryUser.champion_prediction}
                </p>
              )}
            </div>
            <button 
              className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl w-10 h-10 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm"
              onClick={() => setFullStoryUser(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}  
