import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchesGrid } from "@/components/searches-grid";

export default function SearchesPage() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Searches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your search results in one place. Each search is its own collection of leads.
          </p>
        </div>
        <Link href="/search">
          <Button>
            <Plus />
            New search
          </Button>
        </Link>
      </div>
      <div className="mt-6">
        <SearchesGrid />
      </div>
    </div>
  );
}
