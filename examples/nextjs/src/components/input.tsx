import { cn } from '@/lib/utils';

export const Input = ({ className, type, ...props }: React.ComponentProps<'input'>) => (
  <input
    type={type}
    className={cn(
      'flex w-full rounded-md border border-primary text-primary bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      className,
    )}
    {...props}
  />
);
