"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  TrendingDown,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  manufacturer?: string;
  category: string;
  form: string;
  strength?: string;
  unit?: string;
}

interface InventoryItem {
  id: string;
  medicine_id: string;
  medicine: Medicine;
  quantity: number;
  unit?: string;
  batch_number?: string;
  purchase_date?: string;
  expiry_date: string;
  purchase_price?: number;
  supplier?: string;
  storage_location?: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

interface MedicineInventoryProps {
  onMedicineSelect?: (medicine: Medicine) => void;
}

export function MedicineInventory({ onMedicineSelect }: MedicineInventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [filter, searchTerm]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === "low") params.append("low_stock", "true");
      if (filter === "expiring") params.append("expiring_soon", "true");
      if (filter === "expired") params.append("expired", "true");
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/medicine-inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.data);
      } else {
        toast.error("Failed to fetch inventory");
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Error loading inventory");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const today = new Date();
    const expiryDate = new Date(item.expiry_date);
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) return { status: "expired", color: "bg-red-100 text-red-800", text: "Expired" };
    if (daysToExpiry <= 30) return { status: "expiring", color: "bg-orange-100 text-orange-800", text: `Expiring in ${daysToExpiry} days` };
    if (item.quantity <= item.reorder_level) return { status: "low", color: "bg-yellow-100 text-yellow-800", text: "Low Stock" };
    return { status: "good", color: "bg-green-100 text-green-800", text: "In Stock" };
  };

  const handleAddStock = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowAddStock(true);
  };

  const handleUseMedicine = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch("/api/medicine-inventory", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemId,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Medicine usage recorded");
        fetchInventory();
      } else {
        toast.error(data.error || "Failed to record usage");
      }
    } catch (error) {
      console.error("Error using medicine:", error);
      toast.error("Error recording usage");
    }
  };

  const getInventoryStats = () => {
    const total = inventory.length;
    const lowStock = inventory.filter(item => item.quantity <= item.reorder_level).length;
    const expired = inventory.filter(item => new Date(item.expiry_date) < new Date()).length;
    const expiring = inventory.filter(item => {
      const days = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 30;
    }).length;

    return { total, lowStock, expired, expiring };
  };

  const stats = getInventoryStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
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
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(stats.expired > 0 || stats.expiring > 0 || stats.lowStock > 0) && (
        <div className="space-y-2">
          {stats.expired > 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Expired Medicines</AlertTitle>
              <AlertDescription className="text-red-700">
                You have {stats.expired} expired medicine(s) that need to be disposed of.
              </AlertDescription>
            </Alert>
          )}
          {stats.expiring > 0 && (
            <Alert className="bg-orange-50 border-orange-200">
              <Calendar className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Medicines Expiring Soon</AlertTitle>
              <AlertDescription className="text-orange-700">
                {stats.expiring} medicine(s) will expire within the next 30 days.
              </AlertDescription>
            </Alert>
          )}
          {stats.lowStock > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Low Stock Alert</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {stats.lowStock} medicine(s) are below reorder level.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

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
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchInventory} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Inventory</CardTitle>
          <CardDescription>
            Manage your farm's medicine stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const stockStatus = getStockStatus(item);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.medicine.name}</p>
                        {item.medicine.genericName && (
                          <p className="text-sm text-gray-500">{item.medicine.genericName}</p>
                        )}
                        {item.medicine.strength && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.medicine.strength}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.batch_number || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-sm text-gray-500">{item.unit || "units"}</span>
                        {item.quantity <= item.reorder_level && (
                          <Badge variant="outline" className="text-xs">Low</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(item.expiry_date), "MMM dd, yyyy")}</p>
                        <p className="text-xs text-gray-500">
                          {Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.text}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.storage_location || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddStock(item.medicine)}
                        >
                          Add Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMedicineSelect?.(item.medicine)}
                        >
                          Use
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {inventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-500 mb-4">Start by adding medicines to your inventory</p>
              <Button onClick={() => setShowAddStock(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine Stock
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medicine Stock</DialogTitle>
            <DialogDescription>
              Add new stock to your inventory
            </DialogDescription>
          </DialogHeader>
          <AddStockForm
            medicine={selectedMedicine}
            onSuccess={() => {
              setShowAddStock(false);
              fetchInventory();
            }}
            onCancel={() => setShowAddStock(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Stock Form Component
interface AddStockFormProps {
  medicine?: Medicine | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddStockForm({ medicine, onSuccess, onCancel }: AddStockFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicine_id: medicine?.id || "",
    quantity: "",
    batch_number: "",
    purchase_date: format(new Date(), "yyyy-MM-dd"),
    expiry_date: "",
    purchase_price: "",
    supplier: "",
    storage_location: "",
  });

  useEffect(() => {
    if (!medicine) {
      fetchMedicines();
    }
  }, [medicine]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch("/api/medicines?available_only=true");
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medicine_id || !formData.quantity || !formData.expiry_date) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/medicine-inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          purchase_price: formData.purchase_price ? parseInt(formData.purchase_price) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Stock added successfully");
        onSuccess();
      } else {
        toast.error(data.error || "Failed to add stock");
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      toast.error("Error adding stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!medicine && (
        <div>
          <label className="text-sm font-medium">Medicine *</label>
          <Select
            value={formData.medicine_id}
            onValueChange={(value) => setFormData({ ...formData, medicine_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select medicine" />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((med) => (
                <SelectItem key={med.id} value={med.id}>
                  {med.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Quantity *</label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Batch Number</label>
          <Input
            value={formData.batch_number}
            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
            placeholder="Batch #"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Purchase Date</label>
          <Input
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Expiry Date *</label>
          <Input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Purchase Price (PKR)</label>
          <Input
            type="number"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Supplier</label>
          <Input
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="Supplier name"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Storage Location</label>
        <Input
          value={formData.storage_location}
          onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
          placeholder="e.g., Main Store, Fridge A"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Stock"}
        </Button>
      </div>
    </form>
  );
}
