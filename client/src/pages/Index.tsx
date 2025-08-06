
import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import LockerDashboard from '../components/LockerDashboard';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser('');
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <LockerDashboard currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
