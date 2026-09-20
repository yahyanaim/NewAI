
/**
 * Translation Service for Geopolitical Analysis
 * Uses Pollinations.ai for free LLM-based translation
 */

export type SupportedLanguage = 'en' | 'fr' | 'ar';

export interface TranslationResult {
    headline: string;
    description: string;
    aiAnalysis: string;
}

const translationCache: Record<string, Record<SupportedLanguage, TranslationResult>> = {};

/**
 * Translates content using Pollinations.ai
 */
export async function translateContent(
    id: string,
    content: { headline: string; description: string; aiAnalysis: string },
    targetLang: SupportedLanguage
): Promise<TranslationResult> {
    // Return early if target is English (source)
    if (targetLang === 'en') {
        return content;
    }

    // Check cache
    if (translationCache[id]?.[targetLang]) {
        return translationCache[id][targetLang];
    }

    const langNames = {
        fr: 'French',
        ar: 'Arabic'
    };

    const prompt = `
    Translate the following intelligence data into ${langNames[targetLang]}.
    Keep the tone professional and strategic.
    Return ONLY a JSON object with fields: "headline", "description", "aiAnalysis".
    
    Data:
    {
      "headline": "${content.headline}",
      "description": "${content.description}",
      "aiAnalysis": "${content.aiAnalysis}"
    }
  `;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Translation API Error');

        const rawText = await response.text();
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);

        // Store in cache
        if (!translationCache[id]) translationCache[id] = {} as any;
        translationCache[id][targetLang] = result;

        return result;
    } catch (error) {
        console.warn(`Translation to ${targetLang} failed, falling back to English:`, error);
        return content;
    }
}

/**
 * Static UI Labels for different languages
 */
export const labels = {
    en: {
        executiveSummary: 'Executive Summary',
        quickOverview: 'QUICK OVERVIEW',
        assessmentSnapshot: 'ASSESSMENT SNAPSHOT',
        overallRisk: 'Overall Risk',
        impactLevel: 'Impact Level',
        analyticsDashboard: 'ANALYTICS DASHBOARD',
        confidence: 'Confidence',
        severity: 'Severity',
        trend: 'Trend',
        riskBreakdown: 'Risk Breakdown',
        securityRisk: 'Security Risk',
        geopoliticalImpact: 'Geopolitical Impact',
        newsArticle: 'NEWS ARTICLE',
        published: 'Published',
        readMore: 'Read More on',
        keyInsights: 'KEY INSIGHTS',
        recommendedActions: 'RECOMMENDED ACTIONS',
        downloadSummary: 'Download Summary',
        closeSummary: 'Close Summary',
        source: 'Source',
        generated: 'Generated',
    },
    fr: {
        executiveSummary: 'Résumé Exécutif',
        quickOverview: 'APERÇU RAPIDE',
        assessmentSnapshot: 'INSTANTANÉ D\'ÉVALUATION',
        overallRisk: 'Risque Global',
        impactLevel: 'Niveau d\'Impact',
        analyticsDashboard: 'TABLEAU DE BORD ANALYTIQUE',
        confidence: 'Confiance',
        severity: 'Sévérité',
        trend: 'Tendance',
        riskBreakdown: 'Répartition des Risques',
        securityRisk: 'Risque de Sécurité',
        geopoliticalImpact: 'Impact Géopolitique',
        newsArticle: 'ARTICLE DE PRESSE',
        published: 'Publié',
        readMore: 'Lire la suite sur',
        keyInsights: 'APERÇUS CLÉS',
        recommendedActions: 'ACTIONS RECOMMANDÉES',
        downloadSummary: 'Télécharger le résumé',
        closeSummary: 'Fermer le résumé',
        source: 'Source',
        generated: 'Généré',
    },
    ar: {
        executiveSummary: 'ملخص تنفيذي',
        quickOverview: 'نظرة عامة سريعة',
        assessmentSnapshot: 'لقطة التقييم',
        overallRisk: 'المخاطر الإجمالية',
        impactLevel: 'مستوى التأثير',
        analyticsDashboard: 'لوحة القيادة التحليلية',
        confidence: 'الثقة',
        severity: 'الخطورة',
        trend: 'الاتجاه',
        riskBreakdown: 'توزيع المخاطر',
        securityRisk: 'المخاطر الأمنية',
        geopoliticalImpact: 'التأثير الجيوسياسي',
        newsArticle: 'مقال إخباري',
        published: 'نشرت في',
        readMore: 'اقرأ المزيد على',
        keyInsights: 'رؤى رئيسية',
        recommendedActions: 'الإجراءات الموصى بها',
        downloadSummary: 'تحميل الملخص',
        closeSummary: 'إغلاق الملخص',
        source: 'المصدر',
        generated: 'تم إنشاؤه',
    },
};
