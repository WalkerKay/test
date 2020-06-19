import { List } from 'immutable';
declare class QueriesPlugin {
    /**
     * Find the native DOM element for a node at `path`.
     *
     * @param {Editor} editor
     * @param {Array|List} path
     * @return {DOMNode|Null}
     */
    static findDOMNode(editor: any, path: any): any;
    /**
     * Find a native DOM selection point from a Slate `point`.
     *
     * @param {Editor} editor
     * @param {Point} point
     * @return {Object|Null}
     */
    static findDOMPoint(editor: any, point: any): {
        node: any;
        offset: number;
    };
    /**
     * Find a native DOM range from a Slate `range`.
     *
     * @param {Editor} editor
     * @param {Range} range
     * @return {DOMRange|Null}
     */
    static findDOMRange(editor: any, range: any): any;
    /**
     * Find a Slate node from a native DOM `element`.
     *
     * @param {Editor} editor
     * @param {Element} element
     * @return {List|Null}
     */
    static findNode(editor: any, element: any): any;
    /**
     * Get the target range from a DOM `event`.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @return {Range}
     */
    static findEventRange(editor: any, event: any): any;
    /**
     * Find the path of a native DOM `element` by searching React refs.
     *
     * @param {Editor} editor
     * @param {Element} element
     * @return {List|Null}
     */
    static findPath(editor: any, element: any): List<number>;
    /**
     * Find a Slate point from a DOM selection's `nativeNode` and `nativeOffset`.
     *
     * @param {Editor} editor
     * @param {Element} nativeNode
     * @param {Number} nativeOffset
     * @return {Point}
     */
    static findPoint(editor: any, nativeNode: any, nativeOffset: any): any;
    /**
     * Find a Slate range from a DOM range or selection.
     *
     * @param {Editor} editor
     * @param {Selection} domRange
     * @return {Range}
     */
    static findRange(editor: any, domRange: any): any;
    /**
     * Find a Slate selection from a DOM selection.
     *
     * @param {Editor} editor
     * @param {Selection} domSelection
     * @return {Range}
     */
    static findSelection(editor: any, domSelection: any): any;
}
declare const _default: {
    queries: typeof QueriesPlugin;
};
export default _default;
