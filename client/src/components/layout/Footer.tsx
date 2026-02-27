import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-5 w-5" />
          <span className="font-semibold text-foreground">PlaybookAI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} PlaybookAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
