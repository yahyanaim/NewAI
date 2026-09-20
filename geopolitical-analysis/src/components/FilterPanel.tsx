import { useState } from 'react';
import { Filter, Calendar, Activity } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function FilterPanel({ isOpen, onToggle }: FilterPanelProps) {
  const [dateRange, setDateRange] = useState('7days');
  const [eventTypes, setEventTypes] = useState({
    battles: true,
    protests: true,
    riots: true,
    strategic: true,
  });
  const [intensity, setIntensity] = useState([0, 100]);

  const handleEventTypeToggle = (type: keyof typeof eventTypes) => {
    setEventTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-8 top-32 z-40 p-4 bg-bg-surface rounded-lg shadow-near border border-white/10 hover:shadow-accent-glow transition-all duration-200"
      >
        <Filter className="w-6 h-6 text-accent-primary" />
      </button>
    );
  }

  return (
    <div className="fixed left-8 top-32 z-40 w-[320px] glass-panel rounded-lg shadow-near depth-elevated transform-3d">
      <div className="p-space-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-accent-primary" />
            <h3 className="text-heading-md font-semibold">Filters</h3>
          </div>
          <button
            onClick={onToggle}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent-primary" />
            <label className="text-body font-medium text-text-primary">Time Range</label>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 bg-bg-elevated border border-white/10 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>

        {/* Event Types */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-accent-primary" />
            <label className="text-body font-medium text-text-primary">Event Types</label>
          </div>
          <div className="space-y-2">
            {Object.entries(eventTypes).map(([type, checked]) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleEventTypeToggle(type as keyof typeof eventTypes)}
                  className="w-4 h-4 rounded border-white/20 bg-bg-elevated text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-body text-text-secondary capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mb-6">
          <label className="text-body font-medium text-text-primary mb-3 block">Quick Filters</label>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 rounded-full text-body-sm bg-bg-elevated text-text-secondary hover:bg-accent-secondary hover:text-white transition-all">
              High Intensity Only
            </button>
            <button className="px-3 py-1.5 rounded-full text-body-sm bg-bg-elevated text-text-secondary hover:bg-accent-secondary hover:text-white transition-all">
              Armed Conflicts
            </button>
            <button className="px-3 py-1.5 rounded-full text-body-sm bg-bg-elevated text-text-secondary hover:bg-accent-secondary hover:text-white transition-all">
              Protests
            </button>
          </div>
        </div>

        {/* Apply Button */}
        <button
          className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold rounded-md shadow-accent-glow hover:scale-105 transform transition-all duration-200"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
