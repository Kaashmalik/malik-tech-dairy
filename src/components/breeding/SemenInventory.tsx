'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus,
    Syringe,
    AlertTriangle,
    Package,
    Calendar,
    Trash2,
    Edit,
    RefreshCw,
    Search,
    Filter,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { SemenInventory, AnimalSpecies } from '@/types';

interface SemenInventoryResponse {
    summary: {
        totalStraws: number;
        totalItems: number;
        available: number;
        expired: number;
        lowStock: number;
    };
    inventory: (SemenInventory & {
        isExpired: boolean;
        isLowStock: boolean;
    })[];
}

interface SemenFormData {
    strawCode: string;
    bullName: string;
    bullBreed: string;
    bullRegistrationNumber: string;
    sourceCenter: string;
    species: AnimalSpecies;
    quantity: number;
    purchaseDate: string;
    expiryDate: string;
    storageLocation: string;
    costPerStraw: string;
    notes: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

export function SemenInventory() {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<SemenInventory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery<{ data: SemenInventoryResponse }>({
        queryKey: ['semen-inventory'],
        queryFn: async () => {
            const res = await fetch('/api/semen');
            if (!res.ok) throw new Error('Failed to fetch semen inventory');
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: SemenFormData) => {
            const res = await fetch('/api/semen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to add semen');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semen-inventory'] });
            setShowForm(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<SemenInventory> & { id: string }) => {
            const res = await fetch('/api/semen', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semen-inventory'] });
            setEditingItem(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/semen?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semen-inventory'] });
        },
    });

    const inventory = data?.data?.inventory || [];
    const summary = data?.data?.summary || {
        totalStraws: 0,
        totalItems: 0,
        available: 0,
        expired: 0,
        lowStock: 0,
    };

    // Filter inventory
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = searchQuery === '' ||
            item.bullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.strawCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.sourceCenter?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesSpecies = speciesFilter === 'all' || item.species === speciesFilter;
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesSpecies && matchesStatus;
    });

    const getStatusBadge = (status: string, isExpired: boolean, isLowStock: boolean) => {
        if (isExpired) {
            return <Badge variant="destructive">Expired</Badge>;
        }
        switch (status) {
            case 'available':
                return isLowStock
                    ? <Badge className="bg-yellow-500">Low Stock</Badge>
                    : <Badge className="bg-green-500">Available</Badge>;
            case 'used':
                return <Badge variant="secondary">Used</Badge>;
            case 'damaged':
                return <Badge variant="destructive">Damaged</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 dark:border-red-800">
                <CardContent className="pt-6 text-center text-red-600">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p>Failed to load semen inventory</p>
                    <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
        >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <motion.div variants={itemVariants}>
                    <Card className="hover:scale-[1.02] transition-transform">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.totalStraws}</p>
                                    <p className="text-xs text-muted-foreground">Total Straws</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="border-green-200 dark:border-green-800 hover:scale-[1.02] transition-transform">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Syringe className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{summary.available}</p>
                                    <p className="text-xs text-muted-foreground">Available</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="border-yellow-200 dark:border-yellow-800 hover:scale-[1.02] transition-transform">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-600">{summary.lowStock}</p>
                                    <p className="text-xs text-muted-foreground">Low Stock</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="border-red-200 dark:border-red-800 hover:scale-[1.02] transition-transform">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-600">{summary.expired}</p>
                                    <p className="text-xs text-muted-foreground">Expired</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="hover:scale-[1.02] transition-transform">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">{summary.totalItems}</p>
                                    <p className="text-xs text-muted-foreground">Items</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Inventory Table */}
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Syringe className="h-5 w-5" />
                                    Semen Inventory
                                </CardTitle>
                                <CardDescription>
                                    Manage AI semen straws and inventory
                                </CardDescription>
                            </div>
                            <Dialog open={showForm} onOpenChange={setShowForm}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Semen
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <SemenForm
                                        onSubmit={(data) => createMutation.mutate(data)}
                                        onCancel={() => setShowForm(false)}
                                        isLoading={createMutation.isPending}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by bull name, straw code, or source..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Species" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Species</SelectItem>
                                    <SelectItem value="cow">Cow</SelectItem>
                                    <SelectItem value="buffalo">Buffalo</SelectItem>
                                    <SelectItem value="goat">Goat</SelectItem>
                                    <SelectItem value="sheep">Sheep</SelectItem>
                                    <SelectItem value="horse">Horse</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="used">Used</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="damaged">Damaged</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredInventory.length === 0 ? (
                            <div className="text-center py-12">
                                <Syringe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">
                                    {inventory.length === 0
                                        ? 'No semen inventory yet'
                                        : 'No items match your filters'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Straw Code</TableHead>
                                            <TableHead>Bull Name</TableHead>
                                            <TableHead>Species</TableHead>
                                            <TableHead>Breed</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Expiry</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInventory.map((item) => {
                                            const daysUntilExpiry = item.expiryDate
                                                ? differenceInDays(new Date(item.expiryDate), new Date())
                                                : null;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono font-medium">
                                                        {item.strawCode}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <span className="font-medium">{item.bullName}</span>
                                                            {item.bullRegistrationNumber && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    #{item.bullRegistrationNumber}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {item.species}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{item.bullBreed || '-'}</TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{item.sourceCenter || '-'}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`font-bold ${item.isLowStock ? 'text-yellow-600' : ''}`}>
                                                            {item.quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.expiryDate ? (
                                                            <div>
                                                                <span>{format(new Date(item.expiryDate), 'MMM d, yyyy')}</span>
                                                                {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                                                                    <p className="text-xs text-yellow-600">
                                                                        {daysUntilExpiry} days left
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(item.status, item.isExpired, item.isLowStock)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingItem(item)}
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (confirm('Delete this semen inventory item?')) {
                                                                        deleteMutation.mutate(item.id);
                                                                    }
                                                                }}
                                                                title="Delete"
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Inventory</DialogTitle>
                        <DialogDescription>
                            Update quantity or status for {editingItem?.bullName}
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && (
                        <EditSemenForm
                            item={editingItem}
                            onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, ...data })}
                            onCancel={() => setEditingItem(null)}
                            isLoading={updateMutation.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

// =============================================================================
// Semen Form Component (for adding new items)
// =============================================================================
function SemenForm({
    onSubmit,
    onCancel,
    isLoading,
}: {
    onSubmit: (data: SemenFormData) => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState<SemenFormData>({
        strawCode: '',
        bullName: '',
        bullBreed: '',
        bullRegistrationNumber: '',
        sourceCenter: '',
        species: 'cow',
        quantity: 1,
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: '',
        storageLocation: '',
        costPerStraw: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Add Semen to Inventory
                </DialogTitle>
                <DialogDescription>
                    Enter details for the AI semen straws
                </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="strawCode">Straw Code *</Label>
                    <Input
                        id="strawCode"
                        value={formData.strawCode}
                        onChange={(e) => setFormData({ ...formData, strawCode: e.target.value })}
                        placeholder="e.g., HF-2024-001"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="species">Species *</Label>
                    <Select
                        value={formData.species}
                        onValueChange={(v) => setFormData({ ...formData, species: v as AnimalSpecies })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cow">Cow</SelectItem>
                            <SelectItem value="buffalo">Buffalo</SelectItem>
                            <SelectItem value="goat">Goat</SelectItem>
                            <SelectItem value="sheep">Sheep</SelectItem>
                            <SelectItem value="horse">Horse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bullName">Bull Name *</Label>
                    <Input
                        id="bullName"
                        value={formData.bullName}
                        onChange={(e) => setFormData({ ...formData, bullName: e.target.value })}
                        placeholder="e.g., Holstein Champion"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bullBreed">Bull Breed</Label>
                    <Input
                        id="bullBreed"
                        value={formData.bullBreed}
                        onChange={(e) => setFormData({ ...formData, bullBreed: e.target.value })}
                        placeholder="e.g., Holstein Friesian"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bullRegistrationNumber">Registration #</Label>
                    <Input
                        id="bullRegistrationNumber"
                        value={formData.bullRegistrationNumber}
                        onChange={(e) => setFormData({ ...formData, bullRegistrationNumber: e.target.value })}
                        placeholder="Bull registration number"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sourceCenter">Source Center</Label>
                    <Input
                        id="sourceCenter"
                        value={formData.sourceCenter}
                        onChange={(e) => setFormData({ ...formData, sourceCenter: e.target.value })}
                        placeholder="e.g., BAIF, LES Okara"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="storageLocation">Storage Location</Label>
                    <Input
                        id="storageLocation"
                        value={formData.storageLocation}
                        onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                        placeholder="e.g., Tank A, Row 2"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="costPerStraw">Cost per Straw (Rs.)</Label>
                    <Input
                        id="costPerStraw"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPerStraw}
                        onChange={(e) => setFormData({ ...formData, costPerStraw: e.target.value })}
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this semen..."
                    rows={2}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500"
                >
                    {isLoading ? 'Adding...' : 'Add to Inventory'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// =============================================================================
// Edit Semen Form Component
// =============================================================================
function EditSemenForm({
    item,
    onSubmit,
    onCancel,
    isLoading,
}: {
    item: SemenInventory;
    onSubmit: (data: Partial<SemenInventory>) => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [quantity, setQuantity] = useState(item.quantity);
    const [status, setStatus] = useState(item.status);
    const [storageLocation, setStorageLocation] = useState(item.storageLocation || '');
    const [notes, setNotes] = useState(item.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ quantity, status, storageLocation, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                    id="edit-quantity"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-location">Storage Location</Label>
                <Input
                    id="edit-location"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500"
                >
                    {isLoading ? 'Updating...' : 'Update'}
                </Button>
            </DialogFooter>
        </form>
    );
}
