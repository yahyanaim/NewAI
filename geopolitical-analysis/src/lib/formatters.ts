// Utility functions for formatting and display

// Format number to exactly 2 decimal places
export function formatNumber(value: number): string {
  return value.toFixed(2);
}

// Format score display (e.g., "75.50/100")
export function formatScore(value: number): string {
  return `${formatNumber(value)}/100`;
}

// Format percentage (e.g., "75.50%")
export function formatPercentage(value: number): string {
  return `${formatNumber(value)}%`;
}

// Check if an event is new (created within last 2 minutes)
export function isNewEvent(eventId: string, createdAt?: Date): boolean {
  // Check if it's a realtime news event
  if (eventId.startsWith('realtime-news-')) {
    // If we have a creation timestamp, use it
    if (createdAt) {
      const now = Date.now();
      const created = new Date(createdAt).getTime();
      const ageInMinutes = (now - created) / (1000 * 60);
      return ageInMinutes <= 2;
    }
    // Fallback: consider new if ID format suggests recent addition
    return true;
  }
  return false;
}

// Get styling class for new events
export function getNewEventClass(eventId: string, createdAt?: Date): string {
  if (isNewEvent(eventId, createdAt)) {
    return 'bg-gradient-to-r from-accent-primary/15 to-transparent border-l-4 border-accent-primary animate-pulse-subtle';
  }
  return '';
}
