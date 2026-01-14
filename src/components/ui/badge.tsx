import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-orange-500 text-white",
        info: "border-transparent bg-blue-500 text-white",
        muted: "border-transparent bg-muted text-muted-foreground",
        gradient: "border-transparent bg-gradient-to-r from-primary to-secondary text-white",
        urgencyHigh: "border-transparent bg-red-100 text-red-700 font-bold",
        urgencyMedium: "border-transparent bg-orange-100 text-orange-700 font-bold",
        urgencyLow: "border-transparent bg-green-100 text-green-700 font-bold",
        count: "border-transparent bg-muted text-muted-foreground min-w-[1.5rem] justify-center",
        new: "border-transparent bg-blue-100 text-blue-700",
        contacted: "border-transparent bg-orange-100 text-orange-700",
        qualified: "border-transparent bg-green-100 text-green-700",
        converted: "border-transparent bg-primary/10 text-primary",
        gradientCTA: "border-transparent bg-gradient-to-r from-orange-500 to-orange-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
