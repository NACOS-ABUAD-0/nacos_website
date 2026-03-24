export interface User {
  id: number;
  email: string;
  full_name: string;
  matric_number?: string;
  date_joined: string;
  is_staff?: boolean;
  is_email_verified?: boolean;
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
  images?: string[];
  featured: boolean;
  like_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}
