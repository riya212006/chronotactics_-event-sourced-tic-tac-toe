import React from 'react';
import { User } from 'firebase/auth';
import { Volume2, VolumeX, LogIn, LogOut, ShieldCheck, History, Sparkles } from 'lucide-react';
import { isSoundEnabled, toggleSound } from '../utils/audio';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onGoHome?: () => void;
  isInGame?: boolean;
  isSigningIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  onGoHome,
  isInGame,
  isSigningIn = false,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left focus:outline-none group transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-400 group-hover:rotate-[-15deg] transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Chronotactics
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Event Sourced
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Tic-Tac-Toe with Time-Travel & Minimax
            </p>
          </div>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {isInGame && onGoHome && (
            <button
              onClick={onGoHome}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            >
              Exit to Lobby
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Mute Sound' : 'Enable Sound'}
            className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-300 hover:text-white transition"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.displayName || 'Player'}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg border border-slate-800 hover:border-red-900/50 hover:bg-red-950/20 text-slate-400 hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isSigningIn}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white shadow-md shadow-indigo-600/25 transition active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isSigningIn ? 'Signing In...' : 'Google Sign-In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
