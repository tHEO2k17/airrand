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
    <div className="pos-page">
      <header className="pos-page__header">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </div>
  );
}
