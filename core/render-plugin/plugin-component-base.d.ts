import { ViewContainerRef, SimpleChanges, ElementRef, QueryList } from '@angular/core';
import { Editor, Block, Node } from 'slate';
export declare class SlaPluginComponentBase {
    elementRef: ElementRef;
    editor: Editor;
    node: Block;
    parent: Node;
    isFocused: boolean;
    isSelected: boolean;
    readOnly: boolean;
    children: QueryList<any>;
    attributes: {
        [key: string]: string;
    };
    nodeViewContainerRef: ViewContainerRef;
    childrenContent: ElementRef;
    constructor(elementRef: ElementRef);
    initPluginComponent(): void;
    getData(key: any): any;
    isNodeChange(changes: SimpleChanges): boolean;
    updateHostClass(classMap: {
        [key: string]: boolean;
    }): void;
    setNodeAttributes(ele: HTMLElement, attributes: {
        [key: string]: string;
    }): void;
    private insertChildrenView;
    removeNode(event: any): void;
}
