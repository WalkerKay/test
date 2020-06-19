import { Injectable } from '@angular/core';
import { NGX_SLATE_EVENTS } from '../constants/event-handlers';
import { fromEvent, merge } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import * as i0 from "@angular/core";
export class SlaEventService {
    fromSlaEvents(element, $destroy) {
        return merge(...NGX_SLATE_EVENTS.map((eventEntity) => {
            return fromEvent(element, eventEntity.name).pipe(map(event => {
                return { event, eventEntity };
            }));
        })).pipe(takeUntil($destroy));
    }
}
SlaEventService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
SlaEventService.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function SlaEventService_Factory() { return new SlaEventService(); }, token: SlaEventService, providedIn: "root" });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbImNvcmUvZXZlbnQtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBaUIsTUFBTSw2QkFBNkIsQ0FBQztBQUM5RSxPQUFPLEVBQUUsU0FBUyxFQUFXLEtBQUssRUFBYyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDOztBQUtoRCxNQUFNLE9BQU8sZUFBZTtJQUN4QixhQUFhLENBQUMsT0FBb0IsRUFBRSxRQUFzQjtRQUN0RCxPQUFPLEtBQUssQ0FDUixHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQTBCLEVBQUUsRUFBRTtZQUNuRCxPQUFPLFNBQVMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDNUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNSLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQ0wsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUNMLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7OztZQWRKLFVBQVUsU0FBQztnQkFDUixVQUFVLEVBQUUsTUFBTTthQUNyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5HWF9TTEFURV9FVkVOVFMsIE5neFNsYXRlRXZlbnQgfSBmcm9tICcuLi9jb25zdGFudHMvZXZlbnQtaGFuZGxlcnMnO1xuaW1wb3J0IHsgZnJvbUV2ZW50LCBTdWJqZWN0LCBtZXJnZSwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgdGFrZVVudGlsLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgU2xhRXZlbnRTZXJ2aWNlIHtcbiAgICBmcm9tU2xhRXZlbnRzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCAkZGVzdHJveTogU3ViamVjdDxhbnk+KTogT2JzZXJ2YWJsZTx7IGV2ZW50OiBFdmVudDsgZXZlbnRFbnRpdHk6IE5neFNsYXRlRXZlbnQgfT4ge1xuICAgICAgICByZXR1cm4gbWVyZ2UoXG4gICAgICAgICAgICAuLi5OR1hfU0xBVEVfRVZFTlRTLm1hcCgoZXZlbnRFbnRpdHk6IE5neFNsYXRlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50RW50aXR5Lm5hbWUpLnBpcGUoXG4gICAgICAgICAgICAgICAgICAgIG1hcChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBldmVudCwgZXZlbnRFbnRpdHkgfTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKS5waXBlKHRha2VVbnRpbCgkZGVzdHJveSkpO1xuICAgIH1cbn1cbiJdfQ==