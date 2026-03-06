import {
  MOCK_EVENT_SUMMARY,
  MOCK_SYSTEM_CALENDARS,
  MOCK_FAILED_EVENTS,
  MOCK_ACH_FILE_TIMINGS,
  MOCK_FIRD_STATUS,
} from '../data/mockData';

function delay(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 300));
}

function response(data, method, path, status = 200) {
  return {
    data,
    status,
    duration: Math.round(300 + Math.random() * 400),
    method,
    path,
    requestBody: null,
    ok: status >= 200 && status < 300,
  };
}

export const mockEventService = {
  async getEventContexts(period = '24h') {
    await delay();
    const key = period === '5d' ? 'last5d' : 'last24h';
    return response(MOCK_EVENT_SUMMARY[key], 'GET', '/model/v1/eventCtxt?filter.q=eventType~"ach"');
  },

  async getFailedEvents(period = '24h') {
    await delay(500);
    const cutoffMs = period === '5d' ? 5 * 86400000 : 86400000;
    const cutoff = new Date(Date.now() - cutoffMs);
    const filtered = MOCK_FAILED_EVENTS.filter(e => new Date(e.createDtm) >= cutoff);
    return response(filtered, 'GET', '/model/v1/eventCtxt?filter.q=eventType~"ach",hasErr==true');
  },

  async getEventErrors(eventId, msgDirection, channelId) {
    await delay(300);
    const event = MOCK_FAILED_EVENTS.find(e => e.eventId === eventId);
    const path = `/model/v1/eventCtxt/${eventId}/${msgDirection}/${channelId}/errInfo`;
    if (event?.errInfo) {
      return response(event.errInfo, 'GET', path);
    }
    return response({ error: 'Not found' }, 'GET', path, 404);
  },

  async getACHFileTimings() {
    await delay();
    return response(MOCK_ACH_FILE_TIMINGS, 'GET', '/model/v1/batchFile?filter.q=batchType==6');
  },

  async getFIRDStatus() {
    await delay(200);
    return response(MOCK_FIRD_STATUS, 'GET', '/internal/fird/status');
  },
};

export const mockCalendarService = {
  async getACHCalendars() {
    await delay();
    return response(MOCK_SYSTEM_CALENDARS, 'GET', '/model/v1/systemCalendar?filter.q=eventType~"ach"');
  },
};
