import type { IntelEvent } from '@/types';
import { formatScore } from './formatters';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

export async function generateChatResponse(question: string, event: IntelEvent): Promise<string> {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));

    const q = question.toLowerCase();
    const text = `${event.headline} ${event.description} ${event.aiAnalysis}`.toLowerCase();

    // 1. Identification / Actors
    if (q.includes('who') || q.includes('actor') || q.includes('involved')) {
        if (!event.actors || event.actors.length === 0) {
            return "I couldn't identify specific actors in this report, but it likely involves local stakeholders and authorities.";
        }
        return `The key actors identified in this event are: ${event.actors.join(', ')}.`;
    }

    // 2. Location / Context
    if (q.includes('where') || q.includes('location') || q.includes('region')) {
        return `This event is taking place in ${event.location.country} (${event.location.region}). Coordinates: ${event.location.lat.toFixed(2)}, ${event.location.lng.toFixed(2)}.`;
    }

    // 3. Impact / Risk / Scores
    if (q.includes('risk') || q.includes('danger') || q.includes('threat') || q.includes('score')) {
        const maxScore = Math.max(
            event.scores.security,
            event.scores.geopolitical,
            event.scores.geoeconomic,
            event.scores.diplomatic
        );

        let riskType = "general";
        if (maxScore === event.scores.security) riskType = "security";
        if (maxScore === event.scores.geoeconomic) riskType = "economic";

        return `The overall risk profile is driven primarily by ${riskType} factors. Security Risk is ${formatScore(event.scores.security)}, while Geopolitical Impact is ${formatScore(event.scores.geopolitical)}.`;
    }

    // 4. Economic specific
    if (q.includes('econom') || q.includes('market') || q.includes('finance') || q.includes('money')) {
        return `Geoeconomic Impact is rated at ${formatScore(event.scores.geoeconomic)}. ${event.scores.geoeconomic > 50 ? 'This suggests significant potential for market disruption.' : 'The immediate economic impact appears contained.'}`;
    }

    // 5. Casualties / Safety
    if (q.includes('die') || q.includes('death') || q.includes('kill') || q.includes('casualt') || q.includes('safe')) {
        if (text.includes('dead') || text.includes('kill') || text.includes('fatalit') || text.includes('casualt')) {
            return "Reports indicate there may be casualties or significant threats to life. Please refer to the latest official numbers in the event description.";
        }
        return "There are no immediate reports of confirmed mass casualties, but the situation regarding safety remains fluid.";
    }

    // 6. Summary / Tell me more
    if (q.includes('summary') || q.includes('summarize') || q.includes('explain') || q.includes('what happened') || q.includes('more')) {
        return event.aiAnalysis || event.description;
    }

    // Default fallback
    return `I can provide details on the actors, location, risk levels, or economic impact of this ${event.category} event. What would you like to know?`;
}
