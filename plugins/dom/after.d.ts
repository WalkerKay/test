declare class AfterPlugin {
    static isDraggingInternally: any;
    static isMouseDown: boolean;
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBeforeInput(event: any, editor: any, next: any): any;
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBlur(event: any, editor: any, next: any): void;
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onClick(event: any, editor: any, next: any): any;
    /**
     * On copy.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCopy(event: any, editor: any, next: any): void;
    /**
     * On cut.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCut(event: any, editor: any, next: any): void;
    /**
     * On drag end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnd(event: any, editor: any, next: any): void;
    /**
     * On drag start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragStart(event: any, editor: any, next: any): void;
    /**
     * On drop.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDrop(event: any, editor: any, next: any): any;
    /**
     * On focus.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onFocus(event: any, editor: any, next: any): void;
    /**
     * On input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onInput(event: any, editor: any, next: any): void;
    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onKeyDown(event: any, editor: any, next: any): any;
    /**
     * On mouse down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onMouseDown(event: any, editor: any, next: any): void;
    /**
     * On mouse up.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onMouseUp(event: any, editor: any, next: any): void;
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onPaste(event: any, editor: any, next: any): any;
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onSelect(event: any, editor: any, next: any): void;
}
/**
 * Export.
 *
 * @type {Function}
 */
export default AfterPlugin;
