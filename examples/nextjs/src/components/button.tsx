import { cn } from '@/lib/utils';

export function Button({ children, onClick, disabled, className }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        'border border-primary text-primary shadow-sm bg-transparent hover:bg-primary/10',
        'h-9 px-4 py-2',
        className,
      )}
      onClick={onClick}
      disabled={disabled}>
      {children}
    </button>
  );
}
