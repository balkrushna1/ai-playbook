import { useRoute } from "wouter";
import { usePlaybook, useRatePlaybook, useDeletePlaybook } from "@/hooks/use-playbooks";
import { useAuth } from "@/hooks/use-auth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User as UserIcon, Calendar, Wrench, ChevronLeft, Trash, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PlaybookDetail() {
  const [, params] = useRoute("/playbook/:slug");
  const [, setLocation] = useLocation();
  const { data: playbook, isLoading } = usePlaybook(params?.slug || "");
  const { user } = useAuth();
  const rateMutation = useRatePlaybook();
  const deleteMutation = useDeletePlaybook();
  const { toast } = useToast();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-16 w-3/4 mb-6" />
        <Skeleton className="h-6 w-1/2 mb-10" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!playbook) return <div className="text-center py-20 text-xl font-medium">Playbook not found</div>;

  const handleRate = async (rating: number) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    await rateMutation.mutateAsync({ id: playbook.id, rating, slug: playbook.slug });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard!" });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(playbook.id);
    setDeleteModalOpen(false);
    setLocation("/explore");
  };

  const isAuthor = user?.id === playbook.userId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in-slide">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="mb-8 -ml-3 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to explore
        </Button>
      </Link>

      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-border/60 shadow-sm mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Wrench className="w-64 h-64 rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/5 text-primary">
              {playbook.category}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-sm">
              {playbook.difficulty}
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            {playbook.title}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-3xl">
            {playbook.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/40 inline-flex">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span className="font-medium text-foreground">{playbook.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{playbook.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(playbook.createdAt || '').toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 mt-8 pt-8 border-t border-border/40">
            <div>
              <p className="text-sm font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Rate this playbook</p>
              <div className="flex items-center gap-3">
                <StarRating rating={playbook.averageRating || 0} onRate={handleRate} size="lg" />
                <span className="text-sm text-muted-foreground font-medium">
                  ({playbook.ratingCount} {playbook.ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            </div>

            <div className="flex-1" />

            {isAuthor && (
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => setDeleteModalOpen(true)}>
                <Trash className="w-4 h-4 mr-2" /> Delete Playbook
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" /> Tools Required
        </h3>
        <div className="flex flex-wrap gap-2">
          {playbook.toolsUsed.map((tool, idx) => (
            <div key={idx} className="bg-white border border-border shadow-sm px-4 py-2 rounded-lg font-medium">
              {tool}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Execution Steps</h2>
        <Accordion type="multiple" defaultValue={playbook.steps.map(s => s.id)} className="space-y-4">
          {playbook.steps.sort((a,b) => a.stepNumber - b.stepNumber).map((step, index) => (
            <AccordionItem key={step.id} value={step.id} className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm data-[state=open]:border-primary/20 transition-colors">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/20">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{step.title}</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-0.5">Using: {step.toolUsed}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="pl-12 space-y-6">
                  <p className="text-base text-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {step.promptText && (
                    <div className="bg-secondary/50 rounded-xl p-5 border border-border/50 relative group">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => copyToClipboard(step.promptText!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Prompt Template</p>
                      <pre className="font-mono text-sm whitespace-pre-wrap text-primary leading-relaxed">
                        {step.promptText}
                      </pre>
                    </div>
                  )}

                  <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">Expected Output</p>
                    <p className="text-sm text-emerald-900 leading-relaxed">
                      {step.expectedOutput}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Playbook?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the playbook and all its steps.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
