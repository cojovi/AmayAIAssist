import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function LoginPage() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Login page mounted');
    
    // Check URL parameters for auth status first
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const error = urlParams.get('error');
    
    if (authStatus === 'success') {
      console.log('Auth success, redirecting to dashboard');
      navigate('/dashboard');
      return;
    } 
    
    if (authStatus === 'error' || error) {
      if (error === 'unauthorized_domain') {
        alert('Access denied: Only @cmacroofing.com email addresses are allowed.');
      } else {
        alert('Authentication failed. Please try again.');
      }
      // Clear URL parameters after showing error
      window.history.replaceState({}, '', '/login');
      return;
    }

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            console.log('User already authenticated, redirecting to dashboard');
            navigate('/dashboard');
            return;
          }
        }
        console.log('User not authenticated, staying on login page');
      } catch (error) {
        console.log('Error checking auth:', error);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <GlassCard className="p-8 border border-neon-green/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-black">AI</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">AmayAI</h1>
            <p className="text-gray-400">Your AI-powered personal assistant</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome Back</h2>
              <p className="text-sm text-gray-400 mb-6">
                Sign in with your Google account to access your AI assistant
              </p>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full neon-button-green h-12"
              data-testid="button-google-login"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                We'll securely access your Google Workspace data to provide AI assistance.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="mt-8 text-center">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-neon-cyan mb-2">Why Google Authentication?</h3>
            <p className="text-xs text-gray-400">
              AmayAI needs access to your Gmail, Calendar, and Tasks to provide intelligent automation. 
              Your data is processed securely and never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}