"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  Filter, 
  Plus, 
  Search, 
  Pill, 
  Syringe, 
  Shield, 
  Clock,
  Package,
  Star,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { MedicineDetail } from "./MedicineDetail";

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
  withdrawalPeriodMilk?: number;
  withdrawalPeriodMeat?: number;
  pregnancySafe?: boolean;
  lactationSafe?: boolean;
  availableInPakistan: boolean;
  prescriptionRequired: boolean;
  priceRangePkr?: string;
  packSizes?: string[];
  effectivenessRating: number;
  popularityScore: number;
  isActive: boolean;
  notes?: string;
}

interface MedicineListProps {
  category?: string;
  onInventoryUpdate?: (medicine: Medicine) => void;
}

export function MedicineList({ category, onInventoryUpdate }: MedicineListProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(category || "all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const categories = [
    { value: "antibiotic", label: "Antibiotics" },
    { value: "anti_inflammatory", label: "Anti-inflammatory" },
    { value: "antiparasitic", label: "Anti-parasitic" },
    { value: "anthelmintic", label: "Anthelmintics" },
    { value: "vaccine", label: "Vaccines" },
    { value: "vitamin", label: "Vitamins" },
    { value: "mineral", label: "Minerals" },
    { value: "hormonal", label: "Hormonal" },
    { value: "antifungal", label: "Antifungal" },
    { value: "antiseptic", label: "Antiseptics" },
    { value: "analgesic", label: "Analgesics" },
    { value: "reproductive", label: "Reproductive" },
    { value: "digestive", label: "Digestive" },
  ];

  const forms = [
    { value: "injection", label: "Injection" },
    { value: "oral_liquid", label: "Oral Liquid" },
    { value: "oral_powder", label: "Oral Powder" },
    { value: "bolus", label: "Bolus" },
    { value: "tablet", label: "Tablet" },
    { value: "paste", label: "Paste" },
    { value: "ointment", label: "Ointment" },
    { value: "spray", label: "Spray" },
    { value: "pour_on", label: "Pour On" },
  ];

  const categoryIcons = {
    antibiotic: Pill,
    anti_inflammatory: Shield,
    antiparasitic: AlertTriangle,
    anthelmintic: AlertTriangle,
    vaccine: Syringe,
    vitamin: Pill,
    mineral: Pill,
    hormonal: Pill,
    antifungal: AlertTriangle,
    antiseptic: Shield,
    analgesic: Shield,
    reproductive: Pill,
    digestive: Pill,
  };

  useEffect(() => {
    fetchMedicines();
  }, [categoryFilter, manufacturerFilter, formFilter, searchTerm]);

  useEffect(() => {
    if (category) {
      setCategoryFilter(category);
    }
  }, [category]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (manufacturerFilter !== "all") params.append("manufacturer", manufacturerFilter);
      if (formFilter !== "all") params.append("form", formFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("available_only", "true");

      const response = await fetch(`/api/medicines?${params}`);
      const data = await response.json();

      if (data.success) {
        setMedicines(data.data);
        // Extract unique manufacturers
        const manufacturers = [...new Set(data.data.map((m: Medicine) => m.manufacturer).filter(Boolean))];
        // You might want to store this in state for the filter
      } else {
        toast.error("Failed to fetch medicines");
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast.error("Error loading medicines");
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDetail(true);
  };

  const handleInventoryUpdate = (medicine: Medicine) => {
    if (onInventoryUpdate) {
      onInventoryUpdate(medicine);
    }
  };

  const getUniqueManufacturers = () => {
    return [...new Set(medicines.map(m => m.manufacturer).filter(Boolean))];
  };

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
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
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
        <Select value={formFilter} onValueChange={setFormFilter}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <Package className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Form" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Forms</SelectItem>
            {forms.map((form) => (
              <SelectItem key={form.value} value={form.value}>
                {form.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <AlertCircle className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {getUniqueManufacturers().map((mfg) => (
              <SelectItem key={mfg} value={mfg || ""}>
                {mfg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Medicine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map((medicine) => {
          const IconComponent = categoryIcons[medicine.category as keyof typeof categoryIcons] || Pill;
          
          return (
            <Card key={medicine.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{medicine.name}</CardTitle>
                      {medicine.genericName && (
                        <CardDescription className="text-sm">
                          {medicine.genericName}
                        </CardDescription>
                      )}
                      {medicine.brandName && (
                        <CardDescription className="text-xs">
                          {medicine.brandName}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {medicine.form}
                    </Badge>
                    {medicine.prescriptionRequired && (
                      <Badge variant="secondary" className="text-xs">Rx</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {medicine.category}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {medicine.route}
                    </Badge>
                    {medicine.strength && (
                      <Badge variant="secondary" className="text-xs">
                        {medicine.strength}
                      </Badge>
                    )}
                  </div>

                  {medicine.manufacturer && (
                    <div className="text-sm text-gray-600">
                      Manufacturer: {medicine.manufacturer}
                    </div>
                  )}

                  {medicine.dosagePerKg && (
                    <div className="text-sm text-gray-600">
                      Dose: {medicine.dosagePerKg}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(Math.round(medicine.effectivenessRating))}</div>
                    <span className="text-sm text-gray-500">({medicine.effectivenessRating})</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Popularity: {medicine.popularityScore}%</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {medicine.withdrawalPeriodMilk !== undefined && (
                      <span className="text-blue-600">Milk: {medicine.withdrawalPeriodMilk}d</span>
                    )}
                    {medicine.withdrawalPeriodMeat !== undefined && (
                      <span className="text-red-600">Meat: {medicine.withdrawalPeriodMeat}d</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMedicineClick(medicine)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {onInventoryUpdate && (
                      <Button
                        size="sm"
                        onClick={() => handleInventoryUpdate(medicine)}
                        className="flex-1"
                      >
                        Add Stock
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {medicines.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Medicine Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedMedicine && (
            <MedicineDetail 
              medicine={selectedMedicine} 
              onClose={() => setShowDetail(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
