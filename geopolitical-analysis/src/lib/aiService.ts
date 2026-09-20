
// Shared AI Service for Geopolitical Analysis
// Uses free Pollinations.ai API

export interface AIAnalysisResult {
    scores: {
        geopolitical: number;
        geoeconomic: number;
        security: number;
        diplomatic: number;
        stability: number;
    };
    analysis: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    priority: 'high' | 'normal' | 'low';
    location?: {
        country: string;
        region: string;
        conflict_zone?: string;
    };
    tags?: string[];
}

// Function to call Free AI (Pollinations.ai)
export async function analyzeWithAI(text: string): Promise<AIAnalysisResult | null> {
    const prompt = `
    Analyze this geopolitical news event and return ONLY a JSON object.
    News: "${text}"
    
    Task:
    1. Score from 0-100 for categories: geopolitical, geoeconomic, security, diplomatic, stability.
    2. Write a concise 2-sentence intelligence analysis.
    3. Determine sentiment (positive/negative/neutral) and priority (high/normal/low).
    4. Extract the primary Country and Region.
    5. If this is a conflict, identify the specific "conflict_zone".
    6. detailed tags (max 5) characterizing the event (e.g. "Sports", "Conflict", "Trade").

    Format:
    {"scores": {"geopolitical": 0, "geoeconomic": 0, "security": 0, "diplomatic": 0, "stability": 0}, "analysis": "...", "sentiment": "neutral", "priority": "normal", "location": {"country": "Name", "region": "Name", "conflict_zone": "Name or null"}, "tags": ["Tag1", "Tag2"]}
  `;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout (increased for reliability)

        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('AI API Error');

        const rawText = await response.text();
        // Clean potential markdown code blocks
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Basic validation
        const result = JSON.parse(jsonStr);
        if (!result.scores || !result.analysis) throw new Error('Invalid JSON structure');

        return result;
    } catch (error) {
        console.warn('AI Analysis failed or timed out, using fallback:', error);
        return null;
    }
}
