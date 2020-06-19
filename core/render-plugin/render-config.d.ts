import { Editor, Node, Mark, Document, Block, Inline, Annotation, Decoration } from 'slate';
import { ViewContainerRef, ComponentRef } from '@angular/core';
export declare class SlaLeafRenderConfig {
    editor: Editor;
    marks: any;
    node: Node;
    offset: number;
    text: string;
    children: any;
    attributes: {
        [key: string]: string;
    };
    mark?: Mark;
    decoration?: Decoration;
    annotation?: Annotation;
}
/**
 * pluginRender parameter config
 */
export declare class SlaNodeRenderConfig {
    editor: Editor;
    node: Document | Block | Inline;
    annotations?: any;
    decorations?: any;
    parent: Node;
    isFocused: boolean;
    isSelected: boolean;
    readOnly: boolean;
    children: any;
    attributes: {
        [key: string]: string;
    };
    nodeViewContainerRef: ViewContainerRef;
}
export declare class SlaNestedNodeRef {
    rootNode: HTMLElement;
    componentRef: ComponentRef<any>;
    constructor(rootNode: HTMLElement, componentRef: ComponentRef<any>);
}
