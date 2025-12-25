'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface SmartTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  search?: {
    placeholder: string;
    onSearch: (query: string) => void;
  };
  actions?: {
    view?: (row: T) => void;
    edit?: (row: T) => void;
    delete?: (row: T) => void;
  };
  className?: string;
}

export function SmartTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  search,
  actions,
  className,
}: SmartTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    if (!sortConfig.key || sortConfig.key !== key) {
      setSortConfig({ key, direction: 'asc' });
    } else {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    }
  };

  // Virtual scrolling for large datasets
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 60;
    const start = Math.floor(scrollTop / itemHeight);
    const end = start + 50;
    setVisibleRange({ start, end });
  }, []);

  const visibleData = sortedData.slice(visibleRange.start, visibleRange.end);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Search and Filters */}
      {(search || actions) && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {search && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={search.placeholder}
                onChange={(e) => search.onSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={cn(
                      'text-white/80 font-semibold',
                      column.sortable && 'cursor-pointer hover:text-white',
                      column.width
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="text-white/80 font-semibold w-20">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index} className="border-white/5">
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <div className="h-4 bg-white/10 rounded animate-pulse" />
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <div className="h-8 bg-white/10 rounded animate-pulse" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                visibleData.map((row, index) => (
                  <TableRow
                    key={row.id || index}
                    className="border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {columns.map((column) => (
                      <TableCell key={String(column.key)} className="text-white/90">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <div className="flex gap-1">
                          {actions.view && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.view!(row)}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {actions.edit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.edit!(row)}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {actions.delete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.delete!(row)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton loader for table
export function TableSkeleton({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-white/10 rounded w-1/4 animate-pulse" />
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="space-y-2 p-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <div className="h-4 bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
