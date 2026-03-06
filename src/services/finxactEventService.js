import { apiRequest } from './apiClient';

export const finxactEventService = {
  getEventContexts(period = '24h') {
    const filterQ = 'eventType~"ach"';
    return apiRequest('GET', `/model/v1/eventCtxt?filter.q=${encodeURIComponent(filterQ)}&filter.limit=500`);
  },

  getFailedEvents(period = '24h') {
    const filterQ = 'eventType~"ach",hasErr==true';
    return apiRequest('GET', `/model/v1/eventCtxt?filter.q=${encodeURIComponent(filterQ)}&filter.orderBy=-createDtm&filter.limit=100`);
  },

  getEventErrors(eventId, msgDirection, channelId) {
    return apiRequest('GET', `/model/v1/eventCtxt/${eventId}/${msgDirection}/${channelId}/errInfo`);
  },

  getACHFileTimings() {
    return apiRequest('GET', '/model/v1/batchFile?filter.q=batchType==6&filter.orderBy=-fileDtm&filter.limit=10');
  },

  getFIRDStatus() {
    // Custom internal endpoint — not FinXact
    return apiRequest('GET', '/internal/fird/status');
  },
};
