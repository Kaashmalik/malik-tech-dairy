"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validateSubdomain, sanitizeSubdomain, generateSubdomain } from "@/lib/utils/tenant";
import { DEFAULT_TENANT_CONFIG, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Building2, Palette, DollarSign, Check } from "lucide-react";
import type { AnimalSpecies, SubscriptionPlan } from "@/types";

interface OnboardingData {
  farmName: string;
  subdomain: string;
  primaryColor: string;
  accentColor: string;
  animalTypes: AnimalSpecies[];
  selectedPlan: SubscriptionPlan;
}

const STEPS = [
  { id: 1, title: "Farm Details", icon: Building2 },
  { id: 2, title: "Branding", icon: Palette },
  { id: 3, title: "Animal Types", icon: Check },
  { id: 4, title: "Subscription", icon: DollarSign },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { setActive, isLoaded: orgListLoaded } = useOrganizationList();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const [data, setData] = useState<OnboardingData>({
    farmName: "",
    subdomain: "",
    primaryColor: DEFAULT_TENANT_CONFIG.primaryColor,
    accentColor: DEFAULT_TENANT_CONFIG.accentColor,
    animalTypes: DEFAULT_TENANT_CONFIG.animalTypes as AnimalSpecies[],
    selectedPlan: "free",
  });

  // Check subdomain availability
  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    if (!validateSubdomain(subdomain)) {
      setSubdomainAvailable(false);
      return;
    }

    setIsCheckingSubdomain(true);
    try {
      const res = await fetch(`/api/tenants/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);
      const result = await res.json();
      setSubdomainAvailable(result.available);
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setSubdomainAvailable(false);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  // Handle farm name change and auto-generate subdomain
  const handleFarmNameChange = (farmName: string) => {
    setData((prev) => ({ ...prev, farmName }));
    if (!data.subdomain || data.subdomain === generateSubdomain(data.farmName)) {
      const generated = generateSubdomain(farmName);
      setData((prev) => ({ ...prev, subdomain: generated }));
      if (generated.length >= 3) {
        checkSubdomain(generated);
      }
    }
  };

  // Handle subdomain change
  const handleSubdomainChange = (subdomain: string) => {
    const sanitized = sanitizeSubdomain(subdomain);
    setData((prev) => ({ ...prev, subdomain: sanitized }));
    if (sanitized.length >= 3) {
      checkSubdomain(sanitized);
    } else {
      setSubdomainAvailable(null);
    }
  };

  // Create organization in Clerk
  const createOrganization = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return null;
    }

    try {
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.farmName,
          slug: data.subdomain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const { organizationId } = await response.json();
      return organizationId;
    } catch (error: any) {
      toast.error(error.message || "Failed to create farm");
      return null;
    }
  };

  // Initialize tenant in Firestore
  const initializeTenant = async (orgId: string) => {
    try {
      const response = await fetch("/api/tenants/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: data.subdomain,
          ownerEmail: user?.primaryEmailAddress?.emailAddress || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize tenant");
      }

      return true;
    } catch (error) {
      console.error("Error initializing tenant:", error);
      throw error;
    }
  };

  // Update tenant config
  const updateTenantConfig = async (orgId: string) => {
    try {
      const response = await fetch("/api/tenants/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmName: data.farmName,
          subdomain: data.subdomain,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          animalTypes: data.animalTypes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update config");
      }

      return true;
    } catch (error) {
      console.error("Error updating config:", error);
      throw error;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < STEPS.length) {
      // Validate current step
      if (currentStep === 1) {
        if (!data.farmName.trim()) {
          toast.error("Please enter a farm name");
          return;
        }
        if (!data.subdomain || !validateSubdomain(data.subdomain)) {
          toast.error("Please enter a valid subdomain");
          return;
        }
        if (subdomainAvailable === false) {
          toast.error("This subdomain is not available");
          return;
        }
        if (subdomainAvailable === null && !isCheckingSubdomain) {
          toast.error("Please wait for subdomain validation");
          return;
        }
      }
      if (currentStep === 3) {
        if (data.animalTypes.length === 0) {
          toast.error("Please select at least one animal type");
          return;
        }
      }

      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Step 1: Create organization in Clerk
      const orgId = await createOrganization();
      if (!orgId) {
        throw new Error("Failed to create organization");
      }

      // Step 2: Set active organization
      if (setActive) {
        await setActive({ organization: orgId });
      }

      // Step 3: Initialize tenant in Firestore (if not already done by webhook)
      await initializeTenant(orgId);

      // Step 4: Update tenant config with branding and animal types
      await updateTenantConfig(orgId);

      // Step 5: If paid plan selected, redirect to checkout
      if (data.selectedPlan !== "free") {
        toast.success("Farm created! Redirecting to payment...");
        router.push(`/dashboard/subscription/checkout?plan=${data.selectedPlan}`);
      } else {
        toast.success("Farm setup complete!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(error.message || "Failed to complete setup. Please try again.");
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-3xl">Welcome to MTK Dairy</CardTitle>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs value={currentStep.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <TabsTrigger
                      key={step.id}
                      value={step.id.toString()}
                      disabled={step.id > currentStep}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{step.title}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Step 1: Farm Details */}
              <TabsContent value="1" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Farm Information</h3>
                  <p className="text-muted-foreground mb-6">
                    Let's start by setting up your farm details.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="farmName">Farm Name *</Label>
                    <Input
                      id="farmName"
                      value={data.farmName}
                      onChange={(e) => handleFarmNameChange(e.target.value)}
                      placeholder="e.g., Green Valley Dairy"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subdomain">Subdomain *</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="subdomain"
                        value={data.subdomain}
                        onChange={(e) => handleSubdomainChange(e.target.value)}
                        placeholder="greenvalley"
                        className="flex-1"
                      />
                      <span className="text-muted-foreground whitespace-nowrap">
                        .maliktechdairy.com
                      </span>
                      {isCheckingSubdomain && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {subdomainAvailable === true && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {subdomainAvailable === false && (
                        <span className="text-red-500 text-sm">Not available</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your farm's unique URL. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Step 2: Branding */}
              <TabsContent value="2" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Customize Your Brand</h3>
                  <p className="text-muted-foreground mb-6">
                    Choose colors that represent your farm. You can change these later.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={data.primaryColor}
                        onChange={(e) => setData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={data.primaryColor}
                        onChange={(e) => setData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#1F7A3D"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="accentColor"
                        type="color"
                        value={data.accentColor}
                        onChange={(e) => setData((prev) => ({ ...prev, accentColor: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={data.accentColor}
                        onChange={(e) => setData((prev) => ({ ...prev, accentColor: e.target.value }))}
                        placeholder="#F59E0B"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div
                      className="h-20 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: data.primaryColor }}
                    >
                      {data.farmName || "Your Farm Name"}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Step 3: Animal Types */}
              <TabsContent value="3" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Select Animal Types</h3>
                  <p className="text-muted-foreground mb-6">
                    Which animals will you be managing? You can add more later.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(["cow", "buffalo", "chicken", "goat", "sheep", "horse"] as AnimalSpecies[]).map(
                    (species) => (
                      <button
                        key={species}
                        type="button"
                        onClick={() => {
                          setData((prev) => ({
                            ...prev,
                            animalTypes: prev.animalTypes.includes(species)
                              ? prev.animalTypes.filter((t) => t !== species)
                              : [...prev.animalTypes, species],
                          }));
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          data.animalTypes.includes(species)
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              data.animalTypes.includes(species)
                                ? "border-primary bg-primary"
                                : "border-muted"
                            }`}
                          >
                            {data.animalTypes.includes(species) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium capitalize">{species}</span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </TabsContent>

              {/* Step 4: Subscription */}
              <TabsContent value="4" className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Choose Your Plan</h3>
                  <p className="text-muted-foreground mb-6">
                    Start with a free plan and upgrade anytime. 14-day free trial included.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, selectedPlan: planKey as SubscriptionPlan }))}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        data.selectedPlan === planKey
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold text-lg mb-1">{plan.name}</div>
                      <div className="text-2xl font-bold mb-2">
                        PKR {plan.price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </div>
                      <ul className="text-sm space-y-1 mt-3">
                        <li>• Up to {plan.maxAnimals === -1 ? "Unlimited" : plan.maxAnimals} animals</li>
                        <li>• {plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers} users</li>
                        <li>• {plan.features.length} features</li>
                      </ul>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isSubmitting}
              >
                Previous
              </Button>
              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

