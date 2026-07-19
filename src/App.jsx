import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // چک می‌کنیم آیا کاربر قبلاً وارد شده و اطلاعاتش تو مرورگر ذخیره شده یا نه
    const storedUser = localStorage.getItem('worldcup_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('worldcup_user');
    setUser(null);
  };

  return (
    <div className="min-h-screen text-[#00194C]">
      {!user ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;