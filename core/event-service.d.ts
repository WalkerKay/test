import { NgxSlateEvent } from '../constants/event-handlers';
import { Subject, Observable } from 'rxjs';
export declare class SlaEventService {
    fromSlaEvents(element: HTMLElement, $destroy: Subject<any>): Observable<{
        event: Event;
        eventEntity: NgxSlateEvent;
    }>;
}
