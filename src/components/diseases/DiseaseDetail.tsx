"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Shield, 
  Syringe, 
  Thermometer,
  Users,
  Activity,
  Clock,
  TrendingDown,
  Microscope
} from "lucide-react";

interface Disease {
  id: string;
  name: string;
  nameUrdu?: string;
  localName?: string;
  category: string;
  subcategory?: string;
  causativeAgent?: string;
  affectedSpecies: string[];
  symptoms: string[];
  earlySigns?: string[];
  advancedSigns?: string[];
  transmissionMode?: string;
  incubationPeriod?: string;
  mortalityRate?: string;
  morbidityRate?: string;
  zoonotic: boolean;
  peakSeason?: string;
  highRiskRegions?: string[];
  preventiveMeasures?: string[];
  vaccinationAvailable: boolean;
  economicImpactScore: number;
  milkProductionImpact?: string;
  severityDefault: string;
  isNotifiable: boolean;
  treatments?: any[];
  protocols?: any[];
  vaccination_schedules?: any[];
}

interface DiseaseDetailProps {
  disease: Disease;
  onClose: () => void;
}

export function DiseaseDetail({ disease, onClose }: DiseaseDetailProps) {
  const severityColors = {
    mild: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    severe: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const impactStars = Array.from({ length: 5 }, (_, i) => i < disease.economicImpactScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{disease.name}</h2>
            {(disease.nameUrdu || disease.localName) && (
              <p className="text-lg text-gray-600">
                {disease.nameUrdu || disease.localName}
              </p>
            )}
          </div>
          <Badge className={severityColors[disease.severityDefault as keyof typeof severityColors]}>
            {disease.severityDefault}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {disease.category}
          </Badge>
          {disease.vaccinationAvailable && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Syringe className="h-3 w-3" />
              Vaccine Available
            </Badge>
          )}
          {disease.zoonotic && (
            <Badge variant="destructive">Zoonotic</Badge>
          )}
          {disease.isNotifiable && (
            <Badge variant="destructive">Notifiable Disease</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="transmission">Transmission</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Microscope className="h-5 w-5" />
                  Disease Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {disease.causativeAgent && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Causative Agent</p>
                    <p>{disease.causativeAgent}</p>
                  </div>
                )}
                {disease.subcategory && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subcategory</p>
                    <p className="capitalize">{disease.subcategory}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Affected Species</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {disease.affectedSpecies.map((spec) => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Impact & Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Economic Impact</p>
                  <div className="flex items-center gap-1 mt-1">
                    {impactStars.map((_, i) => (
                      <span key={i} className={i < disease.economicImpactScore ? "text-yellow-500" : "text-gray-300"}>
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm">({disease.economicImpactScore}/5)</span>
                  </div>
                </div>
                {disease.milkProductionImpact && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Milk Production Impact</p>
                    <p>{disease.milkProductionImpact}</p>
                  </div>
                )}
                {disease.mortalityRate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mortality Rate</p>
                    <p>{disease.mortalityRate}</p>
                  </div>
                )}
                {disease.morbidityRate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Morbidity Rate</p>
                    <p>{disease.morbidityRate}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {disease.zoonotic && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Zoonotic Disease</AlertTitle>
              <AlertDescription className="text-red-700">
                This disease can be transmitted from animals to humans. Take appropriate precautions when handling infected animals.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Symptoms Tab */}
        <TabsContent value="symptoms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {disease.earlySigns && disease.earlySigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Early Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {disease.earlySigns.map((sign, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span className="text-sm">{sign}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Main Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {disease.symptoms.map((symptom, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-sm">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {disease.advancedSigns && disease.advancedSigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Advanced Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {disease.advancedSigns.map((sign, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span className="text-sm">{sign}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Transmission Tab */}
        <TabsContent value="transmission" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transmission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {disease.transmissionMode && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mode of Transmission</p>
                    <p>{disease.transmissionMode}</p>
                  </div>
                )}
                {disease.incubationPeriod && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Incubation Period</p>
                    <p>{disease.incubationPeriod}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Geographic & Seasonal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {disease.peakSeason && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Peak Season</p>
                    <p>{disease.peakSeason}</p>
                  </div>
                )}
                {disease.highRiskRegions && disease.highRiskRegions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">High Risk Regions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {disease.highRiskRegions.map((region) => (
                        <Badge key={region} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment" className="space-y-4">
          <div className="space-y-4">
            {disease.treatments && disease.treatments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Medicines</CardTitle>
                  <CardDescription>
                    Medicines commonly used for treatment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {disease.treatments.map((treatment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{treatment.medicine?.name}</p>
                          <p className="text-sm text-gray-500">{treatment.recommended_dosage}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={treatment.is_primary_treatment ? "default" : "secondary"}>
                            {treatment.is_primary_treatment ? "Primary" : "Secondary"}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            Rating: {treatment.effectiveness_rating}/5
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {disease.protocols && disease.protocols.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Treatment Protocols
                  </CardTitle>
                  <CardDescription>
                    Standard treatment guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disease.protocols.map((protocol, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{protocol.name}</h4>
                          <Badge variant="outline">{protocol.protocol_type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{protocol.severity_level}</p>
                        <p className="text-sm text-gray-500">
                          Success rate: {protocol.success_rate} | 
                          Recovery: {protocol.expected_recovery_days} days
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Prevention Tab */}
        <TabsContent value="prevention" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disease.preventiveMeasures && disease.preventiveMeasures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Preventive Measures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {disease.preventiveMeasures.map((measure, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-sm">{measure}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {disease.vaccination_schedules && disease.vaccination_schedules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Vaccination Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {disease.vaccination_schedules.map((schedule, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{schedule.species}</span>
                          <Badge variant={schedule.priority === 'essential' ? 'default' : 'secondary'}>
                            {schedule.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Age: {schedule.animal_age_start_label} | 
                          Route: {schedule.route} | 
                          Dose: {schedule.dosage}
                        </p>
                        {schedule.recommended_months && (
                          <p className="text-sm text-gray-500">
                            Months: {schedule.recommended_months.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {disease.isNotifiable && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Notifiable Disease</AlertTitle>
              <AlertDescription className="text-amber-700">
                This disease must be reported to the veterinary authorities. Contact your local veterinary department immediately upon suspicion.
              </AlertDescription>
            </Alert>
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
          View Treatment Options
        </Button>
      </div>
    </div>
  );
}
