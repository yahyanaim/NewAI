import { X, TrendingUp, TrendingDown, Minus, Shield, Globe, DollarSign, Users, MapPin, FileText, Eye, Download, Bot, CheckCircle, AlertTriangle, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { IntelEvent } from '@/types';
import { formatScore, formatNumber } from '@/lib/formatters';
import { ChatAssistant } from './ChatAssistant';
import { translateContent, labels, type SupportedLanguage, type TranslationResult } from '@/lib/translationService';
import { Languages, Loader2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';

interface AIAssessmentPanelProps {
  event: IntelEvent | null;
  onClose: () => void;
  onAuthRequired?: () => void;
}

export function AIAssessmentPanel({ event, onClose, onAuthRequired }: AIAssessmentPanelProps) {
  const { user } = useAuth();
  const { favorites, setRating } = useFavorites();
  const [showSummary, setShowSummary] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [translatedContent, setTranslatedContent] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Handle translation when language or event changes
  useEffect(() => {
    const performTranslation = async () => {
      if (!event) return;

      if (selectedLang === 'en') {
        setTranslatedContent({
          headline: event.headline,
          description: event.description || '',
          aiAnalysis: event.aiAnalysis
        });
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translateContent(
          event.id,
          {
            headline: event.headline,
            description: event.description || '',
            aiAnalysis: event.aiAnalysis
          },
          selectedLang
        );
        setTranslatedContent(result);
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    };

    if (showSummary) {
      performTranslation();
    } else {
      // Reset to English when modal closes to save resources? 
      // Actually let's keep it sticky for the session
    }
  }, [selectedLang, event?.id, showSummary]);

  // Accessibility helper: Text direction
  const isRTL = selectedLang === 'ar';
  const l = labels[selectedLang];

  // Hide scrollbar utility
  const scrollbarHiddenStyles = {
    msOverflowStyle: 'none' as const,  /* IE and Edge */
    scrollbarWidth: 'none' as const,  /* Firefox */
  };
  // Note: For Chrome/Safari/Opera, we'll use a style tag or class if possible, or just the inline style below combined with css if needed. 
  // Actually, standard Tailwind often relies on a plugin for no-scrollbar. 
  // I will inject a small style block or use inline styles for the container.


  // Enhanced overall risk calculation using multiple factors
  const calculateOverallRisk = (event: IntelEvent): number => {
    // Weighted combination of key risk factors
    const securityWeight = 0.35; // Security is the most critical factor
    const geopoliticalWeight = 0.25;
    const diplomaticWeight = 0.20;
    const stabilityWeight = 0.15; // Lower because stability is inverse
    const geoeconomicWeight = 0.05; // Economic factors are secondary for immediate risk

    // Calculate risk with weights and modifiers
    let riskScore = (
      event.scores.security * securityWeight +
      event.scores.geopolitical * geopoliticalWeight +
      event.scores.diplomatic * diplomaticWeight +
      (100 - event.scores.stability) * stabilityWeight + // Invert stability for risk calculation
      event.scores.geoeconomic * geoeconomicWeight
    );

    // Priority modifier (high priority events are inherently riskier)
    const priorityModifier = event.priority === 'high' ? 1.15 : event.priority === 'normal' ? 1.0 : 0.85;
    riskScore *= priorityModifier;

    // Sentiment modifier
    const sentimentModifier = event.sentiment === 'negative' ? 1.2 : event.sentiment === 'positive' ? 0.8 : 1.0;
    riskScore *= sentimentModifier;

    // Confidence modifier (high confidence means more reliable risk assessment)
    const confidenceModifier = event.confidence === 'high' ? 1.0 : event.confidence === 'medium' ? 0.95 : 0.9;
    riskScore *= confidenceModifier;

    // Regional impact modifier (multi-region events are riskier)
    const regionalModifier = event.regions.length > 1 ? 1.1 : 1.0;
    riskScore *= regionalModifier;

    return Math.round(Math.max(0, Math.min(100, riskScore)));
  };

  // Analytics helper functions
  const getSeverityLevel = (event: IntelEvent): string => {
    const avgScore = (event.scores.geopolitical + event.scores.security + event.scores.diplomatic) / 3;
    if (avgScore >= 80) return 'CRITICAL';
    if (avgScore >= 65) return 'HIGH';
    if (avgScore >= 45) return 'MEDIUM';
    return 'LOW';
  };

  const getTrendDirection = (event: IntelEvent): string => {
    // Simple trend calculation based on score patterns
    const securityTrend = event.scores.security > event.scores.diplomatic ? 'UP' : 'DOWN';
    const geoTrend = event.scores.geopolitical > 60 ? 'UP' : 'DOWN';
    const stabilityTrend = event.scores.stability < 50 ? 'DOWN' : 'UP';

    const trends = [securityTrend, geoTrend, stabilityTrend];
    const upTrends = trends.filter(t => t === 'UP').length;

    if (upTrends >= 2) return 'ESCALATING';
    if (upTrends === 1) return 'STABLE';
    return 'DE-ESCALATING';
  };

  // Simulated Verification Logic
  const getVerificationStatus = (event: IntelEvent) => {
    // Analyze content for risk keywords
    const text = (event.headline + ' ' + event.description).toLowerCase();
    const riskKeywords = ['unconfirmed', 'rumor', 'reportedly', 'alleged', 'sources say'];
    const hasRiskKeywords = riskKeywords.some(w => text.includes(w));

    // Determine status based on confidence and keywords
    if (event.confidence === 'high' && !hasRiskKeywords) {
      return {
        label: 'VERIFIED',
        color: 'text-sentiment-positive',
        bgColor: 'bg-sentiment-positive/10',
        borderColor: 'border-sentiment-positive/30',
        icon: <CheckCircle className="w-5 h-5" />,
        message: 'This event has been corroborated by multiple reliable sources and aligns with established pattern recognition models.'
      };
    } else if (event.confidence === 'low' || hasRiskKeywords) {
      return {
        label: 'UNVERIFIED',
        color: 'text-sentiment-negative',
        bgColor: 'bg-sentiment-negative/10',
        borderColor: 'border-sentiment-negative/30',
        icon: <AlertOctagon className="w-5 h-5" />,
        message: 'This report relies on unconfirmed data or single-source intelligence. Exercise caution and await further corroboration.'
      };
    } else {
      return {
        label: 'DEVELOPING',
        color: 'text-sentiment-neutral',
        bgColor: 'bg-sentiment-neutral/10',
        borderColor: 'border-sentiment-neutral/30',
        icon: <AlertTriangle className="w-5 h-5" />,
        message: 'Intelligence is currently being processed. Early indicators are consistent but full verification is pending.'
      };
    }
  };

  if (!event) return null;

  const verification = getVerificationStatus(event);

  const formatTimestamp = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const downloadSummary = (event: IntelEvent) => {
    // 1. Prepare Data
    const verification = getVerificationStatus(event);
    const overallRisk = calculateOverallRisk(event);
    const l = labels[selectedLang];
    const content = translatedContent || {
      headline: event.headline,
      description: event.description || '',
      aiAnalysis: event.aiAnalysis
    };
    const isRTL = selectedLang === 'ar';

    // 2. Build HTML Template (About Us Style)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${selectedLang}" dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${l.executiveSummary} - ${content.headline}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Noto+Sans+Arabic:wght@400;700&display=swap');
          
          :root {
            --primary-dark: #064E3B; /* Dark Green */
            --primary-light: #ECFDF5; /* Light Green */
            --accent: #059669;      /* Medium Green */
            --text-main: #1F2937;
            --text-light: #6B7280;
          }

          body {
            font-family: ${isRTL ? "'Noto Sans Arabic', 'Inter', sans-serif" : "'Inter', sans-serif"};
            margin: 0;
            padding: 40px;
            color: var(--text-main);
            background: #fff;
            -webkit-print-color-adjust: exact;
          }

          /* Header Section */
          header {
            margin-bottom: 60px;
            max-width: 800px;
            text-align: ${isRTL ? 'right' : 'left'};
          }

          .brand {
            font-size: 14px;
            font-weight: 600;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
            display: block;
          }

          h1 {
            font-size: 32px;
            line-height: 1.2;
            font-weight: 800;
            margin: 0 0 24px 0;
            color: #111;
          }

          .subtitle {
            font-size: 18px;
            line-height: 1.6;
            color: var(--text-light);
            max-width: 600px;
          }

          .btn {
            display: inline-block;
            background: var(--accent);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            margin-top: 24px;
          }

          /* Grid Layout */
          .grid-container {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 24px;
            margin-top: 40px;
          }

          /* Cards */
          .card {
            border-radius: 24px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: ${isRTL ? 'right' : 'left'};
          }

          /* Left - "Our Story" equivalent */
          .card-main {
            background: #F3F4F6;
            min-height: 500px;
            position: relative;
            overflow: hidden;
            background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url('https://image.pollinations.ai/prompt/journalism%20photo%20of%20${encodeURIComponent(event.location.country)}%20${encodeURIComponent(event.category)}%20event?width=800&height=600&nologo=true'); 
            background-size: cover;
            background-position: center;
            color: white;
            grid-row: span 2;
          }
          
          .main-content {
            margin-top: auto;
            position: relative;
            z-index: 2;
          }

          .tag {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(4px);
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 12px;
          }

          .card-light {
            background: var(--primary-light);
            color: var(--primary-dark);
          }

          .card-dark {
            background: var(--primary-dark);
            color: white;
          }

          h2 {
            font-size: 24px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
          }

          p {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 24px;
            opacity: 0.9;
          }

          ul {
            padding-${isRTL ? 'right' : 'left'}: 24px;
            margin: 0 0 32px 0;
          }

          li {
            margin-bottom: 12px;
            line-height: 1.5;
          }

          .stat-grid {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 20px;
             margin-top: auto;
          }
          
          .stat-item {
             background: rgba(255,255,255,0.5);
             padding: 16px 20px;
             border-radius: 16px;
          }
          .card-dark .stat-item { background: rgba(255,255,255,0.1); }

          .stat-label { font-size: 11px; text-transform: uppercase; font-weight: 600; opacity: 0.7; }
          .stat-val { font-size: 20px; font-weight: 800; }

        </style>
      </head>
      <body>

        <header>
          <span class="brand">WarTracker24 Intelligence</span>
          <h1>${content.headline}</h1>
          <div class="subtitle">
            ${content.aiAnalysis}
          </div>
          <span class="btn">${l.severity}: ${getSeverityLevel(event)}</span>
        </header>

        <div class="grid-container">
          <div class="card card-main">
            <div class="main-content">
              <span class="tag">${l.quickOverview}</span>
              <h2>${l.executiveSummary}</h2>
              <p>${content.description}</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                 <div style="font-size: 13px; opacity: 0.8;">${l.source.toUpperCase()}</div>
                 <div style="font-size: 18px; font-weight: 600;">${event.source}</div>
                 <div style="font-size: 13px; opacity: 0.6; margin-top: 4px;">Lat: ${event.location.lat.toFixed(2)} | Lng: ${event.location.lng.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div class="card card-light">
            <div>
              <h2>${l.analyticsDashboard}</h2>
              <div class="stat-grid">
               <div class="stat-item">
                 <div class="stat-label">${l.securityRisk}</div>
                 <div class="stat-val">${formatScore(event.scores.security)}</div>
               </div>
               <div class="stat-item">
                 <div class="stat-label">Stability</div>
                 <div class="stat-val">${formatScore(event.scores.stability)}</div>
               </div>
              </div>
            </div>
          </div>

          <div class="card card-dark">
            <div>
              <h2>${l.recommendedActions}</h2>
              <p>${l.overallRisk}: ${formatScore(overallRisk)}</p>
              <ul>
                 <li>${event.priority === 'high' ? (selectedLang === 'fr' ? 'Lancer les protocoles de surveillance accrue.' : selectedLang === 'ar' ? 'بدء بروتوكولات المراقبة المتزايدة.' : 'Initiate heightened monitoring protocols.') : (selectedLang === 'fr' ? 'Poursuivre l\'observation standard.' : selectedLang === 'ar' ? 'مواصلة المراقبة المعتادة.' : 'Continue standard observation.')}</li>
                 <li>${event.regions.length > 1 ? (selectedLang === 'fr' ? 'Évaluer les risques de contagion transfrontalière.' : selectedLang === 'ar' ? 'تقييم مخاطر انتقال العدوى عبر الحدود.' : 'Assess cross-border contagion risks.') : (selectedLang === 'fr' ? 'Liaison avec les parties prenantes locales.' : selectedLang === 'ar' ? 'التواصل مع الجهات المعنية المحلية.' : 'Liaise with local stakeholders.')}</li>
              </ul>
            </div>
          </div>
        </div>

        <script>
           window.onload = function() {
             setTimeout(function() { window.print(); }, 500);
           }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getSentimentIcon = () => {
    switch (event.sentiment) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-sentiment-positive" />;
      case 'negative': return <TrendingDown className="w-5 h-5 text-sentiment-negative" />;
      case 'neutral': return <Minus className="w-5 h-5 text-sentiment-neutral" />;
    }
  };

  const getSentimentColor = () => {
    switch (event.sentiment) {
      case 'positive': return 'bg-sentiment-positive text-bg-base';
      case 'negative': return 'bg-sentiment-negative text-white';
      case 'neutral': return 'bg-sentiment-neutral text-bg-base';
    }
  };

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'high': return 'bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative';
      case 'normal': return 'bg-accent-primary/20 text-accent-primary border-accent-primary';
      case 'low': return 'bg-text-tertiary/20 text-text-tertiary border-text-tertiary';
    }
  };

  return (
    <div className="relative w-full h-full bg-bg-surface/80 backdrop-blur-xl border-l border-accent-primary/20 flex flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-accent-primary/15 bg-accent-primary/5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                {getSentimentIcon()}
                <div className="absolute inset-0 bg-current blur-md opacity-20 animate-pulse rounded-full" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Intelligence Report</h2>
            </div>
            {event && (
              <StarRating
                rating={favorites.find(f => f.event_id === event.id)?.rating}
                onRate={async (val) => {
                  if (!user) {
                    toast.error('Please sign in to rate news');
                    return;
                  }
                  try {
                    await setRating(event, val);
                    toast.success('Rating updated', {
                      description: `Strategic assessment updated to ${val} stars.`,
                      duration: 2000
                    });
                  } catch (err) {
                    toast.error('Failed to update rating');
                  }
                }}
                size={18}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-sm font-medium text-accent-primary transition-colors"
            >
              <FileText className="w-4 h-4" />
              Summary
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-elevated rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-caption text-text-tertiary">
          {formatTimestamp(event.timestamp)}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar"
      >
        {/* Verification Alert - Only show if unverified/developing */}
        {verification.label !== 'VERIFIED' && (
          <div className={`p-3 rounded-lg border ${verification.borderColor} ${verification.bgColor} flex items-start gap-3`}>
            <div className={`${verification.color} pt-0.5`}>{verification.icon}</div>
            <div>
              <div className={`text-sm font-bold ${verification.color} mb-1`}>
                INTELLIGENCE STATUS: {verification.label}
              </div>
              <p className="text-xs text-text-secondary">
                {verification.message}
              </p>
            </div>
          </div>
        )}

        {/* Event Header */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-3">
            {event.headline}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getSentimentColor()}`}>
              {event.sentiment.toUpperCase()}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor()}`}>
              {event.priority.toUpperCase()} PRIORITY
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <MapPin className="w-4 h-4" />
            <span>{event.location.country}, {event.location.region}</span>
          </div>
        </div>

        {/* FACT CHECK BUTTON */}
        <button
          onClick={() => setShowVerification(true)}
          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-300 group shadow-sm ${verification.label === 'VERIFIED'
            ? 'bg-sentiment-positive/10 border-sentiment-positive/30 hover:bg-sentiment-positive/20'
            : 'bg-bg-elevated/40 backdrop-blur-sm border-accent-primary/20 hover:border-accent-primary/50 hover:shadow-accent-primary/10'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${verification.label === 'VERIFIED' ? 'bg-sentiment-positive/10' : 'bg-accent-primary/10'}`}>
              <Shield className={`w-5 h-5 ${verification.label === 'VERIFIED' ? 'text-sentiment-positive' : 'text-accent-primary'
                } group-hover:scale-110 transition-transform`} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Strategic Verification
              </div>
              <div className="text-xs text-text-tertiary">
                Cross-referenced security audit
              </div>
            </div>
          </div>
          <div className={`text-xs font-black px-2 py-1 rounded border ${verification.borderColor} ${verification.color}`}>
            {verification.label}
          </div>
        </button>

        {/* AI Event Assessment Scores */}
        <div className="bg-bg-elevated/40 backdrop-blur-md rounded-xl p-5 border border-accent-primary/20 shadow-lg">
          <h4 className="text-xs font-black text-accent-primary mb-5 flex items-center gap-2 uppercase tracking-[0.2em]">
            <Bot className="w-4 h-4 animate-bounce-slow" />
            Neural Assessment
          </h4>

          <div className="space-y-3">
            <ScoreBar
              label="GEOPOLITICAL"
              score={event.scores.geopolitical}
              icon={<Globe className="w-4 h-4" />}
              color="blue"
            />
            <ScoreBar
              label="GEOECONOMIC"
              score={event.scores.geoeconomic}
              icon={<DollarSign className="w-4 h-4" />}
              color="purple"
            />
            <ScoreBar
              label="SECURITY"
              score={event.scores.security}
              icon={<Shield className="w-4 h-4" />}
              color="red"
            />
            <ScoreBar
              label="DIPLOMATIC"
              score={event.scores.diplomatic}
              icon={<Users className="w-4 h-4" />}
              color="green"
            />
            <ScoreBar
              label="STABILITY"
              score={event.scores.stability}
              icon={<TrendingUp className="w-4 h-4" />}
              color="orange"
            />
          </div>
        </div>

        {/* Key Actors */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">
            Key Actors
          </h4>
          <div className="flex flex-wrap gap-2">
            {event.actors.map((actor, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-accent-primary/10 border border-accent-primary/30 rounded-full text-sm text-accent-primary"
              >
                {actor}
              </div>
            ))}
          </div>
        </div>

        {/* Affected Regions */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">
            Affected Regions
          </h4>
          <div className="flex flex-wrap gap-2">
            {event.regions.map((region, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-sentiment-neutral/10 border border-sentiment-neutral/30 rounded-full text-sm text-sentiment-neutral"
              >
                {region}
              </div>
            ))}
          </div>
        </div>

        {/* AI Agent Analysis */}
        <div className="bg-bg-elevated rounded-lg p-4 border border-accent-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">
              AI Agent Analysis
            </h4>
            <div className={`px-2 py-1 rounded text-caption font-medium ${event.confidence === 'high'
              ? 'bg-sentiment-positive/20 text-sentiment-positive'
              : event.confidence === 'medium'
                ? 'bg-sentiment-neutral/20 text-sentiment-neutral'
                : 'bg-text-tertiary/20 text-text-tertiary'
              }`}>
              {event.confidence.toUpperCase()} CONFIDENCE
            </div>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.aiAnalysis}
          </p>
        </div>

        {/* TACTICAL CHAT ASSISTANT - INLINE VERSION */}
        <div className="mt-6 border-t border-accent-primary/20 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent-primary" />
              <h4 className="text-sm font-semibold text-text-primary">Tactical Chat Assistant</h4>
            </div>
            <button
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="px-2 py-1 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 rounded-md text-xs font-bold text-accent-primary transition-all flex items-center gap-1"
              title={isChatVisible ? "Hide Technical Chat" : "Show Technical Chat"}
            >
              {isChatVisible ? (
                <>
                  <span>HIDE</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>OPEN TECHNICAL</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          {isChatVisible && (
            <div className="h-[400px] bg-bg-surface/50 rounded-lg overflow-hidden border border-accent-primary/10 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
              <ChatAssistant event={event} onAuthRequired={onAuthRequired} />
            </div>
          )}
        </div>

        {/* Source Attribution */}
        <div className="text-caption text-text-tertiary border-t border-accent-primary/10 pt-3 mt-4">
          Source: {event.source} | Category: {event.category.toUpperCase()}
        </div>
      </div>



      {/* Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface border border-accent-primary/30 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${verification.bgColor} ${verification.color}`}>
                {verification.icon}
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Simulated Verification: {verification.label}</h3>
              <p className="text-text-secondary mb-6 leading-relaxed">
                {verification.message}
              </p>

              <div className="w-full bg-bg-elevated rounded-lg p-3 mb-6 text-left">
                <div className="text-caption text-text-tertiary mb-2">Verification Factors</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Source Reliability</span>
                    <span className="font-medium text-text-primary">Checked</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Pattern Match</span>
                    <span className="font-medium text-text-primary">{event.confidence === 'high' ? 'High' : 'Medium'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Cross-Reference</span>
                    <span className="font-medium text-text-primary">Complete</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowVerification(false)}
                className="w-full py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg font-medium transition-colors"
              >
                Acknowledge Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-[#061414] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[94vh] overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)] relative -translate-y-[15px]">
            {/* Modal Header */}
            <div className={`p-6 border-b border-accent-primary/20 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-2 rounded-lg ${getSentimentColor()}`}>
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary leading-tight mb-1">{event.headline}</h3>
                    <h4 className="text-sm font-medium text-accent-primary flex items-center gap-2">
                      {l.executiveSummary}
                      <span className="text-white/20 text-[10px]">•</span>
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{event.location.country}</span>
                    </h4>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor()}`}>
                        {event.sentiment.toUpperCase()}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor()}`}>
                        {event.priority.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Language Selector */}
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10 hover:border-accent-primary/40 transition-all cursor-pointer group shadow-inner">
                    <Languages className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform" />
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value as SupportedLanguage)}
                      className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer uppercase tracking-widest appearance-none pr-1"
                    >
                      <option value="en" className="bg-[#0B121E]">EN</option>
                      <option value="fr" className="bg-[#0B121E]">FR</option>
                      <option value="ar" className="bg-[#0B121E]">AR</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-white/30" />
                  </div>

                  <button
                    onClick={() => setShowSummary(false)}
                    className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white hover:rotate-90 active:scale-95"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className={`p-6 overflow-y-auto max-h-[60vh] custom-scrollbar ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Translating Loader */}
              {isTranslating && (
                <div className="flex items-center justify-center py-8 gap-3 animate-pulse">
                  <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                  <span className="text-sm font-bold text-accent-primary uppercase tracking-widest">
                    AI Translation in Progress...
                  </span>
                </div>
              )}

              {/* Quick Overview */}
              <div className={`mb-6 ${isTranslating ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'} transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both`}>
                <h4 className={`text-sm font-semibold text-accent-primary mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileText className="w-4 h-4" />
                  {l.quickOverview}
                </h4>
                <p className="text-text-secondary leading-relaxed text-lg font-medium">
                  {translatedContent?.headline || event.headline}
                </p>
              </div>

              {/* Assessment Snapshot */}
              <div className={`mb-6 ${isTranslating ? 'opacity-30' : 'opacity-100'} animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both`}>
                <h4 className={`text-sm font-semibold text-accent-primary mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Shield className="w-4 h-4" />
                  {l.assessmentSnapshot}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-elevated rounded-lg p-3">
                    <div className="text-caption text-text-tertiary">{l.overallRisk}</div>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="text-lg font-bold text-text-primary">
                        {formatScore(calculateOverallRisk(event))}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${calculateOverallRisk(event) >= 70
                        ? 'bg-sentiment-positive/20 text-sentiment-positive'
                        : calculateOverallRisk(event) >= 40
                          ? 'bg-sentiment-neutral/20 text-sentiment-neutral'
                          : 'bg-sentiment-negative/20 text-sentiment-negative'
                        }`}>
                        {calculateOverallRisk(event) >= 70 ? (selectedLang === 'ar' ? 'مرتفع' : 'HIGH')
                          : calculateOverallRisk(event) >= 40 ? (selectedLang === 'ar' ? 'متوسط' : 'MEDIUM') : (selectedLang === 'ar' ? 'منخفض' : 'LOW')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-elevated rounded-lg p-3">
                    <div className="text-caption text-text-tertiary">{l.impactLevel}</div>
                    <div className={`text-lg font-bold text-text-primary mt-1 ${isRTL ? 'text-right' : ''}`}>
                      {event.regions.length} {selectedLang === 'ar' ? 'أقاليم' : 'Regions'}
                    </div>
                    <div className="text-xs text-text-tertiary">{selectedLang === 'ar' ? 'متأثرة' : 'Affected'}</div>
                  </div>
                </div>
              </div>

              {/* Analytics Dashboard */}
              <div className={`mb-6 ${isTranslating ? 'opacity-30' : 'opacity-100'} animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both`}>
                <h4 className={`text-sm font-semibold text-accent-primary mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="w-4 h-4" />
                  {l.analyticsDashboard}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-elevated rounded-lg p-3 text-center">
                    <div className="text-xs text-text-tertiary mb-1">{l.confidence}</div>
                    <div className={`text-lg font-bold ${event.confidence === 'high' ? 'text-sentiment-positive' :
                      event.confidence === 'medium' ? 'text-sentiment-neutral' : 'text-text-tertiary'
                      }`}>
                      {Math.round(event.confidence === 'high' ? 92 : event.confidence === 'medium' ? 71 : 43)}%
                    </div>
                  </div>

                  <div className="bg-bg-elevated rounded-lg p-3 text-center">
                    <div className="text-xs text-text-tertiary mb-1">{l.severity}</div>
                    <div className="text-lg font-bold text-text-primary">
                      {getSeverityLevel(event)}
                    </div>
                  </div>

                  <div className="bg-bg-elevated rounded-lg p-3 text-center">
                    <div className="text-xs text-text-tertiary mb-1">{l.trend}</div>
                    <div className="text-lg font-bold text-sentiment-neutral">
                      {getTrendDirection(event)}
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                <div className="mt-3 bg-bg-elevated rounded-lg p-3">
                  <div className="text-xs text-text-tertiary mb-2">{l.riskBreakdown}</div>
                  <div className="space-y-2">
                    <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-text-secondary">{l.securityRisk}</span>
                      <span className="font-medium">{formatScore(event.scores.security)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${event.scores.security}%`,
                          backgroundColor: 'rgb(38, 145, 175)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-text-secondary">{l.geopoliticalImpact}</span>
                      <span className="font-medium">{formatScore(event.scores.geopolitical)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${event.scores.geopolitical}%`,
                          backgroundColor: 'rgb(38, 145, 175)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* News Article */}
              <div className={`mb-10 ${isTranslating ? 'opacity-10 blur-sm' : 'opacity-100'} transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both`}>
                <h4 className={`text-[10px] font-black text-accent-primary mb-5 flex items-center gap-2 uppercase tracking-[0.25em] ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-px bg-accent-primary/30" />
                  <FileText className="w-3.5 h-3.5" />
                  {l.newsArticle}
                </h4>
                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-7 border border-white/5 shadow-2xl group hover:border-white/10 transition-all">
                  <p className="text-white/80 leading-relaxed mb-8 text-[15px] font-medium tracking-tight text-justify">
                    {translatedContent?.description || event.description || `${event.headline} This event represents a significant development in the geopolitical landscape.`}
                  </p>
                  <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em]">
                      {l.published}: <span className="text-white/40">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <a
                      href={event.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(event.headline + ' ' + event.source)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 bg-accent-primary/5 hover:bg-accent-primary/15 border border-accent-primary/20 rounded-xl text-[11px] font-black text-accent-primary transition-all hover:scale-[1.03] active:scale-95 group"
                    >
                      <FileText className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      {l.readMore} <span className="text-white/40 ml-1">{event.source.toUpperCase()}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className={`mb-10 ${isTranslating ? 'opacity-10 blur-sm' : 'opacity-100'} transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms] fill-mode-both`}>
                <h4 className={`text-[10px] font-black text-accent-primary mb-5 flex items-center gap-2 uppercase tracking-[0.25em] ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-px bg-accent-primary/30" />
                  <Globe className="w-3.5 h-3.5" />
                  {l.keyInsights}
                </h4>
                <div className="space-y-6 px-4">
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(38,145,175,0.6)]" />
                    <div className="flex-1">
                      <div className={`text-[11px] font-black text-accent-primary uppercase tracking-widest mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {selectedLang === 'fr' ? 'Analyse Stratégique' : selectedLang === 'ar' ? 'التحليل الاستراتيجي' : 'STRATEGIC ANALYSIS'}
                      </div>
                      <p className={`text-sm text-white/70 leading-relaxed font-medium text-justify ${isRTL ? 'text-right' : ''}`}>
                        {translatedContent?.aiAnalysis || event.aiAnalysis}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(38,145,175,0.6)]" />
                    <div className="flex-1">
                      <div className={`text-[11px] font-black text-accent-primary uppercase tracking-widest mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {selectedLang === 'fr' ? 'Portée Géographique' : selectedLang === 'ar' ? 'النطاق الجغرافي' : 'GEOGRAPHIC SCOPE'}
                      </div>
                      <p className={`text-sm text-white/70 leading-relaxed font-medium text-justify ${isRTL ? 'text-right' : ''}`}>
                        {event.regions.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className={`${isTranslating ? 'opacity-10' : 'opacity-100'} mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms] fill-mode-both`}>
                <h4 className={`text-[10px] font-black text-accent-primary mb-5 flex items-center gap-2 uppercase tracking-[0.25em] ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-px bg-accent-primary/30" />
                  <Users className="w-3.5 h-3.5" />
                  {l.recommendedActions}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
                  <div className={`flex items-center gap-4 p-4 bg-sentiment-negative/[0.02] rounded-2xl border border-sentiment-negative/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-sentiment-negative shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
                    <span className="text-[11px] font-black text-white/70 tracking-tight uppercase">
                      {event.priority === 'high' ? (selectedLang === 'fr' ? 'Protocoles d\'alerte active' : selectedLang === 'ar' ? 'بروتوكولات التنبيه النشطة' : 'ACTIVE ALERT PROTOCOLS') : (selectedLang === 'fr' ? 'Surveillance standard' : selectedLang === 'ar' ? 'مراقبة قياسية' : 'STANDARD MONITORING')}
                    </span>
                  </div>
                  <div className={`flex items-center gap-4 p-4 bg-sentiment-neutral/[0.02] rounded-2xl border border-sentiment-neutral/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-sentiment-neutral shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
                    <span className="text-[11px] font-black text-white/70 tracking-tight uppercase">
                      {event.regions.length > 1 ? (selectedLang === 'fr' ? 'Évaluation transrégionale' : selectedLang === 'ar' ? 'تقييم عابر للأقاليم' : 'CROSS-REGIONAL ASSESSMENT') : (selectedLang === 'fr' ? 'Engagement local' : selectedLang === 'ar' ? 'تفاعل محلي' : 'LOCAL ENGAGEMENT')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Fixed at the bottom) */}
            <div className="p-8 border-t border-white/10 bg-[#061414] z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex shrink-0">
              <div className="w-full flex flex-col gap-6">
                {/* Row 1: Metadata Row */}
                <div className={`flex flex-wrap items-center gap-x-8 gap-y-2 text-[10px] font-black tracking-[0.2em] uppercase ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{l.source}:</span>
                    <span className="text-white/90">{event.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">{l.generated}:</span>
                    <span className="text-white/90">{formatTimestamp(new Date())}</span>
                  </div>
                </div>

                {/* Row 2: Download button (Under in the bottom) */}
                <button
                  onClick={() => downloadSummary(event)}
                  className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-accent-primary via-[#3AB5D9] to-accent-primary bg-[length:200%_auto] hover:bg-[100%_0] text-white rounded-xl text-[11px] font-black transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] shadow-2xl animate-glow-pulse uppercase tracking-[0.2em] group border border-white/20"
                >
                  {/* Shimmer Effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  <span className="relative z-10 drop-shadow-md">{l.downloadSummary}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'red' | 'green' | 'orange';
}

function ScoreBar({ label, score, icon, color }: ScoreBarProps) {
  const getBarColor = () => {
    if (score >= 71) return 'bg-sentiment-positive';
    if (score >= 41) return 'bg-sentiment-neutral';
    return 'bg-sentiment-negative';
  };

  const getTextColor = () => {
    if (score >= 71) return 'text-sentiment-positive';
    if (score >= 41) return 'text-sentiment-neutral';
    return 'text-sentiment-negative';
  };

  const getIconColor = () => {
    switch (color) {
      case 'blue': return 'text-blue-400';
      case 'purple': return 'text-purple-400';
      case 'red': return 'text-red-400';
      case 'green': return 'text-green-400';
      case 'orange': return 'text-orange-400';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={getIconColor()}>{icon}</div>
          <span className="text-caption font-semibold text-text-primary">
            {label}
          </span>
        </div>
        <span className={`text-sm font-bold ${getTextColor()}`}>
          {formatScore(score)}
        </span>
      </div>
      <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
