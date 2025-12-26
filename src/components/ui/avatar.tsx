'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const avatarVariants = cva(
    'relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-transparent transition-all duration-300 hover:ring-primary/20 hover:scale-105',
    {
        variants: {
            size: {
                xs: 'h-6 w-6 text-[0.6rem]',
                sm: 'h-8 w-8 text-xs',
                default: 'h-10 w-10 text-sm',
                lg: 'h-12 w-12 text-base',
                xl: 'h-16 w-16 text-lg',
                '2xl': 'h-24 w-24 text-xl',
            },
            shape: {
                circle: 'rounded-full',
                square: 'rounded-md',
            },
        },
        defaultVariants: {
            size: 'default',
            shape: 'circle',
        },
    }
);

interface AvatarProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
    status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    AvatarProps
>(({ className, size, shape, status, ...props }, ref) => (
    <div className="relative inline-block">
        <AvatarPrimitive.Root
            ref={ref}
            className={cn(avatarVariants({ size, shape }), className)}
            {...props}
        />
        {status && (
            <span className={cn(
                "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
                size === 'xs' || size === 'sm' ? "h-2 w-2" : "h-3 w-3",
                status === 'online' && "bg-green-500",
                status === 'offline' && "bg-slate-400",
                status === 'busy' && "bg-red-500",
                status === 'away' && "bg-yellow-500",
            )} />
        )}
    </div>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn('aspect-square h-full w-full object-cover', className)}
        {...props}
    />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-muted',
            className
        )}
        {...props}
    />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
