import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import { usePlaybooks } from "@/hooks/use-playbooks";
import PlaybookCard from "@/components/PlaybookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeo } from "@/hooks/use-seo";

export default function Home() {
  useSeo({
    title: "PlaybookAI | AI Workflow Playbooks & Prompt Guides",
    description:
      "Discover proven AI workflows and prompt playbooks for writing, coding, design, marketing, and more.",
    canonicalPath: "/",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "PlaybookAI",
      url: window.location.origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${window.location.origin}/explore?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });

  const { data: playbooks, isLoading } = usePlaybooks({ sort: 'highest_rated' });

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] animate-in-fade">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-medium mb-8 border border-primary/10">
            <Sparkles className="w-4 h-4" />
            <span>The premier library for AI workflows</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
            Master GenAI with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Expert Playbooks
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover, share, and execute step-by-step AI workflows. Stop writing prompts from scratch and start using proven processes from top engineers.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/explore">
              <Button size="lg" className="h-14 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                Explore Playbooks
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/create">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-full bg-white/50 backdrop-blur-sm border-border hover:bg-white hover:shadow-md transition-all">
                Share a Workflow
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-secondary/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to use</h3>
              <p className="text-muted-foreground">Every step is documented with exact tools and prompts needed to get the result.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community Vetted</h3>
              <p className="text-muted-foreground">Highest quality playbooks bubble to the top through our community rating system.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Cross-Tool Workflows</h3>
              <p className="text-muted-foreground">Combine ChatGPT, Midjourney, Cursor, and more into single coherent pipelines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Trending Playbooks</h2>
            <p className="text-muted-foreground">The most highly rated AI workflows this week.</p>
          </div>
          <Link href="/explore">
            <Button variant="ghost" className="hidden sm:flex group font-medium">
              View all <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[280px] bg-secondary/50 animate-pulse rounded-2xl border border-border/50" />
            ))
          ) : (
            playbooks?.slice(0, 3).map((playbook) => (
              <PlaybookCard key={playbook.id} playbook={playbook} />
            ))
          )}
        </div>
        
        <div className="mt-8 text-center sm:hidden">
          <Link href="/explore">
            <Button variant="outline" className="w-full">View all playbooks</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
