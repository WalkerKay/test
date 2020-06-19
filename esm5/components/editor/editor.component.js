import * as tslib_1 from "tslib";
import { Component, Renderer2, ElementRef, NgZone, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Editor } from 'slate';
import AngularPlugin from '../../plugins/angular/index';
import { SlaContentComponent } from '../content/content.component';
import { Rendering } from '../../plugins/angular/rendering';
var SlaEditorComponent = /** @class */ (function () {
    function SlaEditorComponent(ngZone, render2, element, rendering) {
        this.ngZone = ngZone;
        this.render2 = render2;
        this.element = element;
        this.rendering = rendering;
        this.spellcheck = false;
        this.plugins = [];
        this.slaOnChange = new EventEmitter();
        this.slaEditorInitComplete = new EventEmitter();
        this.tmp = {
            mounted: false,
            change: null,
            resolves: 0,
            updates: 0,
            contentRef: null
        };
    }
    SlaEditorComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.setEditorContainerClass();
        var _a = this, value = _a.slaValue, readOnly = _a.slaReadOnly;
        this.ngZone.runOutsideAngular(function () {
            var angularPlugins = AngularPlugin(_this);
            var onChange = function (change) {
                // if (this.tmp.mounted) {
                //     this.slaOnChange.emit(change);
                // } else {
                //     this.tmp.change = change;
                // }
                _this.slaOnChange.emit(change);
            };
            _this.editor = new Editor({
                plugins: tslib_1.__spread(angularPlugins, [_this.rendering]),
                onChange: onChange,
                value: value,
                readOnly: readOnly
            });
            _this.editor.tmp.contentRef = _this.contentRef;
            _this.slaEditorInitComplete.emit(_this.editor);
        });
    };
    SlaEditorComponent.prototype.slaEvent = function (handler, event) {
        this.editor.run(handler, event);
    };
    SlaEditorComponent.prototype.setEditorContainerClass = function () {
        var _a;
        var classList = ['sla-editor-container'];
        if (this.slaContainerClass) {
            classList.push(this.slaContainerClass);
        }
        (_a = this.element.nativeElement.classList).add.apply(_a, tslib_1.__spread(classList));
    };
    SlaEditorComponent.decorators = [
        { type: Component, args: [{
                    selector: 'sla-editor,[slaEditor]',
                    template: "<div\n    slaContent\n    class=\"sla-editor-container\"\n    [readOnly]=\"slaReadOnly\"\n    [editor]=\"editor\"\n    [slaEvent]=\"slaEvent\"\n    [slaValue]=\"slaValue\"\n    [attr.tabIndex]=\"tabIndex\"\n    [attr.contenteditable]=\"slaReadOnly ? null : true\"\n    [attr.data-slate-editor]=\"true\"\n    [attr.data-key]=\"slaValue?.document?.key\"\n    [attr.spellcheck]=\"spellcheck\"\n></div>\n"
                }] }
    ];
    /** @nocollapse */
    SlaEditorComponent.ctorParameters = function () { return [
        { type: NgZone },
        { type: Renderer2 },
        { type: ElementRef },
        { type: Rendering }
    ]; };
    SlaEditorComponent.propDecorators = {
        slaValue: [{ type: Input }],
        slaReadOnly: [{ type: Input }],
        slaPlaceholder: [{ type: Input }],
        spellcheck: [{ type: Input }],
        tabIndex: [{ type: Input }],
        slaContainerClass: [{ type: Input }],
        plugins: [{ type: Input }],
        commands: [{ type: Input }],
        queries: [{ type: Input }],
        schema: [{ type: Input }],
        decorateNode: [{ type: Input }],
        renderAnnotation: [{ type: Input }],
        renderBlock: [{ type: Input }],
        renderDecoration: [{ type: Input }],
        renderDocument: [{ type: Input }],
        renderEditor: [{ type: Input }],
        renderInline: [{ type: Input }],
        renderMark: [{ type: Input }],
        onBeforeInput: [{ type: Input }],
        onBlur: [{ type: Input }],
        onClick: [{ type: Input }],
        onContextMenu: [{ type: Input }],
        onCompositionEnd: [{ type: Input }],
        onCompositionStart: [{ type: Input }],
        onCopy: [{ type: Input }],
        onCut: [{ type: Input }],
        onDragEnd: [{ type: Input }],
        onDragEnter: [{ type: Input }],
        onDragLeave: [{ type: Input }],
        onDragOver: [{ type: Input }],
        onDragStart: [{ type: Input }],
        onDrop: [{ type: Input }],
        onInput: [{ type: Input }],
        onFocus: [{ type: Input }],
        onKeyDown: [{ type: Input }],
        onKeyUp: [{ type: Input }],
        onMouseDown: [{ type: Input }],
        onMouseUp: [{ type: Input }],
        onPaste: [{ type: Input }],
        onSelect: [{ type: Input }],
        slaOnChange: [{ type: Output }],
        slaEditorInitComplete: [{ type: Output }],
        contentRef: [{ type: ViewChild, args: [SlaContentComponent, { static: true },] }]
    };
    return SlaEditorComponent;
}());
export { SlaEditorComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvZWRpdG9yL2VkaXRvci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDSCxTQUFTLEVBR1QsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sS0FBSyxFQUNMLE1BQU0sRUFDTixZQUFZLEVBQ1osU0FBUyxFQUNaLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxNQUFNLEVBQVUsTUFBTSxPQUFPLENBQUM7QUFDdkMsT0FBTyxhQUFhLE1BQU0sNkJBQTZCLENBQUM7QUFDeEQsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFbkUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBRTVEO0lBZ0pJLDRCQUNZLE1BQWMsRUFDZCxPQUFrQixFQUNsQixPQUFtQixFQUNuQixTQUFvQjtRQUhwQixXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ2QsWUFBTyxHQUFQLE9BQU8sQ0FBVztRQUNsQixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25CLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFuSWhDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFTbkIsWUFBTyxHQUFhLEVBQUUsQ0FBQztRQXNHdkIsZ0JBQVcsR0FBOEIsSUFBSSxZQUFZLEVBQWUsQ0FBQztRQUd6RSwwQkFBcUIsR0FBeUIsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUt6RSxRQUFHLEdBQUc7WUFDRixPQUFPLEVBQUUsS0FBSztZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLENBQUM7WUFDWCxPQUFPLEVBQUUsQ0FBQztZQUNWLFVBQVUsRUFBRSxJQUFJO1NBQ25CLENBQUM7SUFPQyxDQUFDO0lBRUoscUNBQVEsR0FBUjtRQUFBLGlCQXdCQztRQXZCRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUN6QixJQUFBLFNBQWlELEVBQS9DLG1CQUFlLEVBQUUseUJBQThCLENBQUM7UUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUMxQixJQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSSxDQUFDLENBQUM7WUFFM0MsSUFBTSxRQUFRLEdBQUcsVUFBQyxNQUFtQjtnQkFDakMsMEJBQTBCO2dCQUMxQixxQ0FBcUM7Z0JBQ3JDLFdBQVc7Z0JBQ1gsZ0NBQWdDO2dCQUNoQyxJQUFJO2dCQUNKLEtBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQztZQUVGLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUM7Z0JBQ3JCLE9BQU8sbUJBQU0sY0FBYyxHQUFFLEtBQUksQ0FBQyxTQUFTLEVBQUM7Z0JBQzVDLFFBQVEsVUFBQTtnQkFDUixLQUFLLE9BQUE7Z0JBQ0wsUUFBUSxVQUFBO2FBQ1gsQ0FBQyxDQUFDO1lBQ0YsS0FBSSxDQUFDLE1BQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLEtBQUksQ0FBQyxVQUFVLENBQUM7WUFDdEQsS0FBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQscUNBQVEsR0FBUixVQUFTLE9BQWUsRUFBRSxLQUFZO1FBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU8sb0RBQXVCLEdBQS9COztRQUNJLElBQU0sU0FBUyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUMzQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUN4QixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsQ0FBQSxLQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQSxDQUFDLEdBQUcsNEJBQUksU0FBUyxHQUFFO0lBQzNELENBQUM7O2dCQTNMSixTQUFTLFNBQUM7b0JBQ1AsUUFBUSxFQUFFLHdCQUF3QjtvQkFDbEMsNFpBQXNDO2lCQUN6Qzs7OztnQkFmRyxNQUFNO2dCQUZOLFNBQVM7Z0JBQ1QsVUFBVTtnQkFXTCxTQUFTOzs7MkJBU2IsS0FBSzs4QkFHTCxLQUFLO2lDQUdMLEtBQUs7NkJBR0wsS0FBSzsyQkFHTCxLQUFLO29DQUdMLEtBQUs7MEJBR0wsS0FBSzsyQkFHTCxLQUFLOzBCQUdMLEtBQUs7eUJBR0wsS0FBSzsrQkFHTCxLQUFLO21DQUdMLEtBQUs7OEJBR0wsS0FBSzttQ0FHTCxLQUFLO2lDQUdMLEtBQUs7K0JBR0wsS0FBSzsrQkFHTCxLQUFLOzZCQUdMLEtBQUs7Z0NBR0wsS0FBSzt5QkFHTCxLQUFLOzBCQUdMLEtBQUs7Z0NBR0wsS0FBSzttQ0FHTCxLQUFLO3FDQUdMLEtBQUs7eUJBR0wsS0FBSzt3QkFHTCxLQUFLOzRCQUdMLEtBQUs7OEJBR0wsS0FBSzs4QkFHTCxLQUFLOzZCQUdMLEtBQUs7OEJBR0wsS0FBSzt5QkFHTCxLQUFLOzBCQUdMLEtBQUs7MEJBR0wsS0FBSzs0QkFHTCxLQUFLOzBCQUdMLEtBQUs7OEJBR0wsS0FBSzs0QkFHTCxLQUFLOzBCQUdMLEtBQUs7MkJBR0wsS0FBSzs4QkFHTCxNQUFNO3dDQUdOLE1BQU07NkJBR04sU0FBUyxTQUFDLG1CQUFtQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTs7SUF1RHBELHlCQUFDO0NBQUEsQUE1TEQsSUE0TEM7U0F4TFksa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDb21wb25lbnQsXG4gICAgT25Jbml0LFxuICAgIFZpZXdFbmNhcHN1bGF0aW9uLFxuICAgIFJlbmRlcmVyMixcbiAgICBFbGVtZW50UmVmLFxuICAgIE5nWm9uZSxcbiAgICBJbnB1dCxcbiAgICBPdXRwdXQsXG4gICAgRXZlbnRFbWl0dGVyLFxuICAgIFZpZXdDaGlsZFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEVkaXRvciwgUGx1Z2luIH0gZnJvbSAnc2xhdGUnO1xuaW1wb3J0IEFuZ3VsYXJQbHVnaW4gZnJvbSAnLi4vLi4vcGx1Z2lucy9hbmd1bGFyL2luZGV4JztcbmltcG9ydCB7IFNsYUNvbnRlbnRDb21wb25lbnQgfSBmcm9tICcuLi9jb250ZW50L2NvbnRlbnQuY29tcG9uZW50JztcbmltcG9ydCB7IFZhbHVlQ2hhbmdlIH0gZnJvbSAnLi4vLi4vY29yZS92YWx1ZS1jaGFuZ2UnO1xuaW1wb3J0IHsgUmVuZGVyaW5nIH0gZnJvbSAnLi4vLi4vcGx1Z2lucy9hbmd1bGFyL3JlbmRlcmluZyc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnc2xhLWVkaXRvcixbc2xhRWRpdG9yXScsXG4gICAgdGVtcGxhdGVVcmw6ICcuL2VkaXRvci5jb21wb25lbnQuaHRtbCdcbn0pXG5leHBvcnQgY2xhc3MgU2xhRWRpdG9yQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgICBlZGl0b3I6IEVkaXRvcjtcblxuICAgIEBJbnB1dCgpXG4gICAgc2xhVmFsdWU6IGFueTtcblxuICAgIEBJbnB1dCgpXG4gICAgc2xhUmVhZE9ubHk6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKVxuICAgIHNsYVBsYWNlaG9sZGVyOiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKVxuICAgIHNwZWxsY2hlY2sgPSBmYWxzZTtcblxuICAgIEBJbnB1dCgpXG4gICAgdGFiSW5kZXg6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgc2xhQ29udGFpbmVyQ2xhc3M7XG5cbiAgICBASW5wdXQoKVxuICAgIHBsdWdpbnM6IFBsdWdpbltdID0gW107XG5cbiAgICBASW5wdXQoKVxuICAgIGNvbW1hbmRzOiBhbnk7XG5cbiAgICBASW5wdXQoKVxuICAgIHF1ZXJpZXM6IGFueTtcblxuICAgIEBJbnB1dCgpXG4gICAgc2NoZW1hOiBhbnk7XG5cbiAgICBASW5wdXQoKVxuICAgIGRlY29yYXRlTm9kZTogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlckFubm90YXRpb246ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICByZW5kZXJCbG9jazogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlckRlY29yYXRpb246ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICByZW5kZXJEb2N1bWVudDogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlckVkaXRvcjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlcklubGluZTogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlck1hcms6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkJlZm9yZUlucHV0OiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25CbHVyOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25DbGljazogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uQ29udGV4dE1lbnU6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkNvbXBvc2l0aW9uRW5kOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25Db21wb3NpdGlvblN0YXJ0OiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25Db3B5OiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25DdXQ6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkRyYWdFbmQ6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkRyYWdFbnRlcjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uRHJhZ0xlYXZlOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25EcmFnT3ZlcjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uRHJhZ1N0YXJ0OiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25Ecm9wOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25JbnB1dDogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uRm9jdXM6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbktleURvd246ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbktleVVwOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25Nb3VzZURvd246ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbk1vdXNlVXA6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvblBhc3RlOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25TZWxlY3Q6ICgpID0+IHt9O1xuXG4gICAgQE91dHB1dCgpXG4gICAgc2xhT25DaGFuZ2U6IEV2ZW50RW1pdHRlcjxWYWx1ZUNoYW5nZT4gPSBuZXcgRXZlbnRFbWl0dGVyPFZhbHVlQ2hhbmdlPigpO1xuXG4gICAgQE91dHB1dCgpXG4gICAgc2xhRWRpdG9ySW5pdENvbXBsZXRlOiBFdmVudEVtaXR0ZXI8RWRpdG9yPiA9IG5ldyBFdmVudEVtaXR0ZXI8RWRpdG9yPigpO1xuXG4gICAgQFZpZXdDaGlsZChTbGFDb250ZW50Q29tcG9uZW50LCB7IHN0YXRpYzogdHJ1ZSB9KVxuICAgIGNvbnRlbnRSZWY6IFNsYUNvbnRlbnRDb21wb25lbnQ7XG5cbiAgICB0bXAgPSB7XG4gICAgICAgIG1vdW50ZWQ6IGZhbHNlLFxuICAgICAgICBjaGFuZ2U6IG51bGwsXG4gICAgICAgIHJlc29sdmVzOiAwLFxuICAgICAgICB1cGRhdGVzOiAwLFxuICAgICAgICBjb250ZW50UmVmOiBudWxsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgICAgICBwcml2YXRlIHJlbmRlcjI6IFJlbmRlcmVyMixcbiAgICAgICAgcHJpdmF0ZSBlbGVtZW50OiBFbGVtZW50UmVmLFxuICAgICAgICBwcml2YXRlIHJlbmRlcmluZzogUmVuZGVyaW5nXG4gICAgKSB7fVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIHRoaXMuc2V0RWRpdG9yQ29udGFpbmVyQ2xhc3MoKTtcbiAgICAgICAgY29uc3QgeyBzbGFWYWx1ZTogdmFsdWUsIHNsYVJlYWRPbmx5OiByZWFkT25seSB9ID0gdGhpcztcbiAgICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYW5ndWxhclBsdWdpbnMgPSBBbmd1bGFyUGx1Z2luKHRoaXMpO1xuXG4gICAgICAgICAgICBjb25zdCBvbkNoYW5nZSA9IChjaGFuZ2U6IFZhbHVlQ2hhbmdlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKHRoaXMudG1wLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5zbGFPbkNoYW5nZS5lbWl0KGNoYW5nZSk7XG4gICAgICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy50bXAuY2hhbmdlID0gY2hhbmdlO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNsYU9uQ2hhbmdlLmVtaXQoY2hhbmdlKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZWRpdG9yID0gbmV3IEVkaXRvcih7XG4gICAgICAgICAgICAgICAgcGx1Z2luczogWy4uLmFuZ3VsYXJQbHVnaW5zLCB0aGlzLnJlbmRlcmluZ10sXG4gICAgICAgICAgICAgICAgb25DaGFuZ2UsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgcmVhZE9ubHlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgKHRoaXMuZWRpdG9yIGFzIGFueSkudG1wLmNvbnRlbnRSZWYgPSB0aGlzLmNvbnRlbnRSZWY7XG4gICAgICAgICAgICB0aGlzLnNsYUVkaXRvckluaXRDb21wbGV0ZS5lbWl0KHRoaXMuZWRpdG9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2xhRXZlbnQoaGFuZGxlcjogc3RyaW5nLCBldmVudDogRXZlbnQpIHtcbiAgICAgICAgdGhpcy5lZGl0b3IucnVuKGhhbmRsZXIsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldEVkaXRvckNvbnRhaW5lckNsYXNzKCkge1xuICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBbJ3NsYS1lZGl0b3ItY29udGFpbmVyJ107XG4gICAgICAgIGlmICh0aGlzLnNsYUNvbnRhaW5lckNsYXNzKSB7XG4gICAgICAgICAgICBjbGFzc0xpc3QucHVzaCh0aGlzLnNsYUNvbnRhaW5lckNsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKC4uLmNsYXNzTGlzdCk7XG4gICAgfVxufVxuIl19