import * as tslib_1 from "tslib";
import { Component, Input, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, forwardRef, NgZone, ViewChild } from '@angular/core';
import { Editor, Block, Text } from 'slate';
import Debug from 'debug';
import { ChildNodeBase } from '../../core/child-node-base';
import DATA_ATTRS from '../../constants/data-attributes';
import OffsetKey from '../../utils/offset-key';
import SELECTORS from '../../constants/selectors';
var debug = Debug('slate:text');
debug.check = Debug('slate:docheck');
export var textBinding = {
    provide: ChildNodeBase,
    useExisting: forwardRef(function () { return SlaTextComponent; })
};
var SlaTextComponent = /** @class */ (function (_super) {
    tslib_1.__extends(SlaTextComponent, _super);
    function SlaTextComponent(elementRef, cdr, ngZone) {
        var _this = _super.call(this) || this;
        _this.elementRef = elementRef;
        _this.cdr = cdr;
        _this.ngZone = ngZone;
        _this.offsets = [];
        _this.zeroWidthStringLength = 0;
        _this.isLineBreak = false;
        _this.isTrailing = false;
        return _this;
    }
    Object.defineProperty(SlaTextComponent.prototype, "slaTextNode", {
        get: function () {
            return this.node;
        },
        set: function (value) {
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
        },
        enumerable: true,
        configurable: true
    });
    SlaTextComponent.prototype.ngOnInit = function () {
        debug('ngOnInit');
        this.offsetKey = OffsetKey.stringify({
            key: this.node.key,
            index: 0
        });
        this.rootNode = this.elementRef.nativeElement;
        this.detectTextTemplate();
        this.renderLeaf();
    };
    SlaTextComponent.prototype.ngOnChanges = function (simpleChanges) {
    };
    SlaTextComponent.prototype.renderLeaf = function () {
        var _this = this;
        // COMPAT: Having the `data-` attributes on these leaf elements ensures that
        // in certain misbehaving browsers they aren't weirdly cloned/destroyed by
        // contenteditable behaviors. (2019/05/08)
        var contentElement = this.leafContainer.nativeElement;
        this.node.marks.forEach(function (mark) {
            var _a;
            var markConfig = _this.buildConfig((_a = {},
                _a[DATA_ATTRS.OBJECT] = 'mark',
                _a), contentElement, null, null, mark);
            var ret = _this.editor.run('renderMark', markConfig);
            if (ret) {
                contentElement = ret;
            }
        });
        if (this.lastContentElement && this.lastContentElement !== this.leafContainer.nativeElement) {
            this.lastContentElement.remove();
        }
        this.elementRef.nativeElement.appendChild(contentElement);
        this.lastContentElement = contentElement;
    };
    SlaTextComponent.prototype.detectTextTemplate = function () {
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
            var lastChar = this.node.text.charAt(this.node.text.length - 1);
            if (lastChar === '\n') {
                this.isTrailing = true;
            }
            else {
                this.isTrailing = false;
            }
        }
    };
    // remove dom when isZeroWidthString = true
    // because dom still exist when content component exec updateSelection
    SlaTextComponent.prototype.setZeroWidthElement = function () {
        this.isZeroWidthString = true;
        var text = this.leafContainer.nativeElement.querySelector("" + SELECTORS.STRING);
        if (text) {
            text.remove();
        }
    };
    SlaTextComponent.prototype.buildConfig = function (attributes, children, annotation, decoration, mark) {
        var renderProps = {
            editor: this.editor,
            marks: this.node.marks,
            node: this.node,
            offset: 0,
            text: this.node.text,
            children: children,
            attributes: attributes,
            annotation: annotation,
            decoration: decoration,
            mark: mark
        };
        return renderProps;
    };
    SlaTextComponent.prototype.ngDoCheck = function () {
        debug.check('check text', this.node);
    };
    SlaTextComponent.decorators = [
        { type: Component, args: [{
                    selector: 'sla-text,[slaText]',
                    template: "<span #leaf [attr.data-slate-leaf]=\"true\" [attr.data-offset-key]=\"offsetKey\">\n    <!-- break compisiton input -->\n    <!-- <span contenteditable=\"false\" class=\"non-editable-area\"></span> -->\n    <!-- move zero order to adjust empty text selection when delete last char-->\n    <span #text *ngIf=\"!isZeroWidthString\" data-slate-string=\"true\">{{ node.text }}{{ isTrailing ? '\\n' : null }}</span>\n    <span\n        *ngIf=\"isZeroWidthString\"\n        attr.data-slate-zero-width=\"{{ isLineBreak ? 'n' : 'z' }}\"\n        attr.data-slate-length=\"{{ zeroWidthStringLength }}\"\n        >{{ '\\u200B' }}<br *ngIf=\"isLineBreak\" />\n    </span>\n</span>\n",
                    providers: [textBinding],
                    changeDetection: ChangeDetectionStrategy.OnPush
                }] }
    ];
    /** @nocollapse */
    SlaTextComponent.ctorParameters = function () { return [
        { type: ElementRef },
        { type: ChangeDetectorRef },
        { type: NgZone }
    ]; };
    SlaTextComponent.propDecorators = {
        editor: [{ type: Input }],
        parent: [{ type: Input }],
        block: [{ type: Input }],
        slaTextNode: [{ type: Input }],
        leafContainer: [{ type: ViewChild, args: ['leaf', { static: true },] }]
    };
    return SlaTextComponent;
}(ChildNodeBase));
export { SlaTextComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJjb21wb25lbnRzL3RleHQvdGV4dC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDSCxTQUFTLEVBRVQsS0FBSyxFQUNMLFVBQVUsRUFDVix1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFVBQVUsRUFDVixNQUFNLEVBS04sU0FBUyxFQUNaLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBUSxNQUFNLEVBQUUsS0FBSyxFQUFjLElBQUksRUFBMEIsTUFBTSxPQUFPLENBQUM7QUFFdEYsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLFVBQVUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN6RCxPQUFPLFNBQVMsTUFBTSx3QkFBd0IsQ0FBQztBQUUvQyxPQUFPLFNBQVMsTUFBTSwyQkFBMkIsQ0FBQztBQUdsRCxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbEMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7QUFFckMsTUFBTSxDQUFDLElBQU0sV0FBVyxHQUFRO0lBQzVCLE9BQU8sRUFBRSxhQUFhO0lBQ3RCLFdBQVcsRUFBRSxVQUFVLENBQUMsY0FBTSxPQUFBLGdCQUFnQixFQUFoQixDQUFnQixDQUFDO0NBQ2xELENBQUM7QUFFRjtJQU1zQyw0Q0FBYTtJQW1EL0MsMEJBQ1ksVUFBc0IsRUFDdEIsR0FBc0IsRUFDdEIsTUFBYztRQUgxQixZQUtJLGlCQUFPLFNBQ1Y7UUFMVyxnQkFBVSxHQUFWLFVBQVUsQ0FBWTtRQUN0QixTQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUN0QixZQUFNLEdBQU4sTUFBTSxDQUFRO1FBNUMxQixhQUFPLEdBQUcsRUFB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QXNLbEQ7U0F0S1ksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDb21wb25lbnQsXG4gICAgT25Jbml0LFxuICAgIElucHV0LFxuICAgIEVsZW1lbnRSZWYsXG4gICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gICAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgZm9yd2FyZFJlZixcbiAgICBOZ1pvbmUsXG4gICAgT25DaGFuZ2VzLFxuICAgIFNpbXBsZUNoYW5nZSxcbiAgICBTaW1wbGVDaGFuZ2VzLFxuICAgIERvQ2hlY2ssXG4gICAgVmlld0NoaWxkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTm9kZSwgRWRpdG9yLCBCbG9jaywgRGVjb3JhdGlvbiwgVGV4dCwgTGVhZiwgQW5ub3RhdGlvbiwgTWFyayB9IGZyb20gJ3NsYXRlJztcbmltcG9ydCB7IExpc3QsIE1hcCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgRGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHsgQ2hpbGROb2RlQmFzZSB9IGZyb20gJy4uLy4uL2NvcmUvY2hpbGQtbm9kZS1iYXNlJztcbmltcG9ydCBEQVRBX0FUVFJTIGZyb20gJy4uLy4uL2NvbnN0YW50cy9kYXRhLWF0dHJpYnV0ZXMnO1xuaW1wb3J0IE9mZnNldEtleSBmcm9tICcuLi8uLi91dGlscy9vZmZzZXQta2V5JztcbmltcG9ydCB7IFNsYUxlYWZSZW5kZXJDb25maWcgfSBmcm9tICcuLi8uLi9jb3JlL3JlbmRlci1wbHVnaW4vcmVuZGVyLWNvbmZpZyc7XG5pbXBvcnQgU0VMRUNUT1JTIGZyb20gJy4uLy4uL2NvbnN0YW50cy9zZWxlY3RvcnMnO1xuXG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ3NsYXRlOnRleHQnKTtcbmRlYnVnLmNoZWNrID0gRGVidWcoJ3NsYXRlOmRvY2hlY2snKTtcblxuZXhwb3J0IGNvbnN0IHRleHRCaW5kaW5nOiBhbnkgPSB7XG4gICAgcHJvdmlkZTogQ2hpbGROb2RlQmFzZSxcbiAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBTbGFUZXh0Q29tcG9uZW50KVxufTtcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdzbGEtdGV4dCxbc2xhVGV4dF0nLFxuICAgIHRlbXBsYXRlVXJsOiAnLi90ZXh0LmNvbXBvbmVudC5odG1sJyxcbiAgICBwcm92aWRlcnM6IFt0ZXh0QmluZGluZ10sXG4gICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgU2xhVGV4dENvbXBvbmVudCBleHRlbmRzIENoaWxkTm9kZUJhc2VcbiAgICBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzLCBEb0NoZWNrIHtcbiAgICByb290Tm9kZTogSFRNTEVsZW1lbnQ7XG5cbiAgICBsYXN0Q29udGVudEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuXG4gICAgbm9kZTogVGV4dDtcblxuICAgIGxlYXZlczogTGlzdDxhbnk+O1xuXG4gICAgb2Zmc2V0cyA9IFtdO1xuXG4gICAgQElucHV0KClcbiAgICBlZGl0b3I6IEVkaXRvcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcGFyZW50OiBOb2RlO1xuXG4gICAgQElucHV0KClcbiAgICBibG9jazogQmxvY2s7XG5cbiAgICBASW5wdXQoKVxuICAgIHNldCBzbGFUZXh0Tm9kZSh2YWx1ZTogVGV4dCkge1xuICAgICAgICBkZWJ1Zygnc2V0OiBzbGFUZXh0Tm9kZScsIHZhbHVlLnRvSlNPTigpKTtcbiAgICAgICAgaWYgKHRoaXMubGVhZkNvbnRhaW5lciAmJiB0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLm1hcmtzICYmICF0aGlzLm5vZGUubWFya3MuZXF1YWxzKHZhbHVlLm1hcmtzKSkge1xuICAgICAgICAgICAgdGhpcy5ub2RlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmRldGVjdFRleHRUZW1wbGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJMZWFmKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZGV0ZWN0VGV4dFRlbXBsYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgc2xhVGV4dE5vZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGU7XG4gICAgfVxuXG4gICAgb2Zmc2V0S2V5O1xuXG4gICAgaXNaZXJvV2lkdGhTdHJpbmc6IGJvb2xlYW47XG5cbiAgICB6ZXJvV2lkdGhTdHJpbmdMZW5ndGggPSAwO1xuXG4gICAgaXNMaW5lQnJlYWsgPSBmYWxzZTtcblxuICAgIGlzVHJhaWxpbmcgPSBmYWxzZTtcblxuICAgIEBWaWV3Q2hpbGQoJ2xlYWYnLCB7IHN0YXRpYzogdHJ1ZSB9KVxuICAgIGxlYWZDb250YWluZXI6IEVsZW1lbnRSZWY7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgICAgICBwcml2YXRlIGNkcjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmVcbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgZGVidWcoJ25nT25Jbml0Jyk7XG4gICAgICAgIHRoaXMub2Zmc2V0S2V5ID0gT2Zmc2V0S2V5LnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBrZXk6IHRoaXMubm9kZS5rZXksXG4gICAgICAgICAgICBpbmRleDogMFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgICAgICB0aGlzLmRldGVjdFRleHRUZW1wbGF0ZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckxlYWYoKTtcbiAgICB9XG5cbiAgICBuZ09uQ2hhbmdlcyhzaW1wbGVDaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgfVxuXG5cblxuICAgIHJlbmRlckxlYWYoKSB7XG4gICAgICAgIC8vIENPTVBBVDogSGF2aW5nIHRoZSBgZGF0YS1gIGF0dHJpYnV0ZXMgb24gdGhlc2UgbGVhZiBlbGVtZW50cyBlbnN1cmVzIHRoYXRcbiAgICAgICAgLy8gaW4gY2VydGFpbiBtaXNiZWhhdmluZyBicm93c2VycyB0aGV5IGFyZW4ndCB3ZWlyZGx5IGNsb25lZC9kZXN0cm95ZWQgYnlcbiAgICAgICAgLy8gY29udGVudGVkaXRhYmxlIGJlaGF2aW9ycy4gKDIwMTkvMDUvMDgpXG4gICAgICAgIGxldCBjb250ZW50RWxlbWVudCA9IHRoaXMubGVhZkNvbnRhaW5lci5uYXRpdmVFbGVtZW50O1xuICAgICAgICB0aGlzLm5vZGUubWFya3MuZm9yRWFjaChtYXJrID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtDb25maWcgPSB0aGlzLmJ1aWxkQ29uZmlnKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgW0RBVEFfQVRUUlMuT0JKRUNUXTogJ21hcmsnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250ZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgbWFya1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IHJldDogYW55ID0gdGhpcy5lZGl0b3IucnVuKCdyZW5kZXJNYXJrJywgbWFya0NvbmZpZyk7XG5cbiAgICAgICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50RWxlbWVudCA9IHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLmxhc3RDb250ZW50RWxlbWVudCAmJiB0aGlzLmxhc3RDb250ZW50RWxlbWVudCAhPT0gdGhpcy5sZWFmQ29udGFpbmVyLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGFzdENvbnRlbnRFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFwcGVuZENoaWxkKGNvbnRlbnRFbGVtZW50KTtcbiAgICAgICAgdGhpcy5sYXN0Q29udGVudEVsZW1lbnQgPSBjb250ZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBkZXRlY3RUZXh0VGVtcGxhdGUoKSB7XG4gICAgICAgIHRoaXMuaXNaZXJvV2lkdGhTdHJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy56ZXJvV2lkdGhTdHJpbmdMZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmlzTGluZUJyZWFrID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNUcmFpbGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5lZGl0b3IucXVlcnkoJ2lzVm9pZCcsIHRoaXMucGFyZW50KSkge1xuICAgICAgICAgICAgdGhpcy56ZXJvV2lkdGhTdHJpbmdMZW5ndGggPSB0aGlzLnBhcmVudC50ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuc2V0WmVyb1dpZHRoRWxlbWVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgdGhpcy5ub2RlLnRleHQgPT09ICcnICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5vYmplY3QgPT09ICdibG9jaycgJiZcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnRleHQgPT09ICcnICYmXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5ub2Rlcy5sYXN0KCkgPT09IHRoaXMubm9kZVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuaXNMaW5lQnJlYWsgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZXRaZXJvV2lkdGhFbGVtZW50KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ub2RlLnRleHQgPT09ICcnKSB7XG4gICAgICAgICAgICB0aGlzLnNldFplcm9XaWR0aEVsZW1lbnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RDaGFyID0gdGhpcy5ub2RlLnRleHQuY2hhckF0KHRoaXMubm9kZS50ZXh0Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgaWYgKGxhc3RDaGFyID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNUcmFpbGluZyA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNUcmFpbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIGRvbSB3aGVuIGlzWmVyb1dpZHRoU3RyaW5nID0gdHJ1ZVxuICAgIC8vIGJlY2F1c2UgZG9tIHN0aWxsIGV4aXN0IHdoZW4gY29udGVudCBjb21wb25lbnQgZXhlYyB1cGRhdGVTZWxlY3Rpb25cbiAgICBwcml2YXRlIHNldFplcm9XaWR0aEVsZW1lbnQoKSB7XG4gICAgICAgIHRoaXMuaXNaZXJvV2lkdGhTdHJpbmcgPSB0cnVlO1xuICAgICAgICBjb25zdCB0ZXh0ID0gKHRoaXMubGVhZkNvbnRhaW5lci5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5xdWVyeVNlbGVjdG9yKGAke1NFTEVDVE9SUy5TVFJJTkd9YCk7XG4gICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICB0ZXh0LnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRDb25maWcoXG4gICAgICAgIGF0dHJpYnV0ZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sXG4gICAgICAgIGNoaWxkcmVuOiBIVE1MRWxlbWVudCxcbiAgICAgICAgYW5ub3RhdGlvbj86IEFubm90YXRpb24sXG4gICAgICAgIGRlY29yYXRpb24/OiBEZWNvcmF0aW9uLFxuICAgICAgICBtYXJrPzogTWFya1xuICAgICkge1xuICAgICAgICBjb25zdCByZW5kZXJQcm9wczogU2xhTGVhZlJlbmRlckNvbmZpZyA9IHtcbiAgICAgICAgICAgIGVkaXRvcjogdGhpcy5lZGl0b3IsXG4gICAgICAgICAgICBtYXJrczogdGhpcy5ub2RlLm1hcmtzLFxuICAgICAgICAgICAgbm9kZTogdGhpcy5ub2RlLFxuICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgdGV4dDogdGhpcy5ub2RlLnRleHQsXG4gICAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBhbm5vdGF0aW9uLFxuICAgICAgICAgICAgZGVjb3JhdGlvbixcbiAgICAgICAgICAgIG1hcmtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlclByb3BzO1xuICAgIH1cblxuICAgIG5nRG9DaGVjaygpIHtcbiAgICAgICAgZGVidWcuY2hlY2soJ2NoZWNrIHRleHQnLCB0aGlzLm5vZGUpO1xuICAgIH1cbn1cbiJdfQ==