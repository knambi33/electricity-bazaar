import {
  MarketplaceListing,
  BuyerRequirement,
  MatchResult,
  Enquiry,
  TenderOpportunity,
  ServiceListing,
  LandedCostInputs,
  LandedCostOutputs,
  StateRegulatoryProfile,
  User,
  Organisation,
  ExtractedBillData,
  RooftopEconomics,
  RooftopVendor,
  RooftopCampaign,
  RooftopProposal,
  CampaignSignup,
  RooftopApplicantType
} from "../types";

const API_BASE = (((import.meta as any).env?.VITE_API_BASE_URL as string) || "/api/v1").replace(/\/$/, "");

class ApiService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem("eb_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    let json: any = {};
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        res.status === 413
          ? "Uploaded file is too large (maximum 50MB allowed)."
          : `Server error (${res.status}): ${text.slice(0, 100) || "Unable to parse response"}`
      );
    }

    if (!res.ok || json.success === false) {
      const errorMsg = json.error?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return json.data;
  }

  // --- Auth ---
  async login(credentials: any): Promise<{ user: User; organisation: Organisation; accessToken: string }> {
    const data = await this.request<{ user: User; organisation: Organisation; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    localStorage.setItem("eb_token", data.accessToken);
    return data;
  }

  async register(formData: any): Promise<{ user: User; organisation: Organisation; accessToken: string }> {
    const data = await this.request<{ user: User; organisation: Organisation; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    localStorage.setItem("eb_token", data.accessToken);
    return data;
  }

  async getMe(): Promise<{ user: User; activeOrganisation: Organisation }> {
    return this.request<{ user: User; activeOrganisation: Organisation }>("/auth/me");
  }

  logout(): void {
    localStorage.removeItem("eb_token");
  }

  // --- Marketplace Listings ---
  async getListings(params: Record<string, string> = {}): Promise<{ data: MarketplaceListing[]; meta: any }> {
    const query = new URLSearchParams(params).toString();
    const url = `/listings${query ? `?${query}` : ""}`;
    const res = await fetch(`${API_BASE}${url}`);
    const json = await res.json();
    return { data: json.data || [], meta: json.meta || {} };
  }

  async getListingDetails(idOrSlug: string): Promise<MarketplaceListing> {
    return this.request<MarketplaceListing>(`/listings/${idOrSlug}`);
  }

  async getStateCounts(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>("/listings/state-counts");
  }

  async requestNdaUnlock(listingId: string, payload: {
    corporateEntityName: string;
    designatedSignatory: string;
    companyPanGst: string;
    intentionScope?: string;
    ndaTermsAccepted: boolean;
  }): Promise<any> {
    return this.request<any>(`/listings/${listingId}/request-nda`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async createListing(data: any): Promise<MarketplaceListing> {
    return this.request<MarketplaceListing>("/listings", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async submitListingReview(id: string): Promise<MarketplaceListing> {
    return this.request<MarketplaceListing>(`/listings/${id}/submit-review`, {
      method: "POST"
    });
  }

  async getMyListings(): Promise<MarketplaceListing[]> {
    return this.request<MarketplaceListing[]>("/listings/seller/my-listings");
  }

  // --- Requirements & Matching ---
  async createRequirement(data: any): Promise<BuyerRequirement> {
    return this.request<BuyerRequirement>("/requirements", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async getMyRequirements(): Promise<BuyerRequirement[]> {
    return this.request<BuyerRequirement[]>("/requirements");
  }

  async getMatches(requirementId: string): Promise<{ requirement: BuyerRequirement; matches: MatchResult[] }> {
    return this.request<{ requirement: BuyerRequirement; matches: MatchResult[] }>(`/requirements/${requirementId}/matches`);
  }

  async guestMatch(criteria: {
    state: string;
    contractDemandMw: number;
    targetRenewablePercent?: number;
    preferredTechnology?: string;
    commercialModel?: string;
  }): Promise<MatchResult[]> {
    return this.request<MatchResult[]>("/requirements/guest-match", {
      method: "POST",
      body: JSON.stringify(criteria)
    });
  }

  // --- Calculator & Intelligence ---
  async evaluateLandedCost(inputs: LandedCostInputs): Promise<LandedCostOutputs> {
    return this.request<LandedCostOutputs>("/calculator/evaluate", {
      method: "POST",
      body: JSON.stringify(inputs)
    });
  }

  async decomposeBill(billData: any): Promise<any> {
    return this.request<any>("/calculator/bill-decompose", {
      method: "POST",
      body: JSON.stringify(billData)
    });
  }

  async extractBillData(payload: {
    fileName?: string;
    fileType?: string;
    base64Content?: string;
    samplePreset?: string;
  }): Promise<ExtractedBillData> {
    return this.request<ExtractedBillData>("/calculator/extract-bill", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async getBillSamples(): Promise<any[]> {
    return this.request<any[]>("/calculator/bill-samples");
  }

  async getStates(): Promise<string[]> {
    return this.request<string[]>("/calculator/states");
  }

  async getStateRates(state: string): Promise<StateRegulatoryProfile> {
    return this.request<StateRegulatoryProfile>(`/calculator/state-rates/${encodeURIComponent(state)}`);
  }

  async saveCalculation(data: any): Promise<any> {
    return this.request<any>("/calculator/save", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async getSavedCalculations(): Promise<any[]> {
    return this.request<any[]>("/calculator/saved");
  }

  // --- Enquiries ---
  async createEnquiry(data: {
    listingId: string;
    requirementId?: string;
    proposedCapacityMw?: number;
    message: string;
    buyerConsentGranted: boolean;
  }): Promise<Enquiry> {
    return this.request<Enquiry>("/enquiries", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async getEnquiries(role?: "buyer" | "seller"): Promise<Enquiry[]> {
    const query = role ? `?role=${role}` : "";
    return this.request<Enquiry[]>(`/enquiries${query}`);
  }

  async getEnquiryDetails(id: string): Promise<Enquiry> {
    return this.request<Enquiry>(`/enquiries/${id}`);
  }

  async sendEnquiryMessage(id: string, messageText: string): Promise<any> {
    return this.request<any>(`/enquiries/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ messageText })
    });
  }

  async updateEnquiryStatus(id: string, status: string): Promise<Enquiry> {
    return this.request<Enquiry>(`/enquiries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }

  // --- Tenders & Services ---
  async getTenders(params: Record<string, string> = {}): Promise<TenderOpportunity[]> {
    const query = new URLSearchParams(params).toString();
    return this.request<TenderOpportunity[]>(`/tenders${query ? `?${query}` : ""}`);
  }

  async getServices(params: Record<string, string> = {}): Promise<ServiceListing[]> {
    const query = new URLSearchParams(params).toString();
    return this.request<ServiceListing[]>(`/services${query ? `?${query}` : ""}`);
  }

  // --- Admin ---
  async getAdminStats(): Promise<any> {
    return this.request<any>("/admin/stats");
  }

  async getReviewQueue(): Promise<MarketplaceListing[]> {
    return this.request<MarketplaceListing[]>("/admin/listings/review-queue");
  }

  async reviewListing(id: string, action: "APPROVE" | "REJECT" | "SUSPEND", notes: string): Promise<MarketplaceListing> {
    return this.request<MarketplaceListing>(`/admin/listings/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ action, notes })
    });
  }

  async getVerificationsQueue(): Promise<Organisation[]> {
    return this.request<Organisation[]>("/admin/verifications/queue");
  }

  async decideVerification(orgId: string, newStatus: string, scopeNotes: string): Promise<any> {
    return this.request<any>(`/admin/verifications/${orgId}/decision`, {
      method: "POST",
      body: JSON.stringify({ newStatus, scopeNotes })
    });
  }

  async getAuditLogs(page = 1): Promise<{ data: any[]; meta: any }> {
    const res = await fetch(`${API_BASE}/admin/audit-logs?page=${page}`, {
      headers: { ...this.getAuthHeader() }
    });
    const json = await res.json();
    return { data: json.data || [], meta: json.meta || {} };
  }

  // --- Rooftop Solar Module (Tamil Nadu Pilot) ---
  async calculateRooftopEstimate(params: {
    applicantType: RooftopApplicantType;
    monthlyBillInr: number;
    availableRoofAreaSqFt?: number;
    desiredCapacityKw?: number;
  }): Promise<RooftopEconomics> {
    return this.request<RooftopEconomics>("/rooftop/estimate", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }

  async getRooftopVendors(params: { district?: string; search?: string } = {}): Promise<RooftopVendor[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<RooftopVendor[]>(`/rooftop/vendors${query ? `?${query}` : ""}`);
  }

  async getRooftopCampaigns(): Promise<RooftopCampaign[]> {
    return this.request<RooftopCampaign[]>("/rooftop/campaigns");
  }

  async createRooftopProposal(data: any): Promise<{ proposal: RooftopProposal; economics: RooftopEconomics; forwardedVendors: RooftopVendor[] }> {
    return this.request<{ proposal: RooftopProposal; economics: RooftopEconomics; forwardedVendors: RooftopVendor[] }>("/rooftop/proposals", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async getRooftopProposals(params: { city?: string; applicantType?: string; phone?: string } = {}): Promise<RooftopProposal[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<RooftopProposal[]>(`/rooftop/proposals${query ? `?${query}` : ""}`);
  }

  async registerRooftopCampaign(data: any): Promise<CampaignSignup> {
    return this.request<CampaignSignup>("/rooftop/campaign-signup", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
}

export const api = new ApiService();
