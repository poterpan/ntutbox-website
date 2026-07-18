export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-[13px] font-semibold tracking-wide text-[var(--accent-ink)]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">{title}</h2>
      {description && (
        <p className="mt-3 text-base leading-7 text-[var(--ink-soft)]">{description}</p>
      )}
    </div>
  );
}
