import React, { useState } from 'react';
import { Copy, Check, Share2, Users, Loader2 } from 'lucide-react';

interface ShareBannerProps {
  gameCode: string;
  isWaiting: boolean;
}

export const ShareBanner: React.FC<ShareBannerProps> = ({ gameCode, isWaiting }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?game=${gameCode}`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md max-w-xl mx-auto space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Match Room Code</span>
              {isWaiting && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Waiting for opponent to join
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Share this code or direct link with a friend to play
            </p>
          </div>
        </div>

        {/* Game Code Display & Copy */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-center flex-1 sm:flex-none">
            <span className="font-mono font-black text-sm tracking-widest text-indigo-300">
              {gameCode}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            title="Copy Code"
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 shrink-0"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Code'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            title="Copy Full URL Link"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
