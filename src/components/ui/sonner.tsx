'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                    success: 'group-[.toaster]:border-green-500/20 group-[.toaster]:bg-green-500/5',
                    error: 'group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-500/5',
                    info: 'group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-500/5',
                    warning: 'group-[.toaster]:border-yellow-500/20 group-[.toaster]:bg-yellow-500/5',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
