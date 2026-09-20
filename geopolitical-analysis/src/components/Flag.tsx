import React, { useState } from 'react';

interface FlagProps {
  value?: string | null; // emoji, ISO code, or image URL
  iso2?: string | null; // two-letter code, e.g. 'gb'
  alt?: string;
  className?: string;
}

function iso2ToEmoji(code?: string | null) {
  if (!code) return '🌍';
  const c = code.toUpperCase();
  if (c.length !== 2) return '🌍';
  const first = 0x1f1e6 + (c.charCodeAt(0) - 65);
  const second = 0x1f1e6 + (c.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}

export default function Flag({ value, iso2, alt, className }: FlagProps) {
  // Image-first with local fallbacks: /flags/{iso}.svg, /flags/{iso}.png, then external CDN, then emoji.
  const [candidateIndex, setCandidateIndex] = useState(0);

  const val = value ?? undefined;

  const twoLetter = (val && typeof val === 'string' && /^[A-Za-z]{2}$/.test(val) && val.length === 2)
    ? val.toLowerCase()
    : undefined;

  const iso = (iso2 && iso2.length === 2 ? iso2.toLowerCase() : twoLetter) as string | undefined;

  const candidates: string[] = [];
  // If value is an explicit image URL, try it first.
  if (val && typeof val === 'string' && /^https?:\/\//.test(val)) candidates.push(val);

  // Local static flags (served from public/flags)
  if (iso) {
    candidates.push(`/flags/${iso}.svg`);
    candidates.push(`/flags/${iso}.png`);
  }

  // External fallbacks (FlagCDN)
  if (iso) {
    candidates.push(`https://flagcdn.com/w80/${iso}.png`);
    candidates.push(`https://flagcdn.com/24x18/${iso}.png`);
    candidates.push(`https://flagcdn.com/${iso}.svg`);
  }

  const currentSrc = candidates.length > 0 && candidateIndex < candidates.length ? candidates[candidateIndex] : undefined;

  const handleError = (e?: any) => {
    // advance to next candidate, or fall through to emoji when exhausted
    if (candidateIndex + 1 < candidates.length) setCandidateIndex(candidateIndex + 1);
    else setCandidateIndex(candidates.length);
  };

  if (currentSrc) {
    return (
      <img
        src={currentSrc}
        alt={alt ?? (iso ? iso.toUpperCase() : 'flag')}
        onError={handleError}
        className={className || 'w-6 h-4 object-cover rounded-sm'}
      />
    );
  }

  // If value is a two-letter code or an emoji/text, render emoji/text
  if (val && typeof val === 'string' && val.length > 0) {
    if (/^[A-Za-z]{2}$/.test(val)) {
      return (
        <span
          className={className || 'inline-block text-xl leading-none'}
          aria-hidden
          style={{ fontFamily: 'Apple Color Emoji, "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif' }}
        >
          {iso2ToEmoji(val)}
        </span>
      );
    }

    return (
      <span
        className={className || 'inline-block text-xl leading-none'}
        aria-hidden
        style={{ fontFamily: 'Apple Color Emoji, "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif' }}
      >
        {val}
      </span>
    );
  }

  // Final emoji fallback using iso2 if available
  const emoji = iso2ToEmoji(iso2);
  return (
    <span className={className || 'inline-block text-xl leading-none'} aria-hidden>
      {emoji}
    </span>
  );
}
