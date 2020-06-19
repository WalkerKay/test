import * as tslib_1 from "tslib";
import { ViewChild, Input, ViewContainerRef, ElementRef, QueryList } from '@angular/core';
import { Editor, Block } from 'slate';
var SlaPluginComponentBase = /** @class */ (function () {
    function SlaPluginComponentBase(elementRef) {
        this.elementRef = elementRef;
    }
    SlaPluginComponentBase.prototype.initPluginComponent = function () {
        this.insertChildrenView();
        this.setNodeAttributes(this.elementRef.nativeElement, this.attributes);
    };
    SlaPluginComponentBase.prototype.getData = function (key) {
        return this.node.data.get(key);
    };
    SlaPluginComponentBase.prototype.isNodeChange = function (changes) {
        var node = changes.node;
        if (node && !node.isFirstChange) {
            return true;
        }
        return false;
    };
    SlaPluginComponentBase.prototype.updateHostClass = function (classMap) {
        for (var key in classMap) {
            if (classMap.hasOwnProperty(key)) {
                var value = classMap[key];
                var classList = this.elementRef.nativeElement.classList;
                if (value) {
                    if (!classList.contains(key)) {
                        classList.add(key);
                    }
                }
                else {
                    if (classList.contains(key)) {
                        classList.remove(key);
                    }
                }
            }
        }
    };
    SlaPluginComponentBase.prototype.setNodeAttributes = function (ele, attributes) {
        for (var key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                ele.setAttribute(key, attributes[key]);
            }
        }
    };
    SlaPluginComponentBase.prototype.insertChildrenView = function () {
        var e_1, _a;
        if (this.childrenContent) {
            var nodeRefs = this.children.toArray();
            try {
                for (var nodeRefs_1 = tslib_1.__values(nodeRefs), nodeRefs_1_1 = nodeRefs_1.next(); !nodeRefs_1_1.done; nodeRefs_1_1 = nodeRefs_1.next()) {
                    var nodeRef = nodeRefs_1_1.value;
                    this.childrenContent.nativeElement.appendChild(nodeRef.rootNode);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (nodeRefs_1_1 && !nodeRefs_1_1.done && (_a = nodeRefs_1.return)) _a.call(nodeRefs_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    SlaPluginComponentBase.prototype.removeNode = function (event) {
        event.preventDefault();
        var path = this.editor.value.document.getPath(this.node.key);
        var focusNode = this.editor.value.document.getPreviousBlock(path);
        if (!focusNode) {
            focusNode = this.editor.value.document.getNextBlock(path);
        }
        this.editor.focus().moveToEndOfNode(focusNode);
        this.editor.removeNodeByKey(this.node.key);
    };
    SlaPluginComponentBase.propDecorators = {
        editor: [{ type: Input }],
        node: [{ type: Input }],
        parent: [{ type: Input }],
        isFocused: [{ type: Input }],
        isSelected: [{ type: Input }],
        readOnly: [{ type: Input }],
        children: [{ type: Input }],
        attributes: [{ type: Input }],
        nodeViewContainerRef: [{ type: Input }],
        childrenContent: [{ type: ViewChild, args: ['childrenContent', { read: ElementRef, static: true },] }]
    };
    return SlaPluginComponentBase;
}());
export { SlaPluginComponentBase };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLWNvbXBvbmVudC1iYXNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsiY29yZS9yZW5kZXItcGx1Z2luL3BsdWdpbi1jb21wb25lbnQtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQWlCLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekcsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQVEsTUFBTSxPQUFPLENBQUM7QUFFNUM7SUErQkksZ0NBQW1CLFVBQXNCO1FBQXRCLGVBQVUsR0FBVixVQUFVLENBQVk7SUFDekMsQ0FBQztJQUVELG9EQUFtQixHQUFuQjtRQUNJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELHdDQUFPLEdBQVAsVUFBUSxHQUFHO1FBQ1AsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELDZDQUFZLEdBQVosVUFBYSxPQUFzQjtRQUMvQixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQzFCLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUM3QixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELGdEQUFlLEdBQWYsVUFBZ0IsUUFBb0M7UUFDaEQsS0FBSyxJQUFNLEdBQUcsSUFBSSxRQUFRLEVBQUU7WUFDeEIsSUFBSSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM5QixJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLElBQU0sU0FBUyxHQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBNkIsQ0FBQyxTQUFTLENBQUM7Z0JBQzNFLElBQUksS0FBSyxFQUFFO29CQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUMxQixTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUN0QjtpQkFDSjtxQkFBTTtvQkFDSCxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ3pCLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQ3pCO2lCQUNKO2FBQ0o7U0FDSjtJQUNMLENBQUM7SUFFRCxrREFBaUIsR0FBakIsVUFBa0IsR0FBZ0IsRUFBRSxVQUFxQztRQUNyRSxLQUFLLElBQU0sR0FBRyxJQUFJLFVBQVUsRUFBRTtZQUMxQixJQUFJLFVBQVUsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2hDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzFDO1NBQ0o7SUFDTCxDQUFDO0lBRU8sbURBQWtCLEdBQTFCOztRQUNJLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN0QixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDOztnQkFDekMsS0FBc0IsSUFBQSxhQUFBLGlCQUFBLFFBQVEsQ0FBQSxrQ0FBQSx3REFBRTtvQkFBM0IsSUFBTSxPQUFPLHFCQUFBO29CQUNkLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3BFOzs7Ozs7Ozs7U0FDSjtJQUNMLENBQUM7SUFFRCwyQ0FBVSxHQUFWLFVBQVcsS0FBSztRQUNaLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN2QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0QsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDWixTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3RDtRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQzs7eUJBOUZBLEtBQUs7dUJBR0wsS0FBSzt5QkFHTCxLQUFLOzRCQUdMLEtBQUs7NkJBR0wsS0FBSzsyQkFHTCxLQUFLOzJCQUdMLEtBQUs7NkJBR0wsS0FBSzt1Q0FHTCxLQUFLO2tDQUdMLFNBQVMsU0FBQyxpQkFBaUIsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTs7SUFvRXBFLDZCQUFDO0NBQUEsQUFoR0QsSUFnR0M7U0FoR1ksc0JBQXNCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVmlld0NoaWxkLCBJbnB1dCwgVmlld0NvbnRhaW5lclJlZiwgU2ltcGxlQ2hhbmdlcywgRWxlbWVudFJlZiwgUXVlcnlMaXN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBFZGl0b3IsIEJsb2NrLCBOb2RlIH0gZnJvbSAnc2xhdGUnO1xuXG5leHBvcnQgY2xhc3MgU2xhUGx1Z2luQ29tcG9uZW50QmFzZSB7XG4gICAgQElucHV0KClcbiAgICBlZGl0b3I6IEVkaXRvcjtcblxuICAgIEBJbnB1dCgpXG4gICAgbm9kZTogQmxvY2s7XG5cbiAgICBASW5wdXQoKVxuICAgIHBhcmVudDogTm9kZTtcblxuICAgIEBJbnB1dCgpXG4gICAgaXNGb2N1c2VkOiBib29sZWFuO1xuXG4gICAgQElucHV0KClcbiAgICBpc1NlbGVjdGVkOiBib29sZWFuO1xuXG4gICAgQElucHV0KClcbiAgICByZWFkT25seTogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpXG4gICAgY2hpbGRyZW46IFF1ZXJ5TGlzdDxhbnk+O1xuXG4gICAgQElucHV0KClcbiAgICBhdHRyaWJ1dGVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuXG4gICAgQElucHV0KClcbiAgICBub2RlVmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZjtcblxuICAgIEBWaWV3Q2hpbGQoJ2NoaWxkcmVuQ29udGVudCcsIHsgcmVhZDogRWxlbWVudFJlZiwgc3RhdGljOiB0cnVlIH0pXG4gICAgY2hpbGRyZW5Db250ZW50OiBFbGVtZW50UmVmO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICB9XG5cbiAgICBpbml0UGx1Z2luQ29tcG9uZW50KCkge1xuICAgICAgICB0aGlzLmluc2VydENoaWxkcmVuVmlldygpO1xuICAgICAgICB0aGlzLnNldE5vZGVBdHRyaWJ1dGVzKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCB0aGlzLmF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIGdldERhdGEoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZGF0YS5nZXQoa2V5KTtcbiAgICB9XG5cbiAgICBpc05vZGVDaGFuZ2UoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBub2RlID0gY2hhbmdlcy5ub2RlO1xuICAgICAgICBpZiAobm9kZSAmJiAhbm9kZS5pc0ZpcnN0Q2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdXBkYXRlSG9zdENsYXNzKGNsYXNzTWFwOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjbGFzc01hcCkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNsYXNzTWFwW2tleV07XG4gICAgICAgICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY2xhc3NMaXN0LmNvbnRhaW5zKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTGlzdC5hZGQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc0xpc3QuY29udGFpbnMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Tm9kZUF0dHJpYnV0ZXMoZWxlOiBIVE1MRWxlbWVudCwgYXR0cmlidXRlczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgZWxlLnNldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGluc2VydENoaWxkcmVuVmlldygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW5Db250ZW50KSB7XG4gICAgICAgICAgICBjb25zdCBub2RlUmVmcyA9IHRoaXMuY2hpbGRyZW4udG9BcnJheSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBub2RlUmVmIG9mIG5vZGVSZWZzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbkNvbnRlbnQubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZChub2RlUmVmLnJvb3ROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZU5vZGUoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZWRpdG9yLnZhbHVlLmRvY3VtZW50LmdldFBhdGgodGhpcy5ub2RlLmtleSk7XG4gICAgICAgIGxldCBmb2N1c05vZGUgPSB0aGlzLmVkaXRvci52YWx1ZS5kb2N1bWVudC5nZXRQcmV2aW91c0Jsb2NrKHBhdGgpO1xuICAgICAgICBpZiAoIWZvY3VzTm9kZSkge1xuICAgICAgICAgICAgZm9jdXNOb2RlID0gdGhpcy5lZGl0b3IudmFsdWUuZG9jdW1lbnQuZ2V0TmV4dEJsb2NrKHBhdGgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWRpdG9yLmZvY3VzKCkubW92ZVRvRW5kT2ZOb2RlKGZvY3VzTm9kZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yLnJlbW92ZU5vZGVCeUtleSh0aGlzLm5vZGUua2V5KTtcbiAgICB9XG59XG4iXX0=