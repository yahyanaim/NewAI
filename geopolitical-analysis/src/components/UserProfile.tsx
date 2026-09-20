import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Heart, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  onViewFavorites: () => void;
}

export function UserProfile({ onViewFavorites }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const email = user.email || '';

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-bg-elevated hover:bg-bg-elevated/80 border border-border-primary rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
          <User className="w-4 h-4 text-accent-primary" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-text-primary">{displayName}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        // Open the dropdown to the right of the profile button and vertically center it
  <div className="absolute left-full top-full mt-1 ml-2 w-64 bg-bg-elevated border border-border-primary rounded-lg shadow-2xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-border-primary">
            <p className="text-sm font-medium text-text-primary">{displayName}</p>
            <p className="text-xs text-text-tertiary mt-0.5 truncate">{email}</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                onViewFavorites();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary rounded-lg transition-colors"
            >
              <Heart className="w-4 h-4" />
              My Favorites
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
