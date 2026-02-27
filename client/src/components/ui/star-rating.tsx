import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  onRate, 
  readonly = false,
  size = 'md',
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7"
  };

  return (
    <div className={cn("flex items-center gap-1", className)} onMouseLeave={() => !readonly && setHoverRating(0)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || rating) >= starValue;
        const isHalf = !isFilled && (hoverRating || rating) >= starValue - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onRate?.(starValue)}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            className={cn(
              "focus:outline-none transition-transform",
              !readonly && "hover:scale-110 cursor-pointer active:scale-95"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled ? "fill-amber-400 text-amber-400" : 
                isHalf ? "fill-amber-400/50 text-amber-400" : 
                "fill-transparent text-muted-foreground/30",
                !readonly && "hover:text-amber-400"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
