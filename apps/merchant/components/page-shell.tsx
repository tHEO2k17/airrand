export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-shell">
      <header className="page-header">
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
