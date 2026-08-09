export type FileType = "listing" | "transaction";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type ListingStatus =
  | "intake"
  | "coming_soon"
  | "active"
  | "active_option"
  | "active_contingent"
  | "pending"
  | "sold"
  | "withdrawn"
  | "expired"
  | "cancelled"
  | "temp_off_market";

export type TransactionStatus =
  | "intake"
  | "active"
  | "pending"
  | "closed"
  | "terminated"
  | "cancelled";

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  trec_license?: string;
  role: string;
}

export interface ListingWeeklyStats {
  showings_week?: string | number;
  showings_total?: string | number;
  feedback_count?: string | number;
  feedback_themes?: string;
  showings?: string | number;
  cancellations?: string | number;
  no_shows?: string | number;
}

export interface ListingMetadata {
  weekly_stats?: ListingWeeklyStats;
  showing_restrictions?: string;
  showing_notification_preference?: string;
  open_house_details?: string;
  seller_first_name?: string;
  seller_preferred_name?: string;
  seller_email?: string;
  review_link?: string;
  [key: string]: unknown;
}

export interface Listing {
  id: string;
  property_address: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  mls_number?: string;
  status: ListingStatus;
  list_price?: number;
  target_list_date?: string;
  actual_list_date?: string;
  listing_agent_id?: string;
  compliance_status?: string;
  go_live_approved?: boolean;
  showing_instructions?: string;
  showing_restrictions?: string;
  showing_notification_preference?: string;
  open_house_details?: string;
  has_hoa?: boolean;
  hoa_name?: string;
  metadata?: ListingMetadata;
  created_at?: string;
}

export interface TransactionMetadata {
  weekly_stats?: ListingWeeklyStats;
  client_first_name?: string;
  client_email?: string;
  seller_first_name?: string;
  seller_preferred_name?: string;
  has_hoa?: boolean;
  title_company?: string;
  third_party_name?: string;
  third_party_email?: string;
  status_summary?: string;
  closer_name?: string;
  closer_phone?: string;
  closing_day?: string;
  closing_time?: string;
  signing_method?: string;
  utilities_reminder?: string;
  final_walkthrough?: string;
  keys_and_access?: string;
  review_link?: string;
  [key: string]: unknown;
}

export interface Transaction {
  id: string;
  linked_listing_id?: string;
  property_address: string;
  side: "sell" | "buy" | "both";
  status: TransactionStatus;
  effective_date?: string;
  closing_date?: string;
  option_days?: number;
  option_fee_amount?: number;
  earnest_money_amount?: number;
  financing_days?: number;
  title_file_number?: string;
  mls_number?: string;
  loan_type?: string;
  supervising_agent_id?: string;
  compliance_status?: string;
  has_hoa?: boolean;
  metadata?: TransactionMetadata;
  created_at?: string;
}

export interface Deadline {
  id: string;
  file_type: FileType;
  file_id: string;
  deadline_type: string;
  label: string;
  due_at: string;
  status: string;
  notes?: string;
}

export interface DashboardStats {
  activeListings: number;
  activeTransactions: number;
  pendingReviews: number;
  overdueDeadlines: number;
  dueToday: number;
  openEscalations: number;
}
