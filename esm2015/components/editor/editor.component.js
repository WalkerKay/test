import { Component, Renderer2, ElementRef, NgZone, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Editor } from 'slate';
import AngularPlugin from '../../plugins/angular/index';
import { SlaContentComponent } from '../content/content.component';
import { Rendering } from '../../plugins/angular/rendering';
export class SlaEditorComponent {
    constructor(ngZone, render2, element, rendering) {
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
    ngOnInit() {
        this.setEditorContainerClass();
        const { slaValue: value, slaReadOnly: readOnly } = this;
        this.ngZone.runOutsideAngular(() => {
            const angularPlugins = AngularPlugin(this);
            const onChange = (change) => {
                // if (this.tmp.mounted) {
                //     this.slaOnChange.emit(change);
                // } else {
                //     this.tmp.change = change;
                // }
                this.slaOnChange.emit(change);
            };
            this.editor = new Editor({
                plugins: [...angularPlugins, this.rendering],
                onChange,
                value,
                readOnly
            });
            this.editor.tmp.contentRef = this.contentRef;
            this.slaEditorInitComplete.emit(this.editor);
        });
    }
    slaEvent(handler, event) {
        this.editor.run(handler, event);
    }
    setEditorContainerClass() {
        const classList = ['sla-editor-container'];
        if (this.slaContainerClass) {
            classList.push(this.slaContainerClass);
        }
        this.element.nativeElement.classList.add(...classList);
    }
}
SlaEditorComponent.decorators = [
    { type: Component, args: [{
                selector: 'sla-editor,[slaEditor]',
                template: "<div\n    slaContent\n    class=\"sla-editor-container\"\n    [readOnly]=\"slaReadOnly\"\n    [editor]=\"editor\"\n    [slaEvent]=\"slaEvent\"\n    [slaValue]=\"slaValue\"\n    [attr.tabIndex]=\"tabIndex\"\n    [attr.contenteditable]=\"slaReadOnly ? null : true\"\n    [attr.data-slate-editor]=\"true\"\n    [attr.data-key]=\"slaValue?.document?.key\"\n    [attr.spellcheck]=\"spellcheck\"\n></div>\n"
            }] }
];
/** @nocollapse */
SlaEditorComponent.ctorParameters = () => [
    { type: NgZone },
    { type: Renderer2 },
    { type: ElementRef },
    { type: Rendering }
];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvZWRpdG9yL2VkaXRvci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFHVCxTQUFTLEVBQ1QsVUFBVSxFQUNWLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWixTQUFTLEVBQ1osTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLE1BQU0sRUFBVSxNQUFNLE9BQU8sQ0FBQztBQUN2QyxPQUFPLGFBQWEsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUVuRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFNNUQsTUFBTSxPQUFPLGtCQUFrQjtJQTRJM0IsWUFDWSxNQUFjLEVBQ2QsT0FBa0IsRUFDbEIsT0FBbUIsRUFDbkIsU0FBb0I7UUFIcEIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLFlBQU8sR0FBUCxPQUFPLENBQVc7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBbkloQyxlQUFVLEdBQUcsS0FBSyxDQUFDO1FBU25CLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFzR3ZCLGdCQUFXLEdBQThCLElBQUksWUFBWSxFQUFlLENBQUM7UUFHekUsMEJBQXFCLEdBQXlCLElBQUksWUFBWSxFQUFVLENBQUM7UUFLekUsUUFBRyxHQUFHO1lBQ0YsT0FBTyxFQUFFLEtBQUs7WUFDZCxNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxDQUFDO1lBQ1gsT0FBTyxFQUFFLENBQUM7WUFDVixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDO0lBT0MsQ0FBQztJQUVKLFFBQVE7UUFDSixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMvQixNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO1lBQy9CLE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQyxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQW1CLEVBQUUsRUFBRTtnQkFDckMsMEJBQTBCO2dCQUMxQixxQ0FBcUM7Z0JBQ3JDLFdBQVc7Z0JBQ1gsZ0NBQWdDO2dCQUNoQyxJQUFJO2dCQUNKLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxDQUFDLEdBQUcsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzVDLFFBQVE7Z0JBQ1IsS0FBSztnQkFDTCxRQUFRO2FBQ1gsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLE1BQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDdEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsUUFBUSxDQUFDLE9BQWUsRUFBRSxLQUFZO1FBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU8sdUJBQXVCO1FBQzNCLE1BQU0sU0FBUyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUMzQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUN4QixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO0lBQzNELENBQUM7OztZQTNMSixTQUFTLFNBQUM7Z0JBQ1AsUUFBUSxFQUFFLHdCQUF3QjtnQkFDbEMsNFpBQXNDO2FBQ3pDOzs7O1lBZkcsTUFBTTtZQUZOLFNBQVM7WUFDVCxVQUFVO1lBV0wsU0FBUzs7O3VCQVNiLEtBQUs7MEJBR0wsS0FBSzs2QkFHTCxLQUFLO3lCQUdMLEtBQUs7dUJBR0wsS0FBSztnQ0FHTCxLQUFLO3NCQUdMLEtBQUs7dUJBR0wsS0FBSztzQkFHTCxLQUFLO3FCQUdMLEtBQUs7MkJBR0wsS0FBSzsrQkFHTCxLQUFLOzBCQUdMLEtBQUs7K0JBR0wsS0FBSzs2QkFHTCxLQUFLOzJCQUdMLEtBQUs7MkJBR0wsS0FBSzt5QkFHTCxLQUFLOzRCQUdMLEtBQUs7cUJBR0wsS0FBSztzQkFHTCxLQUFLOzRCQUdMLEtBQUs7K0JBR0wsS0FBSztpQ0FHTCxLQUFLO3FCQUdMLEtBQUs7b0JBR0wsS0FBSzt3QkFHTCxLQUFLOzBCQUdMLEtBQUs7MEJBR0wsS0FBSzt5QkFHTCxLQUFLOzBCQUdMLEtBQUs7cUJBR0wsS0FBSztzQkFHTCxLQUFLO3NCQUdMLEtBQUs7d0JBR0wsS0FBSztzQkFHTCxLQUFLOzBCQUdMLEtBQUs7d0JBR0wsS0FBSztzQkFHTCxLQUFLO3VCQUdMLEtBQUs7MEJBR0wsTUFBTTtvQ0FHTixNQUFNO3lCQUdOLFNBQVMsU0FBQyxtQkFBbUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENvbXBvbmVudCxcbiAgICBPbkluaXQsXG4gICAgVmlld0VuY2Fwc3VsYXRpb24sXG4gICAgUmVuZGVyZXIyLFxuICAgIEVsZW1lbnRSZWYsXG4gICAgTmdab25lLFxuICAgIElucHV0LFxuICAgIE91dHB1dCxcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgVmlld0NoaWxkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRWRpdG9yLCBQbHVnaW4gfSBmcm9tICdzbGF0ZSc7XG5pbXBvcnQgQW5ndWxhclBsdWdpbiBmcm9tICcuLi8uLi9wbHVnaW5zL2FuZ3VsYXIvaW5kZXgnO1xuaW1wb3J0IHsgU2xhQ29udGVudENvbXBvbmVudCB9IGZyb20gJy4uL2NvbnRlbnQvY29udGVudC5jb21wb25lbnQnO1xuaW1wb3J0IHsgVmFsdWVDaGFuZ2UgfSBmcm9tICcuLi8uLi9jb3JlL3ZhbHVlLWNoYW5nZSc7XG5pbXBvcnQgeyBSZW5kZXJpbmcgfSBmcm9tICcuLi8uLi9wbHVnaW5zL2FuZ3VsYXIvcmVuZGVyaW5nJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdzbGEtZWRpdG9yLFtzbGFFZGl0b3JdJyxcbiAgICB0ZW1wbGF0ZVVybDogJy4vZWRpdG9yLmNvbXBvbmVudC5odG1sJ1xufSlcbmV4cG9ydCBjbGFzcyBTbGFFZGl0b3JDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICAgIGVkaXRvcjogRWRpdG9yO1xuXG4gICAgQElucHV0KClcbiAgICBzbGFWYWx1ZTogYW55O1xuXG4gICAgQElucHV0KClcbiAgICBzbGFSZWFkT25seTogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpXG4gICAgc2xhUGxhY2Vob2xkZXI6IHN0cmluZztcblxuICAgIEBJbnB1dCgpXG4gICAgc3BlbGxjaGVjayA9IGZhbHNlO1xuXG4gICAgQElucHV0KClcbiAgICB0YWJJbmRleDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBzbGFDb250YWluZXJDbGFzcztcblxuICAgIEBJbnB1dCgpXG4gICAgcGx1Z2luczogUGx1Z2luW10gPSBbXTtcblxuICAgIEBJbnB1dCgpXG4gICAgY29tbWFuZHM6IGFueTtcblxuICAgIEBJbnB1dCgpXG4gICAgcXVlcmllczogYW55O1xuXG4gICAgQElucHV0KClcbiAgICBzY2hlbWE6IGFueTtcblxuICAgIEBJbnB1dCgpXG4gICAgZGVjb3JhdGVOb2RlOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgcmVuZGVyQW5ub3RhdGlvbjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlckJsb2NrOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgcmVuZGVyRGVjb3JhdGlvbjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIHJlbmRlckRvY3VtZW50OiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgcmVuZGVyRWRpdG9yOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgcmVuZGVySW5saW5lOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgcmVuZGVyTWFyazogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uQmVmb3JlSW5wdXQ6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkJsdXI6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkNsaWNrOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25Db250ZXh0TWVudTogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uQ29tcG9zaXRpb25FbmQ6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkNvbXBvc2l0aW9uU3RhcnQ6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkNvcHk6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkN1dDogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uRHJhZ0VuZDogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uRHJhZ0VudGVyOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25EcmFnTGVhdmU6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkRyYWdPdmVyOiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25EcmFnU3RhcnQ6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbkRyb3A6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbklucHV0OiAoKSA9PiB7fTtcblxuICAgIEBJbnB1dCgpXG4gICAgb25Gb2N1czogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uS2V5RG93bjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uS2V5VXA6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvbk1vdXNlRG93bjogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uTW91c2VVcDogKCkgPT4ge307XG5cbiAgICBASW5wdXQoKVxuICAgIG9uUGFzdGU6ICgpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICBvblNlbGVjdDogKCkgPT4ge307XG5cbiAgICBAT3V0cHV0KClcbiAgICBzbGFPbkNoYW5nZTogRXZlbnRFbWl0dGVyPFZhbHVlQ2hhbmdlPiA9IG5ldyBFdmVudEVtaXR0ZXI8VmFsdWVDaGFuZ2U+KCk7XG5cbiAgICBAT3V0cHV0KClcbiAgICBzbGFFZGl0b3JJbml0Q29tcGxldGU6IEV2ZW50RW1pdHRlcjxFZGl0b3I+ID0gbmV3IEV2ZW50RW1pdHRlcjxFZGl0b3I+KCk7XG5cbiAgICBAVmlld0NoaWxkKFNsYUNvbnRlbnRDb21wb25lbnQsIHsgc3RhdGljOiB0cnVlIH0pXG4gICAgY29udGVudFJlZjogU2xhQ29udGVudENvbXBvbmVudDtcblxuICAgIHRtcCA9IHtcbiAgICAgICAgbW91bnRlZDogZmFsc2UsXG4gICAgICAgIGNoYW5nZTogbnVsbCxcbiAgICAgICAgcmVzb2x2ZXM6IDAsXG4gICAgICAgIHVwZGF0ZXM6IDAsXG4gICAgICAgIGNvbnRlbnRSZWY6IG51bGxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgICAgIHByaXZhdGUgcmVuZGVyMjogUmVuZGVyZXIyLFxuICAgICAgICBwcml2YXRlIGVsZW1lbnQ6IEVsZW1lbnRSZWYsXG4gICAgICAgIHByaXZhdGUgcmVuZGVyaW5nOiBSZW5kZXJpbmdcbiAgICApIHt9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgdGhpcy5zZXRFZGl0b3JDb250YWluZXJDbGFzcygpO1xuICAgICAgICBjb25zdCB7IHNsYVZhbHVlOiB2YWx1ZSwgc2xhUmVhZE9ubHk6IHJlYWRPbmx5IH0gPSB0aGlzO1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhbmd1bGFyUGx1Z2lucyA9IEFuZ3VsYXJQbHVnaW4odGhpcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlID0gKGNoYW5nZTogVmFsdWVDaGFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy50bXAubW91bnRlZCkge1xuICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLnNsYU9uQ2hhbmdlLmVtaXQoY2hhbmdlKTtcbiAgICAgICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLnRtcC5jaGFuZ2UgPSBjaGFuZ2U7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIHRoaXMuc2xhT25DaGFuZ2UuZW1pdChjaGFuZ2UpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5lZGl0b3IgPSBuZXcgRWRpdG9yKHtcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBbLi4uYW5ndWxhclBsdWdpbnMsIHRoaXMucmVuZGVyaW5nXSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZSxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICByZWFkT25seVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAodGhpcy5lZGl0b3IgYXMgYW55KS50bXAuY29udGVudFJlZiA9IHRoaXMuY29udGVudFJlZjtcbiAgICAgICAgICAgIHRoaXMuc2xhRWRpdG9ySW5pdENvbXBsZXRlLmVtaXQodGhpcy5lZGl0b3IpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzbGFFdmVudChoYW5kbGVyOiBzdHJpbmcsIGV2ZW50OiBFdmVudCkge1xuICAgICAgICB0aGlzLmVkaXRvci5ydW4oaGFuZGxlciwgZXZlbnQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0RWRpdG9yQ29udGFpbmVyQ2xhc3MoKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IFsnc2xhLWVkaXRvci1jb250YWluZXInXTtcbiAgICAgICAgaWYgKHRoaXMuc2xhQ29udGFpbmVyQ2xhc3MpIHtcbiAgICAgICAgICAgIGNsYXNzTGlzdC5wdXNoKHRoaXMuc2xhQ29udGFpbmVyQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmNsYXNzTGlzdC5hZGQoLi4uY2xhc3NMaXN0KTtcbiAgICB9XG59XG4iXX0=