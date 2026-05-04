type SearchFormProps = {
  query?: string;
};

export function SearchForm({ query }: SearchFormProps) {
  return (
    <form className="mb-4 flex max-w-md gap-2">
      <input
        className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
        defaultValue={query}
        name="query"
        placeholder="Buscar"
      />
      <button className="rounded-md bg-primary px-4 text-sm text-primary-foreground" type="submit">
        Buscar
      </button>
    </form>
  );
}
