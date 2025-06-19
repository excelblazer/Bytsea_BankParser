import React from 'react';
import { FiMail, FiGithub, FiMoon } from 'react-icons/fi';

interface HeaderProps {
  apiKeyStatus: 'checking' | 'ok' | 'missing';
  onApiChangeRequest: () => void;
}

const Header: React.FC<HeaderProps> = ({ apiKeyStatus, onApiChangeRequest }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Links */}
          <div className="flex items-center space-x-6">
            <a href="/" className="flex items-center space-x-2">
              <img src="/favicon/favicon.svg" alt="Bytsea Logo" className="w-6 h-6" />
              <span className="text-slate-200 font-medium">bytsea.com</span>
            </a>
            <span className="text-slate-500 text-sm hidden sm:inline">
              Simple solutions for a complex world
            </span>
          </div>

          {/* Right: API Status + Actions */}
          <div className="flex items-center space-x-4">
            {/* API Connection Status */}
            {apiKeyStatus === 'ok' && (
              <button
                onClick={onApiChangeRequest}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-full transition-colors duration-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-300">API Connected</span>
                </div>
              </button>
            )}
            
            {/* Action Icons */}
            <div className="flex items-center space-x-3">
              <a
                href="mailto:contact@bytsea.com"
                className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                title="Contact"
              >
                <FiMail className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/bytsea"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                title="GitHub"
              >
                <FiGithub className="w-5 h-5" />
              </a>
              <button
                className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                title="Toggle theme"
              >
                <FiMoon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
