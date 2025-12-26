"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Pill, 
  Package, 
  Shield, 
  Clock, 
  AlertTriangle, 
  Thermometer,
  DollarSign,
  Star,
  Info,
  Syringe,
  Baby,
  Milk,
  Steak
} from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  manufacturer?: string;
  category: string;
  form: string;
  route: string;
  strength?: string;
  dosagePerKg?: string;
  dosageInstructions?: string;
  frequency?: string;
  durationDays?: number;
  speciesDosage?: any;
  withdrawalPeriodMilk?: number;
  withdrawalPeriodMeat?: number;
  contraindications?: string[];
  sideEffects?: string[];
  drugInteractions?: string[];
  pregnancySafe?: boolean;
  lactationSafe?: boolean;
  storageConditions?: string;
  shelfLifeMonths?: number;
  availableInPakistan: boolean;
  prescriptionRequired: boolean;
  priceRangePkr?: string;
  packSizes?: string[];
  effectivenessRating: number;
  popularityScore: number;
  isActive: boolean;
  notes?: string;
  inventory?: any[];
  treats_diseases?: any[];
}

interface MedicineDetailProps {
  medicine: Medicine;
  onClose: () => void;
}

export function MedicineDetail({ medicine, onClose }: MedicineDetailProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getSafetyIcon = (safe?: boolean) => {
    if (safe === true) {
      return <Shield className="h-4 w-4 text-green-500" />;
    } else if (safe === false) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <Info className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{medicine.name}</h2>
            {medicine.genericName && (
              <p className="text-lg text-gray-600">Generic: {medicine.genericName}</p>
            )}
            {medicine.brandName && (
              <p className="text-sm text-gray-500">Brand: {medicine.brandName}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {medicine.prescriptionRequired && (
              <Badge variant="destructive">Prescription Required</Badge>
            )}
            <Badge variant={medicine.availableInPakistan ? "default" : "secondary"}>
              {medicine.availableInPakistan ? "Available in Pakistan" : "Not Available"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {medicine.category}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {medicine.form}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {medicine.route}
          </Badge>
          {medicine.strength && (
            <Badge variant="secondary">{medicine.strength}</Badge>
          )}
        </div>
      </div>

      {/* Rating and Popularity */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-500">Effectiveness Rating</p>
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(Math.round(medicine.effectivenessRating))}</div>
              <span className="font-medium">{medicine.effectivenessRating}/5.0</span>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div>
            <p className="text-sm text-gray-500">Popularity</p>
            <p className="font-medium">{medicine.popularityScore}%</p>
          </div>
        </div>
        {medicine.priceRangePkr && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="font-medium">PKR {medicine.priceRangePkr}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dosage">Dosage</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {medicine.manufacturer && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Manufacturer</p>
                    <p>{medicine.manufacturer}</p>
                  </div>
                )}
                {medicine.packSizes && medicine.packSizes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Available Pack Sizes</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {medicine.packSizes.map((size, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {medicine.shelfLifeMonths && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Shelf Life</p>
                    <p>{medicine.shelfLifeMonths} months</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {medicine.dosageInstructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dosage Instructions</p>
                    <p>{medicine.dosageInstructions}</p>
                  </div>
                )}
                {medicine.frequency && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Frequency</p>
                    <p>{medicine.frequency}</p>
                  </div>
                )}
                {medicine.durationDays && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p>{medicine.durationDays} days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {medicine.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{medicine.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dosage Tab */}
        <TabsContent value="dosage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dosage Information</CardTitle>
              <CardDescription>
                Recommended dosage by species
              </CardDescription>
            </CardHeader>
            <CardContent>
              {medicine.dosagePerKg && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">General Dosage</p>
                  <p className="text-lg">{medicine.dosagePerKg}</p>
                </div>
              )}
              
              {medicine.speciesDosage && Object.keys(medicine.speciesDosage).length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Species-Specific Dosage</p>
                  {Object.entries(medicine.speciesDosage).map(([species, dosage]: [string, any]) => (
                    <div key={species} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium capitalize">{species}</span>
                      <div className="text-right">
                        <p className="text-sm">{dosage.dose}</p>
                        <p className="text-xs text-gray-500">{dosage.route}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSafetyIcon(medicine.pregnancySafe)}
                    <span className="text-sm font-medium">Pregnancy Safe</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {medicine.pregnancySafe === true ? "Yes" : medicine.pregnancySafe === false ? "No" : "Unknown"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSafetyIcon(medicine.lactationSafe)}
                    <span className="text-sm font-medium">Lactation Safe</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {medicine.lactationSafe === true ? "Yes" : medicine.lactationSafe === false ? "No" : "Unknown"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Milk className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Milk Withdrawal</span>
                </div>
                <p className="text-sm">
                  {medicine.withdrawalPeriodMilk !== undefined 
                    ? `${medicine.withdrawalPeriodMilk} days` 
                    : "No data available"}
                </p>

                <div className="flex items-center gap-2">
                  <Steak className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Meat Withdrawal</span>
                </div>
                <p className="text-sm">
                  {medicine.withdrawalPeriodMeat !== undefined 
                    ? `${medicine.withdrawalPeriodMeat} days` 
                    : "No data available"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Warnings & Precautions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicine.contraindications && medicine.contraindications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Contraindications</p>
                    <ul className="space-y-1">
                      {medicine.contraindications.map((contra, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{contra}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {medicine.sideEffects && medicine.sideEffects.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Side Effects</p>
                    <ul className="space-y-1">
                      {medicine.sideEffects.map((effect, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {medicine.drugInteractions && medicine.drugInteractions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Drug Interactions</p>
                    <ul className="space-y-1">
                      {medicine.drugInteractions.map((interaction, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>{interaction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Storage Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicine.storageConditions && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Storage Conditions</p>
                  <p>{medicine.storageConditions}</p>
                </div>
              )}
              
              {medicine.shelfLifeMonths && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Shelf Life</p>
                  <p>{medicine.shelfLifeMonths} months from date of manufacture</p>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Storage Tips</AlertTitle>
                <AlertDescription>
                  Always store medicines in their original packaging, away from direct sunlight and out of reach of children.
                  Check expiry dates before use and dispose of expired medicines properly.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {medicine.inventory && medicine.inventory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Stock</CardTitle>
                <CardDescription>
                  Your inventory for this medicine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {medicine.inventory.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Batch: {item.batch_number || "N/A"}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} {item.unit || "units"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Expiry</p>
                        <p className={`text-sm font-medium ${
                          new Date(item.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}>
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Available</h3>
                  <p className="text-gray-500 mb-4">This medicine is not currently in your inventory</p>
                  <Button>Add to Inventory</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {medicine.treats_diseases && medicine.treats_diseases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treats Diseases</CardTitle>
                <CardDescription>
                  Diseases this medicine is used for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {medicine.treats_diseases.map((treatment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{treatment.disease?.name}</span>
                      <Badge variant="outline">
                        {treatment.is_primary_treatment ? "Primary" : "Secondary"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button>
          Add to Inventory
        </Button>
      </div>
    </div>
  );
}
