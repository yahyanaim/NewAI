import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating?: number;
    onRate?: (rating: number) => void;
    size?: number;
    className?: string;
}

export function StarRating({ rating = 0, onRate, size = 16, className = "" }: StarRatingProps) {
    const [hover, setHover] = useState(0);

    return (
        <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hover || rating) >= star;
                return (
                    <button
                        key={star}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => onRate?.(star)}
                        className="group relative transition-all duration-300 hover:scale-125 focus:outline-none"
                    >
                        <Star
                            size={size}
                            className={`${isActive
                                ? 'text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                                : 'text-text-tertiary border-text-tertiary group-hover:text-yellow-400/50'
                                } transition-all duration-300`}
                        />
                        {isActive && (
                            <div className="absolute inset-0 bg-yellow-400/20 blur-lg rounded-full animate-pulse pointer-events-none" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
