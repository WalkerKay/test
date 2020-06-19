declare class BeforePlugin {
    static activeElement: any;
    static compositionCount: number;
    static isComposing: boolean;
    static isCopying: boolean;
    static isDragging: boolean;
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBeforeInput(event: any, editor: any, next: any): void;
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBlur(event: any, editor: any, next: any): void;
    /**
     * On composition end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCompositionEnd(event: any, editor: any, next: any): void;
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onClick(event: any, editor: any, next: any): void;
    /**
     * On composition start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCompositionStart(event: any, editor: any, next: any): void;
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
     * On drag enter.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnter(event: any, editor: any, next: any): void;
    /**
     * On drag exit.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragExit(event: any, editor: any, next: any): void;
    /**
     * On drag leave.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragLeave(event: any, editor: any, next: any): void;
    /**
     * On drag over.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragOver(event: any, editor: any, next: any): void;
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
    static onDrop(event: any, editor: any, next: any): void;
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
    static onKeyDown(event: any, editor: any, next: any): void;
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onPaste(event: any, editor: any, next: any): void;
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onSelect(event: any, editor: any, next: any): void;
}
export default BeforePlugin;
