const auth = "/auth";
const admin = "/admin";
const sites = "/sites";
const labours = "/labours";
const finance = "/finance";
const materials = "/materials";
const quotations = "/quotations";
const invoices = "/invoices";
const raBills = "/ra-bills";
const labourAdvances = "/labour-advances";
const milestones = "/milestones";
const siteDocuments = "/site-documents";
const vendors = "/vendors";
const equipment = "/equipment";
const safetyIncidents = "/safety-incidents";
const auditLogs = "/audit-logs";

const apiEndpoints = {
  // auth
  login: `${auth}/login`,
  logout: `${auth}/logout`,

  // profile
  changePasswordSuperAdmin: `${admin}/change-password`,
  adminProfile: `${admin}/profile`,
  dashboardStats: `${admin}/dashboard-stats`,

  // Public client portal (no auth)
  portal: {
    byToken: (token: string) => `/portal/${token}`,
  },

  // sites
  sites: {
    base: `${sites}`,
    byId: (id: string) => `${sites}/${id}`,
    portal: (id: string) => `${sites}/${id}/portal`,
    assignLabour: `${sites}/assign-labour`,
    labour: (siteId: string) => `${sites}/${siteId}/labour`,
    attendance: `${sites}/attendance`,
    getAttendance: (siteId: string) => `${sites}/${siteId}/attendance`,
    attendanceSummary: (siteId: string) => `${sites}/${siteId}/attendance/summary`,
    labourCalendar: (siteId: string, labourId: string) =>
      `${sites}/${siteId}/labour/${labourId}/calendar`,
    logs: `${sites}/logs`,
    getLogs: (siteId: string) => `${sites}/${siteId}/logs`,
    stats: (id: string) => `${sites}/${id}/stats`,
  },

  // labours
  labours: {
    base: `${labours}`,
    byId: (id: string) => `${labours}/${id}`,
  },

  // finance
  finance: {
    base: `${finance}`,
    byId: (id: string) => `${finance}/${id}`,
    approve: (id: string) => `${finance}/${id}/approve`,
    reject: (id: string) => `${finance}/${id}/reject`,
    pendingApprovals: `${finance}/pending-approvals`,
  },

  // materials
  materials: {
    base: `${materials}`,
    log: `${materials}/log`,
    transfer: `${materials}/transfer`,
    logs: `${materials}/logs`,
    logById: (id: string) => `${materials}/logs/${id}`,
    byId: (id: string) => `${materials}/${id}`,
  },

  // quotations
  quotations: {
    base: `${quotations}`,
    byId: (id: string) => `${quotations}/${id}`,
  },

  // invoices (GST tax invoices)
  invoices: {
    base: `${invoices}`,
    byId: (id: string) => `${invoices}/${id}`,
    payment: (id: string) => `${invoices}/${id}/payments`,
  },

  // RA bills (Running Account)
  raBills: {
    base: `${raBills}`,
    byId: (id: string) => `${raBills}/${id}`,
    seed: `${raBills}/seed`,
  },

  // Labour advances
  labourAdvances: {
    base: `${labourAdvances}`,
    byId: (id: string) => `${labourAdvances}/${id}`,
  },

  // Milestones
  milestones: {
    base: `${milestones}`,
    byId: (id: string) => `${milestones}/${id}`,
    reorder: `${milestones}/reorder`,
  },

  // Site documents
  siteDocuments: {
    base: `${siteDocuments}`,
    byId: (id: string) => `${siteDocuments}/${id}`,
  },

  // Vendors
  vendors: {
    base: `${vendors}`,
    byId: (id: string) => `${vendors}/${id}`,
    payment: (id: string) => `${vendors}/${id}/payments`,
    bill: (id: string) => `${vendors}/${id}/bills`,
  },

  // Equipment
  equipment: {
    base: `${equipment}`,
    byId: (id: string) => `${equipment}/${id}`,
    logs: `${equipment}/logs`,
    logById: (id: string) => `${equipment}/${id}/logs`,
  },

  // Safety incidents
  safetyIncidents: {
    base: `${safetyIncidents}`,
    byId: (id: string) => `${safetyIncidents}/${id}`,
  },

  // Audit logs
  auditLogs: {
    base: `${auditLogs}`,
  },

  // Super-admin builder management
  superAdmin: {
    builders: "/super-admin/builders",
    builderById: (id: string) => `/super-admin/builders/${id}`,
    approve: (id: string) => `/super-admin/builders/${id}/approve`,
    deny: (id: string) => `/super-admin/builders/${id}/deny`,
    suspend: (id: string) => `/super-admin/builders/${id}/suspend`,
    reinstate: (id: string) => `/super-admin/builders/${id}/reinstate`,
    verifyEmail: (id: string) => `/super-admin/builders/${id}/verify-email`,
    permissions: (id: string) => `/super-admin/builders/${id}/permissions`,
    delete: (id: string) => `/super-admin/builders/${id}`,
  },
};

export default apiEndpoints;
