import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check, AlertCircle, MapPin } from 'lucide-react';
import { Modal } from './Modal';
import { getApiKeys, saveApiKeys } from '@/api/llm';
import { getCensusApiKey, saveCensusApiKey } from '@/api/census';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState({ anthropic: '', google: '', openai: '' });
  const [censusKey, setCensusKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showCensusKey, setShowCensusKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(getApiKeys());
      setCensusKey(getCensusApiKey());
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveApiKeys(keys);
    saveCensusApiKey(censusKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="API Settings"
      icon={<Settings size={20} className="text-violet-400" />}
      iconBgColor="bg-violet-500/20"
      shadowColor="shadow-violet-500/10"
    >
      <div className="space-y-5">
        {/* Anthropic API Key */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Anthropic API Key (Claude)
          </label>
          <div className="relative">
            <input
              type={showAnthropicKey ? 'text' : 'password'}
              value={keys.anthropic}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              placeholder="sk-ant-api03-..."
              className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowAnthropicKey(!showAnthropicKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showAnthropicKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Get your key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        {/* OpenAI API Key */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            OpenAI API Key (GPT / o-series)
          </label>
          <div className="relative">
            <input
              type={showOpenAIKey ? 'text' : 'password'}
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder="sk-proj-..."
              className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowOpenAIKey(!showOpenAIKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showOpenAIKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Get your key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Google AI API Key */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Google AI API Key (Gemini)
          </label>
          <div className="relative">
            <input
              type={showGoogleKey ? 'text' : 'password'}
              value={keys.google}
              onChange={(e) => setKeys({ ...keys, google: e.target.value })}
              placeholder="AIza..."
              className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowGoogleKey(!showGoogleKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showGoogleKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Get your key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              aistudio.google.com
            </a>
          </p>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-slate-700/50" />
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin size={12} />
            <span className="text-[10px] uppercase tracking-[0.15em]">Data APIs</span>
          </div>
          <div className="flex-1 h-px bg-slate-700/50" />
        </div>

        {/* Census Bureau API Key */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            US Census Bureau API Key (Demographics)
          </label>
          <div className="relative">
            <input
              type={showCensusKey ? 'text' : 'password'}
              value={censusKey}
              onChange={(e) => setCensusKey(e.target.value)}
              placeholder="Your Census API key..."
              className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowCensusKey(!showCensusKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showCensusKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Free API key for location demographics. Get yours from{' '}
            <a
              href="https://api.census.gov/data/key_signup.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
            >
              census.gov
            </a>
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            API keys are stored in your browser's localStorage. They are never sent to any
            server except the respective AI provider.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-600 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-violet-500/20'
          }`}
        >
          {saved ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : (
            'Save API Keys'
          )}
        </button>
      </div>
    </Modal>
  );
}

export default SettingsModal;
