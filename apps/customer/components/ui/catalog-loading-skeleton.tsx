export function CatalogLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="store-skeleton-grid" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="store-skeleton-card">
          <div className="store-skeleton store-skeleton--icon" />
          <div className="store-skeleton store-skeleton--title" />
          <div className="store-skeleton store-skeleton--text" />
          <div className="store-skeleton store-skeleton--price" />
          <div className="store-skeleton store-skeleton--button" />
        </div>
      ))}
    </div>
  );
}
