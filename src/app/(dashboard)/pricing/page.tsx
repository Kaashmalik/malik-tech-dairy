"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import type { SubscriptionPlan } from "@/types";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const { isSignedIn } = useAuth();

  const plans: SubscriptionPlan[] = ["free", "professional", "farm", "enterprise"];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
        {plans.map((plan) => {
          const planDetails = SUBSCRIPTION_PLANS[plan];
          const isEnterprise = plan === "enterprise";
          const isFree = plan === "free";

          return (
            <Card
              key={plan}
              className={`relative ${plan === "professional" ? "border-primary border-2 scale-105" : ""}`}
            >
              {plan === "professional" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{planDetails.name}</CardTitle>
                <CardDescription>
                  {isEnterprise ? (
                    <span className="text-3xl font-bold">Custom Pricing</span>
                  ) : isFree ? (
                    <span className="text-3xl font-bold">₨0</span>
                  ) : (
                    <span>
                      <span className="text-3xl font-bold">₨{planDetails.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">/month</span>
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      {planDetails.maxAnimals === -1
                        ? "Unlimited"
                        : `Up to ${planDetails.maxAnimals}`}{" "}
                      Animals
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      {planDetails.maxUsers === -1
                        ? "Unlimited"
                        : `${planDetails.maxUsers}`}{" "}
                      Users
                    </span>
                  </li>
                  {planDetails.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="capitalize">{feature.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                  {!isFree && !isEnterprise && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Add-on: ₨100 per 10 animals above tier limit</span>
                    </li>
                  )}
                </ul>
                {isEnterprise ? (
                  <Link href="/contact?plan=enterprise">
                    <Button className="w-full" variant="outline">
                      Contact Sales
                    </Button>
                  </Link>
                ) : isFree ? (
                  <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                    <Button className="w-full" variant="outline">
                      Get Started Free
                    </Button>
                  </Link>
                ) : (
                  <Link href={isSignedIn ? `/dashboard/subscription/checkout?plan=${plan}` : `/sign-up?plan=${plan}`}>
                    <Button className="w-full">
                      {isSignedIn ? "Upgrade Now" : "Start Free Trial"}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Payment Methods</h2>
        <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">JazzCash</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Most popular in Pakistan. Direct API integration with instant settlement.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">EasyPaisa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mobile-first payments. Backup gateway for maximum coverage.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bank Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                For enterprise customers. Annual contracts with manual verification.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

