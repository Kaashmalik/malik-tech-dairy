"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { Animal } from "@/types";
import { useState } from "react";

export function AnimalList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) throw new Error("Failed to fetch animals");
      const data = await res.json();
      return data.animals as Animal[];
    },
  });

  const animals = data || [];
  const filteredAnimals = animals.filter(
    (animal) =>
      animal.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const animalsBySpecies = filteredAnimals.reduce((acc, animal) => {
    acc[animal.species] = (acc[animal.species] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return <div className="text-center py-8">Loading animals...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading animals. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Animals</h1>
          <p className="text-muted-foreground">
            Manage your livestock ({animals.length} total)
          </p>
        </div>
        <Link href="/dashboard/animals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Animal
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by tag or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Species Summary */}
      {Object.keys(animalsBySpecies).length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(animalsBySpecies).map(([species, count]) => (
            <Card key={species}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {species}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Animals Grid */}
      {filteredAnimals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No animals found matching your search." : "No animals yet."}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/animals/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Animal
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnimals.map((animal) => (
            <Link key={animal.id} href={`/dashboard/animals/${animal.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{animal.tag}</CardTitle>
                    <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                      {animal.species}
                    </span>
                  </div>
                  {animal.name && (
                    <CardDescription>{animal.name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Breed:</span>
                      <span>{animal.breed || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="capitalize">{animal.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="capitalize">{animal.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

