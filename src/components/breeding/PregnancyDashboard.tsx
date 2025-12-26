'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Baby,
    Calendar,
    AlertTriangle,
    Clock,
    Stethoscope,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { PregnancyCheckForm } from './PregnancyCheckForm';
import { motion, AnimatePresence } from 'framer-motion';

interface PregnantAnimal {
    id: string;
    animal: {
        id: string;
        tag: string;
        name: string;
        species: string;
        breed: string;
        photoUrl?: string;
    } | null;
    breedingRecord: {
        id: string;
        breedingDate: string;
        breedingMethod: string;
        expectedDueDate: string;
        gestationDays: number;
        pregnancyConfirmed: boolean;
        pregnancyConfirmedDate?: string;
        status: string;
        sireId?: string;
        semenSource?: string;
    };
    daysRemaining: number;
    daysRemainingFormatted: string;
    progressPercent: number;
    isOverdue: boolean;
    needsCheck: boolean;
    nextCheckDue?: string;
    recommendedCheckMethod?: string;
}

interface PregnancyDashboardData {
    summary: {
        totalPregnant: number;
        confirmedPregnant: number;
        awaitingConfirmation: number;
        overdueCount: number;
        dueThisWeekCount: number;
        dueThisMonthCount: number;
        needsCheckCount: number;
        countBySpecies: Record<string, number>;
    };
    pregnantAnimals: PregnantAnimal[];
    overdue: PregnantAnimal[];
    dueThisWeek: PregnantAnimal[];
    dueThisMonth: PregnantAnimal[];
    needsCheck: PregnantAnimal[];
    upcomingBirths: PregnantAnimal[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

export function PregnancyDashboard() {
    const [selectedAnimal, setSelectedAnimal] = useState<PregnantAnimal | null>(null);
    const [showCheckForm, setShowCheckForm] = useState(false);

    const { data, isLoading, error, refetch } = useQuery<{ data: PregnancyDashboardData }>({
        queryKey: ['pregnant-animals'],
        queryFn: async () => {
            const res = await fetch('/api/breeding/pregnant-animals');
            if (!res.ok) throw new Error('Failed to fetch pregnant animals');
            return res.json();
        },
        refetchInterval: 60000, // Auto-refresh every minute
    });

    const dashboardData = data?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 dark:border-red-800">
                <CardContent className="pt-6 text-center text-red-600">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p>Failed to load pregnancy dashboard</p>
                    <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!dashboardData) {
        return null;
    }

    const { summary, overdue, dueThisWeek, needsCheck, upcomingBirths, pregnantAnimals } = dashboardData;

    const AnimalCard = ({ animal, showCheckButton = false }: { animal: PregnantAnimal; showCheckButton?: boolean }) => (
        <motion.div variants={itemVariants} layout>
            <Card
                className={`transition-all hover:shadow-md h-full ${animal.isOverdue
                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                    : animal.needsCheck
                        ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10'
                        : 'border-green-200 dark:border-green-800'
                    }`}
            >
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                    {animal.animal?.name || animal.animal?.tag || 'Unknown'}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                    {animal.animal?.species}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                                {animal.animal?.breed || 'Unknown breed'}
                            </p>

                            {/* Progress bar */}
                            <div className="space-y-1 mb-3">
                                <Progress
                                    value={animal.progressPercent}
                                    className={`h-2 ${animal.isOverdue
                                        ? '[&>div]:bg-red-500'
                                        : animal.progressPercent > 90
                                            ? '[&>div]:bg-orange-500'
                                            : '[&>div]:bg-green-500'
                                        }`}
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{animal.progressPercent}%</span>
                                    <span
                                        className={`font-medium ${animal.isOverdue ? 'text-red-600' : 'text-green-600'
                                            }`}
                                    >
                                        {animal.daysRemainingFormatted}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Bred:</span>{' '}
                                    {format(new Date(animal.breedingRecord.breedingDate), 'MMM d, yyyy')}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Due:</span>{' '}
                                    {format(new Date(animal.breedingRecord.expectedDueDate), 'MMM d, yyyy')}
                                </div>
                            </div>

                            {/* Status badges */}
                            <div className="flex gap-2 mt-3">
                                {animal.breedingRecord.pregnancyConfirmed ? (
                                    <Badge className="bg-green-500 text-white text-xs">
                                        Confirmed
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                        Confirm?
                                    </Badge>
                                )}
                                {animal.needsCheck && (
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                        Check Due
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {showCheckButton && !animal.breedingRecord.pregnancyConfirmed && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="ml-2"
                                onClick={() => {
                                    setSelectedAnimal(animal);
                                    setShowCheckForm(true);
                                }}
                            >
                                <Stethoscope className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
        >
            {/* Pregnancy Check Form Modal */}
            <AnimatePresence>
                {showCheckForm && selectedAnimal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        >
                            <PregnancyCheckForm
                                breedingRecordId={selectedAnimal.breedingRecord.id}
                                animalId={selectedAnimal.animal?.id || ''}
                                animalName={selectedAnimal.animal?.name || selectedAnimal.animal?.tag || 'Unknown'}
                                recommendedMethod={selectedAnimal.recommendedCheckMethod as any}
                                onClose={() => {
                                    setShowCheckForm(false);
                                    setSelectedAnimal(null);
                                }}
                                onSuccess={() => {
                                    setShowCheckForm(false);
                                    setSelectedAnimal(null);
                                    refetch();
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:scale-[1.02] transition-transform">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">{summary.totalPregnant}</p>
                                    <p className="text-sm text-green-100">Total Pregnant</p>
                                </div>
                                <Baby className="h-10 w-10 text-green-200 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className={`${summary.overdueCount > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' : ''} hover:scale-[1.02] transition-transform`}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-3xl font-bold ${summary.overdueCount > 0 ? '' : 'text-red-600'}`}>
                                        {summary.overdueCount}
                                    </p>
                                    <p className={`text-sm ${summary.overdueCount > 0 ? 'text-red-100' : 'text-muted-foreground'}`}>
                                        Overdue
                                    </p>
                                </div>
                                <AlertTriangle className={`h-10 w-10 ${summary.overdueCount > 0 ? 'text-red-200' : 'text-red-300'} opacity-80`} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className={`${summary.dueThisWeekCount > 0 ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white' : ''} hover:scale-[1.02] transition-transform`}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-3xl font-bold ${summary.dueThisWeekCount > 0 ? '' : 'text-orange-600'}`}>
                                        {summary.dueThisWeekCount}
                                    </p>
                                    <p className={`text-sm ${summary.dueThisWeekCount > 0 ? 'text-orange-100' : 'text-muted-foreground'}`}>
                                        Due This Week
                                    </p>
                                </div>
                                <Clock className={`h-10 w-10 ${summary.dueThisWeekCount > 0 ? 'text-orange-200' : 'text-orange-300'} opacity-80`} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className={`${summary.needsCheckCount > 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : ''} hover:scale-[1.02] transition-transform`}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-3xl font-bold ${summary.needsCheckCount > 0 ? '' : 'text-blue-600'}`}>
                                        {summary.needsCheckCount}
                                    </p>
                                    <p className={`text-sm ${summary.needsCheckCount > 0 ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                        Need Check
                                    </p>
                                </div>
                                <Stethoscope className={`h-10 w-10 ${summary.needsCheckCount > 0 ? 'text-blue-200' : 'text-blue-300'} opacity-80`} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Species breakdown */}
            {Object.keys(summary.countBySpecies).length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Pregnant by Species</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(summary.countBySpecies).map(([species, count]) => (
                                    <Badge key={species} variant="secondary" className="text-sm">
                                        {species}: {count}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Pregnant ({summary.totalPregnant})</TabsTrigger>
                    <TabsTrigger value="needs-check" className="relative">
                        Needs Check
                        {summary.needsCheckCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                {summary.needsCheckCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="relative">
                        Overdue
                        {summary.overdueCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {summary.overdueCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming Births</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {pregnantAnimals.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-muted-foreground">
                                <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No pregnant animals at this time</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            <AnimatePresence>
                                {pregnantAnimals.map((animal) => (
                                    <AnimalCard key={animal.id} animal={animal} showCheckButton />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="needs-check" className="space-y-4">
                    {needsCheck.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-muted-foreground">
                                <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No animals need pregnancy checks right now</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {needsCheck.map((animal) => (
                                <AnimalCard key={animal.id} animal={animal} showCheckButton />
                            ))}
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="overdue" className="space-y-4">
                    {overdue.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-green-600">
                                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                                <p>No overdue pregnancies - all on schedule! 🎉</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {overdue.map((animal) => (
                                <AnimalCard key={animal.id} animal={animal} />
                            ))}
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Upcoming Births (Next 30 Days)
                            </CardTitle>
                            <CardDescription>
                                Confirmed pregnancies due soon
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingBirths.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No confirmed births expected in the next 30 days
                                </p>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-3"
                                >
                                    {upcomingBirths.map((animal) => (
                                        <motion.div
                                            key={animal.id}
                                            variants={itemVariants}
                                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                    <Baby className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {animal.animal?.name || animal.animal?.tag}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {animal.animal?.species} • {animal.animal?.breed}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">
                                                    {animal.daysRemainingFormatted}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(animal.breedingRecord.expectedDueDate), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
