import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Login } from '../components/Login';
import { Register } from '../components/Register';
import { useAuth } from '../contexts/AuthContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Get the redirect path from the navigation state
  const from = location.state?.from?.pathname || '/';

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSuccessfulAuth = () => {
    // This will be called after successful login/register
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {isLogin ? (
          <Login 
            onSwitchToRegister={() => setIsLogin(false)}
            onSuccess={handleSuccessfulAuth}
          />
        ) : (
          <Register 
            onSwitchToLogin={() => setIsLogin(true)}
            onSuccess={handleSuccessfulAuth}
          />
        )}
      </div>
    </div>
  );
};
