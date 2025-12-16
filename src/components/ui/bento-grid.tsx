import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

const bentoGridVariants = tv({
  base: 'mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3',
});

export interface BentoGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bentoGridVariants> {
  children?: React.ReactNode;
  'aria-label'?: string;
}

export const BentoGrid = ({
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: BentoGridProps) => {
  return (
    <div
      className={cn(bentoGridVariants(), className)}
      role="grid"
      aria-label={ariaLabel || 'Bento grid layout'}
      {...props}
    >
      {children}
    </div>
  );
};

const bentoGridItemVariants = tv({
  base: 'group/bento shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  variants: {
    interactive: {
      true: 'cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    interactive: false,
  },
});

export interface BentoGridItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof bentoGridItemVariants> {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  interactive,
  ...props
}: BentoGridItemProps) => {
  return (
    <div
      className={cn(bentoGridItemVariants({ interactive }), className)}
      role="gridcell"
      aria-label={typeof title === 'string' ? title : undefined}
      {...props}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon && <div aria-hidden="true">{icon}</div>}
        {title && (
          <div className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
            {title}
          </div>
        )}
        {description && (
          <div className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};
