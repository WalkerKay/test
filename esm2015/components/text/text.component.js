import { Component, Input, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, forwardRef, NgZone, ViewChild } from '@angular/core';
import { Editor, Block, Text } from 'slate';
import Debug from 'debug';
import { ChildNodeBase } from '../../core/child-node-base';
import DATA_ATTRS from '../../constants/data-attributes';
import OffsetKey from '../../utils/offset-key';
import SELECTORS from '../../constants/selectors';
const debug = Debug('slate:text');
debug.check = Debug('slate:docheck');
export const textBinding = {
    provide: ChildNodeBase,
    useExisting: forwardRef(() => SlaTextComponent)
};
export class SlaTextComponent extends ChildNodeBase {
    constructor(elementRef, cdr, ngZone) {
        super();
        this.elementRef = elementRef;
        this.cdr = cdr;
        this.ngZone = ngZone;
        this.offsets = [];
        this.zeroWidthStringLength = 0;
        this.isLineBreak = false;
        this.isTrailing = false;
    }
    set slaTextNode(value) {
        debug('set: slaTextNode', value.toJSON());
        if (this.leafContainer && this.node && this.node.marks && !this.node.marks.equals(value.marks)) {
            this.node = value;
            this.detectTextTemplate();
            this.renderLeaf();
        }
        else {
            this.node = value;
            this.detectTextTemplate();
        }
    }
    get slaTextNode() {
        return this.node;
    }
    ngOnInit() {
        debug('ngOnInit');
        this.offsetKey = OffsetKey.stringify({
            key: this.node.key,
            index: 0
        });
        this.rootNode = this.elementRef.nativeElement;
        this.detectTextTemplate();
        this.renderLeaf();
    }
    ngOnChanges(simpleChanges) {
    }
    renderLeaf() {
        // COMPAT: Having the `data-` attributes on these leaf elements ensures that
        // in certain misbehaving browsers they aren't weirdly cloned/destroyed by
        // contenteditable behaviors. (2019/05/08)
        let contentElement = this.leafContainer.nativeElement;
        this.node.marks.forEach(mark => {
            const markConfig = this.buildConfig({
                [DATA_ATTRS.OBJECT]: 'mark'
            }, contentElement, null, null, mark);
            const ret = this.editor.run('renderMark', markConfig);
            if (ret) {
                contentElement = ret;
            }
        });
        if (this.lastContentElement && this.lastContentElement !== this.leafContainer.nativeElement) {
            this.lastContentElement.remove();
        }
        this.elementRef.nativeElement.appendChild(contentElement);
        this.lastContentElement = contentElement;
    }
    detectTextTemplate() {
        this.isZeroWidthString = false;
        this.zeroWidthStringLength = 0;
        this.isLineBreak = false;
        this.isTrailing = false;
        if (this.editor.query('isVoid', this.parent)) {
            this.zeroWidthStringLength = this.parent.text.length;
            this.setZeroWidthElement();
        }
        else if (this.node.text === '' &&
            this.parent.object === 'block' &&
            this.parent.text === '' &&
            this.parent.nodes.last() === this.node) {
            this.isLineBreak = true;
            this.setZeroWidthElement();
        }
        else if (this.node.text === '') {
            this.setZeroWidthElement();
        }
        else {
            const lastChar = this.node.text.charAt(this.node.text.length - 1);
            if (lastChar === '\n') {
                this.isTrailing = true;
            }
            else {
                this.isTrailing = false;
            }
        }
    }
    // remove dom when isZeroWidthString = true
    // because dom still exist when content component exec updateSelection
    setZeroWidthElement() {
        this.isZeroWidthString = true;
        const text = this.leafContainer.nativeElement.querySelector(`${SELECTORS.STRING}`);
        if (text) {
            text.remove();
        }
    }
    buildConfig(attributes, children, annotation, decoration, mark) {
        const renderProps = {
            editor: this.editor,
            marks: this.node.marks,
            node: this.node,
            offset: 0,
            text: this.node.text,
            children,
            attributes,
            annotation,
            decoration,
            mark
        };
        return renderProps;
    }
    ngDoCheck() {
        debug.check('check text', this.node);
    }
}
SlaTextComponent.decorators = [
    { type: Component, args: [{
                selector: 'sla-text,[slaText]',
                template: "<span #leaf [attr.data-slate-leaf]=\"true\" [attr.data-offset-key]=\"offsetKey\">\n    <!-- break compisiton input -->\n    <!-- <span contenteditable=\"false\" class=\"non-editable-area\"></span> -->\n    <!-- move zero order to adjust empty text selection when delete last char-->\n    <span #text *ngIf=\"!isZeroWidthString\" data-slate-string=\"true\">{{ node.text }}{{ isTrailing ? '\\n' : null }}</span>\n    <span\n        *ngIf=\"isZeroWidthString\"\n        attr.data-slate-zero-width=\"{{ isLineBreak ? 'n' : 'z' }}\"\n        attr.data-slate-length=\"{{ zeroWidthStringLength }}\"\n        >{{ '\\u200B' }}<br *ngIf=\"isLineBreak\" />\n    </span>\n</span>\n",
                providers: [textBinding],
                changeDetection: ChangeDetectionStrategy.OnPush
            }] }
];
/** @nocollapse */
SlaTextComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: ChangeDetectorRef },
    { type: NgZone }
];
SlaTextComponent.propDecorators = {
    editor: [{ type: Input }],
    parent: [{ type: Input }],
    block: [{ type: Input }],
    slaTextNode: [{ type: Input }],
    leafContainer: [{ type: ViewChild, args: ['leaf', { static: true },] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJjb21wb25lbnRzL3RleHQvdGV4dC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFFVCxLQUFLLEVBQ0wsVUFBVSxFQUNWLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsVUFBVSxFQUNWLE1BQU0sRUFLTixTQUFTLEVBQ1osTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFRLE1BQU0sRUFBRSxLQUFLLEVBQWMsSUFBSSxFQUEwQixNQUFNLE9BQU8sQ0FBQztBQUV0RixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQzNELE9BQU8sVUFBVSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3pELE9BQU8sU0FBUyxNQUFNLHdCQUF3QixDQUFDO0FBRS9DLE9BQU8sU0FBUyxNQUFNLDJCQUEyQixDQUFDO0FBR2xELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUVyQyxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQVE7SUFDNUIsT0FBTyxFQUFFLGFBQWE7SUFDdEIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztDQUNsRCxDQUFDO0FBUUYsTUFBTSxPQUFPLGdCQUFpQixTQUFRLGFBQWE7SUFtRC9DLFlBQ1ksVUFBc0IsRUFDdEIsR0FBc0IsRUFDdEIsTUFBYztRQUV0QixLQUFLLEVBQUUsQ0FBQztRQUpBLGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdEIsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFDdEIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQTVDMUIsWUFBTyxHQUFHLEVBQUUsQ0FBQztRQWdDYiwwQkFBcUIsR0FBRyxDQUFDLENBQUM7UUFFMUIsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFcEIsZUFBVSxHQUFHLEtBQUssQ0FBQztJQVduQixDQUFDO0lBcENELElBQ0ksV0FBVyxDQUFDLEtBQVc7UUFDdkIsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUM1RixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNsQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7U0FDckI7YUFBTTtZQUNILElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1NBQzdCO0lBQ0wsQ0FBQztJQUVELElBQUksV0FBVztRQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNyQixDQUFDO0lBdUJELFFBQVE7UUFDSixLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ2pDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUc7WUFDbEIsS0FBSyxFQUFFLENBQUM7U0FDWCxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBQzlDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsV0FBVyxDQUFDLGFBQTRCO0lBQ3hDLENBQUM7SUFJRCxVQUFVO1FBQ04sNEVBQTRFO1FBQzVFLDBFQUEwRTtRQUMxRSwwQ0FBMEM7UUFDMUMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzNCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQy9CO2dCQUNJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU07YUFDOUIsRUFDRCxjQUFjLEVBQ2QsSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLENBQ1AsQ0FBQztZQUNGLE1BQU0sR0FBRyxHQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUUzRCxJQUFJLEdBQUcsRUFBRTtnQkFDTCxjQUFjLEdBQUcsR0FBRyxDQUFDO2FBQ3hCO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEtBQUssSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUU7WUFDekYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ3BDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUM7SUFDN0MsQ0FBQztJQUVELGtCQUFrQjtRQUNkLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDL0IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDMUMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNyRCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztTQUM5QjthQUFNLElBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRTtZQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxPQUFPO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUU7WUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBSSxDQUFDLElBQUksRUFDeEM7WUFDRSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztTQUM5QjthQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxFQUFFO1lBQzlCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1NBQzlCO2FBQU07WUFDSCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLElBQUksUUFBUSxLQUFLLElBQUksRUFBRTtnQkFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7YUFDMUI7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7YUFDM0I7U0FDSjtJQUNMLENBQUM7SUFFRCwyQ0FBMkM7SUFDM0Msc0VBQXNFO0lBQzlELG1CQUFtQjtRQUN2QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLE1BQU0sSUFBSSxHQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBNkIsQ0FBQyxhQUFhLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNwRyxJQUFJLElBQUksRUFBRTtZQUNOLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNqQjtJQUNMLENBQUM7SUFFRCxXQUFXLENBQ1AsVUFBcUMsRUFDckMsUUFBcUIsRUFDckIsVUFBdUIsRUFDdkIsVUFBdUIsRUFDdkIsSUFBVztRQUVYLE1BQU0sV0FBVyxHQUF3QjtZQUNyQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSztZQUN0QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixNQUFNLEVBQUUsQ0FBQztZQUNULElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDcEIsUUFBUTtZQUNSLFVBQVU7WUFDVixVQUFVO1lBQ1YsVUFBVTtZQUNWLElBQUk7U0FDUCxDQUFDO1FBQ0YsT0FBTyxXQUFXLENBQUM7SUFDdkIsQ0FBQztJQUVELFNBQVM7UUFDTCxLQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsQ0FBQzs7O1lBM0tKLFNBQVMsU0FBQztnQkFDUCxRQUFRLEVBQUUsb0JBQW9CO2dCQUM5Qix5cUJBQW9DO2dCQUNwQyxTQUFTLEVBQUUsQ0FBQyxXQUFXLENBQUM7Z0JBQ3hCLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNO2FBQ2xEOzs7O1lBbENHLFVBQVU7WUFFVixpQkFBaUI7WUFFakIsTUFBTTs7O3FCQTJDTCxLQUFLO3FCQUdMLEtBQUs7b0JBR0wsS0FBSzswQkFHTCxLQUFLOzRCQTJCTCxTQUFTLFNBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQ29tcG9uZW50LFxuICAgIE9uSW5pdCxcbiAgICBJbnB1dCxcbiAgICBFbGVtZW50UmVmLFxuICAgIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICAgIENoYW5nZURldGVjdG9yUmVmLFxuICAgIGZvcndhcmRSZWYsXG4gICAgTmdab25lLFxuICAgIE9uQ2hhbmdlcyxcbiAgICBTaW1wbGVDaGFuZ2UsXG4gICAgU2ltcGxlQ2hhbmdlcyxcbiAgICBEb0NoZWNrLFxuICAgIFZpZXdDaGlsZFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5vZGUsIEVkaXRvciwgQmxvY2ssIERlY29yYXRpb24sIFRleHQsIExlYWYsIEFubm90YXRpb24sIE1hcmsgfSBmcm9tICdzbGF0ZSc7XG5pbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IENoaWxkTm9kZUJhc2UgfSBmcm9tICcuLi8uLi9jb3JlL2NoaWxkLW5vZGUtYmFzZSc7XG5pbXBvcnQgREFUQV9BVFRSUyBmcm9tICcuLi8uLi9jb25zdGFudHMvZGF0YS1hdHRyaWJ1dGVzJztcbmltcG9ydCBPZmZzZXRLZXkgZnJvbSAnLi4vLi4vdXRpbHMvb2Zmc2V0LWtleSc7XG5pbXBvcnQgeyBTbGFMZWFmUmVuZGVyQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29yZS9yZW5kZXItcGx1Z2luL3JlbmRlci1jb25maWcnO1xuaW1wb3J0IFNFTEVDVE9SUyBmcm9tICcuLi8uLi9jb25zdGFudHMvc2VsZWN0b3JzJztcblxuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdzbGF0ZTp0ZXh0Jyk7XG5kZWJ1Zy5jaGVjayA9IERlYnVnKCdzbGF0ZTpkb2NoZWNrJyk7XG5cbmV4cG9ydCBjb25zdCB0ZXh0QmluZGluZzogYW55ID0ge1xuICAgIHByb3ZpZGU6IENoaWxkTm9kZUJhc2UsXG4gICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gU2xhVGV4dENvbXBvbmVudClcbn07XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnc2xhLXRleHQsW3NsYVRleHRdJyxcbiAgICB0ZW1wbGF0ZVVybDogJy4vdGV4dC5jb21wb25lbnQuaHRtbCcsXG4gICAgcHJvdmlkZXJzOiBbdGV4dEJpbmRpbmddLFxuICAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIFNsYVRleHRDb21wb25lbnQgZXh0ZW5kcyBDaGlsZE5vZGVCYXNlXG4gICAgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjayB7XG4gICAgcm9vdE5vZGU6IEhUTUxFbGVtZW50O1xuXG4gICAgbGFzdENvbnRlbnRFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAgIG5vZGU6IFRleHQ7XG5cbiAgICBsZWF2ZXM6IExpc3Q8YW55PjtcblxuICAgIG9mZnNldHMgPSBbXTtcblxuICAgIEBJbnB1dCgpXG4gICAgZWRpdG9yOiBFZGl0b3I7XG5cbiAgICBASW5wdXQoKVxuICAgIHBhcmVudDogTm9kZTtcblxuICAgIEBJbnB1dCgpXG4gICAgYmxvY2s6IEJsb2NrO1xuXG4gICAgQElucHV0KClcbiAgICBzZXQgc2xhVGV4dE5vZGUodmFsdWU6IFRleHQpIHtcbiAgICAgICAgZGVidWcoJ3NldDogc2xhVGV4dE5vZGUnLCB2YWx1ZS50b0pTT04oKSk7XG4gICAgICAgIGlmICh0aGlzLmxlYWZDb250YWluZXIgJiYgdGhpcy5ub2RlICYmIHRoaXMubm9kZS5tYXJrcyAmJiAhdGhpcy5ub2RlLm1hcmtzLmVxdWFscyh2YWx1ZS5tYXJrcykpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5kZXRlY3RUZXh0VGVtcGxhdGUoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTGVhZigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ub2RlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmRldGVjdFRleHRUZW1wbGF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHNsYVRleHROb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlO1xuICAgIH1cblxuICAgIG9mZnNldEtleTtcblxuICAgIGlzWmVyb1dpZHRoU3RyaW5nOiBib29sZWFuO1xuXG4gICAgemVyb1dpZHRoU3RyaW5nTGVuZ3RoID0gMDtcblxuICAgIGlzTGluZUJyZWFrID0gZmFsc2U7XG5cbiAgICBpc1RyYWlsaW5nID0gZmFsc2U7XG5cbiAgICBAVmlld0NoaWxkKCdsZWFmJywgeyBzdGF0aWM6IHRydWUgfSlcbiAgICBsZWFmQ29udGFpbmVyOiBFbGVtZW50UmVmO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICAgICAgcHJpdmF0ZSBjZHI6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIGRlYnVnKCduZ09uSW5pdCcpO1xuICAgICAgICB0aGlzLm9mZnNldEtleSA9IE9mZnNldEtleS5zdHJpbmdpZnkoe1xuICAgICAgICAgICAga2V5OiB0aGlzLm5vZGUua2V5LFxuICAgICAgICAgICAgaW5kZXg6IDBcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICAgICAgdGhpcy5kZXRlY3RUZXh0VGVtcGxhdGUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJMZWFmKCk7XG4gICAgfVxuXG4gICAgbmdPbkNoYW5nZXMoc2ltcGxlQ2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIH1cblxuXG5cbiAgICByZW5kZXJMZWFmKCkge1xuICAgICAgICAvLyBDT01QQVQ6IEhhdmluZyB0aGUgYGRhdGEtYCBhdHRyaWJ1dGVzIG9uIHRoZXNlIGxlYWYgZWxlbWVudHMgZW5zdXJlcyB0aGF0XG4gICAgICAgIC8vIGluIGNlcnRhaW4gbWlzYmVoYXZpbmcgYnJvd3NlcnMgdGhleSBhcmVuJ3Qgd2VpcmRseSBjbG9uZWQvZGVzdHJveWVkIGJ5XG4gICAgICAgIC8vIGNvbnRlbnRlZGl0YWJsZSBiZWhhdmlvcnMuICgyMDE5LzA1LzA4KVxuICAgICAgICBsZXQgY29udGVudEVsZW1lbnQgPSB0aGlzLmxlYWZDb250YWluZXIubmF0aXZlRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlLm1hcmtzLmZvckVhY2gobWFyayA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXJrQ29uZmlnID0gdGhpcy5idWlsZENvbmZpZyhcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFtEQVRBX0FUVFJTLk9CSkVDVF06ICdtYXJrJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udGVudEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgIG1hcmtcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCByZXQ6IGFueSA9IHRoaXMuZWRpdG9yLnJ1bigncmVuZGVyTWFyaycsIG1hcmtDb25maWcpO1xuXG4gICAgICAgICAgICBpZiAocmV0KSB7XG4gICAgICAgICAgICAgICAgY29udGVudEVsZW1lbnQgPSByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5sYXN0Q29udGVudEVsZW1lbnQgJiYgdGhpcy5sYXN0Q29udGVudEVsZW1lbnQgIT09IHRoaXMubGVhZkNvbnRhaW5lci5uYXRpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmxhc3RDb250ZW50RWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZChjb250ZW50RWxlbWVudCk7XG4gICAgICAgIHRoaXMubGFzdENvbnRlbnRFbGVtZW50ID0gY29udGVudEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZGV0ZWN0VGV4dFRlbXBsYXRlKCkge1xuICAgICAgICB0aGlzLmlzWmVyb1dpZHRoU3RyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuemVyb1dpZHRoU3RyaW5nTGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5pc0xpbmVCcmVhayA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzVHJhaWxpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yLnF1ZXJ5KCdpc1ZvaWQnLCB0aGlzLnBhcmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuemVyb1dpZHRoU3RyaW5nTGVuZ3RoID0gdGhpcy5wYXJlbnQudGV4dC5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnNldFplcm9XaWR0aEVsZW1lbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHRoaXMubm9kZS50ZXh0ID09PSAnJyAmJlxuICAgICAgICAgICAgdGhpcy5wYXJlbnQub2JqZWN0ID09PSAnYmxvY2snICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudC50ZXh0ID09PSAnJyAmJlxuICAgICAgICAgICAgdGhpcy5wYXJlbnQubm9kZXMubGFzdCgpID09PSB0aGlzLm5vZGVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLmlzTGluZUJyZWFrID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2V0WmVyb1dpZHRoRWxlbWVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubm9kZS50ZXh0ID09PSAnJykge1xuICAgICAgICAgICAgdGhpcy5zZXRaZXJvV2lkdGhFbGVtZW50KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0Q2hhciA9IHRoaXMubm9kZS50ZXh0LmNoYXJBdCh0aGlzLm5vZGUudGV4dC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIGlmIChsYXN0Q2hhciA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVHJhaWxpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVHJhaWxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJlbW92ZSBkb20gd2hlbiBpc1plcm9XaWR0aFN0cmluZyA9IHRydWVcbiAgICAvLyBiZWNhdXNlIGRvbSBzdGlsbCBleGlzdCB3aGVuIGNvbnRlbnQgY29tcG9uZW50IGV4ZWMgdXBkYXRlU2VsZWN0aW9uXG4gICAgcHJpdmF0ZSBzZXRaZXJvV2lkdGhFbGVtZW50KCkge1xuICAgICAgICB0aGlzLmlzWmVyb1dpZHRoU3RyaW5nID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgdGV4dCA9ICh0aGlzLmxlYWZDb250YWluZXIubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCkucXVlcnlTZWxlY3RvcihgJHtTRUxFQ1RPUlMuU1RSSU5HfWApO1xuICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgdGV4dC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkQ29uZmlnKFxuICAgICAgICBhdHRyaWJ1dGVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9LFxuICAgICAgICBjaGlsZHJlbjogSFRNTEVsZW1lbnQsXG4gICAgICAgIGFubm90YXRpb24/OiBBbm5vdGF0aW9uLFxuICAgICAgICBkZWNvcmF0aW9uPzogRGVjb3JhdGlvbixcbiAgICAgICAgbWFyaz86IE1hcmtcbiAgICApIHtcbiAgICAgICAgY29uc3QgcmVuZGVyUHJvcHM6IFNsYUxlYWZSZW5kZXJDb25maWcgPSB7XG4gICAgICAgICAgICBlZGl0b3I6IHRoaXMuZWRpdG9yLFxuICAgICAgICAgICAgbWFya3M6IHRoaXMubm9kZS5tYXJrcyxcbiAgICAgICAgICAgIG5vZGU6IHRoaXMubm9kZSxcbiAgICAgICAgICAgIG9mZnNldDogMCxcbiAgICAgICAgICAgIHRleHQ6IHRoaXMubm9kZS50ZXh0LFxuICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgYW5ub3RhdGlvbixcbiAgICAgICAgICAgIGRlY29yYXRpb24sXG4gICAgICAgICAgICBtYXJrXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiByZW5kZXJQcm9wcztcbiAgICB9XG5cbiAgICBuZ0RvQ2hlY2soKSB7XG4gICAgICAgIGRlYnVnLmNoZWNrKCdjaGVjayB0ZXh0JywgdGhpcy5ub2RlKTtcbiAgICB9XG59XG4iXX0=