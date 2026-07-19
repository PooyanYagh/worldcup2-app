import React, { useState } from 'react';
import { supabase } from './supabaseClient';

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

// ✅ اضافه کردن React.memo برای جلوگیری از رندرهای غیرضروری
export default React.memo(function MatchCard({ match, userId, userPrediction, isAdmin, onTeamClick }) {
  const [predHome, setPredHome] = useState(userPrediction?.pred_home ?? '');
  const [predAway, setPredAway] = useState(userPrediction?.pred_away ?? '');
  const [predAdvanced, setPredAdvanced] = useState(userPrediction?.pred_advanced_team ?? '');
  
  const [adminHome, setAdminHome] = useState(match.home_score ?? '');
  const [adminAway, setAdminAway] = useState(match.away_score ?? '');
  const [adminAdvanced, setAdminAdvanced] = useState(match.advanced_team ?? '');
  
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); 

  const isMatchStarted = new Date() > new Date(match.match_time);
  const isMatchFinished = match.home_score !== null && match.away_score !== null;
  
  // ✅ بررسی مساوی بودن نتیجه‌ها با مقاوم‌سازی
  const predHomeNum = parseInt(predHome);
  const predAwayNum = parseInt(predAway);
  const isPredictionDraw = predHome !== '' && predAway !== '' && !isNaN(predHomeNum) && !isNaN(predAwayNum) && predHomeNum === predAwayNum;
  
  const adminHomeNum = parseInt(adminHome);
  const adminAwayNum = parseInt(adminAway);
  const isAdminResultDraw = adminHome !== '' && adminAway !== '' && !isNaN(adminHomeNum) && !isNaN(adminAwayNum) && adminHomeNum === adminAwayNum;

  // محاسبات نوار پیشرفت (آمار امتیازات فامیل)
  let totalPreds = 0, p3 = 0, p2 = 0, p1 = 0, p0 = 0;
  if (isMatchFinished && match.predictions) {
    totalPreds = match.predictions.length;
    match.predictions.forEach(p => {
      if (p.points_earned === 3) p3++;
      else if (p.points_earned === 2) p2++;
      else if (p.points_earned === 1) p1++;
      else if (p.points_earned === 0) p0++;
    });
  }
  
  // ✅ تابع درصد با مقاوم‌سازی
  const getPercent = (val) => {
    if (totalPreds === 0 || typeof val !== 'number') return 0;
    return (val / totalPreds) * 100;
  };
  
  // ✅ تابع نمایش درصد با فرمت مناسب
  const getPercentDisplay = (val) => {
    const pct = getPercent(val);
    return pct > 0 ? `${pct.toFixed(0)}%` : '0%';
  };

  // مرتب‌سازی لیست پیش‌بینی بقیه فامیل
  const sortedOthersPredictions = (match.predictions || [])
    .filter(p => p.user_id !== userId)
    .sort((a, b) => {
      const ptsA = a.points_earned || 0;
      const ptsB = b.points_earned || 0;
      return ptsB - ptsA;
    });

  const handleSavePrediction = async () => {
    if (predHome === '' || predAway === '') {
      alert('لطفاً هر دو عدد را وارد کنید!');
      return;
    }
    
    const predHomeNum = parseInt(predHome);
    const predAwayNum = parseInt(predAway);
    
    if (isNaN(predHomeNum) || isNaN(predAwayNum)) {
      alert('لطفاً اعداد معتبر وارد کنید!');
      return;
    }
    
    // ارور هوشمند: اگر مساوی بود حتماً باید تیم صعودکننده انتخاب بشه
    if (predHomeNum === predAwayNum && predAdvanced === '') {
      alert('بازی‌های حذفی نمی‌توانند مساوی تمام شوند! لطفاً تیم صعودکننده را انتخاب کنید.');
      return;
    }

    setSaving(true);
    setIsSaved(false);
    
    const predictionPayload = {
      user_id: userId,
      match_id: match.id,
      pred_home: predHomeNum,
      pred_away: predAwayNum,
      pred_advanced_team: predHomeNum === predAwayNum ? predAdvanced : null
    };

    try {
      const { error } = await supabase
        .from('predictions')
        .upsert(predictionPayload, { onConflict: 'user_id,match_id' });
      
      if (error) throw error;
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('خطا در ثبت پیش‌بینی!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRealResult = async () => {
    if (adminHome === '' || adminAway === '') {
      alert('لطفاً هر دو عدد نتیجه را وارد کنید!');
      return;
    }
    
    const adminHomeNum = parseInt(adminHome);
    const adminAwayNum = parseInt(adminAway);
    
    if (isNaN(adminHomeNum) || isNaN(adminAwayNum)) {
      alert('لطفاً اعداد معتبر وارد کنید!');
      return;
    }
    
    if (adminHomeNum === adminAwayNum && adminAdvanced === '') {
      alert('لطفاً تیم صعودکننده واقعی را مشخص کنید!');
      return;
    }

    setSavingAdmin(true);
    const updateData = {
      home_score: adminHomeNum,
      away_score: adminAwayNum,
      advanced_team: adminHomeNum === adminAwayNum ? adminAdvanced : null
    };

    try {
      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match.id);
      
      if (error) throw error;
      
      alert('نتیجه با موفقیت ثبت شد!');
      // ✅ ریلود با تاخیر کوچک برای اطمینان از ثبت
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error saving result:', error);
      alert('خطا در ثبت نتیجه نهایی!');
    } finally {
      setSavingAdmin(false);
    }
  };

  // ✅ تابع کمکی برای کلیک روی تیم
  const handleTeamClick = (teamName) => {
    if (onTeamClick && typeof onTeamClick === 'function') {
      onTeamClick(teamName);
    }
  };

  // ✅ تابع کمکی برای نمایش پرچم
  const renderFlag = (teamName, className = "w-7 h-5 rounded-sm shadow-sm object-cover border border-slate-100 group-hover:scale-110 transition-transform") => {
    const url = getFlagUrl(teamName);
    return url ? (
      <img src={url} alt={`پرچم ${teamName}`} className={className} />
    ) : (
      <span className="text-lg">🏳️</span>
    );
  };

  return (
    <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,25,76,0.03)] border border-[#F1F5F9] p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 bottom-0 w-1.5 ${isMatchStarted ? 'bg-slate-300' : 'bg-[#FDBA2D]'}`}></div>

      <div className="flex justify-between items-center text-[11px] text-slate-500 mb-4 border-b border-slate-100 pb-2">
        <span className={isMatchStarted ? 'text-slate-400' : 'text-[#10B981] font-bold'}>
          {isMatchStarted ? '🔒 بازی شروع شده' : '🕒 فرصت پیش‌بینی'}
        </span>
        <span dir="ltr">{new Date(match.match_time).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex items-center justify-between font-black text-[#00194C] mb-4">
        {/* تیم میزبان */}
        <div 
          onClick={() => handleTeamClick(match.home_team)}
          className="w-1/3 flex flex-col items-center gap-1 text-sm text-center cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors group"
          title="مشاهده تاریخچه بازی‌های این تیم"
        >
          {renderFlag(match.home_team)}
          <span className="group-hover:text-[#FDBA2D] transition-colors">{match.home_team}</span>
          {isMatchStarted && match.advanced_team === 'home' && (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mt-1">صعود 🏳️</span>
          )}
        </div>
        
        {/* اینپوت‌ها یا نتایج پیش‌بینی کاربر */}
        <div className="w-1/3 flex flex-col items-center justify-center gap-2">
          {!isMatchStarted ? (
            <div className="flex items-center gap-1" dir="ltr">
              <input 
                type="number" 
                min="0"
                max="20"
                value={predAway} 
                onChange={(e) => setPredAway(e.target.value)} 
                placeholder="میهمان" 
                className="w-11 h-11 text-center bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#FDBA2D] focus:ring-1 focus:ring-[#FDBA2D] rounded-xl text-lg font-black outline-none transition-all" 
              />
              <span className="text-slate-300">-</span>
              <input 
                type="number" 
                min="0"
                max="20"
                value={predHome} 
                onChange={(e) => setPredHome(e.target.value)} 
                placeholder="میزبان" 
                className="w-11 h-11 text-center bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#FDBA2D] focus:ring-1 focus:ring-[#FDBA2D] rounded-xl text-lg font-black outline-none transition-all" 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3 text-xl bg-[#F8FAFC] px-4 py-2 rounded-xl text-[#00194C]" dir="ltr">
                <span>{predAway !== '' ? predAway : '-'}</span>
                <span className="text-slate-300">:</span>
                <span>{predHome !== '' ? predHome : '-'}</span>
              </div>
              {/* نمایش تیمی که کاربر برای صعود حدس زده بود */}
              {isPredictionDraw && predAdvanced && (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold whitespace-nowrap border border-slate-200">
                  صعود: {predAdvanced === 'home' ? match.home_team : match.away_team}
                </span>
              )}
            </div>
          )}
        </div>

        {/* تیم میهمان */}
        <div 
          onClick={() => handleTeamClick(match.away_team)}
          className="w-1/3 flex flex-col items-center gap-1 text-sm text-center cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors group"
          title="مشاهده تاریخچه بازی‌های این تیم"
        >
          {renderFlag(match.away_team)}
          <span className="group-hover:text-[#FDBA2D] transition-colors">{match.away_team}</span>
          {isMatchStarted && match.advanced_team === 'away' && (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mt-1">صعود 🏳️</span>
          )}
        </div>
      </div>

      {/* انتخاب برنده در صورت مساوی شدن پیش‌بینی */}
      {!isMatchStarted && isPredictionDraw && (
        <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center animate-fade-in">
          <p className="text-[11px] font-bold text-amber-800 mb-2">در ضربات پنالتی/وقت اضافه کدام صعود می‌کند؟</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setPredAdvanced('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${predAdvanced === 'home' ? 'bg-[#00194C] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              {match.home_team}
            </button>
            <button 
              onClick={() => setPredAdvanced('away')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${predAdvanced === 'away' ? 'bg-[#00194C] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              {match.away_team}
            </button>
          </div>
        </div>
      )}

      {/* دکمه ثبت پیش‌بینی کاربر */}
      {!isMatchStarted && (
        <button 
          onClick={handleSavePrediction} 
          disabled={saving || isSaved} 
          className={`w-full text-white font-bold py-3 rounded-xl text-xs transition duration-300 mt-3 shadow-md disabled:opacity-90 ${isSaved ? 'bg-[#10B981]' : 'bg-[#00194C] hover:bg-[#334770]'}`}
        >
          {saving ? 'در حال ثبت...' : isSaved ? 'پیش‌بینی شما ثبت شد ✔️' : 'ثبت پیش‌بینی'}
        </button>
      )}

      {/* باکس نتیجه واقعی */}
      {isMatchFinished && (
        <div className="text-center text-xs font-bold text-[#10B981] bg-[#ECFDF5] py-2.5 rounded-xl border border-[#10B981]/20 mt-3">
          نتیجه واقعی: {match.home_team} {match.home_score} - {match.away_score} {match.away_team}
        </div>
      )}

      {/* نمودار آماری امتیازات فامیل در این بازی */}
      {isMatchFinished && totalPreds > 0 && (
        <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500">عملکرد فامیل در این بازی</span>
            <span className="text-[9px] font-bold text-slate-400">{totalPreds} پیش‌بینی</span>
          </div>
          <div className="w-full h-2 flex rounded-full overflow-hidden">
            {p3 > 0 && <div style={{ width: `${getPercent(p3)}%` }} className="bg-emerald-500" title={`۳ امتیاز: ${p3} نفر`}></div>}
            {p2 > 0 && <div style={{ width: `${getPercent(p2)}%` }} className="bg-blue-500" title={`۲ امتیاز: ${p2} نفر`}></div>}
            {p1 > 0 && <div style={{ width: `${getPercent(p1)}%` }} className="bg-amber-500" title={`۱ امتیاز: ${p1} نفر`}></div>}
            {p0 > 0 && <div style={{ width: `${getPercent(p0)}%` }} className="bg-slate-300" title={`۰ امتیاز: ${p0} نفر`}></div>}
          </div>
          <div className="flex justify-between text-[9px] font-bold mt-1.5" dir="rtl">
            <div className="flex gap-2">
               {p3 > 0 && <span className="text-emerald-600">۳ام: {getPercentDisplay(p3)}</span>}
               {p2 > 0 && <span className="text-blue-600">۲ام: {getPercentDisplay(p2)}</span>}
               {p1 > 0 && <span className="text-amber-600">۱ام: {getPercentDisplay(p1)}</span>}
               {p0 > 0 && <span className="text-slate-500">۰ام: {getPercentDisplay(p0)}</span>}
            </div>
          </div>
        </div>
      )}

      {/* پنل ادمین */}
      {isAdmin && isMatchStarted && (
        <div className="mt-4 pt-4 border-t border-rose-100 bg-rose-50 p-3 rounded-xl">
          <p className="text-xs font-black text-rose-800 mb-3 text-center">👑 پنل مدیریت (ثبت نتیجه)</p>
          
          <div className="flex items-center justify-center gap-2 mb-3" dir="ltr">
            <input 
              type="number" 
              min="0"
              max="20"
              value={adminAway} 
              onChange={(e) => setAdminAway(e.target.value)} 
              placeholder="میهمان" 
              className="w-12 h-10 text-center bg-white border border-rose-200 rounded-lg text-sm font-bold outline-none" 
            />
            <span className="text-rose-300">-</span>
            <input 
              type="number" 
              min="0"
              max="20"
              value={adminHome} 
              onChange={(e) => setAdminHome(e.target.value)} 
              placeholder="میزبان" 
              className="w-12 h-10 text-center bg-white border border-rose-200 rounded-lg text-sm font-bold outline-none" 
            />
          </div>
          
          {isAdminResultDraw && (
            <div className="mb-3 text-center">
              <p className="text-[10px] font-bold text-rose-600 mb-2">تیم صعودکننده در پنالتی:</p>
              <div className="flex justify-center gap-2">
                <button 
                  onClick={() => setAdminAdvanced('home')} 
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${adminAdvanced === 'home' ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border border-rose-200'}`}
                >
                  {match.home_team}
                </button>
                <button 
                  onClick={() => setAdminAdvanced('away')} 
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${adminAdvanced === 'away' ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border border-rose-200'}`}
                >
                  {match.away_team}
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={handleSaveRealResult} 
            disabled={savingAdmin} 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition duration-200 disabled:opacity-50"
          >
            {savingAdmin ? 'در حال ذخیره...' : 'ثبت نتیجه در دیتابیس'}
          </button>
        </div>
      )}

      {/* نمایش پیش‌بینی بقیه با ترتیب امتیازات */}
      {isMatchStarted && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button 
            onClick={() => setShowOthers(!showOthers)} 
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#00194C] transition-colors"
          >
            {showOthers ? 'بستن پیش‌بینی بقیه ▲' : 'مشاهده پیش‌بینی فامیل ▼'}
          </button>
          
          {showOthers && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
              {sortedOthersPredictions.length > 0 ? (
                sortedOthersPredictions.map(pred => (
                  <div key={pred.id} className="flex justify-between items-center text-xs bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100 text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">
                        {pred.profiles?.first_name || 'کاربر'} {pred.profiles?.last_name || ''}
                      </span>
                      {isMatchFinished && (
                        <span className={`w-fit text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          pred.points_earned === 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          pred.points_earned === 2 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          pred.points_earned === 1 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {pred.points_earned} امتیاز
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-black text-[#00194C] bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100" dir="ltr">
                        {pred.pred_away} - {pred.pred_home}
                      </span>
                      {pred.pred_home === pred.pred_away && pred.pred_advanced_team && (
                        <span className="text-[9px] mt-1 font-bold text-slate-400">
                          صعود: {pred.pred_advanced_team === 'home' ? match.home_team : match.away_team}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 py-2">کسی پیش‌بینی نکرده!</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
