// ============================================================
// src/components/Wrapped/WrappedSlide.jsx
// ============================================================

import React, { useEffect, useRef } from 'react';

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
  if (!teamName) return null;
  const code = flagMap[teamName];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

// ==========================================
// 1. Intro Slide
// ==========================================
const IntroSlide = ({ data }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-8 w-full">
    <div className="relative">
      <div className="absolute inset-0 bg-[#FDBA2D] blur-3xl opacity-20 rounded-full animate-pulse"></div>
      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#FDBA2D] to-amber-300 flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10">
        <span className="text-6xl drop-shadow-md">🏆</span>
      </div>
    </div>
    <div className="text-center space-y-2">
      <h2 className="text-[#FDBA2D] text-sm tracking-widest font-black uppercase">WORLD CUP 2026</h2>
      <h1 className="text-5xl font-black text-white drop-shadow-lg leading-tight">کارنامه<br />پیش‌بینی</h1>
    </div>
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-xs border border-white/20 shadow-xl text-center">
      <p className="text-white/60 text-xs mb-1">صادر شده برای:</p>
      <p className="text-2xl font-bold text-white">{data?.user?.first_name || ''} {data?.user?.last_name || ''}</p>
    </div>
  </div>
);

// ==========================================
// 2. Rank Slide
// ==========================================
const RankSlide = ({ data }) => {
  const rankObj = data?.userRank;
  const uniqueRanksCount = data?.communityStats?.totalUniqueRanks || 0; 
  
  let rankEmoji = '🎖️';
  if (rankObj === 1) rankEmoji = '🥇';
  else if (rankObj === 2) rankEmoji = '🥈';
  else if (rankObj === 3) rankEmoji = '🥉';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full space-y-8">
      <div className="text-center space-y-4">
        <span className="text-8xl drop-shadow-2xl animate-bounce inline-block">{rankEmoji}</span>
        <p className="text-xl font-bold text-white/80">جایگاه نهایی شما</p>
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-[#FDBA2D] text-8xl font-black drop-shadow-[0_0_15px_rgba(253,186,45,0.5)]">#{rankObj || '-'}</span>
          
          {uniqueRanksCount > 0 && (
            <div className="bg-white/10 px-4 py-1.5 rounded-full mt-2 border border-white/10 shadow-inner">
              <span className="text-white/70 text-[11px] font-bold">از بین {uniqueRanksCount} رتبه ایجاد شده</span>
            </div>
          )}
          <span className="text-white/40 text-xs mt-1">(در میان {data?.totalUsers || 0} شرکت‌کننده)</span>
        </div>
      </div>
      
      <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl flex items-center justify-between">
        <div>
          <p className="text-white/60 text-xs font-bold mb-1">امتیاز کل</p>
          <p className="text-3xl font-black text-white">{data?.totalPoints || 0} <span className="text-sm font-normal text-white/50">امتیاز</span></p>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30">
          📈
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Breakdown Slide (با همزاد پیش‌بینی)
// ==========================================
const BreakdownSlide = ({ data }) => {
  // ✅ استفاده از متغیرهای محلی با مقدار پیش‌فرض 0
  const threes = data?.threes ?? 0;
  const twos = data?.twos ?? 0;
  const ones = data?.ones ?? 0;
  const zeros = data?.zeros ?? 0;
  const total = threes + twos + ones + zeros;
  
  // ✅ تابع درصد با چک کردن عدد بودن
  const getPct = (val) => {
    if (total === 0) return 0;
    const num = typeof val === 'number' ? val : 0;
    return Math.round((num / total) * 100);
  };
  
  const twin = data?.predictionTwin;

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">🎯</span>
        <h2 className="text-2xl font-black text-white">آناتومی حدس‌ها</h2>
        <p className="text-white/60 text-sm mt-1">توزیع امتیازات شما در یک نگاه</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30 text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-emerald-400 mb-1">دقیق (۳ امتیازی)</p>
          <p className="text-3xl font-black text-white">{threes}</p>
          <p className="text-[9px] text-emerald-400/50 mt-1">{getPct(threes)}% حدس‌ها</p>
        </div>
        <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30 text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-blue-400 mb-1">تفاضل (۲ امتیازی)</p>
          <p className="text-3xl font-black text-white">{twos}</p>
          <p className="text-[9px] text-blue-400/50 mt-1">{getPct(twos)}% حدس‌ها</p>
        </div>
        <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30 text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-amber-400 mb-1">برنده (۱ امتیازی)</p>
          <p className="text-3xl font-black text-white">{ones}</p>
          <p className="text-[9px] text-amber-400/50 mt-1">{getPct(ones)}% حدس‌ها</p>
        </div>
        <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/30 text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-rose-400 mb-1">غلط (۰ امتیازی)</p>
          <p className="text-3xl font-black text-white">{zeros}</p>
          <p className="text-[9px] text-rose-400/50 mt-1">{getPct(zeros)}% حدس‌ها</p>
        </div>
      </div>

      {twin && (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/20 rounded-xl p-4 border border-purple-500/30 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-purple-300 flex items-center gap-1">👥 همزاد پیش‌بینی تو</p>
            <p className="text-sm font-black text-white mt-1">{twin.name}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-purple-400">{twin.similarity}%</p>
            <p className="text-[8px] text-purple-300/60">شباهت در توزیع امتیاز</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. Best & Worst Slide
// ==========================================
const BestWorstSlide = ({ data }) => {
  const best = data?.bestMatch;
  const worst = data?.worstMatch;

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">🎭</span>
        <h2 className="text-2xl font-black text-white">اوج و حضیض</h2>
      </div>
      <div className="space-y-4 w-full mt-2">
        {best && best.points === 3 ? (
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-blur-md rounded-3xl p-5 border border-emerald-500/30 shadow-lg relative">
            <div className="absolute -left-4 -top-4 text-5xl opacity-10">🌟</div>
            <p className="text-emerald-400 font-bold text-xs mb-3">🌟 شاهکار پیش‌بینی</p>
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="font-bold text-white text-sm w-1/3 text-right">{best.homeTeam}</span>
              <span className="font-black text-xl text-[#FDBA2D] w-1/3 text-center" dir="ltr">{best.awayScore} - {best.homeScore}</span>
              <span className="font-bold text-white text-sm w-1/3 text-left">{best.awayTeam}</span>
            </div>
            <div className="mt-3 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <p className="text-[10px] text-emerald-300 font-medium leading-relaxed">
                <strong className="font-black text-white">چرا این بازی؟</strong> این خاص‌ترین ۳ امتیازی تو بود! فقط {best.rarity} نفر از کل شرکت‌کننده‌ها تونستن این نتیجه رو دقیق حدس بزنن.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
            <p className="text-white/50 text-sm">هیچ پیش‌بینی دقیقی (۳ امتیازی) نداشتی 😢</p>
          </div>
        )}

        {worst && worst.error > 0 ? (
          <div className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 backdrop-blur-md rounded-3xl p-5 border border-rose-500/30 shadow-lg relative">
            <div className="absolute -left-4 -top-4 text-5xl opacity-10">💩</div>
            <p className="text-rose-400 font-bold text-xs mb-3">💩 سوتی مطلق</p>
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
              <span className="font-bold text-white text-sm w-1/3 text-right">{worst.homeTeam}</span>
              <span className="font-black text-xl text-rose-300 w-1/3 text-center" dir="ltr">{worst.awayScore} - {worst.homeScore}</span>
              <span className="font-bold text-white text-sm w-1/3 text-left">{worst.awayTeam}</span>
            </div>
            <div className="mt-3 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <p className="text-[10px] text-rose-200 font-medium leading-relaxed">
                <strong className="font-black text-white">چرا این بازی؟</strong> حدس تو <span dir="ltr" className="font-black text-rose-400">{worst.predAway}-{worst.predHome}</span> بود. مجموعاً {worst.error} گل با واقعیت اختلاف داشتی که بزرگترین خطای محاسباتی تو تو کل جام بود!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
            <p className="text-white/50 text-sm">هیچ سوتی بزرگی (۰ امتیازی) نداشتی! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. Rank Timeline Slide (مقاوم‌سازی شده)
// ==========================================
const RankTimelineSlide = ({ data }) => {
  const timeline = data?.rankTimeline || [];
  
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col h-full w-full justify-center items-center">
        <span className="text-5xl mb-4">📊</span>
        <p className="text-white/60 font-bold">دیتای کافی برای نمایش روند رتبه وجود ندارد</p>
      </div>
    );
  }

  // ✅ استخراج رتبه‌ها با مقدار پیش‌فرض
  const ranks = timeline.map(r => r.rank ?? 0);
  const firstRank = timeline[0]?.rank ?? 0;
  const lastRank = timeline[timeline.length - 1]?.rank ?? 0;
  const bestRank = Math.min(...ranks);
  const worstRank = Math.max(...ranks);
  const rankDiff = firstRank - lastRank;

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">📈</span>
        <h2 className="text-2xl font-black text-white">روند تغییرات رتبه</h2>
        <p className="text-white/60 text-sm mt-1">۱۲ مسابقه تأثیرگذار آخر</p>
      </div>

      <div className="space-y-4 w-full">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="relative h-40 w-full">
            <svg className="w-full h-full" viewBox={`0 0 ${Math.max(timeline.length * 25, 100)} 120`} preserveAspectRatio="none">
              <polyline
                points={timeline.map((item, i) => {
                  const minRank = Math.min(...ranks);
                  const maxRank = Math.max(...ranks);
                  const range = maxRank - minRank || 1;
                  const y = 100 - (((item.rank ?? 0) - minRank) / range) * 80;
                  return `${i * 25 + 12},${y + 10}`;
                }).join(' ')}
                fill="none" stroke="#FDBA2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="drop-shadow-[0_0_10px_rgba(253,186,45,0.3)]"
              />
              
              {timeline.map((item, i) => {
                const minRank = Math.min(...ranks);
                const maxRank = Math.max(...ranks);
                const range = maxRank - minRank || 1;
                const y = 100 - (((item.rank ?? 0) - minRank) / range) * 80 + 10;
                
                const isFirst = i === 0;
                const isLast = i === timeline.length - 1;
                const isBest = (item.rank ?? 0) === bestRank;
                const isWorst = (item.rank ?? 0) === worstRank;
                
                let fillColor = '#FDBA2D60'; 
                let r = 4; 
                let strokeColor = '#00194C';
                
                if (isFirst) { fillColor = '#60a5fa'; r = 6; } 
                else if (isLast) { fillColor = '#FDBA2D'; r = 7; strokeColor = '#FDBA2D'; } 
                else if (isBest) { fillColor = '#10b981'; r = 6; } 
                else if (isWorst) { fillColor = '#ef4444'; r = 6; }
                
                return (
                  <circle key={`dot-${i}`} cx={i * 25 + 12} cy={y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={isLast ? 3 : 2}>
                    <title>رتبه {item.rank} - {item.date}</title>
                  </circle>
                );
              })}
              
              {timeline.map((item, i) => {
                if (i === 0 || i === timeline.length - 1 || i % 3 === 0) {
                  return (
                    <text key={`label-${i}`} x={i * 25 + 12} y={115} fontSize="7" fill="#ffffff50" textAnchor="middle" className="font-bold">
                      {item.date}
                    </text>
                  );
                }
                return null;
              })}
            </svg>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-blue-500/10 rounded-xl p-2 text-center border border-blue-500/20">
              <p className="text-[8px] text-blue-400/70">شروع</p>
              <p className="text-xl font-black text-blue-400">#{firstRank}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-2 text-center border border-emerald-500/20">
              <p className="text-[8px] text-emerald-400/70">بهترین</p>
              <p className="text-xl font-black text-emerald-400">#{bestRank}</p>
            </div>
            <div className="bg-rose-500/10 rounded-xl p-2 text-center border border-rose-500/20">
              <p className="text-[8px] text-rose-400/70">بدترین</p>
              <p className="text-xl font-black text-rose-400">#{worstRank}</p>
            </div>
            <div className="bg-[#FDBA2D]/10 rounded-xl p-2 text-center border border-[#FDBA2D]/20">
              <p className="text-[8px] text-[#FDBA2D]/70">پایان</p>
              <p className="text-xl font-black text-[#FDBA2D]">#{lastRank}</p>
            </div>
          </div>

          <div className="mt-3 text-center">
            {rankDiff > 0 && (
              <div className="bg-emerald-500/20 rounded-xl p-2 border border-emerald-500/30">
                <p className="text-sm text-emerald-400">🎉 <span className="font-black">{rankDiff} پله</span> صعود کردی!</p>
              </div>
            )}
            {rankDiff < 0 && (
              <div className="bg-rose-500/20 rounded-xl p-2 border border-rose-500/30">
                <p className="text-sm text-rose-400">😅 <span className="font-black">{Math.abs(rankDiff)} پله</span> سقوط کردی!</p>
              </div>
            )}
            {rankDiff === 0 && (
              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <p className="text-sm text-white/50">⚖️ رتبه‌ات ثابت موند!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. Rivalry Slide
// ==========================================
const RivalrySlide = ({ data }) => {
  const rival = data?.mainRival; 

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">⚔️</span>
        <h2 className="text-2xl font-black text-white">دربی شخصی</h2>
        <p className="text-white/60 text-sm mt-1">کسی که سایه‌به‌سایه تعقیبت می‌کرد</p>
      </div>

      <div className="space-y-4 w-full">
        {rival ? (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/20 backdrop-blur-md rounded-3xl p-6 border border-purple-500/30 relative">
            <div className="text-center mb-6">
              <p className="text-lg font-black text-white">{rival.first_name} {rival.last_name}</p>
              <p className="text-[10px] text-purple-200 mt-1">شما در {rival.commonGames || 0} بازی پیش‌بینی مشترک داشتید</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center border border-white/5">
                <span className="text-xs text-emerald-200/80">تعداد دفعاتی که تو مچش رو خوابوندی</span>
                <span className="text-xl font-black text-emerald-400">{rival.userWins || 0} بار</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center border border-white/5">
                <span className="text-xs text-rose-200/80">تعداد دفعاتی که اون مچت رو خوابوند</span>
                <span className="text-xl font-black text-rose-400">{rival.rivalWins || 0} بار</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl flex justify-between items-center border border-white/5">
                <span className="text-xs text-blue-200/80">هم‌فکری کامل (امتیاز برابر)</span>
                <span className="text-xl font-black text-blue-400">{rival.draws || 0} بازی</span>
              </div>
            </div>
            
            <div className="mt-5 text-center">
              <p className="text-[11px] text-purple-300 font-bold bg-purple-500/20 py-2 rounded-lg border border-purple-500/30">
                در نهایت {rival.pointsDiff} امتیاز با هم اختلاف دارید.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-sm text-white/50">رقیب مشخصی پیدا نشد!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 7. Team Bias Slide
// ==========================================
const TeamBiasSlide = ({ data }) => {
  const bias = data?.teamBias || {};
  const hasEnoughData = bias.favorite && bias.hated;

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">⚖️</span>
        <h2 className="text-2xl font-black text-white">تیم‌های بهشت و جهنم</h2>
      </div>

      {hasEnoughData ? (
        <div className="space-y-4 w-full">
          <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/20 rounded-2xl p-5 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 font-bold mb-3">😇 فرشته نجات</p>
            <div className="flex items-center gap-3 mb-2">
              {getFlagUrl(bias.favorite) && <img src={getFlagUrl(bias.favorite)} alt={bias.favorite} className="w-8 h-6 rounded object-cover" />}
              <span className="text-xl font-bold text-white">{bias.favorite}</span>
            </div>
            <p className="text-[10px] text-emerald-200/70 leading-relaxed">
              <strong className="text-white">دلیل:</strong> این تیم برای تو معدن طلا بود! در بازی‌های این تیم تونستی روی هم <span className="font-bold text-emerald-400">{bias.favoritePoints} امتیاز</span> دشت کنی که بالاترین نرخ بهره‌وری تو بین تمام تیم‌هاست.
            </p>
          </div>

          <div className="bg-gradient-to-r from-rose-900/40 to-red-900/20 rounded-2xl p-5 border border-rose-500/30">
            <p className="text-xs text-rose-400 font-bold mb-3">😈 قاتل خاموش</p>
            <div className="flex items-center gap-3 mb-2">
              {getFlagUrl(bias.hated) && <img src={getFlagUrl(bias.hated)} alt={bias.hated} className="w-8 h-6 rounded object-cover grayscale" />}
              <span className="text-xl font-bold text-white/80">{bias.hated}</span>
            </div>
            <p className="text-[10px] text-rose-200/70 leading-relaxed">
              <strong className="text-white">دلیل:</strong> این تیم رسماً گند زد به فرم‌های پیش‌بینی تو! در بازی‌های این تیم، حدس‌های تو مجموعاً <span className="font-bold text-rose-400">{bias.hatedErrors} گل</span> با واقعیت اختلاف داشت.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center w-full">
          <span className="text-5xl mb-4 block">📊</span>
          <p className="text-white/60 font-bold">دیتای کافی برای تحلیل تیم‌ها وجود ندارد</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 8. Streak Slide
// ==========================================
const StreakSlide = ({ data }) => {
  const streak = data?.streakData || {};

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">🔥</span>
        <h2 className="text-2xl font-black text-white">نوار پیروزی</h2>
        <p className="text-white/60 text-sm mt-1">اوج و فرود پیش‌بینی‌های شما</p>
      </div>

      <div className="space-y-4 w-full">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/30 text-center">
            <p className="text-xs text-emerald-400 font-bold mb-1">🔥 طولانی‌ترین نوار پیروزی</p>
            <p className="text-5xl font-black text-emerald-400">{streak.bestStreak || 0}</p>
            <p className="text-[10px] text-white/50 mt-1">بازی متوالی با امتیاز</p>
          </div>
          
          <div className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 backdrop-blur-md rounded-2xl p-5 border border-rose-500/30 text-center">
            <p className="text-xs text-rose-400 font-bold mb-1">💧 طولانی‌ترین خشکسالی</p>
            <p className="text-5xl font-black text-rose-400">{streak.worstStreak || 0}</p>
            <p className="text-[10px] text-white/50 mt-1">بازی متوالی بدون امتیاز</p>
          </div>
        </div>

        {streak.currentStreak > 0 && (
          <div className="bg-gradient-to-r from-[#FDBA2D]/20 to-amber-500/20 backdrop-blur-md rounded-2xl p-4 border border-[#FDBA2D]/30 text-center">
            <p className="text-xs text-[#FDBA2D] font-bold">⚡ نوار فعلی</p>
            <p className="text-3xl font-black text-[#FDBA2D]">{streak.currentStreak} بازی متوالی با امتیاز</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 9. Risk Profile Slide
// ==========================================
const RiskProfileSlide = ({ data }) => {
  const risk = data?.riskProfile || {};
  const riskPercent = risk.riskPercent || 0;
  const totalPredictions = risk.totalPredictions || 0;

  if (totalPredictions < 3) {
    return (
      <div className="flex flex-col h-full w-full justify-center items-center space-y-6">
        <div className="text-center">
          <span className="text-7xl drop-shadow-lg mb-2 inline-block">🔍</span>
          <h2 className="text-2xl font-black text-white">شخصیت پیش‌بینی</h2>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center w-full">
          <p className="text-white/60 font-bold">برای تحلیل شخصیت پیش‌بینی به دیتای بیشتری نیاز داریم</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <div className="text-7xl drop-shadow-lg mb-2 inline-block">{risk.emoji || '🐑'}</div>
        <h2 className="text-2xl font-black text-white">شخصیت پیش‌بینی</h2>
        <p className={`text-lg font-black ${risk.color || 'text-slate-400'} mt-1`}>{risk.label || 'محتاطِ امن 🐑'}</p>
        <p className="text-xs text-white/40 mt-1">بر اساس {totalPredictions} پیش‌بینی</p>
      </div>

      <div className="space-y-4 w-full">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
          <p className="text-xs text-white/60 font-bold mb-3 text-center">شاخص ریسک‌پذیری</p>
          <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                riskPercent >= 30 ? 'bg-rose-500' : 
                riskPercent >= 15 ? 'bg-amber-500' : 
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(riskPercent + 20, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/40">
            <span>محتاط 🐑</span>
            <span className="font-bold text-white/60">{riskPercent}% شگفتی‌جو</span>
            <span>جسور 🐺</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-[10px] text-white/50">پیش‌بینی‌های شگفتی‌ساز</p>
            <p className="text-2xl font-black text-rose-400">{risk.upsetPredictions || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-[10px] text-white/50">دقت کلی</p>
            <p className="text-2xl font-black text-emerald-400">{risk.safePercent || 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 10. Champion Slide
// ==========================================
const ChampionSlide = ({ data }) => {
  const champ = data?.championPick;
  const correctChamp = data?.isChampionCorrect;
  
  return (
    <div className="flex flex-col h-full w-full items-center justify-center space-y-8">
      <div className="relative text-center">
        <div className="absolute inset-0 bg-[#FDBA2D] blur-[40px] opacity-20 rounded-full"></div>
        <span className="text-7xl drop-shadow-2xl relative z-10 inline-block mb-2">🔮</span>
        <h2 className="text-2xl font-black text-white relative z-10">پیش‌بینی قهرمان</h2>
      </div>

      {champ ? (
        <div className="w-full space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col items-center">
            {getFlagUrl(champ) ? (
              <img src={getFlagUrl(champ)} alt={champ} className="w-24 h-16 rounded-lg object-cover shadow-lg mb-4 border-2 border-white/10" />
            ) : (
              <div className="text-5xl mb-4">🏳️</div>
            )}
            <p className="text-3xl font-black text-[#FDBA2D] tracking-wide">{champ}</p>
          </div>

          <div className={`p-4 rounded-2xl flex items-center justify-between border ${correctChamp ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-rose-500/20 border-rose-500/50'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{correctChamp ? '🎉' : '💔'}</span>
              <div>
                <p className="text-sm font-bold text-white">{correctChamp ? 'قهرمان شد!' : 'جام رو از دست داد'}</p>
                {correctChamp && <p className="text-[10px] text-emerald-400 mt-0.5">۵+ امتیاز طلایی بهت اضافه شد</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-center w-full">
          <span className="text-5xl mb-4 block opacity-50">🤷‍♂️</span>
          <p className="text-white/60 font-bold">تیمی رو برای قهرمانی انتخاب نکرده بودی!</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 11. What If Slide
// ==========================================
const WhatIfSlide = ({ data }) => {
  const rival = data?.mainRival;

  return (
    <div className="flex flex-col h-full w-full justify-center space-y-6">
      <div className="text-center mb-2">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">🤔</span>
        <h2 className="text-2xl font-black text-white">اگه... چی می‌شد؟</h2>
        <p className="text-white/60 text-sm mt-1">جهان‌های موازی پیش‌بینی تو</p>
      </div>

      <div className="space-y-4 w-full">
        <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 backdrop-blur-md rounded-2xl p-4 border border-blue-500/30 flex justify-between items-center">
          <div>
            <p className="text-[11px] text-blue-200 font-bold mb-1">اگه ۳ سوتی بزرگت رو دقیق می‌زدی...</p>
            <p className="text-[9px] text-white/40">رتبه‌ فعلی: #{data?.userRank}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white drop-shadow-md">#{data?.ifScenarios?.threeMoreCorrect?.rank || '-'}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 flex justify-between items-center">
          <div>
            <p className="text-[11px] text-emerald-200 font-bold mb-1">اگه هیچ غیبتی نداشتی...</p>
            <p className="text-[9px] text-white/40">با فرض گرفتن میانگین امتیازات خودت</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white drop-shadow-md">#{data?.ifScenarios?.noMiss?.rank || '-'}</p>
          </div>
        </div>

        {rival && rival.rank && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-800/20 backdrop-blur-md rounded-2xl p-4 border border-purple-500/30 flex justify-between items-center">
            <div>
              <p className="text-[11px] text-purple-200 font-bold mb-1">اگه دقیقاً از روی دست رقیبت تقلب می‌کردی...</p>
              <p className="text-[9px] text-white/40">کپی‌برداری از {rival.first_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-white drop-shadow-md">#{rival.rank || '-'}</p>
            </div>
          </div>
        )}
        
        {(!rival || !rival.rank) && (
          <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/20 backdrop-blur-md rounded-2xl p-4 border border-amber-500/30 flex justify-between items-center">
            <div>
              <p className="text-[11px] text-amber-200 font-bold mb-1">اگه از اول تا آخر فقط مساوی می‌زدی...</p>
              <p className="text-[9px] text-white/40">بدون هیچ تحلیل و فکری</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-white drop-shadow-md">#{data?.ifScenarios?.alwaysDraw?.rank || '-'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 12. Achievements Slide
// ==========================================
const AchievementsSlide = ({ data }) => {
  const earned = data?.achievements?.earned || [];
  const funBadges = data?.achievements?.funBadges || []; 
  
  const displayItems = earned.length > 0 ? earned : funBadges;

  return (
    <div className="flex flex-col h-full w-full space-y-6 pt-4">
      <div className="text-center shrink-0">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">🏅</span>
        <h2 className="text-2xl font-black text-[#FDBA2D]">ویترین افتخارات</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4" style={{ scrollbarWidth: 'none' }}>
        {displayItems.length > 0 ? (
          displayItems.map((item, i) => (
            <div key={`achievement-${i}`} className={`backdrop-blur-md rounded-xl p-4 shadow-lg flex gap-4 items-center border-l-4 ${earned.length > 0 ? 'bg-white/10 border-emerald-500' : 'bg-white/5 border-slate-500 grayscale'}`}>
              <div className="text-3xl shrink-0">{item.icon || (earned.length > 0 ? '🌟' : '👻')}</div>
              <div>
                <p className="text-sm font-black text-white mb-1">{item.title}</p>
                <p className="text-[10px] text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center mt-10">
            <span className="text-5xl mb-4 block">👻</span>
            <p className="text-white/50 text-sm">هیچ مدالی نگرفتی! روحی بودی برای خودت.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 13. Community Slide
// ==========================================
const CommunitySlide = ({ data }) => {
  const community = data?.communityStats || {};
  return (
    <div className="flex flex-col h-full w-full justify-center space-y-8">
      <div className="text-center">
        <span className="text-5xl drop-shadow-lg mb-2 inline-block">🌐</span>
        <h2 className="text-2xl font-black text-white">آمار کل فامیل</h2>
        <p className="text-white/60 text-sm mt-1">نگاهی به کلیت تورنمنت</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center shadow-lg">
          <p className="text-[10px] text-white/60 font-bold mb-2 uppercase tracking-wider">شرکت‌کنندگان</p>
          <p className="text-4xl font-black text-[#FDBA2D] drop-shadow-md">{community.totalPlayers || 0}</p>
          <p className="text-xs text-white/40 mt-1">نفر</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center shadow-lg">
          <p className="text-[10px] text-white/60 font-bold mb-2 uppercase tracking-wider">کل پیش‌بینی‌ها</p>
          <p className="text-4xl font-black text-emerald-400 drop-shadow-md">{community.totalPredictions || 0}</p>
          <p className="text-xs text-white/40 mt-1">فرم ثبت شده</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/30 text-center shadow-xl w-full">
        <p className="text-xs text-indigo-200 font-bold mb-2">میانگین امتیاز هر بازی (برای هر نفر)</p>
        <div className="flex items-baseline justify-center gap-2">
          <p className="text-5xl font-black text-white drop-shadow-lg">{community.avgPoints || 0}</p>
          <span className="text-sm text-indigo-300">امتیاز</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 14. Share Slide (مقاوم‌سازی شده)
// ==========================================
const ShareSlide = ({ data, onNext }) => {
  const primaryAchievement = data?.achievements?.earned?.[0] || data?.achievements?.funBadges?.[0] || { title: 'شهروند عادی 🚶‍♂️', icon: '🚶‍♂️' };
  const myChamp = data?.championPick;
  const totalUsers = data?.totalUsers || 0;
  const userRank = data?.userRank || 0;
  
  // ✅ جلوگیری از تقسیم بر صفر
  const topPercent = totalUsers > 0 ? Math.min(100, Math.round((userRank / totalUsers) * 100)) : 100;
  const bestM = data?.bestMatch;

  return (
    <div className="flex flex-col h-full w-full justify-center items-center pb-2">
      <div className="w-full h-full bg-gradient-to-br from-[#0a2a5e] to-[#00194C] rounded-[32px] p-6 border border-white/10 shadow-2xl relative flex flex-col overflow-hidden">
        <div className="absolute -right-12 -top-12 text-[150px] opacity-[0.03] rotate-12 pointer-events-none">🏆</div>
        <div className="absolute -left-12 bottom-12 text-[180px] opacity-[0.02] -rotate-12 pointer-events-none">⚽</div>
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-5 relative z-10 shrink-0">
          <div className="text-right">
            <h4 className="text-white font-black text-xl">{data?.user?.first_name || ''} {data?.user?.last_name || ''}</h4>
            <p className="text-[10px] text-[#FDBA2D] font-bold tracking-widest uppercase mt-1">WORLD CUP 2026 WRAPPED</p>
          </div>
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-2xl border border-white/10 shadow-inner">⭐</div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-around py-2 relative z-10">
          
          {topPercent <= 50 && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center py-3 rounded-xl shadow-sm">
              🔥 جزو <span className="font-black text-emerald-300">{topPercent}٪ برتر</span> کل فامیل بودید!
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FDBA2D] to-transparent opacity-50"></div>
              <p className="text-xs text-white/50 font-bold mb-2">رتبه نهایی</p>
              <div className="flex items-baseline justify-center gap-1">
                <p className="text-6xl font-black text-[#FDBA2D] drop-shadow-[0_0_15px_rgba(253,186,45,0.4)]">#{userRank || '-'}</p>
                <span className="text-xs text-white/30 font-bold">/{totalUsers}</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
              <p className="text-xs text-white/50 font-bold mb-2">امتیاز کل</p>
              <p className="text-6xl font-black text-white drop-shadow-md">{data?.totalPoints || 0}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mt-2">
            <p className="text-[10px] text-center text-white/50 font-bold mb-3">دقت پیش‌بینی‌های من</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-emerald-500/10 rounded-xl py-2 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-400 mb-1">دقیق</p>
                <p className="text-lg font-black text-white">{data?.threes || 0}</p>
              </div>
              <div className="bg-blue-500/10 rounded-xl py-2 border border-blue-500/20">
                <p className="text-[10px] text-blue-400 mb-1">تفاضل</p>
                <p className="text-lg font-black text-white">{data?.twos || 0}</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl py-2 border border-amber-500/20">
                <p className="text-[10px] text-amber-400 mb-1">برنده</p>
                <p className="text-lg font-black text-white">{data?.ones || 0}</p>
              </div>
              <div className="bg-rose-500/10 rounded-xl py-2 border border-rose-500/20">
                <p className="text-[10px] text-rose-400 mb-1">غلط</p>
                <p className="text-lg font-black text-white">{data?.zeros || 0}</p>
              </div>
            </div>
          </div>

          {bestM && bestM.points === 3 && (
            <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10 flex items-center justify-between mt-2">
              <div>
                <p className="text-[9px] text-white/50 font-bold mb-1.5 flex items-center gap-1">🌟 شاهکار من</p>
                <p className="text-sm font-black text-white">{bestM.homeTeam} {bestM.homeScore}-{bestM.awayScore} {bestM.awayTeam}</p>
              </div>
              <div className="text-[10px] bg-[#FDBA2D]/20 text-[#FDBA2D] px-3 py-1.5 rounded-lg border border-[#FDBA2D]/30 font-bold">
                دقیق زدم!
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-3 shadow-sm">
              <span className="text-3xl">{primaryAchievement.icon}</span>
              <div className="truncate">
                <p className="text-[9px] text-white/40 font-bold">لقب اختصاصی</p>
                <p className="text-xs font-black text-white truncate">{primaryAchievement.title}</p>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-3 shadow-sm">
              {myChamp && getFlagUrl(myChamp) ? (
                <img src={getFlagUrl(myChamp)} alt="flag" className="w-8 h-6 object-cover rounded shadow-sm shrink-0 border border-white/10" />
              ) : <span className="text-3xl">🔮</span>}
              <div className="truncate">
                <p className="text-[9px] text-white/40 font-bold">حدس قهرمان</p>
                <p className="text-xs font-black text-[#FDBA2D] truncate">{myChamp || 'ثبت نشده'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-2 pt-4 border-t border-white/10 relative z-10 shrink-0">
          <p className="text-[8px] text-white/30 tracking-[0.4em] font-black uppercase">FIFA WORLD CUP 2026 PREDICTIONS</p>
        </div>
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all"
      >
        بستن کارنامه
      </button>
    </div>
  );
};

// ==========================================
// Main Container Component
// ==========================================
const WrappedSlide = ({ data, slideId, onNext }) => {
  const slideRef = useRef(null);

  useEffect(() => {
    if (slideRef.current) {
      slideRef.current.style.opacity = '0';
      slideRef.current.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        slideRef.current.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        slideRef.current.style.opacity = '1';
        slideRef.current.style.transform = 'translateY(0)';
      });
    }
  }, [slideId]);

  const renderContent = () => {
    switch (slideId) {
      case 'intro': return <IntroSlide data={data} />;
      case 'rank': return <RankSlide data={data} />;
      case 'breakdown': return <BreakdownSlide data={data} />;
      case 'best_worst': return <BestWorstSlide data={data} />;
      case 'rank_timeline': return <RankTimelineSlide data={data} />;
      case 'rivalry': return <RivalrySlide data={data} />;
      case 'team_bias': return <TeamBiasSlide data={data} />;
      case 'streak': return <StreakSlide data={data} />;
      case 'risk': return <RiskProfileSlide data={data} />;
      case 'champion': return <ChampionSlide data={data} />;
      case 'what_if': return <WhatIfSlide data={data} />;
      case 'achievements': return <AchievementsSlide data={data} />;
      case 'community': return <CommunitySlide data={data} />;
      case 'share': return <ShareSlide data={data} onNext={onNext} />;
      default: return null;
    }
  };

  return (
    <div ref={slideRef} className="h-full w-full bg-[#00194C] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[60%] bg-[#FDBA2D]/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="h-full w-full p-5 flex flex-col items-center relative z-10 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default WrappedSlide;
