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
  created_at?: string;
}

export interface Transaction {
  id: string;
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
}

export interface DashboardStats {
  activeListings: number;
  activeTransactions: number;
  pendingReviews: number;
  overdueDeadlines: number;
  dueToday: number;
  openEscalations: number;
}
