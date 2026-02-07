'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { AIProvider } from '@/types';
import { getDefaultModel } from '@/lib/ai';

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Faster)' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
];

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Recommended)' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Faster)' },
];

export default function SettingsPage() {
  const aiSettings = useStore((state) => state.aiSettings);
  const setAISettings = useStore((state) => state.setAISettings);

  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider);
  const [model, setModel] = useState(aiSettings.model);
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [saved, setSaved] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(`ai_api_key_${provider}`);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, [provider]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
    // Load stored key for this provider
    const storedKey = localStorage.getItem(`ai_api_key_${newProvider}`);
    setApiKey(storedKey || '');
  };

  const handleSave = () => {
    // Save to store
    setAISettings({
      provider,
      model,
      apiKey: apiKey || undefined,
    });

    // Also save API key to localStorage (persists across sessions)
    if (apiKey) {
      localStorage.setItem(`ai_api_key_${provider}`, apiKey);
    } else {
      localStorage.removeItem(`ai_api_key_${provider}`);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const models = provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
            title="Back to Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* AI Configuration Section */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">AI Configuration</h2>
            <p className="text-xs text-zinc-500 mt-1">Configure your AI provider and API key for the chat feature.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                AI Provider
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleProviderChange('openai')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    provider === 'openai'
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">OpenAI</div>
                  <div className="text-xs text-zinc-500 mt-0.5">GPT-4o, GPT-4 Turbo</div>
                </button>
                <button
                  onClick={() => handleProviderChange('anthropic')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    provider === 'anthropic'
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">Anthropic</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Claude Sonnet 4, Claude 3.5</div>
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
              />
              <p className="text-xs text-zinc-500 mt-2">
                {provider === 'openai' ? (
                  <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Dashboard</a></>
                ) : (
                  <>Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a></>
                )}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            {/* Environment Variable Note */}
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-xs text-zinc-600">
                <strong>Alternative:</strong> You can also set API keys via environment variables:
              </p>
              <code className="block mt-2 text-xs text-zinc-500 bg-zinc-100 p-2 rounded">
                {provider === 'openai' ? 'OPENAI_API_KEY=sk-...' : 'ANTHROPIC_API_KEY=sk-ant-...'}
              </code>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Save Settings
              </button>
              {saved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Saved!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-6 bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">About Contextory</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-zinc-600">
              Contextory helps you shape and visualize the context of your work with AI.
              Organize projects, workspaces, objects, and items to build comprehensive context views.
            </p>
            <div className="mt-4 text-xs text-zinc-400">
              Version 0.1.0 - Phase 5.1 (AI Chat)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
