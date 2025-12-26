"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, BookOpen, Filter, Plus, Search, Syringe, Thermometer, Virus } from "lucide-react";
import { toast } from "sonner";
import { DiseaseDetail } from "./DiseaseDetail";

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
}

interface DiseaseListProps {
  species?: string;
  onTreatmentSelect?: (disease: Disease) => void;
}

export function DiseaseList({ species, onTreatmentSelect }: DiseaseListProps) {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const categories = [
    { value: "infectious", label: "Infectious" },
    { value: "parasitic", label: "Parasitic" },
    { value: "metabolic", label: "Metabolic" },
    { value: "reproductive", label: "Reproductive" },
    { value: "digestive", label: "Digestive" },
    { value: "respiratory", label: "Respiratory" },
    { value: "musculoskeletal", label: "Musculoskeletal" },
    { value: "nutritional", label: "Nutritional" },
  ];

  const severityColors = {
    mild: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    severe: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const categoryIcons = {
    infectious: Virus,
    parasitic: AlertCircle,
    metabolic: Thermometer,
    reproductive: BookOpen,
    digestive: AlertCircle,
    respiratory: AlertCircle,
    musculoskeletal: AlertCircle,
    nutritional: AlertCircle,
  };

  useEffect(() => {
    fetchDiseases();
  }, [species, categoryFilter, searchTerm]);

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (species) params.append("species", species);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/diseases?${params}`);
      const data = await response.json();

      if (data.success) {
        setDiseases(data.data);
      } else {
        toast.error("Failed to fetch diseases");
      }
    } catch (error) {
      console.error("Error fetching diseases:", error);
      toast.error("Error loading diseases");
    } finally {
      setLoading(false);
    }
  };

  const handleDiseaseClick = (disease: Disease) => {
    setSelectedDisease(disease);
    setShowDetail(true);
  };

  const handleTreatment = (disease: Disease) => {
    if (onTreatmentSelect) {
      onTreatmentSelect(disease);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search diseases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Disease Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {diseases.map((disease) => {
          const IconComponent = categoryIcons[disease.category as keyof typeof categoryIcons] || AlertCircle;
          
          return (
            <Card key={disease.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{disease.name}</CardTitle>
                      {(disease.nameUrdu || disease.localName) && (
                        <CardDescription className="text-sm">
                          {disease.nameUrdu || disease.localName}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge className={severityColors[disease.severityDefault as keyof typeof severityColors]}>
                    {disease.severityDefault}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {disease.category}
                    </Badge>
                    {disease.vaccinationAvailable && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Syringe className="h-3 w-3" />
                        Vaccine
                      </Badge>
                    )}
                    {disease.zoonotic && (
                      <Badge variant="destructive">Zoonotic</Badge>
                    )}
                    {disease.isNotifiable && (
                      <Badge variant="destructive">Notifiable</Badge>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Affected Species:</p>
                    <div className="flex flex-wrap gap-1">
                      {disease.affectedSpecies.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {disease.symptoms.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Key Symptoms:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {disease.symptoms.slice(0, 3).join(", ")}
                        {disease.symptoms.length > 3 && "..."}
                      </p>
                    </div>
                  )}

                  {disease.peakSeason && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Peak: {disease.peakSeason}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiseaseClick(disease)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {onTreatmentSelect && (
                      <Button
                        size="sm"
                        onClick={() => handleTreatment(disease)}
                        className="flex-1"
                      >
                        Treat
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {diseases.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No diseases found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Disease Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDisease && (
            <DiseaseDetail disease={selectedDisease} onClose={() => setShowDetail(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
