// frontend/src/lib/hooks/useResources.ts
import { useState, useEffect } from 'react';
import { resourcesAPI } from '../api';

export interface Resource {
  id: number | string;
  title: string;
  description: string;
  url: string;
  download_url?: string;
  course_code?: string;
  year?: string;
  file_type: string;
  file_size?: number;
  file_size_display: string;
  file_icon: string;
  download_count: number;
  category?: { id: number; name: string };
  tags: Array<{ id: number; name: string }>;
  created_at: string;
}

export interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Resource[];
}

export interface UseResourcesReturn {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useResources = (params: any = {}): UseResourcesReturn => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await resourcesAPI.getResources(params);
      setResources(response.data.results);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch resources';
      setError(errorMessage);
      console.error('Error fetching resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [JSON.stringify(params)]);

  return {
    resources,
    isLoading,
    error,
    refetch: fetchResources,
  };
};

export const useResourceCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await resourcesAPI.getResourceCategories();
      setCategories(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch categories';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
};