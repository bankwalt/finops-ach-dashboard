import { finxactEventService } from './finxactEventService';
import { finxactCalendarService } from './finxactCalendarService';
import { mockEventService, mockCalendarService } from './mockProvider';
import { alacrtiService } from './alacrtiMockProvider';
import { transactionService } from './transactionMockProvider';

export function getServices(apiMode) {
  if (apiMode === 'real') {
    return {
      events: finxactEventService,
      calendar: finxactCalendarService,
      alacriti: alacrtiService,
      transactions: transactionService,
    };
  }
  return {
    events: mockEventService,
    calendar: mockCalendarService,
    alacriti: alacrtiService,
    transactions: transactionService,
  };
}
