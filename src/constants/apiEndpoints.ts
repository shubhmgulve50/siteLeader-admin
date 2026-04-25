const auth = "/auth";
const admin = "/admin";
const sites = "/sites";
const labours = "/labours";
const finance = "/finance";
const materials = "/materials";
const quotations = "/quotations";

const apiEndpoints = {
  // auth
  login: `${auth}/login`,
  logout: `${auth}/logout`,

  // profile
  changePasswordSuperAdmin: `${admin}/change-password`,
  adminProfile: `${admin}/profile`,
  dashboardStats: `${admin}/dashboard-stats`,

  // sites
  sites: {
    base: `${sites}`,
    byId: (id: string) => `${sites}/${id}`,
    assignLabour: `${sites}/assign-labour`,
    labour: (siteId: string) => `${sites}/${siteId}/labour`,
    attendance: `${sites}/attendance`,
    getAttendance: (siteId: string) => `${sites}/${siteId}/attendance`,
    attendanceSummary: (siteId: string) => `${sites}/${siteId}/attendance/summary`,
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
  },

  // materials
  materials: {
    base: `${materials}`,
    log: `${materials}/log`,
    logs: `${materials}/logs`,
    byId: (id: string) => `${materials}/${id}`,
  },

  // quotations
  quotations: {
    base: `${quotations}`,
    byId: (id: string) => `${quotations}/${id}`,
  },
};

export default apiEndpoints;
