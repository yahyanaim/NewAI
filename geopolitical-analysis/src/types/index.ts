// Type definitions for the application

export interface Country {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  capital: string;
  region: string;
  population: number;
  area: number;
  flag: string;
  latlng: [number, number];
}

export interface ConflictEvent {
  id: string;
  country: string;
  eventType: string;
  date: string;
  location: string;
  actors: string[];
  description: string;
  fatalities: number;
  intensity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: string;
  country?: string;
}

// New intelligence event structure
export interface IntelEvent {
  id: string;
  timestamp: Date;
  headline: string;
  description: string; // Full news article content
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'normal' | 'low';
  location: { lat: number; lng: number; country: string; region: string };
  source: string;
  sourceUrl?: string; // Link to original article
  category: 'political' | 'military' | 'economic' | 'diplomatic' | 'sports' | 'technology' | 'health' | 'culture';
  actors: string[];
  regions: string[];
  scores: {
    geopolitical: number;
    geoeconomic: number;
    security: number;
    diplomatic: number;
    stability: number;
  };
  aiAnalysis: string;
  tags?: string[]; // AI-generated tags for filtering
  confidence: 'high' | 'medium' | 'low';
  relatedEvents?: string[];
  rating?: number; // User rating 1-5
}

export interface ConflictIntensity {
  country: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  eventCount: number;
  recentEvents: ConflictEvent[];
}

export interface GlobalMetrics {
  totalEvents: number;
  activeConflicts: number;
  lastUpdate: string;
}
