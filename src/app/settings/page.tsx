'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { AIProvider, UserSettings, Connection, ConnectionType, CONNECTION_TYPES, CONNECTION_TYPE_INFO } from '@/types';
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
  const userSettings = useStore((state) => state.userSettings);
  const setUserSettings = useStore((state) => state.setUserSettings);
  const connections = useStore((state) => state.connections);
  const addConnection = useStore((state) => state.addConnection);
  const deleteConnection = useStore((state) => state.deleteConnection);
  const workspaces = useStore((state) => state.workspaces);
  const projects = useStore((state) => state.projects);

  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider);
  const [model, setModel] = useState(aiSettings.model);
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState(userSettings.displayName);
  const [defaultViewMode, setDefaultViewMode] = useState<UserSettings['defaultViewMode']>(userSettings.defaultViewMode);
  const [theme, setTheme] = useState<UserSettings['theme']>(userSettings.theme);
  const [showRightSidebar, setShowRightSidebar] = useState(userSettings.showRightSidebar);
  const [userSettingsSaved, setUserSettingsSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; created_at: string; last_used_at: string | null }>>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  // Connections form state
  const [connName, setConnName] = useState('');
  const [connType, setConnType] = useState<ConnectionType>('custom');
  const [connUrl, setConnUrl] = useState('');
  const [connScope, setConnScope] = useState<Connection['scope']>('global');
  const [connWorkspaceId, setConnWorkspaceId] = useState('');
  const [connProjectId, setConnProjectId] = useState('');

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

  const handleSaveUserSettings = () => {
    setUserSettings({ displayName, defaultViewMode, theme, showRightSidebar });
    setUserSettingsSaved(true);
    setTimeout(() => setUserSettingsSaved(false), 2000);
  };

  const handleAddConnection = async () => {
    if (!connName.trim()) return;
    const info = CONNECTION_TYPE_INFO[connType];
    await addConnection({
      name: connName.trim(),
      type: connType,
      url: connUrl.trim() || undefined,
      icon: info.icon,
      scope: connScope,
      workspaceId: connScope === 'workspace' ? connWorkspaceId : undefined,
      projectId: connScope === 'project' ? connProjectId : undefined,
    });
    setConnName('');
    setConnType('custom');
    setConnUrl('');
    setConnScope('global');
    setConnWorkspaceId('');
    setConnProjectId('');
  };

  const loadApiKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) setApiKeys(data.data);
    } catch {
      // Failed to load keys
    }
  };

  const generateNewKey = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'Default' }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.data.key);
        setNewKeyName('');
        loadApiKeys();
      }
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      loadApiKeys();
      if (generatedKey) setGeneratedKey(null);
    } catch {
      // Failed to delete key
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const models = provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard"
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
        {/* User Settings Section */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">User Settings</h2>
            <p className="text-xs text-zinc-500 mt-1">Customize your Contextory experience.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
              />
            </div>

            {/* Default View Mode */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Default View Mode
              </label>
              <select
                value={defaultViewMode}
                onChange={(e) => setDefaultViewMode(e.target.value as UserSettings['defaultViewMode'])}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="table">Table</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Theme
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">Light</div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">Dark</div>
                </button>
              </div>
            </div>

            {/* Right Sidebar Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-700">Right Sidebar</label>
                <p className="text-xs text-zinc-500 mt-0.5">Show or hide the right sidebar by default.</p>
              </div>
              <button
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showRightSidebar ? 'bg-zinc-900' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    showRightSidebar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveUserSettings}
                className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Save Settings
              </button>
              {userSettingsSaved && (
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

        {/* API Keys Section */}
        <div className="mt-6 bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">API Keys</h2>
            <p className="text-xs text-zinc-500 mt-1">Manage API keys for MCP server and external integrations.</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Generate new key */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. MCP Server)"
                className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
              />
              <button
                onClick={generateNewKey}
                disabled={isLoadingKeys}
                className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {isLoadingKeys ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {/* Show generated key */}
            {generatedKey && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-medium text-green-800 mb-2">
                  Your new API key (copy it now -- it will not be shown again):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-green-900 bg-green-100 px-3 py-2 rounded font-mono break-all">
                    {generatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="px-3 py-2 bg-green-700 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Use this key as a Bearer token in your MCP server configuration.
                </p>
              </div>
            )}

            {/* Existing keys list */}
            {apiKeys.length > 0 ? (
              <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{k.name}</p>
                      <p className="text-xs text-zinc-500">
                        Created {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at && (
                          <span> &middot; Last used {new Date(k.last_used_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteKey(k.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No API keys yet. Generate one to use with your MCP server.</p>
            )}
          </div>
        </div>

        {/* Connections Section */}
        <div className="mt-6 bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Connections</h2>
            <p className="text-xs text-zinc-500 mt-1">Link external apps and services to your workspaces and projects.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Add connection form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={connName}
                    onChange={(e) => setConnName(e.target.value)}
                    placeholder="e.g. Project Repo"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
                  <select
                    value={connType}
                    onChange={(e) => setConnType(e.target.value as ConnectionType)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
                  >
                    {CONNECTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {CONNECTION_TYPE_INFO[t].icon} {CONNECTION_TYPE_INFO[t].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">URL</label>
                <input
                  type="text"
                  value={connUrl}
                  onChange={(e) => setConnUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Scope</label>
                  <select
                    value={connScope}
                    onChange={(e) => setConnScope(e.target.value as Connection['scope'])}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
                  >
                    <option value="global">Global</option>
                    <option value="workspace">Workspace</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                {connScope === 'workspace' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Workspace</label>
                    <select
                      value={connWorkspaceId}
                      onChange={(e) => setConnWorkspaceId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
                    >
                      <option value="">Select workspace...</option>
                      {workspaces.map((w) => (
                        <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {connScope === 'project' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Project</label>
                    <select
                      value={connProjectId}
                      onChange={(e) => setConnProjectId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500 text-sm"
                    >
                      <option value="">Select project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddConnection}
                disabled={!connName.trim()}
                className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Add Connection
              </button>
            </div>

            {/* Existing connections list */}
            {connections.length > 0 ? (
              <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                {connections.map((conn) => (
                  <div key={conn.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{conn.icon || CONNECTION_TYPE_INFO[conn.type]?.icon || ''}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{conn.name}</p>
                        <p className="text-xs text-zinc-500">
                          {CONNECTION_TYPE_INFO[conn.type]?.label || conn.type} - {conn.scope}
                          {conn.url && (
                            <span> - <a href={conn.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{conn.url}</a></span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteConnection(conn.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No connections yet. Add one to link external services.</p>
            )}
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
