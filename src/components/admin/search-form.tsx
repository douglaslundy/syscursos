type SearchFormProps = {
  query?: string;
};

export function SearchForm({ query }: SearchFormProps) {
  return (
    <form className="mb-4 flex max-w-md gap-2">
      <input
        className="h-10 flex-1 rounded-md border px-3 text-sm outline-none"
        defaultValue={query}
        name="query"
        placeholder="Buscar"
      />
      <button
        className="rounded-md bg-brand-primary px-4 text-sm text-copy-primary transition hover:bg-brand-primaryHover"
        type="submit"
      >
        Buscar
      </button>
    </form>
  );
}
