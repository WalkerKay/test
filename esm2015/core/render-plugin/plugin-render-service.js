import { Injectable, ComponentFactoryResolver, QueryList } from '@angular/core';
import { SlaNestedNodeRef } from './render-config';
import * as i0 from "@angular/core";
export class SlaPluginRenderService {
    constructor(cfr) {
        this.cfr = cfr;
    }
    renderDom(tagName, children, attributes, styles) {
        const node = document.createElement(tagName);
        this.setNodeAttributes(node, attributes);
        if (styles) {
            this.setNodeStyles(node, styles);
        }
        if (children instanceof HTMLCollection) {
            for (let index = 0; index < children.length; index++) {
                const element = children.item(index);
                node.appendChild(element);
            }
            return node;
        }
        if (children instanceof HTMLElement) {
            node.appendChild(children);
            return node;
        }
        if (children instanceof QueryList) {
            const nodeRefs = children.toArray();
            for (const nodeRef of nodeRefs) {
                node.appendChild(nodeRef.rootNode);
            }
            return node;
        }
        return node;
    }
    renderComponent(componentType, config) {
        const componentFactory = this.cfr.resolveComponentFactory(componentType);
        const componentRef = config.nodeViewContainerRef.createComponent(componentFactory);
        Object.assign(componentRef.instance, Object.assign({}, config));
        componentRef.changeDetectorRef.detectChanges();
        return new SlaNestedNodeRef(this.getComponentRootNode(componentRef), componentRef);
    }
    setNodeAttributes(ele, attributes) {
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                ele.setAttribute(key, attributes[key]);
            }
        }
    }
    setNodeStyles(ele, styles) {
        for (const key in styles) {
            if (styles.hasOwnProperty(key)) {
                ele.style[key] = styles[key];
            }
        }
    }
    getComponentRootNode(componentRef) {
        return componentRef.hostView.rootNodes[0];
    }
}
SlaPluginRenderService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
/** @nocollapse */
SlaPluginRenderService.ctorParameters = () => [
    { type: ComponentFactoryResolver }
];
SlaPluginRenderService.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function SlaPluginRenderService_Factory() { return new SlaPluginRenderService(i0.ɵɵinject(i0.ComponentFactoryResolver)); }, token: SlaPluginRenderService, providedIn: "root" });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLXJlbmRlci1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsiY29yZS9yZW5kZXItcGx1Z2luL3BsdWdpbi1yZW5kZXItc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFpQyxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDL0csT0FBTyxFQUF1QixnQkFBZ0IsRUFBRSxNQUFNLGlCQUFpQixDQUFDOztBQU14RSxNQUFNLE9BQU8sc0JBQXNCO0lBQy9CLFlBQW9CLEdBQTZCO1FBQTdCLFFBQUcsR0FBSCxHQUFHLENBQTBCO0lBQUcsQ0FBQztJQUM5QyxTQUFTLENBQ1osT0FBZSxFQUNmLFFBQWEsRUFDYixVQUFxQyxFQUNyQyxNQUFrQztRQUVsQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekMsSUFBSSxNQUFNLEVBQUU7WUFDUixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNwQztRQUVELElBQUksUUFBUSxZQUFZLGNBQWMsRUFBRTtZQUNwQyxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDbEQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUM3QjtZQUNELE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxJQUFJLFFBQVEsWUFBWSxXQUFXLEVBQUU7WUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsSUFBSSxRQUFRLFlBQVksU0FBUyxFQUFFO1lBQy9CLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdEM7WUFDRCxPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLGVBQWUsQ0FBQyxhQUFpQyxFQUFFLE1BQTJCO1FBQ2pGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RSxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbkYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxvQkFBTyxNQUFNLEVBQUcsQ0FBQztRQUNwRCxZQUFZLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDL0MsT0FBTyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRU8saUJBQWlCLENBQUMsR0FBZ0IsRUFBRSxVQUFxQztRQUM3RSxLQUFLLE1BQU0sR0FBRyxJQUFJLFVBQVUsRUFBRTtZQUMxQixJQUFJLFVBQVUsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2hDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzFDO1NBQ0o7SUFDTCxDQUFDO0lBRU8sYUFBYSxDQUFDLEdBQWdCLEVBQUUsTUFBaUM7UUFDckUsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUU7WUFDdEIsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM1QixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNoQztTQUNKO0lBQ0wsQ0FBQztJQUVPLG9CQUFvQixDQUFDLFlBQStCO1FBQ3hELE9BQVEsWUFBWSxDQUFDLFFBQWlDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztJQUN2RixDQUFDOzs7WUFoRUosVUFBVSxTQUFDO2dCQUNSLFVBQVUsRUFBRSxNQUFNO2FBQ3JCOzs7O1lBTm9CLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgRW1iZWRkZWRWaWV3UmVmLCBDb21wb25lbnRSZWYsIFF1ZXJ5TGlzdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgU2xhTm9kZVJlbmRlckNvbmZpZywgU2xhTmVzdGVkTm9kZVJlZiB9IGZyb20gJy4vcmVuZGVyLWNvbmZpZyc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgU2xhUGx1Z2luUmVuZGVyU2VydmljZSB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBjZnI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcikge31cbiAgICBwdWJsaWMgcmVuZGVyRG9tKFxuICAgICAgICB0YWdOYW1lOiBzdHJpbmcsXG4gICAgICAgIGNoaWxkcmVuOiBhbnksXG4gICAgICAgIGF0dHJpYnV0ZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sXG4gICAgICAgIHN0eWxlcz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH1cbiAgICApOiBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgICAgICB0aGlzLnNldE5vZGVBdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpO1xuICAgICAgICBpZiAoc3R5bGVzKSB7XG4gICAgICAgICAgICB0aGlzLnNldE5vZGVTdHlsZXMobm9kZSwgc3R5bGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGlsZHJlbiBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkcmVuLml0ZW0oaW5kZXgpO1xuICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGRyZW4gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZHJlbik7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGRyZW4gaW5zdGFuY2VvZiBRdWVyeUxpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVSZWZzID0gY2hpbGRyZW4udG9BcnJheSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBub2RlUmVmIG9mIG5vZGVSZWZzKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChub2RlUmVmLnJvb3ROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXJDb21wb25lbnQoY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZTxhbnk+LCBjb25maWc6IFNsYU5vZGVSZW5kZXJDb25maWcpOiBTbGFOZXN0ZWROb2RlUmVmIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IHRoaXMuY2ZyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudFR5cGUpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRSZWYgPSBjb25maWcubm9kZVZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudEZhY3RvcnkpO1xuICAgICAgICBPYmplY3QuYXNzaWduKGNvbXBvbmVudFJlZi5pbnN0YW5jZSwgeyAuLi5jb25maWcgfSk7XG4gICAgICAgIGNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHJldHVybiBuZXcgU2xhTmVzdGVkTm9kZVJlZih0aGlzLmdldENvbXBvbmVudFJvb3ROb2RlKGNvbXBvbmVudFJlZiksIGNvbXBvbmVudFJlZik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXROb2RlQXR0cmlidXRlcyhlbGU6IEhUTUxFbGVtZW50LCBhdHRyaWJ1dGVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9KSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBlbGUuc2V0QXR0cmlidXRlKGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0Tm9kZVN0eWxlcyhlbGU6IEhUTUxFbGVtZW50LCBzdHlsZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0pIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gc3R5bGVzKSB7XG4gICAgICAgICAgICBpZiAoc3R5bGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBlbGUuc3R5bGVba2V5XSA9IHN0eWxlc1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRSb290Tm9kZShjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogSFRNTEVsZW1lbnQge1xuICAgICAgICByZXR1cm4gKGNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55Pikucm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICAgIH1cbn1cbiJdfQ==