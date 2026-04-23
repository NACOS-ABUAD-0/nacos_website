// src/lib/utils/pagination.ts

// Define the paginated response type locally
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function extractPaginatedData<T>(
  responseData: PaginatedResponse<T> | T[] | unknown
): T[] {
  // Check if it's a paginated response with results property
  if (responseData && typeof responseData === 'object' && 'results' in responseData) {
    const paginated = responseData as PaginatedResponse<T>;
    return paginated.results;
  }

  // Assume it's already an array
  return (responseData as T[]) || [];
}