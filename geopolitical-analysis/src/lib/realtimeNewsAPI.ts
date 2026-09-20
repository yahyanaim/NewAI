// Real-time News API using Supabase Realtime
// Provides Socket.IO-like functionality for live news streaming

import { supabase, type DBMoroccanNewsArticle } from './supabase';
import type { IntelEvent } from '@/types';

// Helper to extract actors (simplified)
function extractActors(title: string, description: string): string[] {
  const text = `${title} ${description}`;
  const actors: string[] = [];

  const actorPatterns = [
    /government/i,
    /gouvernement/i,
    /ministry/i,
    /ministère/i,
    /parliament/i,
    /parlement/i,
    /king/i,
    /roi/i,
    /royal/i,
    /opposition/i,
    /party/i,
    /parti/i,
    /union/i,
    /syndicat/i,
  ];

  actorPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      actors.push(pattern.source.replace(/[\/\\^$*+?.()|[\]{}]/g, '').replace(/i$/, ''));
    }
  });

  return actors.slice(0, 5);
}

// Fallback / Existing Logic: Generate scores based on keywords
function generateNewsScores(article: DBMoroccanNewsArticle): {
  geopolitical: number;
  geoeconomic: number;
  security: number;
  diplomatic: number;
  stability: number;
} {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  const priority = article.priority || 'normal';
  const sentiment = article.sentiment || 'neutral';

  // Base score from priority
  let baseScore = priority === 'high' ? 65 : priority === 'normal' ? 45 : 30;

  // Sentiment modifier (negative news tends to have higher immediate impact/risk scores)
  const sentimentModifier = sentiment === 'negative' ? 10 : sentiment === 'positive' ? -5 : 0;

  // Helper to calculate score based on keywords
  const calculateCategoryScore = (keywords: string[], weight: number = 10, maxScore: number = 100) => {
    let score = baseScore + sentimentModifier;
    let matches = 0;

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += weight;
        matches++;
      }
    });

    // Boost if multiple keywords match
    if (matches > 2) score += 10;

    // Intensifiers
    const intensifiers = ['crisis', 'urgent', 'massive', 'critical', 'severe', 'breakthrough', 'historic', 'deadly', 'attack', 'war'];
    intensifiers.forEach(word => {
      if (text.includes(word)) score += 5;
    });

    return Math.max(10, Math.min(maxScore, score));
  };

  const geopoliticalKeywords = ['government', 'kingdom', 'royal', 'king', 'parliament', 'minister', 'policy', 'reform', 'election', 'sovereignty', 'territory', 'international', 'un'];
  const geoeconomicKeywords = ['economy', 'market', 'trade', 'investment', 'finance', 'export', 'import', 'bank', 'inflation', 'gdp', 'infrastructure', 'energy', 'development', 'business'];
  const securityKeywords = ['security', 'military', 'police', 'defense', 'army', 'terror', 'crime', 'border', 'conflict', 'violence', 'attack', 'threat', 'safety', 'guard', 'force'];
  const diplomaticKeywords = ['diplomatic', 'relations', 'agreement', 'treaty', 'ambassador', 'foreign', 'cooperation', 'partnership', 'summit', 'visit', 'dialogue', 'peace', 'negotiation'];
  const stabilityKeywords = ['protest', 'strike', 'riot', 'unrest', 'stable', 'stability', 'peace', 'order', 'social', 'public'];

  // Stability is often inverse to conflict/unrest
  let stabilityScore = 100 - (calculateCategoryScore([...securityKeywords, ...stabilityKeywords], 12) * 0.8);
  if (sentiment === 'positive') stabilityScore += 15;

  return {
    geopolitical: calculateCategoryScore(geopoliticalKeywords, 12),
    geoeconomic: calculateCategoryScore(geoeconomicKeywords, 12),
    security: calculateCategoryScore(securityKeywords, 15),
    diplomatic: calculateCategoryScore(diplomaticKeywords, 12),
    stability: Math.max(0, Math.min(100, stabilityScore)),
  };
}

// Fallback Analysis Generator
function generateNewsAnalysis(article: DBMoroccanNewsArticle): string {
  const category = article.category || 'political';
  const sentiment = article.sentiment || 'neutral';
  const source = article.source;
  const title = article.title;

  const intro = `This analysis evaluates the impact of the reported ${category} event regarding "${title}".`;

  let implications = "";
  if (category === 'political') {
    implications = sentiment === 'negative'
      ? "The situation suggests potential friction in domestic governance. Monitoring legislative feedback is advised."
      : "This development indicates a strengthening of institutional frameworks.";
  } else if (category === 'economic') {
    implications = sentiment === 'negative'
      ? "Market indicators may react with short-term volatility."
      : "This signals a positive trajectory for economic growth.";
  } else {
    implications = "This event contributes to the broader narrative of regional development.";
  }

  const conclusion = `Confidence in this assessment is ${article.description ? 'high' : 'moderate'}. Source reliability from ${source} is factorable.`;

  return `${intro} ${implications} ${conclusion}`;
}

function calculateConfidence(article: DBMoroccanNewsArticle): 'high' | 'medium' | 'low' {
  const credibleSources = ['Médias24', 'Hespress', 'H24info'];
  const hasDescription = article.description && article.description.length > 50;

  if (credibleSources.includes(article.source) && hasDescription) return 'high';
  if (credibleSources.includes(article.source) || hasDescription) return 'medium';
  return 'low';
}

// --- AI INTELLIGENCE LAYER ---

// Type for AI Response
interface AIAnalysisResult {
  scores: {
    geopolitical: number;
    geoeconomic: number;
    security: number;
    diplomatic: number;
    stability: number;
  };
  analysis: string;
}

import { analyzeWithAI } from './aiService';

// ...

// Async converter that attempts AI analysis first
async function convertDatabaseArticleToIntelEventAsync(article: DBMoroccanNewsArticle): Promise<IntelEvent> {
  // 1. Basic Extraction
  const actors = extractActors(article.title, article.description || '');
  const confidence = calculateConfidence(article);
  const textToAnalyze = `${article.title}. ${article.description || ''}`.substring(0, 500);

  // 2. Attempt AI Analysis
  let scores = generateNewsScores(article); // Default init
  let aiAnalysis = generateNewsAnalysis(article); // Default init

  // Only use AI for high/medium priority or long description items to save bandwidth/time
  if (article.description && article.description.length > 20) {
    const aiResult = await analyzeWithAI(textToAnalyze);
    if (aiResult) {
      scores = aiResult.scores;
      aiAnalysis = aiResult.analysis + " (AI Augmented)";
    }
  }

  return {
    id: `realtime-news-${article.id}`,
    timestamp: new Date(article.pub_date || article.created_at),
    headline: article.title.substring(0, 200),
    description: article.description || article.content || article.title,
    sentiment: (article.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
    priority: (article.priority as 'high' | 'normal' | 'low') || 'normal',
    location: {
      lat: 33.9716, // Rabat, Morocco
      lng: -6.8498,
      country: 'Morocco',
      region: 'North Africa',
    },
    source: article.source,
    sourceUrl: article.link,
    category: (article.category as 'political' | 'military' | 'economic' | 'diplomatic') || 'political',
    actors,
    regions: ['North Africa', 'Maghreb'],
    scores,
    aiAnalysis,
    confidence,
    relatedEvents: [],
  };
}

// Exported wrapper for legacy sync calls (warns but provides fallback)
export function convertDatabaseArticleToIntelEvent(article: DBMoroccanNewsArticle): IntelEvent {
  // Synchronous fallback
  const actors = extractActors(article.title, article.description || '');
  return {
    id: `realtime-news-${article.id}`,
    timestamp: new Date(article.pub_date || article.created_at),
    headline: article.title.substring(0, 200),
    description: article.description || article.content || article.title,
    sentiment: (article.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
    priority: (article.priority as 'high' | 'normal' | 'low') || 'normal',
    location: { lat: 33.9716, lng: -6.8498, country: 'Morocco', region: 'North Africa' },
    source: article.source,
    sourceUrl: article.link,
    category: (article.category as 'political' | 'military' | 'economic' | 'diplomatic') || 'political',
    actors,
    regions: ['North Africa', 'Maghreb'],
    scores: generateNewsScores(article),
    aiAnalysis: generateNewsAnalysis(article),
    confidence: calculateConfidence(article),
    relatedEvents: [],
  };
}


// --- MAIN FETCHERS (UPDATED TO ASYNC) ---

export async function fetchAllNewsFromDatabase(): Promise<IntelEvent[]> {
  try {
    console.log('Fetching all news from Supabase database...');
    const { data, error } = await supabase
      .from('moroccan_news_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) { console.error('Database fetch error:', error); return []; }
    if (!data || data.length === 0) return [];

    console.log(`Fetched ${data.length} news articles. Processing AI analysis...`);

    // Process concurrently
    const events = await Promise.all(data.map(article => convertDatabaseArticleToIntelEventAsync(article)));
    return events;

  } catch (error) {
    console.error('Error fetching news from database:', error);
    return [];
  }
}

export async function fetchRecentNewsFromDatabase(): Promise<IntelEvent[]> {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('moroccan_news_articles')
      .select('*')
      .gte('pub_date', threeHoursAgo)
      .order('pub_date', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    console.log(`Fetched ${data.length} recent news. Processing AI...`);
    return await Promise.all(data.map(article => convertDatabaseArticleToIntelEventAsync(article)));

  } catch (error) {
    console.error('Error fetching recent news:', error);
    return [];
  }
}

export async function fetchHistoricalNewsFromDatabase(): Promise<IntelEvent[]> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('moroccan_news_articles')
      .select('*')
      .gte('pub_date', twentyFourHoursAgo)
      .lt('pub_date', threeHoursAgo)
      .order('pub_date', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return await Promise.all(data.map(article => convertDatabaseArticleToIntelEventAsync(article)));

  } catch (error) {
    console.error('Error fetching historical news:', error);
    return [];
  }
}

export async function triggerNewsFetch(): Promise<void> {
  try {
    console.log('Triggering news fetch via edge function...');
    const { data, error } = await supabase.functions.invoke('stream-moroccan-news', { body: {} });
    if (error) console.error('Edge function error:', error);
    else console.log('News fetch completed:', data);
  } catch (error) {
    console.error('Error triggering news fetch:', error);
  }
}

export async function fetchGlobalNews(): Promise<IntelEvent[]> {
  try {
    console.log('Fetching global news from ok.surf...');
    const response = await fetch('https://ok.surf/api/v1/cors/news-feed');
    const data = await response.json();
    const articles = [...data.World, ...data.Business, ...data.Technology].slice(0, 15);

    // We can also apply AI to these global news items if needed
    // For now, we'll keep the lightweight mapping to avoid spamming the free API with 15+ requests instantly
    // Or we could mix it in. Let's do a lightweight mix.

    return await Promise.all(articles.map(async (article: any, index: number) => {
      // Create a stable ID based on title and source to avoid duplicates on refresh
      const stableId = `global-news-${article.title.substring(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${article.source.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      const textToAnalyze = `${article.title}. ${article.description || ''}`.substring(0, 500);
      let scores = {
        geopolitical: 50,
        geoeconomic: 50,
        security: 40,
        diplomatic: 40,
        stability: 60
      };
      let aiAnalysis = 'Global news event fetched from international wire services.';

      // AI Analysis
      const aiResult = await analyzeWithAI(textToAnalyze);
      let sentiment = 'neutral';
      let priority = 'normal';

      if (aiResult) {
        scores = aiResult.scores;
        aiAnalysis = aiResult.analysis + " (AI Augmented)";
        sentiment = aiResult.sentiment || 'neutral';
        priority = aiResult.priority || 'normal';
      }

      return {
        id: stableId,
        headline: article.title,
        timestamp: new Date(),
        location: {
          lat: 20 + Math.random() * 40,
          lng: -20 + Math.random() * 60,
          country: 'Global News',
          region: 'International'
        },
        regions: ['International'],
        sentiment: sentiment as 'positive' | 'negative' | 'neutral',
        priority: priority as 'high' | 'normal' | 'low',
        source: article.source,
        category: 'political',
        actors: ['International Actors'],
        description: article.title,
        content: article.link,
        scores,
        aiAnalysis,
        confidence: 'high'
      };
    }));
  } catch (error) {
    console.error('Error fetching global news:', error);
    return [];
  }
}
