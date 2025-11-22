"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CouponForm } from "@/components/admin/CouponForm";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to fetch coupons");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted successfully");
    },
  });

  const coupons = data?.coupons || [];

  if (isLoading) {
    return <div className="text-center py-8">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {showForm && (
        <CouponForm
          coupon={editingCoupon}
          onSuccess={() => {
            setShowForm(false);
            setEditingCoupon(null);
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCoupon(null);
          }}
        />
      )}

      <div className="grid gap-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No coupons created yet.</p>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon: any) => (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{coupon.code}</CardTitle>
                    <CardDescription>{coupon.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        coupon.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this coupon?")) {
                          deleteMutation.mutate(coupon.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="capitalize">{coupon.type.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value:</span>{" "}
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : `PKR ${coupon.value.toLocaleString()}`}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid From:</span>{" "}
                    {format(new Date(coupon.validFrom), "MMM d, yyyy")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid Until:</span>{" "}
                    {format(new Date(coupon.validUntil), "MMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

