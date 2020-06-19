import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { PortalModule } from '@angular/cdk/portal';
import { SlaEditorComponent } from './components/editor/editor.component';
import { SlaContentComponent } from './components/content/content.component';
import { SlaNodeComponent } from './components/node/node.component';
import { SlaTextComponent } from './components/text/text.component';
import { SlaVoidComponent } from './components/void/void.component';
import { Rendering } from './plugins/angular/rendering';
var SlaEditorModule = /** @class */ (function () {
    function SlaEditorModule() {
    }
    SlaEditorModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [SlaEditorComponent, SlaContentComponent, SlaNodeComponent, SlaVoidComponent, SlaTextComponent],
                    imports: [BrowserModule, PortalModule],
                    exports: [SlaEditorComponent, SlaContentComponent, SlaNodeComponent, SlaTextComponent, SlaVoidComponent],
                    entryComponents: [SlaTextComponent, SlaVoidComponent],
                    providers: [Rendering]
                },] }
    ];
    /** @nocollapse */
    SlaEditorModule.ctorParameters = function () { return []; };
    return SlaEditorModule;
}());
export { SlaEditorModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbImVkaXRvci5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBc0QsTUFBTSxlQUFlLENBQUM7QUFDN0YsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUM3RSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFFeEQ7SUFRSTtJQUFlLENBQUM7O2dCQVJuQixRQUFRLFNBQUM7b0JBQ04sWUFBWSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUM7b0JBQzdHLE9BQU8sRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUM7b0JBQ3RDLE9BQU8sRUFBRSxDQUFDLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDO29CQUN4RyxlQUFlLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQztvQkFDckQsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDO2lCQUN6Qjs7OztJQUdELHNCQUFDO0NBQUEsQUFURCxJQVNDO1NBRlksZUFBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nTW9kdWxlLCBBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBJbmplY3RvciB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQnJvd3Nlck1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuaW1wb3J0IHsgUG9ydGFsTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQgeyBTbGFFZGl0b3JDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvZWRpdG9yL2VkaXRvci5jb21wb25lbnQnO1xuaW1wb3J0IHsgU2xhQ29udGVudENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9jb250ZW50L2NvbnRlbnQuY29tcG9uZW50JztcbmltcG9ydCB7IFNsYU5vZGVDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvbm9kZS9ub2RlLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBTbGFUZXh0Q29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL3RleHQvdGV4dC5jb21wb25lbnQnO1xuaW1wb3J0IHsgU2xhVm9pZENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy92b2lkL3ZvaWQuY29tcG9uZW50JztcbmltcG9ydCB7IFJlbmRlcmluZyB9IGZyb20gJy4vcGx1Z2lucy9hbmd1bGFyL3JlbmRlcmluZyc7XG5cbkBOZ01vZHVsZSh7XG4gICAgZGVjbGFyYXRpb25zOiBbU2xhRWRpdG9yQ29tcG9uZW50LCBTbGFDb250ZW50Q29tcG9uZW50LCBTbGFOb2RlQ29tcG9uZW50LCBTbGFWb2lkQ29tcG9uZW50LCBTbGFUZXh0Q29tcG9uZW50XSxcbiAgICBpbXBvcnRzOiBbQnJvd3Nlck1vZHVsZSwgUG9ydGFsTW9kdWxlXSxcbiAgICBleHBvcnRzOiBbU2xhRWRpdG9yQ29tcG9uZW50LCBTbGFDb250ZW50Q29tcG9uZW50LCBTbGFOb2RlQ29tcG9uZW50LCBTbGFUZXh0Q29tcG9uZW50LCBTbGFWb2lkQ29tcG9uZW50XSxcbiAgICBlbnRyeUNvbXBvbmVudHM6IFtTbGFUZXh0Q29tcG9uZW50LCBTbGFWb2lkQ29tcG9uZW50XSxcbiAgICBwcm92aWRlcnM6IFtSZW5kZXJpbmddXG59KVxuZXhwb3J0IGNsYXNzIFNsYUVkaXRvck1vZHVsZSB7XG4gICAgY29uc3RydWN0b3IoKSB7fVxufVxuIl19