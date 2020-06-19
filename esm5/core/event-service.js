import * as tslib_1 from "tslib";
import { Injectable } from '@angular/core';
import { NGX_SLATE_EVENTS } from '../constants/event-handlers';
import { fromEvent, merge } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import * as i0 from "@angular/core";
var SlaEventService = /** @class */ (function () {
    function SlaEventService() {
    }
    SlaEventService.prototype.fromSlaEvents = function (element, $destroy) {
        return merge.apply(void 0, tslib_1.__spread(NGX_SLATE_EVENTS.map(function (eventEntity) {
            return fromEvent(element, eventEntity.name).pipe(map(function (event) {
                return { event: event, eventEntity: eventEntity };
            }));
        }))).pipe(takeUntil($destroy));
    };
    SlaEventService.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root'
                },] }
    ];
    SlaEventService.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function SlaEventService_Factory() { return new SlaEventService(); }, token: SlaEventService, providedIn: "root" });
    return SlaEventService;
}());
export { SlaEventService };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbImNvcmUvZXZlbnQtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sNkJBQTZCLENBQUM7QUFDOUUsT0FBTyxFQUFFLFNBQVMsRUFBVyxLQUFLLEVBQWMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7QUFFaEQ7SUFBQTtLQWVDO0lBWEcsdUNBQWEsR0FBYixVQUFjLE9BQW9CLEVBQUUsUUFBc0I7UUFDdEQsT0FBTyxLQUFLLGdDQUNMLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxVQUFDLFdBQTBCO1lBQy9DLE9BQU8sU0FBUyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUM1QyxHQUFHLENBQUMsVUFBQSxLQUFLO2dCQUNMLE9BQU8sRUFBRSxLQUFLLE9BQUEsRUFBRSxXQUFXLGFBQUEsRUFBRSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUNMLENBQUM7UUFDTixDQUFDLENBQUMsR0FDSixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDaEMsQ0FBQzs7Z0JBZEosVUFBVSxTQUFDO29CQUNSLFVBQVUsRUFBRSxNQUFNO2lCQUNyQjs7OzBCQVBEO0NBb0JDLEFBZkQsSUFlQztTQVpZLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBOR1hfU0xBVEVfRVZFTlRTLCBOZ3hTbGF0ZUV2ZW50IH0gZnJvbSAnLi4vY29uc3RhbnRzL2V2ZW50LWhhbmRsZXJzJztcbmltcG9ydCB7IGZyb21FdmVudCwgU3ViamVjdCwgbWVyZ2UsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IHRha2VVbnRpbCwgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFNsYUV2ZW50U2VydmljZSB7XG4gICAgZnJvbVNsYUV2ZW50cyhlbGVtZW50OiBIVE1MRWxlbWVudCwgJGRlc3Ryb3k6IFN1YmplY3Q8YW55Pik6IE9ic2VydmFibGU8eyBldmVudDogRXZlbnQ7IGV2ZW50RW50aXR5OiBOZ3hTbGF0ZUV2ZW50IH0+IHtcbiAgICAgICAgcmV0dXJuIG1lcmdlKFxuICAgICAgICAgICAgLi4uTkdYX1NMQVRFX0VWRU5UUy5tYXAoKGV2ZW50RW50aXR5OiBOZ3hTbGF0ZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZyb21FdmVudChlbGVtZW50LCBldmVudEVudGl0eS5uYW1lKS5waXBlKFxuICAgICAgICAgICAgICAgICAgICBtYXAoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgZXZlbnQsIGV2ZW50RW50aXR5IH07XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICkucGlwZSh0YWtlVW50aWwoJGRlc3Ryb3kpKTtcbiAgICB9XG59XG4iXX0=