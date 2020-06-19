import * as tslib_1 from "tslib";
import { Component, Input, ElementRef, ViewContainerRef, ChangeDetectionStrategy, QueryList, ViewChildren, forwardRef, IterableDiffers, NgZone } from '@angular/core';
import { Selection, PathUtils, Editor, Block } from 'slate';
import { SlaNestedNodeRef } from '../../core/render-plugin/render-config';
import DATA_ATTRS from '../../constants/data-attributes';
import Debug from 'debug';
import { ChildNodeBase } from '../../core/child-node-base';
import warning from 'tiny-warning';
import { SlaVoidComponent } from '../void/void.component';
import { SlaPluginRenderService } from '../../core/render-plugin/plugin-render-service';
var debug = Debug('slate:node');
debug.render = Debug('slate:node-render');
debug.check = Debug('slate:docheck');
debug.change = Debug('slate:change');
export var nodeBinding = {
    provide: ChildNodeBase,
    useExisting: forwardRef(function () { return SlaNodeComponent; })
};
var SlaNodeComponent = /** @class */ (function (_super) {
    tslib_1.__extends(SlaNodeComponent, _super);
    function SlaNodeComponent(viewContainerRef, elementRef, slaPluginRenderService, ngZone, differs) {
        var _this = _super.call(this) || this;
        _this.viewContainerRef = viewContainerRef;
        _this.elementRef = elementRef;
        _this.slaPluginRenderService = slaPluginRenderService;
        _this.ngZone = ngZone;
        _this.differs = differs;
        _this.subSelections = [];
        _this.readOnly = false;
        _this.rendered = true;
        return _this;
    }
    Object.defineProperty(SlaNodeComponent.prototype, "node", {
        get: function () {
            return this.internalNode;
        },
        set: function (value) {
            var _this = this;
            debug('set: node', value.toJSON());
            var oldNode = this.internalNode || value;
            this.internalNode = value;
            if (this.nodeComponentRef) {
                this.ngZone.run(function () {
                    _this.nodeComponentRef.componentRef.instance.node = _this.internalNode;
                    _this.nodeComponentRef.componentRef.changeDetectorRef.detectChanges();
                });
            }
            else {
                if (!this.internalNode.data.equals(oldNode.data)) {
                    this.render();
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    SlaNodeComponent.prototype.ngOnInit = function () {
        debug("ngOnInit node", this.node.toJSON());
        this.rootNode = this.elementRef.nativeElement;
    };
    SlaNodeComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        this.render();
        this.differ = this.differs.find(this.nodeRefs).create(function (index, item) {
            return item.rootNode;
        });
        this.differ.diff(this.nodeRefs);
        this.nodeRefs.changes.subscribe(function () {
            var iterableChanges = _this.differ.diff(_this.nodeRefs);
            if (iterableChanges) {
                iterableChanges.forEachAddedItem(function (record) {
                    var rootNode = record.item.rootNode;
                    var childrenContent;
                    if (_this.nodeComponentRef) {
                        childrenContent = _this.nodeComponentRef.componentRef.instance.childrenContent.nativeElement;
                    }
                    else {
                        childrenContent = _this.rootNode;
                    }
                    var childNodes = Array.from(childrenContent.childNodes).filter(function (node) {
                        return node.hasAttribute('data-slate-object') || node.hasAttribute('data-slate-void');
                    });
                    var nextNode = childNodes[record.currentIndex];
                    if (nextNode) {
                        childrenContent.insertBefore(rootNode, nextNode);
                    }
                    else {
                        childrenContent.appendChild(rootNode);
                    }
                });
            }
        });
    };
    SlaNodeComponent.prototype.ngAfterViewChecked = function () { };
    SlaNodeComponent.prototype.getRelativeRange = function (node, index, range) {
        if (range.isUnset) {
            return null;
        }
        var child = node.nodes.get(index);
        var start = range.start, end = range.end;
        var startPath = start.path;
        var endPath = end.path;
        var startIndex = startPath.first();
        var endIndex = endPath.first();
        if (startIndex === index) {
            start = start.setPath(startPath.rest());
        }
        else if (startIndex < index && index <= endIndex) {
            if (child.object === 'text') {
                start = start.moveTo(PathUtils.create([index]), 0).setKey(child.key);
            }
            else {
                var _a = tslib_1.__read(child.texts(), 1), first = _a[0];
                var _b = tslib_1.__read(first, 2), firstNode = _b[0], firstPath = _b[1];
                start = start.moveTo(firstPath, 0).setKey(firstNode.key);
            }
        }
        else {
            start = null;
        }
        if (endIndex === index) {
            end = end.setPath(endPath.rest());
        }
        else if (startIndex <= index && index < endIndex) {
            if (child.object === 'text') {
                var length_1 = child.text.length;
                end = end.moveTo(PathUtils.create([index]), length_1).setKey(child.key);
            }
            else {
                var _c = tslib_1.__read(child.texts({ direction: 'backward' }), 1), last = _c[0];
                var _d = tslib_1.__read(last, 2), lastNode = _d[0], lastPath = _d[1];
                end = end.moveTo(lastPath, lastNode.text.length).setKey(lastNode.key);
            }
        }
        else {
            end = null;
        }
        if (!start || !end) {
            return null;
        }
        range = range.setAnchor(start);
        range = range.setFocus(end);
        return range;
    };
    SlaNodeComponent.prototype.trackBy = function (index, node) {
        return node.key + "_" + node.type;
    };
    SlaNodeComponent.prototype.render = function () {
        var _a;
        debug.render('exec render', this.node.toJSON());
        var pluginRender;
        if (this.node.object === 'block') {
            pluginRender = 'renderBlock';
        }
        else if (this.node.object === 'document') {
            pluginRender = 'renderDocument';
        }
        else if (this.node.object === 'inline') {
            pluginRender = 'renderInline';
        }
        var config = {
            editor: this.editor,
            isFocused: !!this.selection && this.selection.isFocused,
            isSelected: !!this.selection,
            node: this.node,
            parent: null,
            readOnly: this.readOnly,
            children: this.nodeRefs,
            attributes: (_a = {},
                _a[DATA_ATTRS.OBJECT] = this.node.object,
                _a[DATA_ATTRS.KEY] = this.node.key,
                _a),
            nodeViewContainerRef: this.viewContainerRef
        };
        var renderResult = this.editor.run(pluginRender, config);
        var renderDom = null;
        if (renderResult instanceof SlaNestedNodeRef) {
            this.nodeComponentRef = renderResult;
            renderDom = this.nodeComponentRef.rootNode;
        }
        else {
            renderDom = renderResult;
        }
        if (this.editor.isVoid(this.node)) {
            config.children = renderDom;
            var voidRootNode = this.slaPluginRenderService.renderComponent(SlaVoidComponent, Object.assign(config, { nodeRefs: this.nodeRefs })).rootNode;
            this.rootNode.replaceWith(voidRootNode);
            this.rootNode = voidRootNode;
        }
        else {
            this.rootNode.replaceWith(renderDom);
            this.rootNode = renderDom;
        }
    };
    SlaNodeComponent.prototype.getNodeRef = function (index) {
        if (!this.nodeRefs) {
            warning(false, 'nodeRefs is undefined.');
            return null;
        }
        return this.nodeRefs.find(function (item, i, array) { return i === index; });
    };
    SlaNodeComponent.prototype.ngOnChanges = function (simpleChanges) {
        var _this = this;
        if (simpleChanges.node || simpleChanges.decorations || simpleChanges.annotations || simpleChanges.selection) {
            this.memoSubNodes();
        }
        debug.change("node changes", simpleChanges);
        var selectionChange = simpleChanges.selection;
        if (selectionChange && !selectionChange.firstChange) {
            if (this.nodeComponentRef) {
                var isFocused_1 = !!this.selection && this.selection.isFocused;
                if (isFocused_1 !== this.nodeComponentRef.componentRef.instance.isFocused) {
                    this.ngZone.run(function () {
                        _this.nodeComponentRef.componentRef.instance.isFocused = isFocused_1;
                        _this.nodeComponentRef.componentRef.changeDetectorRef.detectChanges();
                    });
                }
            }
        }
    };
    SlaNodeComponent.prototype.ngDoCheck = function () {
        debug.check('check node');
    };
    SlaNodeComponent.prototype.ngOnDestroy = function () {
        debug("ngOnDestroy node");
        this.rootNode.remove();
    };
    SlaNodeComponent.prototype.memoSubNodes = function () {
        for (var i = 0; i < this.node.nodes.size; i++) {
            var selection = this.selection && this.getRelativeRange(this.node, i, this.selection);
            if (!(selection && selection.equals(this.subSelections[i]))) {
                this.subSelections[i] = selection;
            }
        }
    };
    SlaNodeComponent.decorators = [
        { type: Component, args: [{
                    selector: 'sla-node,[slaNode]',
                    template: "<ng-container *ngFor=\"let child of node.nodes; let i = index; trackBy: trackBy\">\n    <span\n        *ngIf=\"child.object === 'text'\"\n        slaText\n        [attr.data-slate-object]=\"child.object\"\n        [slaTextNode]=\"child\"\n        [parent]=\"node\"\n        [editor]=\"editor\"\n        [attr.data-key]=\"child.key\"\n    ></span>\n    <div\n        *ngIf=\"child.object !== 'text'\"\n        slaNode\n        [node]=\"child\"\n        [selection]=\"subSelections[i]\"\n        [editor]=\"editor\"\n        [readOnly]=\"readOnly\"\n    ></div>\n</ng-container>\n",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    providers: [nodeBinding]
                }] }
    ];
    /** @nocollapse */
    SlaNodeComponent.ctorParameters = function () { return [
        { type: ViewContainerRef },
        { type: ElementRef },
        { type: SlaPluginRenderService },
        { type: NgZone },
        { type: IterableDiffers }
    ]; };
    SlaNodeComponent.propDecorators = {
        editor: [{ type: Input }],
        selection: [{ type: Input }],
        block: [{ type: Input }],
        index: [{ type: Input }],
        nodeRef: [{ type: Input }],
        readOnly: [{ type: Input }],
        node: [{ type: Input }],
        nodeRefs: [{ type: ViewChildren, args: [ChildNodeBase,] }]
    };
    return SlaNodeComponent;
}(ChildNodeBase));
export { SlaNodeComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJjb21wb25lbnRzL25vZGUvbm9kZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDSCxTQUFTLEVBQ1QsS0FBSyxFQUtMLFVBQVUsRUFFVixnQkFBZ0IsRUFDaEIsdUJBQXVCLEVBRXZCLFNBQVMsRUFDVCxZQUFZLEVBQ1osVUFBVSxFQUlWLGVBQWUsRUFJZixNQUFNLEVBRVQsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFZLFNBQVMsRUFBRSxTQUFTLEVBQVEsTUFBTSxFQUFFLEtBQUssRUFBd0MsTUFBTSxPQUFPLENBQUM7QUFFbEgsT0FBTyxFQUF1QixnQkFBZ0IsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQy9GLE9BQU8sVUFBVSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3pELE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxPQUFPLE1BQU0sY0FBYyxDQUFDO0FBQ25DLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLGdEQUFnRCxDQUFDO0FBRXhGLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQzFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ3JDLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXJDLE1BQU0sQ0FBQyxJQUFNLFdBQVcsR0FBUTtJQUM1QixPQUFPLEVBQUUsYUFBYTtJQUN0QixXQUFXLEVBQUUsVUFBVSxDQUFDLGNBQU0sT0FBQSxnQkFBZ0IsRUFBaEIsQ0FBZ0IsQ0FBQztDQUNsRCxDQUFDO0FBRUY7SUFNc0MsNENBQWE7SUF5RC9DLDBCQUNZLGdCQUFrQyxFQUNsQyxVQUEyQixFQUMzQixzQkFBOEMsRUFDOUMsTUFBYyxFQUNkLE9BQXdCO1FBTHBDLFlBT0ksaUJBQU8sU0FDVjtRQVBXLHNCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsZ0JBQVUsR0FBVixVQUFVLENBQWlCO1FBQzNCLDRCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7UUFDOUMsWUFBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLGFBQU8sR0FBUCxPQUFPLENBQWlCO1FBckRwQyxtQkFBYSxHQUFHLEVBQUUsQ0FBQztRQWtCbkIsY0FBUSxHQUFHLEtBQUssQ0FBQztRQUVqQixjQUFRLEdBQUcsSUFBSSxDQUFDOztJQW9DaEIsQ0FBQztJQWxDRCxzQkFDSSxrQ0FBSTthQWdCUjtZQUNJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUM3QixDQUFDO2FBbkJELFVBQ1MsS0FBZ0M7WUFEekMsaUJBZUM7WUFiRyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDO1lBQzNDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO2dCQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztvQkFDWixLQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsS0FBSSxDQUFDLFlBQVksQ0FBQztvQkFDckUsS0FBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDekUsQ0FBQyxDQUFDLENBQUM7YUFDTjtpQkFBTTtnQkFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUNqQjthQUNKO1FBQ0wsQ0FBQzs7O09BQUE7SUFxQkQsbUNBQVEsR0FBUjtRQUNJLEtBQUssQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7SUFDbEQsQ0FBQztJQUVELDBDQUFlLEdBQWY7UUFBQSxpQkE2QkM7UUE1QkcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsS0FBSyxFQUFFLElBQUk7WUFDOUQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQWUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUM1QixJQUFNLGVBQWUsR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsUUFBZSxDQUFDLENBQUM7WUFDL0QsSUFBSSxlQUFlLEVBQUU7Z0JBQ2pCLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFDLE1BQTJDO29CQUN6RSxJQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDdEMsSUFBSSxlQUE0QixDQUFDO29CQUNqQyxJQUFJLEtBQUksQ0FBQyxnQkFBZ0IsRUFBRTt3QkFDdkIsZUFBZSxHQUFJLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBZ0IsQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDO3FCQUN4Rzt5QkFBTTt3QkFDSCxlQUFlLEdBQUcsS0FBSSxDQUFDLFFBQVEsQ0FBQztxQkFDbkM7b0JBQ0QsSUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsSUFBSTt3QkFDbEUsT0FBQyxJQUFvQixDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFLLElBQW9CLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDO29CQUFoSCxDQUFnSCxDQUNuSCxDQUFDO29CQUNGLElBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2pELElBQUksUUFBUSxFQUFFO3dCQUNWLGVBQWUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3FCQUNwRDt5QkFBTTt3QkFDSCxlQUFlLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3FCQUN6QztnQkFDTCxDQUFDLENBQUMsQ0FBQzthQUNOO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsNkNBQWtCLEdBQWxCLGNBQXNCLENBQUM7SUFFdkIsMkNBQWdCLEdBQWhCLFVBQWlCLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSztRQUMvQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDZixPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsSUFBQSxtQkFBSyxFQUFFLGVBQUcsQ0FBVztRQUNuQixJQUFBLHNCQUFlLENBQVc7UUFDMUIsSUFBQSxrQkFBYSxDQUFTO1FBQzlCLElBQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQyxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFakMsSUFBSSxVQUFVLEtBQUssS0FBSyxFQUFFO1lBQ3RCLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzNDO2FBQU0sSUFBSSxVQUFVLEdBQUcsS0FBSyxJQUFJLEtBQUssSUFBSSxRQUFRLEVBQUU7WUFDaEQsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtnQkFDekIsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN4RTtpQkFBTTtnQkFDRyxJQUFBLHFDQUF1QixFQUF0QixhQUFzQixDQUFDO2dCQUN4QixJQUFBLDZCQUE4QixFQUE3QixpQkFBUyxFQUFFLGlCQUFrQixDQUFDO2dCQUNyQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM1RDtTQUNKO2FBQU07WUFDSCxLQUFLLEdBQUcsSUFBSSxDQUFDO1NBQ2hCO1FBRUQsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQ3BCLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ3JDO2FBQU0sSUFBSSxVQUFVLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxRQUFRLEVBQUU7WUFDaEQsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtnQkFDekIsSUFBTSxRQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDekU7aUJBQU07Z0JBQ0csSUFBQSw4REFBK0MsRUFBOUMsWUFBOEMsQ0FBQztnQkFDaEQsSUFBQSw0QkFBMkIsRUFBMUIsZ0JBQVEsRUFBRSxnQkFBZ0IsQ0FBQztnQkFDbEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN6RTtTQUNKO2FBQU07WUFDSCxHQUFHLEdBQUcsSUFBSSxDQUFDO1NBQ2Q7UUFFRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ2hCLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFFRCxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsa0NBQU8sR0FBUCxVQUFRLEtBQUssRUFBRSxJQUFTO1FBQ3BCLE9BQVUsSUFBSSxDQUFDLEdBQUcsU0FBSSxJQUFJLENBQUMsSUFBTSxDQUFDO0lBQ3RDLENBQUM7SUFFRCxpQ0FBTSxHQUFOOztRQUNJLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNoRCxJQUFJLFlBQVksQ0FBQztRQUNqQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE9BQU8sRUFBRTtZQUM5QixZQUFZLEdBQUcsYUFBYSxDQUFDO1NBQ2hDO2FBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxVQUFVLEVBQUU7WUFDeEMsWUFBWSxHQUFHLGdCQUFnQixDQUFDO1NBQ25DO2FBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDdEMsWUFBWSxHQUFHLGNBQWMsQ0FBQztTQUNqQztRQUNELElBQU0sTUFBTSxHQUF3QjtZQUNoQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUztZQUN2RCxVQUFVLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQzVCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixVQUFVO2dCQUNOLEdBQUMsVUFBVSxDQUFDLE1BQU0sSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07Z0JBQ3JDLEdBQUMsVUFBVSxDQUFDLEdBQUcsSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUc7bUJBQ2xDO1lBQ0Qsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtTQUM5QyxDQUFDO1FBQ0YsSUFBTSxZQUFZLEdBQW1DLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQVEsQ0FBQztRQUNsRyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFBSSxZQUFZLFlBQVksZ0JBQWdCLEVBQUU7WUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFlBQVksQ0FBQztZQUNyQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztTQUM5QzthQUFNO1lBQ0gsU0FBUyxHQUFHLFlBQVksQ0FBQztTQUM1QjtRQUNELElBQUssSUFBSSxDQUFDLE1BQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxlQUFlLENBQzVELGdCQUFnQixFQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FDckQsQ0FBQyxRQUFRLENBQUM7WUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQztTQUNoQzthQUFNO1lBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7U0FDN0I7SUFDTCxDQUFDO0lBRUQscUNBQVUsR0FBVixVQUFXLEtBQWE7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDaEIsT0FBTyxDQUFDLEtBQUssRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLElBQUssT0FBQSxDQUFDLEtBQUssS0FBSyxFQUFYLENBQVcsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxzQ0FBVyxHQUFYLFVBQVksYUFBNEI7UUFBeEMsaUJBaUJDO1FBaEJHLElBQUksYUFBYSxDQUFDLElBQUksSUFBSSxhQUFhLENBQUMsV0FBVyxJQUFJLGFBQWEsQ0FBQyxXQUFXLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRTtZQUN6RyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDdkI7UUFDRCxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM1QyxJQUFNLGVBQWUsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDO1FBQ2hELElBQUksZUFBZSxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRTtZQUNqRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDdkIsSUFBTSxXQUFTLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7Z0JBQy9ELElBQUksV0FBUyxLQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtvQkFDckUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7d0JBQ1osS0FBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLFdBQVMsQ0FBQzt3QkFDbEUsS0FBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDekUsQ0FBQyxDQUFDLENBQUM7aUJBQ047YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQUVELG9DQUFTLEdBQVQ7UUFDSSxLQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxzQ0FBVyxHQUFYO1FBQ0ksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsdUNBQVksR0FBWjtRQUNJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hGLElBQUksQ0FBQyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN6RCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQzthQUNyQztTQUNKO0lBQ0wsQ0FBQzs7Z0JBOVBKLFNBQVMsU0FBQztvQkFDUCxRQUFRLEVBQUUsb0JBQW9CO29CQUM5Qiw4a0JBQW9DO29CQUNwQyxlQUFlLEVBQUUsdUJBQXVCLENBQUMsTUFBTTtvQkFDL0MsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUMzQjs7OztnQkF6Q0csZ0JBQWdCO2dCQUZoQixVQUFVO2dCQTBCTCxzQkFBc0I7Z0JBWDNCLE1BQU07Z0JBSk4sZUFBZTs7O3lCQTRDZCxLQUFLOzRCQUdMLEtBQUs7d0JBR0wsS0FBSzt3QkFHTCxLQUFLOzBCQUdMLEtBQUs7MkJBR0wsS0FBSzt1QkFLTCxLQUFLOzJCQXFCTCxZQUFZLFNBQUMsYUFBYTs7SUFxTS9CLHVCQUFDO0NBQUEsQUEvUEQsQ0FNc0MsYUFBYSxHQXlQbEQ7U0F6UFksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDb21wb25lbnQsXG4gICAgSW5wdXQsXG4gICAgU2ltcGxlQ2hhbmdlcyxcbiAgICBWaWV3Q2hpbGQsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uSW5pdCxcbiAgICBFbGVtZW50UmVmLFxuICAgIFRlbXBsYXRlUmVmLFxuICAgIFZpZXdDb250YWluZXJSZWYsXG4gICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gICAgT25EZXN0cm95LFxuICAgIFF1ZXJ5TGlzdCxcbiAgICBWaWV3Q2hpbGRyZW4sXG4gICAgZm9yd2FyZFJlZixcbiAgICBEb0NoZWNrLFxuICAgIEFmdGVyVmlld0luaXQsXG4gICAgQWZ0ZXJWaWV3Q2hlY2tlZCxcbiAgICBJdGVyYWJsZURpZmZlcnMsXG4gICAgSXRlcmFibGVEaWZmZXIsXG4gICAgSXRlcmFibGVDaGFuZ2VSZWNvcmQsXG4gICAgTmdJdGVyYWJsZSxcbiAgICBOZ1pvbmUsXG4gICAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRG9jdW1lbnQsIFNlbGVjdGlvbiwgUGF0aFV0aWxzLCBOb2RlLCBFZGl0b3IsIEJsb2NrLCBJbmxpbmUsIERlY29yYXRpb24sIEFubm90YXRpb24sIFRleHQgfSBmcm9tICdzbGF0ZSc7XG5pbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IHsgU2xhTm9kZVJlbmRlckNvbmZpZywgU2xhTmVzdGVkTm9kZVJlZiB9IGZyb20gJy4uLy4uL2NvcmUvcmVuZGVyLXBsdWdpbi9yZW5kZXItY29uZmlnJztcbmltcG9ydCBEQVRBX0FUVFJTIGZyb20gJy4uLy4uL2NvbnN0YW50cy9kYXRhLWF0dHJpYnV0ZXMnO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IENoaWxkTm9kZUJhc2UgfSBmcm9tICcuLi8uLi9jb3JlL2NoaWxkLW5vZGUtYmFzZSc7XG5pbXBvcnQgd2FybmluZyBmcm9tICd0aW55LXdhcm5pbmcnO1xuaW1wb3J0IHsgU2xhVm9pZENvbXBvbmVudCB9IGZyb20gJy4uL3ZvaWQvdm9pZC5jb21wb25lbnQnO1xuaW1wb3J0IHsgU2xhUGx1Z2luUmVuZGVyU2VydmljZSB9IGZyb20gJy4uLy4uL2NvcmUvcmVuZGVyLXBsdWdpbi9wbHVnaW4tcmVuZGVyLXNlcnZpY2UnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdzbGF0ZTpub2RlJyk7XG5kZWJ1Zy5yZW5kZXIgPSBEZWJ1Zygnc2xhdGU6bm9kZS1yZW5kZXInKTtcbmRlYnVnLmNoZWNrID0gRGVidWcoJ3NsYXRlOmRvY2hlY2snKTtcbmRlYnVnLmNoYW5nZSA9IERlYnVnKCdzbGF0ZTpjaGFuZ2UnKTtcblxuZXhwb3J0IGNvbnN0IG5vZGVCaW5kaW5nOiBhbnkgPSB7XG4gICAgcHJvdmlkZTogQ2hpbGROb2RlQmFzZSxcbiAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBTbGFOb2RlQ29tcG9uZW50KVxufTtcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdzbGEtbm9kZSxbc2xhTm9kZV0nLFxuICAgIHRlbXBsYXRlVXJsOiAnLi9ub2RlLmNvbXBvbmVudC5odG1sJyxcbiAgICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgICBwcm92aWRlcnM6IFtub2RlQmluZGluZ11cbn0pXG5leHBvcnQgY2xhc3MgU2xhTm9kZUNvbXBvbmVudCBleHRlbmRzIENoaWxkTm9kZUJhc2UgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSwgT25DaGFuZ2VzLCBBZnRlclZpZXdJbml0LCBEb0NoZWNrLCBBZnRlclZpZXdDaGVja2VkIHtcbiAgICBpbnRlcm5hbE5vZGU6IEJsb2NrIHwgRG9jdW1lbnQgfCBJbmxpbmU7XG5cbiAgICBkZXNjZW5kYW50Um9vdE5vZGVzOiBIVE1MRWxlbWVudFtdO1xuXG4gICAgcm9vdE5vZGU6IEhUTUxFbGVtZW50O1xuXG4gICAgbm9kZUNvbXBvbmVudFJlZjogU2xhTmVzdGVkTm9kZVJlZjtcblxuICAgIHN1YlNlbGVjdGlvbnMgPSBbXTtcblxuICAgIEBJbnB1dCgpXG4gICAgZWRpdG9yOiBFZGl0b3I7XG5cbiAgICBASW5wdXQoKVxuICAgIHNlbGVjdGlvbjogU2VsZWN0aW9uO1xuXG4gICAgQElucHV0KClcbiAgICBibG9jazogQmxvY2s7XG5cbiAgICBASW5wdXQoKVxuICAgIGluZGV4OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIG5vZGVSZWY6IChub2RlUmVmOiBhbnkpID0+IHt9O1xuXG4gICAgQElucHV0KClcbiAgICByZWFkT25seSA9IGZhbHNlO1xuXG4gICAgcmVuZGVyZWQgPSB0cnVlO1xuXG4gICAgQElucHV0KClcbiAgICBzZXQgbm9kZSh2YWx1ZTogQmxvY2sgfCBJbmxpbmUgfCBEb2N1bWVudCkge1xuICAgICAgICBkZWJ1Zygnc2V0OiBub2RlJywgdmFsdWUudG9KU09OKCkpO1xuICAgICAgICBjb25zdCBvbGROb2RlID0gdGhpcy5pbnRlcm5hbE5vZGUgfHwgdmFsdWU7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxOb2RlID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLm5vZGVDb21wb25lbnRSZWYpIHtcbiAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlQ29tcG9uZW50UmVmLmNvbXBvbmVudFJlZi5pbnN0YW5jZS5ub2RlID0gdGhpcy5pbnRlcm5hbE5vZGU7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlQ29tcG9uZW50UmVmLmNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pbnRlcm5hbE5vZGUuZGF0YS5lcXVhbHMob2xkTm9kZS5kYXRhKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgbm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxOb2RlO1xuICAgIH1cblxuICAgIEBWaWV3Q2hpbGRyZW4oQ2hpbGROb2RlQmFzZSlcbiAgICBub2RlUmVmczogUXVlcnlMaXN0PENoaWxkTm9kZUJhc2U+O1xuXG4gICAgZGlmZmVyOiBJdGVyYWJsZURpZmZlcjxDaGlsZE5vZGVCYXNlPjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZjxhbnk+LFxuICAgICAgICBwcml2YXRlIHNsYVBsdWdpblJlbmRlclNlcnZpY2U6IFNsYVBsdWdpblJlbmRlclNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgICAgIHByaXZhdGUgZGlmZmVyczogSXRlcmFibGVEaWZmZXJzXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIGRlYnVnKGBuZ09uSW5pdCBub2RlYCwgdGhpcy5ub2RlLnRvSlNPTigpKTtcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5kaWZmZXIgPSB0aGlzLmRpZmZlcnMuZmluZCh0aGlzLm5vZGVSZWZzKS5jcmVhdGUoKGluZGV4LCBpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5yb290Tm9kZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlmZmVyLmRpZmYodGhpcy5ub2RlUmVmcyBhcyBhbnkpO1xuICAgICAgICB0aGlzLm5vZGVSZWZzLmNoYW5nZXMuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZXJhYmxlQ2hhbmdlcyA9IHRoaXMuZGlmZmVyLmRpZmYodGhpcy5ub2RlUmVmcyBhcyBhbnkpO1xuICAgICAgICAgICAgaWYgKGl0ZXJhYmxlQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGl0ZXJhYmxlQ2hhbmdlcy5mb3JFYWNoQWRkZWRJdGVtKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPENoaWxkTm9kZUJhc2U+KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlID0gcmVjb3JkLml0ZW0ucm9vdE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbkNvbnRlbnQ6IEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5ub2RlQ29tcG9uZW50UmVmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbkNvbnRlbnQgPSAodGhpcy5ub2RlQ29tcG9uZW50UmVmLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkpLmNoaWxkcmVuQ29udGVudC5uYXRpdmVFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW5Db250ZW50ID0gdGhpcy5yb290Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZE5vZGVzID0gQXJyYXkuZnJvbShjaGlsZHJlbkNvbnRlbnQuY2hpbGROb2RlcykuZmlsdGVyKChub2RlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZSgnZGF0YS1zbGF0ZS1vYmplY3QnKSB8fCAobm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKCdkYXRhLXNsYXRlLXZvaWQnKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0Tm9kZSA9IGNoaWxkTm9kZXNbcmVjb3JkLmN1cnJlbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW5Db250ZW50Lmluc2VydEJlZm9yZShyb290Tm9kZSwgbmV4dE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW5Db250ZW50LmFwcGVuZENoaWxkKHJvb3ROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0NoZWNrZWQoKSB7fVxuXG4gICAgZ2V0UmVsYXRpdmVSYW5nZShub2RlLCBpbmRleCwgcmFuZ2UpIHtcbiAgICAgICAgaWYgKHJhbmdlLmlzVW5zZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2hpbGQgPSBub2RlLm5vZGVzLmdldChpbmRleCk7XG4gICAgICAgIGxldCB7IHN0YXJ0LCBlbmQgfSA9IHJhbmdlO1xuICAgICAgICBjb25zdCB7IHBhdGg6IHN0YXJ0UGF0aCB9ID0gc3RhcnQ7XG4gICAgICAgIGNvbnN0IHsgcGF0aDogZW5kUGF0aCB9ID0gZW5kO1xuICAgICAgICBjb25zdCBzdGFydEluZGV4ID0gc3RhcnRQYXRoLmZpcnN0KCk7XG4gICAgICAgIGNvbnN0IGVuZEluZGV4ID0gZW5kUGF0aC5maXJzdCgpO1xuXG4gICAgICAgIGlmIChzdGFydEluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgc3RhcnQgPSBzdGFydC5zZXRQYXRoKHN0YXJ0UGF0aC5yZXN0KCkpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0SW5kZXggPCBpbmRleCAmJiBpbmRleCA8PSBlbmRJbmRleCkge1xuICAgICAgICAgICAgaWYgKGNoaWxkLm9iamVjdCA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFydC5tb3ZlVG8oUGF0aFV0aWxzLmNyZWF0ZShbaW5kZXhdKSwgMCkuc2V0S2V5KGNoaWxkLmtleSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtmaXJzdF0gPSBjaGlsZC50ZXh0cygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFtmaXJzdE5vZGUsIGZpcnN0UGF0aF0gPSBmaXJzdDtcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0Lm1vdmVUbyhmaXJzdFBhdGgsIDApLnNldEtleShmaXJzdE5vZGUua2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXJ0ID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbmRJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgIGVuZCA9IGVuZC5zZXRQYXRoKGVuZFBhdGgucmVzdCgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFydEluZGV4IDw9IGluZGV4ICYmIGluZGV4IDwgZW5kSW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZC5vYmplY3QgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IGNoaWxkLnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGVuZCA9IGVuZC5tb3ZlVG8oUGF0aFV0aWxzLmNyZWF0ZShbaW5kZXhdKSwgbGVuZ3RoKS5zZXRLZXkoY2hpbGQua2V5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW2xhc3RdID0gY2hpbGQudGV4dHMoeyBkaXJlY3Rpb246ICdiYWNrd2FyZCcgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgW2xhc3ROb2RlLCBsYXN0UGF0aF0gPSBsYXN0O1xuICAgICAgICAgICAgICAgIGVuZCA9IGVuZC5tb3ZlVG8obGFzdFBhdGgsIGxhc3ROb2RlLnRleHQubGVuZ3RoKS5zZXRLZXkobGFzdE5vZGUua2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVuZCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXN0YXJ0IHx8ICFlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmFuZ2UgPSByYW5nZS5zZXRBbmNob3Ioc3RhcnQpO1xuICAgICAgICByYW5nZSA9IHJhbmdlLnNldEZvY3VzKGVuZCk7XG4gICAgICAgIHJldHVybiByYW5nZTtcbiAgICB9XG5cbiAgICB0cmFja0J5KGluZGV4LCBub2RlOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGAke25vZGUua2V5fV8ke25vZGUudHlwZX1gO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgZGVidWcucmVuZGVyKCdleGVjIHJlbmRlcicsIHRoaXMubm9kZS50b0pTT04oKSk7XG4gICAgICAgIGxldCBwbHVnaW5SZW5kZXI7XG4gICAgICAgIGlmICh0aGlzLm5vZGUub2JqZWN0ID09PSAnYmxvY2snKSB7XG4gICAgICAgICAgICBwbHVnaW5SZW5kZXIgPSAncmVuZGVyQmxvY2snO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubm9kZS5vYmplY3QgPT09ICdkb2N1bWVudCcpIHtcbiAgICAgICAgICAgIHBsdWdpblJlbmRlciA9ICdyZW5kZXJEb2N1bWVudCc7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ub2RlLm9iamVjdCA9PT0gJ2lubGluZScpIHtcbiAgICAgICAgICAgIHBsdWdpblJlbmRlciA9ICdyZW5kZXJJbmxpbmUnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmZpZzogU2xhTm9kZVJlbmRlckNvbmZpZyA9IHtcbiAgICAgICAgICAgIGVkaXRvcjogdGhpcy5lZGl0b3IsXG4gICAgICAgICAgICBpc0ZvY3VzZWQ6ICEhdGhpcy5zZWxlY3Rpb24gJiYgdGhpcy5zZWxlY3Rpb24uaXNGb2N1c2VkLFxuICAgICAgICAgICAgaXNTZWxlY3RlZDogISF0aGlzLnNlbGVjdGlvbixcbiAgICAgICAgICAgIG5vZGU6IHRoaXMubm9kZSxcbiAgICAgICAgICAgIHBhcmVudDogbnVsbCxcbiAgICAgICAgICAgIHJlYWRPbmx5OiB0aGlzLnJlYWRPbmx5LFxuICAgICAgICAgICAgY2hpbGRyZW46IHRoaXMubm9kZVJlZnMsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgW0RBVEFfQVRUUlMuT0JKRUNUXTogdGhpcy5ub2RlLm9iamVjdCxcbiAgICAgICAgICAgICAgICBbREFUQV9BVFRSUy5LRVldOiB0aGlzLm5vZGUua2V5XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbm9kZVZpZXdDb250YWluZXJSZWY6IHRoaXMudmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZW5kZXJSZXN1bHQ6IEhUTUxFbGVtZW50IHwgU2xhTmVzdGVkTm9kZVJlZiA9IHRoaXMuZWRpdG9yLnJ1bihwbHVnaW5SZW5kZXIsIGNvbmZpZykgYXMgYW55O1xuICAgICAgICBsZXQgcmVuZGVyRG9tID0gbnVsbDtcbiAgICAgICAgaWYgKHJlbmRlclJlc3VsdCBpbnN0YW5jZW9mIFNsYU5lc3RlZE5vZGVSZWYpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZUNvbXBvbmVudFJlZiA9IHJlbmRlclJlc3VsdDtcbiAgICAgICAgICAgIHJlbmRlckRvbSA9IHRoaXMubm9kZUNvbXBvbmVudFJlZi5yb290Tm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbmRlckRvbSA9IHJlbmRlclJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHRoaXMuZWRpdG9yIGFzIGFueSkuaXNWb2lkKHRoaXMubm9kZSkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5jaGlsZHJlbiA9IHJlbmRlckRvbTtcbiAgICAgICAgICAgIGNvbnN0IHZvaWRSb290Tm9kZSA9IHRoaXMuc2xhUGx1Z2luUmVuZGVyU2VydmljZS5yZW5kZXJDb21wb25lbnQoXG4gICAgICAgICAgICAgICAgU2xhVm9pZENvbXBvbmVudCxcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGNvbmZpZywgeyBub2RlUmVmczogdGhpcy5ub2RlUmVmcyB9KVxuICAgICAgICAgICAgKS5yb290Tm9kZTtcbiAgICAgICAgICAgIHRoaXMucm9vdE5vZGUucmVwbGFjZVdpdGgodm9pZFJvb3ROb2RlKTtcbiAgICAgICAgICAgIHRoaXMucm9vdE5vZGUgPSB2b2lkUm9vdE5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJvb3ROb2RlLnJlcGxhY2VXaXRoKHJlbmRlckRvbSk7XG4gICAgICAgICAgICB0aGlzLnJvb3ROb2RlID0gcmVuZGVyRG9tO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Tm9kZVJlZihpbmRleDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5ub2RlUmVmcykge1xuICAgICAgICAgICAgd2FybmluZyhmYWxzZSwgJ25vZGVSZWZzIGlzIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVSZWZzLmZpbmQoKGl0ZW0sIGksIGFycmF5KSA9PiBpID09PSBpbmRleCk7XG4gICAgfVxuXG4gICAgbmdPbkNoYW5nZXMoc2ltcGxlQ2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBpZiAoc2ltcGxlQ2hhbmdlcy5ub2RlIHx8IHNpbXBsZUNoYW5nZXMuZGVjb3JhdGlvbnMgfHwgc2ltcGxlQ2hhbmdlcy5hbm5vdGF0aW9ucyB8fCBzaW1wbGVDaGFuZ2VzLnNlbGVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5tZW1vU3ViTm9kZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1Zy5jaGFuZ2UoYG5vZGUgY2hhbmdlc2AsIHNpbXBsZUNoYW5nZXMpO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb25DaGFuZ2UgPSBzaW1wbGVDaGFuZ2VzLnNlbGVjdGlvbjtcbiAgICAgICAgaWYgKHNlbGVjdGlvbkNoYW5nZSAmJiAhc2VsZWN0aW9uQ2hhbmdlLmZpcnN0Q2hhbmdlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlQ29tcG9uZW50UmVmKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGb2N1c2VkID0gISF0aGlzLnNlbGVjdGlvbiAmJiB0aGlzLnNlbGVjdGlvbi5pc0ZvY3VzZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGlzRm9jdXNlZCAhPT0gdGhpcy5ub2RlQ29tcG9uZW50UmVmLmNvbXBvbmVudFJlZi5pbnN0YW5jZS5pc0ZvY3VzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZUNvbXBvbmVudFJlZi5jb21wb25lbnRSZWYuaW5zdGFuY2UuaXNGb2N1c2VkID0gaXNGb2N1c2VkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlQ29tcG9uZW50UmVmLmNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5nRG9DaGVjaygpIHtcbiAgICAgICAgZGVidWcuY2hlY2soJ2NoZWNrIG5vZGUnKTtcbiAgICB9XG5cbiAgICBuZ09uRGVzdHJveSgpIHtcbiAgICAgICAgZGVidWcoYG5nT25EZXN0cm95IG5vZGVgKTtcbiAgICAgICAgdGhpcy5yb290Tm9kZS5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBtZW1vU3ViTm9kZXMoKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ub2RlLm5vZGVzLnNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb24gJiYgdGhpcy5nZXRSZWxhdGl2ZVJhbmdlKHRoaXMubm9kZSwgaSwgdGhpcy5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgaWYgKCEoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5lcXVhbHModGhpcy5zdWJTZWxlY3Rpb25zW2ldKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YlNlbGVjdGlvbnNbaV0gPSBzZWxlY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=