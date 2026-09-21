import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../api";

export interface ExecutiveRecord {
  id: number;
  name: string;
  title: string;
  session: string;
  level: string;
  email: string;
  photo_url: string | null;
  display_order: number;
}

// Shared query key: the admin Executives page invalidates ["executives"] after
// every create/update/delete, so the public page refreshes immediately.
export const EXECUTIVES_QUERY_KEY = ["executives"];

export const useAllExecutives = () =>
  useQuery<ExecutiveRecord[]>({
    queryKey: EXECUTIVES_QUERY_KEY,
    queryFn: async () => {
      const data = (await publicApi.get("/executives/")).data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });
