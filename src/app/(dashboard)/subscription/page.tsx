"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/subscription/PricingCard";
import { UsageLimits } from "@/components/subscription/UsageLimits";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { usePostHogAnalytics } from "@/hooks/usePostHog";
import type { SubscriptionPlan } from "@/types";

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const { trackSubscriptionUpgrade } = usePostHogAnalytics();
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Track subscription upgrade on success
  useEffect(() => {
    const success = searchParams?.get("success");
    if (success === "true" && subscription) {
      // Get previous plan from localStorage or default to free
      const previousPlan = localStorage.getItem("previous_plan") || "free";
      trackSubscriptionUpgrade({
        fromPlan: previousPlan,
        toPlan: subscription.plan,
        amount: subscription.amount,
        gateway: subscription.gateway,
      });
      localStorage.removeItem("previous_plan");
    }
  }, [searchParams, subscription, trackSubscriptionUpgrade]);

  if (isLoading) {
    return <div className="text-center py-8">Loading subscription...</div>;
  }

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              {subscription.status === "active"
                ? "Your subscription is active"
                : subscription.status === "trial"
                ? "You're on a free trial"
                : "Subscription inactive"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Plan
                </label>
                <p className="text-lg font-semibold capitalize">
                  {SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan].name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <p className="text-lg font-semibold capitalize">
                  {subscription.status}
                </p>
              </div>
              {subscription.renewDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Renewal Date
                  </label>
                  <p className="text-lg">
                    {format(new Date(subscription.renewDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Amount
                </label>
                <p className="text-lg">
                  PKR {subscription.amount?.toLocaleString() || "0"}/month
                </p>
              </div>
            </div>
            {currentPlan !== "free" && (
              <div className="mt-4 flex gap-2">
                <Link href="/dashboard/subscription/checkout?plan=professional">
                  <Button variant="outline">Upgrade</Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to cancel your subscription? You'll be downgraded to the free plan."
                      )
                    ) {
                      const res = await fetch("/api/subscription", {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        window.location.reload();
                      }
                    }
                  }}
                >
                  Cancel Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Limits */}
      <UsageLimits />

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.keys(SUBSCRIPTION_PLANS).map((plan) => (
            <PricingCard
              key={plan}
              plan={plan as SubscriptionPlan}
              currentPlan={currentPlan as SubscriptionPlan}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

