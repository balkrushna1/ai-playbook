import { Link } from "wouter";
import { PlaybookResponse } from "@shared/routes";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, TrendingUp } from "lucide-react";
import { StarRating } from "./ui/star-rating";

export default function PlaybookCard({ playbook }: { playbook: PlaybookResponse }) {
  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expert': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Link href={`/playbook/${playbook.slug}`}>
      <Card className="h-full cursor-pointer overflow-hidden card-hover-effect border-border/50 group flex flex-col rounded-2xl bg-white/50 backdrop-blur-sm">
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4 gap-2">
            <Badge variant="secondary" className="font-medium bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
              {playbook.category}
            </Badge>
            <Badge variant="outline" className={getDifficultyColor(playbook.difficulty)}>
              {playbook.difficulty}
            </Badge>
          </div>
          
          <h3 className="text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {playbook.title}
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
            {playbook.shortDescription}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-auto">
            {playbook.toolsUsed.slice(0, 3).map((tool, i) => (
              <span key={i} className="text-xs font-medium px-2 py-1 rounded-md bg-secondary/80 text-secondary-foreground border border-border/40">
                {tool}
              </span>
            ))}
            {playbook.toolsUsed.length > 3 && (
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary/80 text-secondary-foreground border border-border/40">
                +{playbook.toolsUsed.length - 3} more
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-6 py-4 border-t border-border/40 bg-secondary/20 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {playbook.estimatedTime}
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {playbook.authorName}
            </div>
          </div>
          
          {playbook.averageRating ? (
            <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-700">{playbook.averageRating.toFixed(1)}</span>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  );
}
