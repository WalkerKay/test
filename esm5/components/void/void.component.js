import { Component, Input, ElementRef, ViewContainerRef, QueryList, HostBinding } from '@angular/core';
import { Selection, Editor, Block } from 'slate';
import { List, Map } from 'immutable';
import DATA_ATTRS from '../../constants/data-attributes';
import { setNodeStyles, setNodeAttributes } from '../../utils/attributes';
var SlaVoidComponent = /** @class */ (function () {
    function SlaVoidComponent(viewContainerRef, elementRef) {
        this.viewContainerRef = viewContainerRef;
        this.elementRef = elementRef;
        this.readOnly = false;
        this.void = 'true';
        this.key = '';
    }
    Object.defineProperty(SlaVoidComponent.prototype, "node", {
        get: function () {
            return this.internalNode;
        },
        set: function (value) {
            this.internalNode = value;
            if (this.nodeComponentRef) {
                this.nodeComponentRef.componentRef.instance.node = this.internalNode;
            }
        },
        enumerable: true,
        configurable: true
    });
    SlaVoidComponent.prototype.ngOnInit = function () {
        this.render();
        this.key = this.node.key;
        if (this.node.object === 'inline') {
            this.elementRef.nativeElement.contentEditable = 'false';
        }
    };
    SlaVoidComponent.prototype.createElement = function () {
        var tag = this.node.object === 'block' ? 'div' : 'span';
        return document.createElement(tag);
    };
    SlaVoidComponent.prototype.render = function () {
        if (!this.readOnly) {
            this.elementRef.nativeElement.appendChild(this.renderSpacer());
        }
        else {
            this.children.remove();
        }
        this.elementRef.nativeElement.appendChild(this.renderContent());
    };
    SlaVoidComponent.prototype.renderSpacer = function () {
        var _a;
        var style = {
            height: '0',
            color: 'transparent',
            outline: 'none',
            position: 'absolute',
        };
        var spacerAttrs = (_a = {},
            _a[DATA_ATTRS.SPACER] = 'true',
            _a);
        var spacer = this.createElement();
        setNodeStyles(spacer, style);
        setNodeAttributes(spacer, spacerAttrs);
        spacer.appendChild(this.nodeRefs.first.rootNode);
        return spacer;
    };
    SlaVoidComponent.prototype.renderContent = function () {
        var content = this.createElement();
        content.setAttribute("contentEditable", this.readOnly ? null : 'false');
        content.appendChild(this.children);
        return content;
    };
    SlaVoidComponent.decorators = [
        { type: Component, args: [{
                    selector: 'div[slaVoid]',
                    template: ""
                }] }
    ];
    /** @nocollapse */
    SlaVoidComponent.ctorParameters = function () { return [
        { type: ViewContainerRef },
        { type: ElementRef }
    ]; };
    SlaVoidComponent.propDecorators = {
        editor: [{ type: Input }],
        selection: [{ type: Input }],
        parent: [{ type: Input }],
        block: [{ type: Input }],
        decorations: [{ type: Input }],
        annotations: [{ type: Input }],
        children: [{ type: Input }],
        nodeRef: [{ type: Input }],
        readOnly: [{ type: Input }],
        nodeRefs: [{ type: Input }],
        node: [{ type: Input }],
        void: [{ type: HostBinding, args: ['attr.data-slate-void',] }],
        key: [{ type: HostBinding, args: ['attr.data-key',] }]
    };
    return SlaVoidComponent;
}());
export { SlaVoidComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pZC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJjb21wb25lbnRzL3ZvaWQvdm9pZC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFDVCxLQUFLLEVBRUwsVUFBVSxFQUNWLGdCQUFnQixFQUVoQixTQUFTLEVBQ1QsV0FBVyxFQUNkLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFFSCxTQUFTLEVBR1QsTUFBTSxFQUNOLEtBQUssRUFLUixNQUFNLE9BQU8sQ0FBQztBQUNmLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBSXRDLE9BQU8sVUFBVSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3pELE9BQU8sRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUcxRTtJQTBESSwwQkFDWSxnQkFBa0MsRUFDbEMsVUFBMkI7UUFEM0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxlQUFVLEdBQVYsVUFBVSxDQUFpQjtRQXpCdkMsYUFBUSxHQUFHLEtBQUssQ0FBQztRQWtCakIsU0FBSSxHQUFHLE1BQU0sQ0FBQztRQUdkLFFBQUcsR0FBRyxFQUFFLENBQUM7SUFLTCxDQUFDO0lBckJMLHNCQUNJLGtDQUFJO2FBT1I7WUFDSSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDN0IsQ0FBQzthQVZELFVBQ1MsS0FBVTtZQUNmLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO2dCQUN2QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQzthQUN4RTtRQUNMLENBQUM7OztPQUFBO0lBaUJELG1DQUFRLEdBQVI7UUFDSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3pCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQy9CLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUM7U0FDM0Q7SUFDTCxDQUFDO0lBRUQsd0NBQWEsR0FBYjtRQUNJLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDMUQsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxpQ0FBTSxHQUFOO1FBQ0ksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1NBQ2xFO2FBQU07WUFDSCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQzFCO1FBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCx1Q0FBWSxHQUFaOztRQUNJLElBQU0sS0FBSyxHQUFHO1lBQ1YsTUFBTSxFQUFFLEdBQUc7WUFDWCxLQUFLLEVBQUUsYUFBYTtZQUNwQixPQUFPLEVBQUUsTUFBTTtZQUNmLFFBQVEsRUFBRSxVQUFVO1NBQ3ZCLENBQUM7UUFDRixJQUFNLFdBQVc7WUFDYixHQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUcsTUFBTTtlQUM5QixDQUFDO1FBQ0YsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3BDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0IsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELHdDQUFhLEdBQWI7UUFDSSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckMsT0FBTyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hFLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7O2dCQTNHSixTQUFTLFNBQUM7b0JBQ1AsUUFBUSxFQUFFLGNBQWM7b0JBQ3hCLFlBQW9DO2lCQUN2Qzs7OztnQkE1QkcsZ0JBQWdCO2dCQURoQixVQUFVOzs7eUJBb0NULEtBQUs7NEJBR0wsS0FBSzt5QkFHTCxLQUFLO3dCQUdMLEtBQUs7OEJBR0wsS0FBSzs4QkFHTCxLQUFLOzJCQUdMLEtBQUs7MEJBR0wsS0FBSzsyQkFHTCxLQUFLOzJCQUdMLEtBQUs7dUJBR0wsS0FBSzt1QkFZTCxXQUFXLFNBQUMsc0JBQXNCO3NCQUdsQyxXQUFXLFNBQUMsZUFBZTs7SUFzRGhDLHVCQUFDO0NBQUEsQUE3R0QsSUE2R0M7U0F6R1ksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDb21wb25lbnQsXG4gICAgSW5wdXQsXG4gICAgT25Jbml0LFxuICAgIEVsZW1lbnRSZWYsXG4gICAgVmlld0NvbnRhaW5lclJlZixcbiAgICBFbWJlZGRlZFZpZXdSZWYsXG4gICAgUXVlcnlMaXN0LFxuICAgIEhvc3RCaW5kaW5nXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudCxcbiAgICBTZWxlY3Rpb24sXG4gICAgUGF0aFV0aWxzLFxuICAgIE5vZGUsXG4gICAgRWRpdG9yLFxuICAgIEJsb2NrLFxuICAgIElubGluZSxcbiAgICBEZWNvcmF0aW9uLFxuICAgIEFubm90YXRpb24sXG4gICAgVGV4dFxufSBmcm9tICdzbGF0ZSc7XG5pbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IHtcbiAgICBTbGFOZXN0ZWROb2RlUmVmLFxufSBmcm9tICcuLi8uLi9jb3JlL3JlbmRlci1wbHVnaW4vcmVuZGVyLWNvbmZpZyc7XG5pbXBvcnQgREFUQV9BVFRSUyBmcm9tICcuLi8uLi9jb25zdGFudHMvZGF0YS1hdHRyaWJ1dGVzJztcbmltcG9ydCB7IHNldE5vZGVTdHlsZXMsIHNldE5vZGVBdHRyaWJ1dGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvYXR0cmlidXRlcyc7XG5cblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdkaXZbc2xhVm9pZF0nLFxuICAgIHRlbXBsYXRlVXJsOiAnLi92b2lkLmNvbXBvbmVudC5odG1sJyxcbn0pXG5leHBvcnQgY2xhc3MgU2xhVm9pZENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cbiAgICBpbnRlcm5hbE5vZGU6IGFueTtcblxuICAgIG5vZGVDb21wb25lbnRSZWY6IFNsYU5lc3RlZE5vZGVSZWY7XG5cbiAgICBASW5wdXQoKVxuICAgIGVkaXRvcjogRWRpdG9yO1xuXG4gICAgQElucHV0KClcbiAgICBzZWxlY3Rpb246IFNlbGVjdGlvbjtcblxuICAgIEBJbnB1dCgpXG4gICAgcGFyZW50OiBEb2N1bWVudCB8IEJsb2NrIHwgSW5saW5lO1xuXG4gICAgQElucHV0KClcbiAgICBibG9jazogQmxvY2s7XG5cbiAgICBASW5wdXQoKVxuICAgIGRlY29yYXRpb25zOiBMaXN0PERlY29yYXRpb24+O1xuXG4gICAgQElucHV0KClcbiAgICBhbm5vdGF0aW9uczogTWFwPHN0cmluZywgQW5ub3RhdGlvbj47XG5cbiAgICBASW5wdXQoKVxuICAgIGNoaWxkcmVuOiBIVE1MRWxlbWVudDtcblxuICAgIEBJbnB1dCgpXG4gICAgbm9kZVJlZjogKG5vZGVSZWY6IGFueSkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICBASW5wdXQoKVxuICAgIG5vZGVSZWZzOiBRdWVyeUxpc3Q8YW55PjtcblxuICAgIEBJbnB1dCgpXG4gICAgc2V0IG5vZGUodmFsdWU6IGFueSkge1xuICAgICAgICB0aGlzLmludGVybmFsTm9kZSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5ub2RlQ29tcG9uZW50UmVmKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVDb21wb25lbnRSZWYuY29tcG9uZW50UmVmLmluc3RhbmNlLm5vZGUgPSB0aGlzLmludGVybmFsTm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBub2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcm5hbE5vZGU7XG4gICAgfVxuXG4gICAgQEhvc3RCaW5kaW5nKCdhdHRyLmRhdGEtc2xhdGUtdm9pZCcpXG4gICAgdm9pZCA9ICd0cnVlJztcblxuICAgIEBIb3N0QmluZGluZygnYXR0ci5kYXRhLWtleScpXG4gICAga2V5ID0gJyc7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgICBwcml2YXRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8YW55PlxuICAgICkgeyB9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5rZXkgPSB0aGlzLm5vZGUua2V5O1xuICAgICAgICBpZiAodGhpcy5ub2RlLm9iamVjdCA9PT0gJ2lubGluZScpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSA9ICdmYWxzZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBjb25zdCB0YWcgPSB0aGlzLm5vZGUub2JqZWN0ID09PSAnYmxvY2snID8gJ2RpdicgOiAnc3Bhbic7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAoIXRoaXMucmVhZE9ubHkpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucmVuZGVyU3BhY2VyKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnJlbmRlckNvbnRlbnQoKSk7XG4gICAgfVxuXG4gICAgcmVuZGVyU3BhY2VyKCkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgICAgIGhlaWdodDogJzAnLFxuICAgICAgICAgICAgY29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgc3BhY2VyQXR0cnMgPSB7XG4gICAgICAgICAgICBbREFUQV9BVFRSUy5TUEFDRVJdOiAndHJ1ZScsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHNwYWNlciA9IHRoaXMuY3JlYXRlRWxlbWVudCgpO1xuICAgICAgICBzZXROb2RlU3R5bGVzKHNwYWNlciwgc3R5bGUpO1xuICAgICAgICBzZXROb2RlQXR0cmlidXRlcyhzcGFjZXIsIHNwYWNlckF0dHJzKTtcbiAgICAgICAgc3BhY2VyLmFwcGVuZENoaWxkKHRoaXMubm9kZVJlZnMuZmlyc3Qucm9vdE5vZGUpO1xuICAgICAgICByZXR1cm4gc3BhY2VyO1xuICAgIH1cblxuICAgIHJlbmRlckNvbnRlbnQoKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNyZWF0ZUVsZW1lbnQoKTtcbiAgICAgICAgY29udGVudC5zZXRBdHRyaWJ1dGUoYGNvbnRlbnRFZGl0YWJsZWAsIHRoaXMucmVhZE9ubHkgPyBudWxsIDogJ2ZhbHNlJyk7XG4gICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGhpcy5jaGlsZHJlbik7XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cblxufVxuIl19