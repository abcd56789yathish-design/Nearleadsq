import { SearchForm } from "@/components/search-form";

export default function SearchPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">New Search</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Search a location and category to build a fresh lead list.
      </p>
      <SearchForm />
    </div>
  );
}
