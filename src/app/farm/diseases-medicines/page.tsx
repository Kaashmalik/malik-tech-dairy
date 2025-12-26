"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Pill, 
  Syringe, 
  Package, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Microscope
} from "lucide-react";
import { DiseaseList } from "@/components/diseases/DiseaseList";
import { MedicineList } from "@/components/medicines/MedicineList";
import { MedicineInventory } from "@/components/medicines/MedicineInventory";
import { AnimalTreatmentForm } from "@/components/treatments/AnimalTreatmentForm";
import { DiseaseDetail } from "@/components/diseases/DiseaseDetail";
import { MedicineDetail } from "@/components/medicines/MedicineDetail";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

// Dashboard Stats Component
function DashboardStats() {
  const [stats, setStats] = useState({
    totalDiseases: 0,
    totalMedicines: 0,
    lowStock: 0,
    expiringSoon: 0,
    activeTreatments: 0,
    upcomingVaccinations: 0,
  });

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      try {
        // Fetch diseases count
        const diseasesRes = await fetch("/api/diseases");
        const diseasesData = await diseasesRes.json();
        
        // Fetch medicines count
        const medicinesRes = await fetch("/api/medicines");
        const medicinesData = await medicinesRes.json();
        
        // Fetch inventory stats
        const inventoryRes = await fetch("/api/medicine-inventory?low_stock=true");
        const inventoryData = await inventoryRes.json();
        
        // Fetch expiring medicines
        const expiringRes = await fetch("/api/medicine-inventory?expiring_soon=true");
        const expiringData = await expiringRes.json();
        
        // Fetch active treatments
        const treatmentsRes = await fetch("/api/animal-treatments?status=in_treatment");
        const treatmentsData = await treatmentsRes.json();
        
        // Fetch upcoming vaccinations
        const vaccinationsRes = await fetch("/api/animal-vaccinations?upcoming_only=true");
        const vaccinationsData = await vaccinationsRes.json();
        
        setStats({
          totalDiseases: diseasesData.data?.length || 0,
          totalMedicines: medicinesData.data?.length || 0,
          lowStock: inventoryData.data?.length || 0,
          expiringSoon: expiringData.data?.length || 0,
          activeTreatments: treatmentsData.data?.length || 0,
          upcomingVaccinations: vaccinationsData.data?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Diseases</p>
              <p className="text-2xl font-bold">{stats.totalDiseases}</p>
            </div>
            <Microscope className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Medicines</p>
              <p className="text-2xl font-bold">{stats.totalMedicines}</p>
            </div>
            <Pill className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <Package className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Treatments</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeTreatments}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Vaccinations Due</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.upcomingVaccinations}</p>
            </div>
            <Syringe className="h-8 w-8 text-indigo-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DiseasesMedicinesPage() {
  const [selectedDisease, setSelectedDisease] = useState<any>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [showDiseaseDetail, setShowDiseaseDetail] = useState(false);
  const [showMedicineDetail, setShowMedicineDetail] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleDiseaseSelect = (disease: any) => {
    setSelectedDisease(disease);
    setShowDiseaseDetail(true);
  };

  const handleMedicineSelect = (medicine: any) => {
    setSelectedMedicine(medicine);
    setShowMedicineDetail(true);
  };

  const handleTreatmentStart = (disease: any) => {
    setSelectedDisease(disease);
    setShowTreatmentForm(true);
  };

  const handleTreatmentSuccess = () => {
    setShowTreatmentForm(false);
    toast.success("Treatment recorded successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Diseases & Medicines</h1>
        <p className="text-gray-500">Manage animal diseases, medicines, and treatments</p>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="diseases">Diseases</TabsTrigger>
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Diseases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5" />
                  Common Diseases
                </CardTitle>
                <CardDescription>
                  Frequently occurring diseases in your region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Foot and Mouth Disease", category: "viral", severity: "severe" },
                    { name: "Hemorrhagic Septicemia", category: "bacterial", severity: "critical" },
                    { name: "Mastitis", category: "bacterial", severity: "moderate" },
                    { name: "Babesiosis", category: "parasitic", severity: "severe" },
                  ].map((disease, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{disease.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{disease.category}</p>
                      </div>
                      <Badge variant={disease.severity === "critical" ? "destructive" : disease.severity === "severe" ? "default" : "secondary"}>
                        {disease.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTreatmentForm(true)}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">Record Treatment</span>
                    <Activity className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">Check Medicine Stock</span>
                    <Package className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab("diseases")}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">Browse Diseases</span>
                    <Microscope className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab("medicines")}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">View Medicines</span>
                    <Pill className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Vaccinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No upcoming vaccinations scheduled</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diseases Tab */}
        <TabsContent value="diseases">
          <DiseaseList onTreatmentSelect={handleTreatmentStart} />
        </TabsContent>

        {/* Medicines Tab */}
        <TabsContent value="medicines">
          <MedicineList onInventoryUpdate={handleMedicineSelect} />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <MedicineInventory onMedicineSelect={handleMedicineSelect} />
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment">
          <AnimalTreatmentForm onSuccess={handleTreatmentSuccess} />
        </TabsContent>
      </Tabs>

      {/* Disease Detail Dialog */}
      <Dialog open={showDiseaseDetail} onOpenChange={setShowDiseaseDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDisease && (
            <DiseaseDetail
              disease={selectedDisease}
              onClose={() => setShowDiseaseDetail(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Medicine Detail Dialog */}
      <Dialog open={showMedicineDetail} onOpenChange={setShowMedicineDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedMedicine && (
            <MedicineDetail
              medicine={selectedMedicine}
              onClose={() => setShowMedicineDetail(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Treatment Form Dialog */}
      <Dialog open={showTreatmentForm} onOpenChange={setShowTreatmentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AnimalTreatmentForm
            onSuccess={handleTreatmentSuccess}
            onCancel={() => setShowTreatmentForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
