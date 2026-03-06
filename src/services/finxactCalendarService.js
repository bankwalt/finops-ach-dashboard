import { apiRequest } from './apiClient';

export const finxactCalendarService = {
  getACHCalendars() {
    const filterQ = 'eventType~"ach"';
    return apiRequest('GET', `/model/v1/systemCalendar?filter.q=${encodeURIComponent(filterQ)}`);
  },
};
