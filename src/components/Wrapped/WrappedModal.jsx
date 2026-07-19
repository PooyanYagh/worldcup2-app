// src/components/Wrapped/WrappedModal.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import WrappedSlide from './WrappedSlide';

const WrappedModal = ({ isOpen, onClose, user, matches, predictions, profiles, leaderboard }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [wrappedData, setWrappedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const slides = [
    { id: 'intro', title: 'Intro' },
    { id: 'rank', title: 'Rank' },
    { id: 'breakdown', title: 'Breakdown' },
    { id: 'best_worst', title: 'Best & Worst' },
    { id: 'rank_timeline', title: 'Rank Timeline' },
    { id: 'rivalry', title: 'Rivalry' },
    { id: 'champion', title: 'Champion' },
    { id: 'what_if', title: 'What If' },
    { id: 'team_bias', title: 'Team Bias' },
    { id: 'streak', title: 'Streak' },
    { id: 'risk', title: 'Risk' },
    { id: 'achievements', title: 'Achievements' },
    { id: 'community', title: 'Community' },
    { id: 'share', title: 'Share' },
  ];

  // ============================================================
  // ✅ nextSlide و prevSlide با useCallback برای جلوگیری از رفرش تایمر
  // ============================================================
  const nextSlide = useCallback(() => {
    if (!isMountedRef.current) return;
    setCurrentSlide(prev => {
      if (prev < slides.length - 1) {
        return prev + 1;
      } else {
        // اگر آخرین اسلاید بود، مودال رو ببند
        onClose();
        return prev;
      }
    });
  }, [onClose, slides.length]);

  const prevSlide = useCallback(() => {
    if (!isMountedRef.current) return;
    setCurrentSlide(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // ============================================================
  // ✅ Load Data - با مدیریت خطا و جلوگیری از race condition
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true;
    
    if (isOpen && user && matches.length > 0) {
      setIsLoading(true);
      setIsAutoPlaying(false);
      
      // ✅ استفاده از import داینامیک با try/catch
      import('./WrappedData')
        .then(({ generateWrappedData }) => {
          if (!isMountedRef.current) return;
          
          const data = generateWrappedData(user.id, matches, predictions, profiles, leaderboard);
          if (!isMountedRef.current) return;
          
          setWrappedData(data);
          setCurrentSlide(0);
          setIsLoading(false);
          // ✅ با تاخیر کوچک AutoPlay رو فعال کن تا slide آماده بشه
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsAutoPlaying(true);
            }
          }, 500);
        })
        .catch((error) => {
          console.error('Error loading Wrapped data:', error);
          if (isMountedRef.current) {
            setIsLoading(false);
            onClose();
          }
        });
    } else {
      setIsLoading(true);
      setWrappedData(null);
      setIsAutoPlaying(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, user, matches, predictions, profiles, leaderboard, onClose]);

  // ============================================================
  // ✅ Auto-play Timer - با مدیریت صحیح تایمر و جلوگیری از unmount
  // ============================================================
  useEffect(() => {
    // پاک کردن تایمر قبلی
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // شرط‌های شروع تایمر
    if (
      !isOpen || 
      isLoading || 
      !isAutoPlaying || 
      currentSlide >= slides.length - 1 ||
      !isMountedRef.current
    ) {
      return;
    }

    // تنظیم تایمر جدید
    timerRef.current = setTimeout(() => {
      if (isMountedRef.current && isOpen && isAutoPlaying) {
        nextSlide();
      }
    }, 4000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentSlide, isAutoPlaying, isLoading, isOpen, slides.length, nextSlide]);

  // ============================================================
  // ✅ Keyboard Handlers - با استفاده از useCallback
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isLoading) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        // توقف AutoPlay هنگام تعامل کاربر
        setIsAutoPlaying(false);
        nextSlide();
        // بعد از تعامل کاربر، دوباره AutoPlay رو فعال کن
        setTimeout(() => {
          if (isMountedRef.current && isOpen) {
            setIsAutoPlaying(true);
          }
        }, 3000);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsAutoPlaying(false);
        prevSlide();
        setTimeout(() => {
          if (isMountedRef.current && isOpen) {
            setIsAutoPlaying(true);
          }
        }, 3000);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, nextSlide, prevSlide, onClose]);

  // ============================================================
  // ✅ Swipe Handlers
  // ============================================================
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsAutoPlaying(false);
  };

  const handleTouchEnd = (e) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    // Resume auto-play after swipe with delay
    setTimeout(() => {
      if (isMountedRef.current && isOpen) {
        setIsAutoPlaying(true);
      }
    }, 3000);
  };

  // ============================================================
  // ✅ Mouse Handlers
  // ============================================================
  const handleMouseDown = () => setIsAutoPlaying(false);
  const handleMouseUp = () => {
    setTimeout(() => {
      if (isMountedRef.current && isOpen) {
        setIsAutoPlaying(true);
      }
    }, 3000);
  };

  // ============================================================
  // ✅ Click Zones
  // ============================================================
  const handleScreenClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    setIsAutoPlaying(false);
    
    if (x < width * 0.5) {
      nextSlide();
    } else {
      prevSlide();
    }
    
    setTimeout(() => {
      if (isMountedRef.current && isOpen) {
        setIsAutoPlaying(true);
      }
    }, 3000);
  };

  // ============================================================
  // ✅ Reset state when modal closes
  // ============================================================
  useEffect(() => {
    if (!isOpen) {
      // پاک کردن تایمر
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsAutoPlaying(false);
      // ریست currentSlide برای دفعه بعد
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ============================================================
  // ✅ محاسبه پیشرفت برای نوار پیشرفت
  // ============================================================
  const getProgressWidth = (index) => {
    if (index < currentSlide) return '100%';
    if (index === currentSlide && isAutoPlaying) return '100%';
    if (index === currentSlide && !isAutoPlaying) {
      // وقتی متوقف شده، درصد فعلی رو نشون بده
      return '100%';
    }
    return '0%';
  };

  return (
    <div 
      className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex justify-center"
      dir="rtl"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="w-16 h-16 border-4 border-[#FDBA2D] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60 font-bold animate-pulse">در حال آماده‌سازی کارنامه شما...</p>
        </div>
      ) : (
        <div 
          className="relative w-full h-full max-w-md bg-[#00194C] shadow-2xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleScreenClick}
        >
          {/* ====== HEADER: Progress Bar + Close ====== */}
          <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            {/* Progress Bar */}
            <div className="flex gap-1 mb-3" dir="ltr">
              {slides.map((_, index) => {
                const isActive = index === currentSlide;
                const isPast = index < currentSlide;
                const width = isPast ? '100%' : (isActive ? '100%' : '0%');
                
                return (
                  <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-[#FDBA2D] transition-all duration-300`}
                      style={{ 
                        width: width,
                        transition: isActive && isAutoPlaying ? 'width 4s linear' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pointer-events-auto">
              <span className="text-white/60 text-xs font-black tracking-widest drop-shadow-md">
                WRAP <span className="text-[#FDBA2D]">2026</span>
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-white/60 hover:text-white text-xl transition-colors p-2 -mr-2"
                aria-label="بستن"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ====== CONTENT ====== */}
          <div className="h-full w-full relative z-10">
            <WrappedSlide 
              data={wrappedData}
              slideId={slides[currentSlide].id}
              totalSlides={slides.length}
              currentSlide={currentSlide + 1}
              onNext={nextSlide}
              onPrev={prevSlide}
            />
          </div>

          {/* ====== DESKTOP NAVIGATION ARROWS ====== */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsAutoPlaying(false);
              prevSlide();
              setTimeout(() => {
                if (isMountedRef.current && isOpen) setIsAutoPlaying(true);
              }, 3000);
            }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white text-4xl transition-all duration-300 p-4 rounded-full hover:bg-white/10 hidden md:block ${
              currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="اسلاید قبلی"
          >
            ›
          </button>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsAutoPlaying(false);
              nextSlide();
              setTimeout(() => {
                if (isMountedRef.current && isOpen) setIsAutoPlaying(true);
              }, 3000);
            }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white text-4xl transition-all duration-300 p-4 rounded-full hover:bg-white/10 hidden md:block ${
              currentSlide === slides.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="اسلاید بعدی"
          >
            ‹
          </button>

          {/* ====== INDICATOR: Slide Counter ====== */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span className="text-[10px] text-white/60 font-bold">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WrappedModal;
