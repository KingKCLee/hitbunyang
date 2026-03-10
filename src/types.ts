export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

export type Variables = {
  userId?: number;
  userType?: string;
  user?: any;
};

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  user_type: 'normal' | 'business' | 'admin';
  company_name?: string;
  business_number?: string;
  alert_regions?: string;
  alert_ranks?: string;
  created_at: string;
}

export interface Property {
  id: number;
  title: string;
  subtitle?: string;
  property_type: string;
  region: string;
  address: string;
  price_min?: number;
  price_max?: number;
  supply_area_min?: number;
  supply_area_max?: number;
  total_units?: number;
  floors?: number;
  completion_date?: string;
  sale_start_date?: string;
  sale_end_date?: string;
  description?: string;
  floor_plan_url?: string;
  image_urls?: string;
  amenities?: string;
  status: string;
  is_featured: number;
  is_hot: number;
  is_new: number;
  ad_type: string;
  view_count: number;
  inquiry_count: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
}

export interface JobPost {
  id: number;
  title: string;
  site_name: string;
  region: string;
  property_type?: string;
  rank_type: string;
  commission_rate?: number;
  commission_note?: string;
  daily_pay?: number;
  accommodation_pay?: number;
  experience_required?: string;
  description?: string;
  contact_name: string;
  contact_phone: string;
  contact_kakao?: string;
  is_hot: number;
  is_urgent: number;
  is_best: number;
  ad_type: string;
  view_count: number;
  status: string;
  expires_at?: string;
  created_at: string;
}
