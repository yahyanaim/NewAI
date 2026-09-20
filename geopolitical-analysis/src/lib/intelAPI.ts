// Enhanced API for generating realistic intelligence events from UCDP data
import type { IntelEvent, ConflictIntensity, ConflictEvent } from '@/types';

// Location coordinates for major conflict zones and capitals
export const LOCATION_COORDS: Record<string, { lat: number; lng: number; region: string }> = {
  'PSE': { lat: 31.9, lng: 35.2, region: 'Middle East' },
  'ISR': { lat: 32.0, lng: 34.8, region: 'Middle East' },
  'SYR': { lat: 33.5, lng: 36.3, region: 'Middle East' },
  'YEM': { lat: 15.4, lng: 44.2, region: 'Middle East' },
  'IRQ': { lat: 33.3, lng: 44.4, region: 'Middle East' },
  'AFG': { lat: 34.5, lng: 69.2, region: 'South Asia' },
  'UKR': { lat: 50.4, lng: 30.5, region: 'Eastern Europe' },
  'RUS': { lat: 55.8, lng: 37.6, region: 'Eastern Europe' },
  'MMR': { lat: 16.8, lng: 96.2, region: 'Southeast Asia' },
  'ETH': { lat: 9.0, lng: 38.7, region: 'East Africa' },
  'SDN': { lat: 15.6, lng: 32.5, region: 'East Africa' },
  'SOM': { lat: 2.0, lng: 45.3, region: 'East Africa' },
  'COD': { lat: -4.3, lng: 15.3, region: 'Central Africa' },
  'LBY': { lat: 32.9, lng: 13.2, region: 'North Africa' },
  'NGA': { lat: 9.1, lng: 7.2, region: 'West Africa' },
  'USA': { lat: 38.9, lng: -77.0, region: 'North America' },
  'CHN': { lat: 39.9, lng: 116.4, region: 'East Asia' },
  'IND': { lat: 28.6, lng: 77.2, region: 'South Asia' },
  'GBR': { lat: 51.5, lng: -0.1, region: 'Western Europe' },
  'FRA': { lat: 48.9, lng: 2.4, region: 'Western Europe' },
  // North Africa & Sahel Extensions
  'Algeria': { lat: 28.0, lng: 1.6, region: 'North Africa' },
  'Morocco': { lat: 31.7, lng: -7.0, region: 'North Africa' },
  'Tunisia': { lat: 33.8, lng: 9.5, region: 'North Africa' },
  'Libya': { lat: 26.3, lng: 17.2, region: 'North Africa' },
  'Egypt': { lat: 26.8, lng: 30.8, region: 'North Africa' },
  'Mauritania': { lat: 21.0, lng: -10.9, region: 'North Africa' },
  'Mali': { lat: 17.5, lng: -3.9, region: 'Sahel' },
  'Niger': { lat: 17.6, lng: 8.0, region: 'Sahel' },
  'Chad': { lat: 15.4, lng: 18.7, region: 'Sahel' },
  'Sudan': { lat: 12.8, lng: 30.2, region: 'East Africa' },
  'Western Sahara': { lat: 24.2, lng: -12.8, region: 'North Africa' },
  'MAR': { lat: 31.7, lng: -7.0, region: 'North Africa' },
  'DZA': { lat: 28.0, lng: 1.6, region: 'North Africa' },
};

// Sentiment analysis based on event characteristics
function analyzeSentiment(event: ConflictEvent): 'positive' | 'negative' | 'neutral' {
  const eventType = event.eventType.toLowerCase();
  const description = event.description.toLowerCase();

  // Positive indicators
  if (
    eventType.includes('peace') ||
    eventType.includes('agreement') ||
    eventType.includes('ceasefire') ||
    description.includes('diplomatic') ||
    description.includes('cooperation') ||
    event.fatalities === 0
  ) {
    return 'positive';
  }

  // Negative indicators
  if (
    event.fatalities > 10 ||
    eventType.includes('violence') ||
    eventType.includes('conflict') ||
    description.includes('strike') ||
    description.includes('attack')
  ) {
    return 'negative';
  }

  return 'neutral';
}

// Calculate priority based on event characteristics
function calculatePriority(event: ConflictEvent): 'high' | 'normal' | 'low' {
  if (event.fatalities > 20 || event.intensity === 'critical' || event.intensity === 'high') {
    return 'high';
  }

  if (event.fatalities > 5 || event.intensity === 'medium') {
    return 'normal';
  }

  return 'low';
}

// Enhanced AI assessment scores with sophisticated algorithms and keyword matching
function generateAIScores(event: ConflictEvent, sentiment: string, priority: string, country: string): {
  geopolitical: number;
  geoeconomic: number;
  security: number;
  diplomatic: number;
  stability: number;
} {
  const text = `${event.eventType} ${event.description || ''} ${event.actors.join(' ')}`.toLowerCase();

  // Base score from priority
  let baseScore = priority === 'high' ? 65 : priority === 'normal' ? 45 : 30;

  // Sentiment modifier
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
    const intensifiers = ['crisis', 'urgent', 'massive', 'critical', 'severe', 'breakthrough', 'historic', 'deadly', 'attack', 'war', 'fatalities', 'casualties'];
    intensifiers.forEach(word => {
      if (text.includes(word)) score += 5;
    });

    // Fatality impact
    if (event.fatalities > 10) score += 15;
    if (event.fatalities > 50) score += 25;

    return Math.max(10, Math.min(maxScore, score));
  };

  const geopoliticalKeywords = ['government', 'kingdom', 'royal', 'king', 'parliament', 'minister', 'policy', 'reform', 'election', 'sovereignty', 'territory', 'international', 'un', 'president', 'leader'];
  const geoeconomicKeywords = ['economy', 'market', 'trade', 'investment', 'finance', 'export', 'import', 'bank', 'inflation', 'gdp', 'infrastructure', 'energy', 'development', 'business', 'sanction'];
  const securityKeywords = ['security', 'military', 'police', 'defense', 'army', 'terror', 'crime', 'border', 'conflict', 'violence', 'attack', 'threat', 'safety', 'guard', 'force', 'armed', 'strike'];
  const diplomaticKeywords = ['diplomatic', 'relations', 'agreement', 'treaty', 'ambassador', 'foreign', 'cooperation', 'partnership', 'summit', 'visit', 'dialogue', 'peace', 'negotiation', 'meeting'];
  const stabilityKeywords = ['protest', 'strike', 'riot', 'unrest', 'stable', 'stability', 'peace', 'order', 'social', 'public', 'demonstration'];

  // Stability logic
  let stabilityScore = 100 - (calculateCategoryScore([...securityKeywords, ...stabilityKeywords], 12) * 0.8);
  if (sentiment === 'positive') stabilityScore += 15;
  if (event.fatalities > 0) stabilityScore -= 20;

  return {
    geopolitical: calculateCategoryScore(geopoliticalKeywords, 12),
    geoeconomic: calculateCategoryScore(geoeconomicKeywords, 12),
    security: calculateCategoryScore(securityKeywords, 15),
    diplomatic: calculateCategoryScore(diplomaticKeywords, 12),
    stability: Math.max(0, Math.min(100, stabilityScore)),
  };
}

// Generate realistic AI analysis based on event characteristics
// Generate realistic AI analysis based on event characteristics
function generateAIAnalysis(event: ConflictEvent, sentiment: string, country: string): string {
  const text = `${event.eventType} ${event.description || ''}`.toLowerCase();

  // 1. STRATEGIC INTRO TEMPLATES
  const intros = [
    `Strategic assessment indicates a significant shift in the operational landscape of ${country}.`,
    `Intelligence gathering suggests a complex development involving multiple stakeholders in ${country}.`,
    `Current surveillance and open-source intelligence (OSINT) corroborate reports of a ${event.eventType.toLowerCase()} in ${country}.`,
    `Analysis of regional data streams points to an evolving security situation in ${country}.`,
    `This event marks a critical inflection point for stability metrics within the ${country} theatre.`
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  // 2. DYNAMIC BODY LOGIC (Score-Driven)
  const scoreImplications: string[] = [];
  const scores = generateAIScores(event, sentiment, 'normal', country); // Calculate temp scores for logic if not passed

  // Security Analysis
  if (scores.security > 75) {
    scoreImplications.push("High kinetic activity signals a severe degradation of local security architecture, necessitating immediate force protection measures.");
  } else if (scores.security > 50) {
    scoreImplications.push("Elevated threat levels suggest potential for sporadic violence and disruption to routine operations.");
  }

  // Geopolitical Analysis
  if (scores.geopolitical > 70) {
    scoreImplications.push("The political ramifications are likely to extend beyond national borders, influencing regional diplomatic alignments.");
  }

  // Economic Analysis
  if (scores.geoeconomic > 60) {
    scoreImplications.push("Market volatility indicators are flashing warnings, suggesting potential supply chain interruptions.");
  }

  // Stability Analysis
  if (scores.stability < 40) {
    scoreImplications.push("Social cohesion metrics are critically low, increasing the probability of civil unrest or mass mobilization.");
  }

  // Fallback body if no specific high scores
  if (scoreImplications.length === 0) {
    if (sentiment === 'negative') {
      scoreImplications.push(`The incident continues to strain local resources and tests the resilience of ${country}'s governance structures.`);
    } else {
      scoreImplications.push(`While the immediate impact is localized, the long-term trend suggests a stabilization of the control environment.`);
    }
  }

  // Combine implications
  const body = scoreImplications.join(" ");

  // 3. PREDICTIVE CONCLUSION TEMPLATES
  const conclusions = [
    "Projection: High probability of escalation in the next 48 hours. Monitoring advised.",
    "Forecast: Situation is likely to normalize pending government intervention.",
    "Assessment: Continued volatility expected. Risk mitigation protocols recommended.",
    "Outlook: Regional contagion risk remains moderate but requires sustained observation.",
    "Strategic Advisory: Stakeholders should prepare for potential secondary effects on operational continuity."
  ];
  const conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];

  return `${intro} ${body} ${conclusion}`;
}

// Enhanced confidence calculation based on multiple factors
function calculateConfidenceLevel(event: ConflictEvent, scores: any, sentiment: string): 'high' | 'medium' | 'low' {
  let confidencePoints = 0;

  // Fatality data reliability
  if (event.fatalities > 0) confidencePoints += 25;
  else confidencePoints += 15; // Zero fatalities still provides information

  // Geographic precision
  if (event.location !== 'Unknown location') confidencePoints += 20;
  else confidencePoints -= 10;

  // Event type clarity
  if (event.eventType && event.eventType.length > 3) confidencePoints += 15;

  // Actor identification
  if (event.actors && event.actors.length > 0) confidencePoints += 20;

  // Score consistency (high scores indicate clear, significant events)
  const avgScore = (scores.geopolitical + scores.security + scores.diplomatic) / 3;
  if (avgScore > 70) confidencePoints += 15;
  else if (avgScore > 40) confidencePoints += 10;
  else confidencePoints += 5;

  // Sentiment confidence
  if (sentiment === 'neutral') confidencePoints += 10; // Neutral is harder to assess
  else confidencePoints += 15; // Clear positive/negative sentiment is more confident

  // Intensity level clarity
  if (['high', 'critical'].includes(event.intensity)) confidencePoints += 10;
  else confidencePoints += 5;

  // Determine confidence level
  if (confidencePoints >= 80) return 'high';
  if (confidencePoints >= 50) return 'medium';
  return 'low';
}

// Confidence calculation for curated events (simplified version)
function calculateCuratedEventConfidence(baseConfidence: string, sentiment: string, fatalities: number): 'high' | 'medium' | 'low' {
  let confidence = 0;

  // Base confidence from priority
  if (baseConfidence === 'high') confidence += 50;
  else confidence += 30;

  // Sentiment clarity
  if (sentiment !== 'neutral') confidence += 25;
  else confidence += 15;

  // Event data completeness
  if (fatalities >= 0) confidence += 20; // Events with clear fatality data
  else confidence += 10;

  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

import { analyzeWithAI } from './aiService';

// ... (imports remain)

// ... (helper functions remain)

// Async version of generator
export async function generateIntelEventsFromConflicts(conflicts: ConflictIntensity[]): Promise<IntelEvent[]> {
  const events: IntelEvent[] = [];
  const sources = [
    'Reuters', 'AP News', 'BBC World', 'UN News', 'State Department', 'Foreign Ministry', 'Defense Intelligence', 'Regional Observer',
    'Al Jazeera', 'CNN International', 'DW News', 'France 24', 'Bloomberg',
    'Middle East Eye', 'The Times of Israel', 'Arab News', 'Tehran Times',
    'Kyiv Independent', 'Moscow Times', 'South China Morning Post', 'The Hindu', 'Africa News'
  ];

  // Flatten all events first to process them
  const allConflictEvents: { conflict: ConflictIntensity; event: ConflictEvent; index: number; eventIndex: number }[] = [];

  conflicts.forEach((conflict, index) => {
    conflict.recentEvents.slice(0, 3).forEach((event, eventIndex) => {
      allConflictEvents.push({ conflict, event, index, eventIndex });
    });
  });

  // Process concurrently with AI
  const processedEvents = await Promise.all(allConflictEvents.map(async ({ conflict, event, index, eventIndex }) => {
    const sentiment = analyzeSentiment(event);
    const priority = calculatePriority(event);
    const coords = LOCATION_COORDS[conflict.country] || { lat: 0, lng: 0, region: 'Unknown' };

    // Default Scores (Fallback)
    let scores = generateAIScores(event, sentiment, priority, conflict.country);
    let aiAnalysis = generateAIAnalysis(event, sentiment, conflict.country);

    // AI ENRICHMENT
    // Only for significant events to save rate limits
    if (event.description && event.description.length > 20) {
      const textToAnalyze = `${event.eventType} in ${conflict.country}. ${event.description}`;
      const aiResult = await analyzeWithAI(textToAnalyze);

      if (aiResult) {
        scores = aiResult.scores; // Use AI scores
        aiAnalysis = aiResult.analysis + " (AI Augmented)";
      }
    }

    // Generate headline based on event type and location
    const headline = generateHeadline(event, conflict.country);
    const now = new Date();
    const minutesAgo = (index * 3 + eventIndex) * 20;

    return {
      id: `intel-${conflict.country}-${event.id}`,
      timestamp: new Date(now.getTime() - minutesAgo * 60000),
      headline,
      description: generateDescription(event, conflict.country, coords.region),
      sentiment,
      priority,
      location: {
        lat: coords.lat + (Math.random() - 0.5) * 2, // Add slight variation
        lng: coords.lng + (Math.random() - 0.5) * 2,
        country: conflict.country,
        region: coords.region,
      },
      source: sources[Math.floor(Math.random() * sources.length)],
      sourceUrl: generateSourceUrl(headline, sources[Math.floor(Math.random() * sources.length)]),
      category: categorizeEvent(event.eventType),
      actors: event.actors.length > 0 ? event.actors : ['Government Forces', 'Opposition Groups'],
      regions: [coords.region],
      scores,
      aiAnalysis,
      confidence: calculateConfidenceLevel(event, scores, sentiment),
      relatedEvents: [],
    };
  }));

  events.push(...processedEvents);

  // If we don't have enough events from real data, add some curated current events
  if (events.length < 10) {
    events.push(...getCuratedIntelEvents());
  }

  // Sort by timestamp (newest first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
}

function generateHeadline(event: ConflictEvent, countryCode: string): string {
  const countryNames: Record<string, string> = {
    'PSE': 'Palestine', 'ISR': 'Israel', 'SYR': 'Syria', 'YEM': 'Yemen',
    'IRQ': 'Iraq', 'AFG': 'Afghanistan', 'UKR': 'Ukraine', 'RUS': 'Russia',
    'MMR': 'Myanmar', 'ETH': 'Ethiopia', 'SDN': 'Sudan', 'SOM': 'Somalia',
    'COD': 'DR Congo', 'LBY': 'Libya', 'NGA': 'Nigeria', 'USA': 'United States',
    'CHN': 'China', 'IND': 'India', 'GBR': 'United Kingdom', 'FRA': 'France',
  };

  const country = countryNames[countryCode] || countryCode;
  const location = event.location !== 'Unknown location' ? event.location : country;

  if (event.fatalities > 20) {
    return `Deadly ${event.eventType} in ${location} Claims ${event.fatalities} Lives`;
  } else if (event.fatalities > 5) {
    return `${event.eventType} in ${location} Results in Casualties`;
  } else if (event.eventType.toLowerCase().includes('peace') || event.eventType.toLowerCase().includes('agreement')) {
    return `${country}: ${event.eventType} Signals Progress in Conflict Resolution`;
  } else {
    return `${event.eventType} Reported in ${location}, ${country}`;
  }
}

function categorizeEvent(eventType: string): 'political' | 'military' | 'economic' | 'diplomatic' {
  const type = eventType.toLowerCase();

  if (type.includes('diplomatic') || type.includes('agreement') || type.includes('peace')) {
    return 'diplomatic';
  }
  if (type.includes('violence') || type.includes('attack') || type.includes('conflict')) {
    return 'military';
  }
  if (type.includes('sanction') || type.includes('trade')) {
    return 'economic';
  }
  return 'political';
}

// Generate detailed news description based on event characteristics
function generateDescription(event: ConflictEvent, countryCode: string, region: string): string {
  const countryNames: Record<string, string> = {
    'PSE': 'Palestine', 'ISR': 'Israel', 'SYR': 'Syria', 'YEM': 'Yemen',
    'IRQ': 'Iraq', 'AFG': 'Afghanistan', 'UKR': 'Ukraine', 'RUS': 'Russia',
    'MMR': 'Myanmar', 'ETH': 'Ethiopia', 'SDN': 'Sudan', 'SOM': 'Somalia',
    'COD': 'DR Congo', 'LBY': 'Libya', 'NGA': 'Nigeria', 'USA': 'United States',
    'CHN': 'China', 'IND': 'India', 'GBR': 'United Kingdom', 'FRA': 'France',
  };

  const country = countryNames[countryCode] || countryCode;
  const location = event.location !== 'Unknown location' ? event.location : country;

  // Generate detailed description based on event severity and type
  if (event.fatalities > 20) {
    return `A significant ${event.eventType.toLowerCase()} has occurred in ${location}, ${country}, resulting in ${event.fatalities} reported fatalities according to local authorities. The incident took place in ${location}, affecting the local population and infrastructure. Emergency services are responding to the situation while international observers monitor developments. The ${region} region continues to experience heightened tensions following this latest escalation. Government officials and humanitarian organizations are working to provide assistance to affected communities. This development underscores the ongoing challenges in the region and the need for sustained diplomatic efforts to address underlying conflicts.`;
  } else if (event.fatalities > 5) {
    return `A ${event.eventType.toLowerCase()} in ${location}, ${country} has resulted in casualties as local authorities confirm ${event.fatalities} fatalities. The incident occurred during ongoing activities in the area, drawing immediate response from security forces and medical services. The ${region} region has been experiencing periodic tensions, and this latest event adds to concerns about regional stability. Local government representatives have issued statements regarding the situation while coordinating with humanitarian agencies to address any immediate needs. International partners are monitoring the developments closely, emphasizing the importance of maintaining dialogue and preventing further escalation.`;
  } else if (event.eventType.toLowerCase().includes('peace') || event.eventType.toLowerCase().includes('agreement')) {
    return `A significant diplomatic breakthrough has been achieved in ${location}, ${country}, with all parties involved in ${event.eventType.toLowerCase()} activities. This positive development represents a crucial step toward peace and stability in the ${region} region. International observers have welcomed this initiative, which demonstrates commitment to resolving longstanding conflicts through peaceful means. The agreement involves multiple stakeholders working together to establish frameworks for sustained peace and cooperation. Regional and international partners are providing support to ensure implementation of these positive measures. This development offers hope for broader peace initiatives across the region and serves as a model for conflict resolution efforts elsewhere.`;
  } else {
    return `Recent developments in ${location}, ${country} have been reported, with local authorities handling the situation according to established protocols. The ${event.eventType.toLowerCase()} occurred without major incidents, maintaining the security and stability of the area. Local officials continue to monitor the situation while ensuring public safety and maintaining order. The ${region} region remains under observation as part of ongoing regional security frameworks. Government authorities have emphasized their commitment to addressing any concerns while working with community leaders and international partners. This incident represents part of broader efforts to maintain stability and address evolving security challenges in the region through coordinated approaches and diplomatic engagement.`;
  }
}

// Generate realistic source URLs for news articles
function generateSourceUrl(headline: string, source: string): string {
  // Map sources to their websites
  const sourceUrls: Record<string, string> = {
    'Reuters': 'https://www.reuters.com/world',
    'AP News': 'https://apnews.com',
    'BBC World': 'https://www.bbc.com/news/world',
    'UN News': 'https://news.un.org/en',
    'State Department': 'https://www.state.gov/news',
    'Foreign Ministry': 'https://www.mfa.gov.eg',
    'Defense Intelligence': 'https://www.defense.gov/News/News-Archive',
    'Regional Observer': 'https://www.reuters.com/world/africa',
    'Al Jazeera': 'https://www.aljazeera.com',
    'CNN International': 'https://edition.cnn.com',
    'DW News': 'https://www.dw.com',
    'France 24': 'https://www.france24.com',
    'Bloomberg': 'https://www.bloomberg.com/politics',
    'Middle East Eye': 'https://www.middleeasteye.net',
    'The Times of Israel': 'https://www.timesofisrael.com',
    'Arab News': 'https://www.arabnews.com',
    'Tehran Times': 'https://www.tehrantimes.com',
    'Kyiv Independent': 'https://kyivindependent.com',
    'Moscow Times': 'https://www.themoscowtimes.com',
    'South China Morning Post': 'https://www.scmp.com',
    'The Hindu': 'https://www.thehindu.com',
    'Africa News': 'https://www.africanews.com',
  };

  // Return actual source URL or generate search URL
  return sourceUrls[source] || `https://www.google.com/search?q=${encodeURIComponent(headline + ' ' + source)}`;
}

// Curated intelligence events for November 2025
function getCuratedIntelEvents(): IntelEvent[] {
  const now = new Date();

  return [
    {
      id: 'curated-1',
      timestamp: new Date(now.getTime() - 30 * 60000),
      headline: 'UN Security Council Convenes Emergency Session on Middle East Crisis',
      description: 'The United Nations Security Council has called an emergency session to address escalating tensions in the Middle East region. Member states are convening to discuss recent developments and consider appropriate responses to maintain regional stability. The session comes at a critical time when diplomatic efforts are being intensified to prevent further escalation of conflicts affecting civilians. International observers are closely monitoring the proceedings, hoping for concrete action plans that could help de-escalate current tensions. The United Nations Secretary-General has emphasized the importance of unity among member states and finding peaceful solutions to ongoing disputes. This emergency session demonstrates the international community\'s commitment to addressing crises through multilateral dialogue and coordinated response mechanisms.',
      sentiment: 'neutral',
      priority: 'high',
      location: { lat: 31.9, lng: 35.2, country: 'PSE', region: 'Middle East' },
      source: 'UN News',
      sourceUrl: 'https://news.un.org/en',
      category: 'diplomatic',
      actors: ['UN Security Council', 'Regional Powers'],
      regions: ['Middle East'],
      scores: { geopolitical: 85, geoeconomic: 60, security: 75, diplomatic: 70, stability: 45 },
      aiAnalysis: 'The emergency session reflects international concern over escalating tensions in the region. Member states are divided on intervention strategies, with major powers advocating for different approaches to conflict resolution.',
      confidence: calculateCuratedEventConfidence('high', 'neutral', 0),
    },
    {
      id: 'curated-2',
      timestamp: new Date(now.getTime() - 60 * 60000),
      headline: 'G7 Leaders Announce Coordinated Response to Global Security Challenges',
      description: 'G7 nations have announced a comprehensive coordinated response to address evolving global security challenges facing the international community. The announcement represents a significant step toward strengthened multilateral cooperation and demonstrates unity among major democratic nations. Leaders from the United States, United Kingdom, Germany, France, Italy, Japan, and Canada have committed to enhanced intelligence sharing, joint security exercises, and coordinated diplomatic initiatives. The G7 framework includes provisions for economic cooperation, technological partnerships, and collective defense measures. This unified approach signals a renewed commitment to upholding international norms and responding effectively to emerging threats. The announcement has been welcomed by allies and partners worldwide as a positive development for global stability and security coordination.',
      sentiment: 'positive',
      priority: 'normal',
      location: { lat: 48.9, lng: 2.4, country: 'FRA', region: 'Western Europe' },
      source: 'State Department',
      sourceUrl: 'https://www.state.gov/news',
      category: 'diplomatic',
      actors: ['G7 Nations', 'International Coalition'],
      regions: ['Western Europe', 'North America'],
      scores: { geopolitical: 75, geoeconomic: 70, security: 65, diplomatic: 80, stability: 70 },
      aiAnalysis: 'The coordinated G7 statement demonstrates renewed commitment to multilateral cooperation. This unified approach could strengthen international norms and provide framework for addressing shared security concerns.',
      confidence: calculateCuratedEventConfidence('high', 'positive', 0),
    },
    {
      id: 'curated-3',
      timestamp: new Date(now.getTime() - 90 * 60000),
      headline: 'Humanitarian Crisis Deepens in Conflict Zone as Aid Access Restricted',
      description: 'A humanitarian crisis continues to deepen in the conflict-affected region as humanitarian organizations report severe restrictions on aid access. Local populations are facing critical shortages of essential supplies including food, medicine, and clean water. International humanitarian agencies have issued urgent appeals for immediate action to address the deteriorating situation. The conflict has resulted in significant civilian displacement and destruction of critical infrastructure, limiting the ability of aid organizations to reach those in need. Humanitarian corridors that were previously established have become inaccessible, leaving millions at risk. UN agencies and international NGOs are working to negotiate improved access while coordinating with local authorities and international partners. The situation requires immediate international attention and sustained humanitarian response to prevent further deterioration of an already critical humanitarian emergency.',
      sentiment: 'negative',
      priority: 'high',
      location: { lat: 15.6, lng: 32.5, country: 'SDN', region: 'East Africa' },
      source: 'UNHCR',
      sourceUrl: 'https://www.unhcr.org/news',
      category: 'military',
      actors: ['Armed Groups', 'Civilian Population'],
      regions: ['East Africa'],
      scores: { geopolitical: 65, geoeconomic: 50, security: 80, diplomatic: 55, stability: 35 },
      aiAnalysis: 'The humanitarian situation has deteriorated significantly with blocked aid corridors affecting millions. International organizations are calling for immediate humanitarian access and protection of civilian infrastructure.',
      confidence: calculateCuratedEventConfidence('high', 'negative', 5),
    },
  ];
}

// Generate flash updates from intel events
export function generateFlashUpdates(events: IntelEvent[]): string[] {
  return events
    .filter(e => e.priority === 'high' || e.sentiment === 'negative')
    .slice(0, 8)
    .map(e => {
      const prefix = e.priority === 'high' && e.sentiment === 'negative' ? 'BREAKING: ' : '';
      return `${prefix}${e.headline}`;
    });
}
