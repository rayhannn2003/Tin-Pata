interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {description ? <p className="max-w-2xl text-sm text-muted md:text-base">{description}</p> : null}
    </header>
  );
}
