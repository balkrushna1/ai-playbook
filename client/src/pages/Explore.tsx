import { useState, useEffect } from "react";
import { usePlaybooks } from "@/hooks/use-playbooks";
import PlaybookCard from "@/components/PlaybookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";

export default function Explore() {
  useSeo({
    title: "Explore AI Playbooks | PlaybookAI",
    description:
      "Browse community AI playbooks, filter by category and difficulty, and find step-by-step workflows that deliver results.",
    canonicalPath: "/explore",
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [sort, setSort] = useState<'newest' | 'highest_rated'>('newest');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: playbooks, isLoading } = usePlaybooks({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    sort
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setDifficulty("all");
    setSort("newest");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in-fade">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Explore Playbooks</h1>
          <p className="text-muted-foreground text-lg">Find the perfect AI workflow for your task.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-border/60 shadow-sm mb-10 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search titles, descriptions, tools..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-base rounded-xl bg-secondary/30 focus-visible:bg-white"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[160px] h-12 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Writing">Writing</SelectItem>
              <SelectItem value="Coding">Coding</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Data Analysis">Data Analysis</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-[160px] h-12 rounded-xl">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
              <SelectItem value="Expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-full sm:w-[160px] h-12 rounded-xl">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest_rated">Highest Rated</SelectItem>
            </SelectContent>
          </Select>

          {(search || category !== 'all' || difficulty !== 'all' || sort !== 'newest') && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="h-12 w-12 rounded-xl shrink-0" title="Clear filters">
              <FilterX className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[280px] bg-secondary/50 animate-pulse rounded-2xl border border-border/50" />
          ))}
        </div>
      ) : playbooks?.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-border/50 border-dashed">
          <div className="w-20 h-20 bg-secondary/80 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No playbooks found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We couldn't find any playbooks matching your current filters. Try adjusting your search or create a new playbook.
          </p>
          <Button onClick={clearFilters} variant="outline" className="rounded-full px-8">
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks?.map((playbook) => (
            <PlaybookCard key={playbook.id} playbook={playbook} />
          ))}
        </div>
      )}
    </div>
  );
}
