import api from './axiosInstance'
import type {
  ClinicalTaxonomy,
  Device,
  OrgPlanUsage,
  Organization,
  PaginatedResponse,
  Protocol,
  ProtocolGroup,
  ReferralDestination,
  Site,
} from '../types'

// ── Organization Settings ────────────────────────────────────────────

export const orgApi = {
  getSettings: async () => {
    const { data } = await api.get<Organization>('/org/')
    return data
  },

  updateSettings: async (payload: Partial<Organization>) => {
    const { data } = await api.patch<Organization>('/org/', payload)
    return data
  },

  getPlanUsage: async () => {
    const { data } = await api.get<OrgPlanUsage>('/org/plan/')
    return data
  },
}

// ── Sites ────────────────────────────────────────────────────────────

export const sitesApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Site>>('/sites/', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<Site>(`/sites/${id}/`)
    return data
  },

  create: async (payload: Partial<Site>) => {
    const { data } = await api.post<Site>('/sites/', payload)
    return data
  },

  update: async (id: string, payload: Partial<Site>) => {
    const { data } = await api.patch<Site>(`/sites/${id}/`, payload)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/sites/${id}/`)
  },
}

// ── Devices ──────────────────────────────────────────────────────────

export const devicesApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Device>>('/devices/', { params })
    return data
  },

  create: async (payload: { siteId: string; identifier: string; cameraModel?: string; serialNumber?: string; captureNotes?: string }) => {
    const { data } = await api.post<Device>('/devices/', payload)
    return data
  },

  update: async (id: string, payload: Partial<Device>) => {
    const { data } = await api.patch<Device>(`/devices/${id}/`, payload)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/devices/${id}/`)
  },
}

// ── Referral Destinations ────────────────────────────────────────────

export const referralDestinationsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<ReferralDestination>>('/referral-destinations/', { params })
    return data
  },

  create: async (payload: Partial<ReferralDestination>) => {
    const { data } = await api.post<ReferralDestination>('/referral-destinations/', payload)
    return data
  },

  update: async (id: string, payload: Partial<ReferralDestination>) => {
    const { data } = await api.patch<ReferralDestination>(`/referral-destinations/${id}/`, payload)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/referral-destinations/${id}/`)
  },

  testContact: async (id: string) => {
    const { data } = await api.post(`/referral-destinations/${id}/test-contact/`)
    return data
  },
}

// ── Protocols ────────────────────────────────────────────────────────

export const protocolsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<ProtocolGroup[]>('/protocols/', { params })
    return data
  },

  create: async (payload: { name: string; severityLabel?: string; recommendedAction?: string; followUpIntervalDays?: number; urgency?: string }) => {
    const { data } = await api.post<Protocol>('/protocols/', payload)
    return data
  },

  newVersion: async (id: string) => {
    const { data } = await api.post<Protocol>(`/protocols/${id}/new-version/`)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/protocols/${id}/`)
  },
}

// ── Clinical Taxonomy ────────────────────────────────────────────────

export const taxonomyApi = {
  get: async () => {
    const { data } = await api.get<ClinicalTaxonomy>('/taxonomy/')
    return data
  },

  update: async (payload: Partial<ClinicalTaxonomy>) => {
    const { data } = await api.patch<ClinicalTaxonomy>('/taxonomy/', payload)
    return data
  },
}

// ── Legacy (keep backward compat) ────────────────────────────────────

export const tenantsApi = {
  listOrgs: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Organization>>('/tenants/organizations/', { params })
    return data
  },

  getOrg: async (id: string) => {
    const { data } = await api.get<Organization>(`/tenants/organizations/${id}/`)
    return data
  },

  createOrg: async (payload: Partial<Organization>) => {
    const { data } = await api.post<Organization>('/tenants/organizations/', payload)
    return data
  },

  updateOrg: async (id: string, payload: Partial<Organization>) => {
    const { data } = await api.patch<Organization>(`/tenants/organizations/${id}/`, payload)
    return data
  },

  listSites: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Site>>('/tenants/sites/', { params })
    return data
  },

  listDevices: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Device>>('/tenants/devices/', { params })
    return data
  },
}
