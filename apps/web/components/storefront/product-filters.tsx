"use client";

import { SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Category, ProductFilters } from "@/types/domain";

type ProductFiltersProps = {
  categories: Category[];
  value: ProductFilters;
  onChange: (filters: ProductFilters) => void;
};

export function ProductFilters({ categories, value, onChange }: ProductFiltersProps) {
  return (
    <div className="surface rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Filters</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Label htmlFor="query">Search</Label>
          <Input
            id="query"
            className="mt-2"
            value={value.query ?? ""}
            onChange={(event) => onChange({ ...value, query: event.target.value, page: 1 })}
            placeholder="Keyword, brand, category"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={value.category ?? "all"}
            onValueChange={(category) =>
              onChange({ ...value, category: category === "all" ? undefined : category, page: 1 })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sort</Label>
          <Select
            value={value.sort ?? "featured"}
            onValueChange={(sort) => onChange({ ...value, sort: sort as ProductFilters["sort"], page: 1 })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="price_asc">Price low</SelectItem>
              <SelectItem value="price_desc">Price high</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="maxPrice">Max price</Label>
          <Input
            id="maxPrice"
            className="mt-2"
            type="number"
            min={0}
            value={value.maxPrice ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                maxPrice: event.target.value ? Number(event.target.value) : undefined,
                page: 1
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
