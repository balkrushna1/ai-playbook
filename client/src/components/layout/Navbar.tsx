import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Search, Plus, BookOpen, LogOut, User as UserIcon } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">PlaybookAI</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search playbooks..." 
              onClick={() => setLocation('/explore')}
              className="h-10 w-64 rounded-full border border-border/50 bg-secondary/50 px-9 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/create" className="hidden sm:flex">
                    <Button variant="outline" size="sm" className="rounded-full shadow-sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-transparent focus-visible:ring-primary transition-all">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="flex items-center gap-2 p-2 mb-1">
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-sm font-medium leading-none">{user.username}</p>
                          <p className="text-xs text-muted-foreground leading-none">Logged in</p>
                        </div>
                      </div>
                      <DropdownMenuItem onClick={() => setLocation('/create')} className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>New Playbook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setAuthModalOpen(true)} className="rounded-full font-medium">
                    Log in
                  </Button>
                  <Button onClick={() => setAuthModalOpen(true)} className="rounded-full shadow-md font-medium shadow-primary/20">
                    Sign up
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}
