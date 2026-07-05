// src/types/index.ts

export interface User {
  id: number;
  email: string;
  full_name: string;
  matric_number?: string;
  date_joined: string;
  is_staff?: boolean;
  profile_complete?: boolean;
}

export interface Skill {
  id: number;
  name: string;
  description?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  owner: User;
  tags?: Skill[];
  links?: Record<string, string>;
  live_url: string;
  images?: string[];
  // ✅ API returns is_featured — the old field name "featured" never existed
  // in the Django model, so project.featured was always undefined.
  is_featured: boolean;
  collaboration_needs: CollaborationNeed[];
  like_count?: number;
  is_liked_by_user?: boolean;
  status?: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface ProjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}

export interface CollaborationNeed {
  id?: number;
  skill_type: 'frontend' | 'backend' | 'ui_ux' | 'ai_ml' | 'documentation' | 'others';
  custom_skill?: string;
  description?: string;
  is_filled?: boolean;
}

export interface ProjectFormData {
  title: string;
  description: string;
  tag_ids?: number[];
  links?: Record<string, string>;
  live_url: string;
  images?: string[];
  collaboration_needs?: Omit<CollaborationNeed, 'id' | 'is_filled'>[];
}