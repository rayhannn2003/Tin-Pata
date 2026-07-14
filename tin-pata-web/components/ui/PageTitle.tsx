interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <header className="mb-8 flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
      </h1>
      {description ? <p className="text-base text-muted">{description}</p> : null}
    </header>
  );
}
