"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";

interface HealthScoreCardProps {
  score: number;
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Animal Health Score
        </CardTitle>
        <CardDescription>
          Overall health status based on recent records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold" style={{ color: getScoreColor(score) }}>
              {score}
            </span>
            <span className={`text-lg font-medium ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </span>
          </div>
          <Progress value={score} className="h-3" />
          <p className="text-sm text-muted-foreground">
            Based on vaccinations, checkups, treatments, and disease records from the last 30 days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

