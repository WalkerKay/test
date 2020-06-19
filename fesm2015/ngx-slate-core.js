import Plain from 'slate-plain-serializer';
import Base64 from 'slate-base64-serializer';
import { TAB } from '@angular/cdk/keycodes';
import Hotkeys from 'slate-hotkeys';
import getWindow from 'get-window';
import { IS_IE, IS_IOS, IS_EDGE, IS_FIREFOX, IS_SAFARI, IS_ANDROID } from 'slate-dev-environment';
import 'immutable';
import { fromEvent, merge, Subject, interval } from 'rxjs';
import { takeUntil, map, throttle } from 'rxjs/operators';
import Debug from 'debug';
import { BrowserModule } from '@angular/platform-browser';
import { PortalModule } from '@angular/cdk/portal';
import { Component, Input, ElementRef, ViewContainerRef, QueryList, HostBinding, Injectable, ComponentFactoryResolver, Renderer2, NgZone, Output, EventEmitter, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, forwardRef, ViewChildren, IterableDiffers, NgModule, ɵɵdefineInjectable, ɵɵinject } from '@angular/core';
import { Value, PathUtils, Editor } from 'slate';
import warning from 'tiny-warning';

const EVENT_HANDLERS = [
    'onBeforeInput',
    'onBlur',
    'onClick',
    'onContextMenu',
    'onCompositionEnd',
    'onCompositionStart',
    'onCopy',
    'onCut',
    'onDragEnd',
    'onDragEnter',
    'onDragExit',
    'onDragLeave',
    'onDragOver',
    'onDragStart',
    'onDrop',
    'onInput',
    'onFocus',
    'onKeyDown',
    'onKeyUp',
    'onMouseDown',
    'onMouseUp',
    'onPaste',
    'onSelect'
];
const NGX_SLATE_EVENTS = [
    { name: 'blur', handler: 'onBlur', isTriggerBeforeInput: true },
    { name: 'compositionstart', handler: 'onCompositionStart', isTriggerBeforeInput: true },
    { name: 'compositionupdate', handler: null, isTriggerBeforeInput: true },
    { name: 'compositionend', handler: 'onCompositionEnd', isTriggerBeforeInput: true },
    { name: 'keydown', handler: 'onKeyDown', isTriggerBeforeInput: true },
    { name: 'keypress', handler: null, isTriggerBeforeInput: true },
    { name: 'keyup', handler: 'onKeyUp', isTriggerBeforeInput: true },
    { name: 'mousedown', handler: 'onMouseDown', isTriggerBeforeInput: true },
    { name: 'textInput', handler: null, isTriggerBeforeInput: true },
    { name: 'paste', handler: 'onPaste', isTriggerBeforeInput: true },
    { name: 'click', handler: 'onClick', isTriggerBeforeInput: false },
    { name: 'contextmenu', handler: 'onContextMenu', isTriggerBeforeInput: false },
    { name: 'copy', handler: 'onCopy', isTriggerBeforeInput: false },
    { name: 'cut', handler: 'onCut', isTriggerBeforeInput: false },
    // { name: 'input', handler: 'onInput', isTriggerBeforeInput: false },
    { name: 'focus', handler: 'onFocus', isTriggerBeforeInput: false },
    { name: 'cut', handler: 'onCut', isTriggerBeforeInput: false },
    { name: 'mouseup', handler: 'onMouseUp', isTriggerBeforeInput: false },
    { name: 'select', handler: 'onSelect', isTriggerBeforeInput: false },
    { name: 'drop', handler: 'onDrop', isTriggerBeforeInput: false }
];

const PROPS = [
    ...EVENT_HANDLERS,
    'commands',
    'decorateNode',
    'queries',
    'renderAnnotation',
    'renderBlock',
    'renderDecoration',
    'renderDocument',
    'renderEditor',
    'renderInline',
    'renderMark',
    'schema'
];
function EditorPropsPlugin(options = {}) {
    const plugin = PROPS.reduce((memo, prop) => {
        if (prop in options) {
            if (options[prop]) {
                memo[prop] = options[prop];
            }
        }
        return memo;
    }, {});
    return plugin;
}

var TRANSFER_TYPES = {
    FRAGMENT: 'application/x-slate-fragment',
    HTML: 'text/html',
    NODE: 'application/x-slate-node',
    RICH: 'text/rtf',
    TEXT: 'text/plain'
};

/**
 * Cross-browser remove all ranges from a `domSelection`.
 *
 * @param {Selection} domSelection
 */
function removeAllRanges(domSelection) {
    // COMPAT: In IE 11, if the selection contains nested tables, then
    // `removeAllRanges` will throw an error.
    if (IS_IE) {
        const range = window.document.body.createTextRange();
        range.collapse();
        range.select();
    }
    else {
        domSelection.removeAllRanges();
    }
}

var DATA_ATTRS = {
    EDITOR: 'data-slate-editor',
    FRAGMENT: 'data-slate-fragment',
    KEY: 'data-key',
    LEAF: 'data-slate-leaf',
    LENGTH: 'data-slate-length',
    OBJECT: 'data-slate-object',
    OFFSET_KEY: 'data-offset-key',
    SPACER: 'data-slate-spacer',
    STRING: 'data-slate-string',
    TEXT: 'data-slate-object',
    VOID: 'data-slate-void',
    ZERO_WIDTH: 'data-slate-zero-width',
    SKIP_EVENT: 'skip-slate-event'
};

var SELECTORS = {
    BLOCK: `[${DATA_ATTRS.OBJECT}="block"]`,
    EDITOR: `[${DATA_ATTRS.EDITOR}]`,
    INLINE: `[${DATA_ATTRS.OBJECT}="inline"]`,
    KEY: `[${DATA_ATTRS.KEY}]`,
    LEAF: `[${DATA_ATTRS.LEAF}]`,
    OBJECT: `[${DATA_ATTRS.OBJECT}]`,
    STRING: `[${DATA_ATTRS.STRING}]`,
    TEXT: `[${DATA_ATTRS.OBJECT}="text"]`,
    VOID: `[${DATA_ATTRS.VOID}]`,
    ZERO_WIDTH: `[${DATA_ATTRS.ZERO_WIDTH}]`,
    SKIP_EVENT: `[${DATA_ATTRS.SKIP_EVENT}]`
};

const { FRAGMENT, HTML, TEXT } = TRANSFER_TYPES;
function cloneFragment(event, editor, callback = () => undefined) {
    const window = getWindow(event.target);
    const native = window.getSelection();
    const { value } = editor;
    const { document, fragment, selection } = value;
    const { start, end } = selection;
    const startVoid = document.getClosestVoid(start.path, editor);
    const endVoid = document.getClosestVoid(end.path, editor);
    // If the selection is collapsed, and it isn't inside a void node, abort.
    if (native.isCollapsed && !startVoid) {
        return;
    }
    // Create a fake selection so that we can add a Base64-encoded copy of the
    // fragment to the HTML, to decode on future pastes.
    const encoded = Base64.serializeNode(fragment);
    const range = native.getRangeAt(0);
    let contents = range.cloneContents();
    let attach = contents.childNodes[0];
    // Make sure attach is a non-empty node, since empty nodes will not get copied
    contents.childNodes.forEach(node => {
        if (node.textContent && node.textContent.trim() !== '') {
            attach = node;
        }
    });
    // COMPAT: If the end node is a void node, we need to move the end of the
    // range from the void node's spacer span, to the end of the void node's
    // content, since the spacer is before void's content in the DOM.
    if (endVoid) {
        const r = range.cloneRange();
        const node = editor.findDOMNode(document.getPath(endVoid));
        r.setEndAfter(node);
        contents = r.cloneContents();
    }
    // COMPAT: If the start node is a void node, we need to attach the encoded
    // fragment to the void node's content node instead of the spacer, because
    // attaching it to empty `<div>/<span>` nodes will end up having it erased by
    // most browsers. (2018/04/27)
    if (startVoid) {
        attach = contents.childNodes[0].childNodes[1].firstChild;
    }
    // Remove any zero-width space spans from the cloned DOM so that they don't
    // show up elsewhere when pasted.
    [].slice.call(contents.querySelectorAll(SELECTORS.ZERO_WIDTH)).forEach(zw => {
        const isNewline = zw.getAttribute(DATA_ATTRS.ZERO_WIDTH) === 'n';
        zw.textContent = isNewline ? '\n' : '';
    });
    // Set a `data-slate-fragment` attribute on a non-empty node, so it shows up
    // in the HTML, and can be used for intra-Slate pasting. If it's a text
    // node, wrap it in a `<span>` so we have something to set an attribute on.
    if (attach.nodeType === 3) {
        const span = window.document.createElement('span');
        // COMPAT: In Chrome and Safari, if we don't add the `white-space` style
        // then leading and trailing spaces will be ignored. (2017/09/21)
        span.style.whiteSpace = 'pre';
        span.appendChild(attach);
        contents.appendChild(span);
        attach = span;
    }
    attach.setAttribute(DATA_ATTRS.FRAGMENT, encoded);
    //  Creates value from only the selected blocks
    //  Then gets plaintext for clipboard with proper linebreaks for BLOCK elements
    //  Via Plain serializer
    const valFromSelection = Value.create({ document: fragment });
    const plainText = Plain.serialize(valFromSelection);
    // Add the phony content to a div element. This is needed to copy the
    // contents into the html clipboard register.
    const div = window.document.createElement('div');
    div.appendChild(contents);
    // For browsers supporting it, we set the clipboard registers manually,
    // since the result is more predictable.
    // COMPAT: IE supports the setData method, but only in restricted sense.
    // IE doesn't support arbitrary MIME types or common ones like 'text/plain';
    // it only accepts "Text" (which gets mapped to 'text/plain') and "Url"
    // (mapped to 'text/url-list'); so, we should only enter block if !IS_IE
    if (event.clipboardData && event.clipboardData.setData && !IS_IE) {
        event.preventDefault();
        event.clipboardData.setData(TEXT, plainText);
        event.clipboardData.setData(FRAGMENT, encoded);
        event.clipboardData.setData(HTML, div.innerHTML);
        callback();
        return;
    }
    // COMPAT: For browser that don't support the Clipboard API's setData method,
    // we must rely on the browser to natively copy what's selected.
    // So we add the div (containing our content) to the DOM, and select it.
    const editorEl = event.target.closest(SELECTORS.EDITOR);
    div.setAttribute('contenteditable', true);
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    editorEl.appendChild(div);
    native.selectAllChildren(div);
    // Revert to the previous selection right after copying.
    window.requestAnimationFrame(() => {
        editorEl.removeChild(div);
        removeAllRanges(native);
        native.addRange(range);
        callback();
    });
}

/**
 * Transfer types.
 *
 * @type {String}
 */
const { FRAGMENT: FRAGMENT$1, HTML: HTML$1, NODE, RICH, TEXT: TEXT$1 } = TRANSFER_TYPES;
/**
 * Fragment matching regexp for HTML nodes.
 *
 * @type {RegExp}
 */
const FRAGMENT_MATCHER = / data-slate-fragment="([^\s"]+)"/;
/**
 * Get the transfer data from an `event`.
 *
 * @param {Event} event
 * @return {Object}
 */
function getEventTransfer(event) {
    // COMPAT: IE 11 doesn't populate nativeEvent with either
    // dataTransfer or clipboardData. We'll need to use the base event
    // object (2018/14/6)
    if (!IS_IE && event.nativeEvent) {
        event = event.nativeEvent;
    }
    const transfer = event.dataTransfer || event.clipboardData;
    let fragment = getType(transfer, FRAGMENT$1);
    let node = getType(transfer, NODE);
    const html = getType(transfer, HTML$1);
    const rich = getType(transfer, RICH);
    let text = getType(transfer, TEXT$1);
    let files;
    // If there isn't a fragment, but there is HTML, check to see if the HTML is
    // actually an encoded fragment.
    // tslint:disable-next-line:no-bitwise
    if (!fragment && html && ~html.indexOf(` ${DATA_ATTRS.FRAGMENT}="`)) {
        const matches = FRAGMENT_MATCHER.exec(html);
        const [full, encoded] = matches; // eslint-disable-line no-unused-vars
        if (encoded) {
            fragment = encoded;
        }
    }
    // COMPAT: Edge doesn't handle custom data types
    // These will be embedded in text/plain in this case (2017/7/12)
    if (text) {
        const embeddedTypes = getEmbeddedTypes(text);
        if (embeddedTypes[FRAGMENT$1]) {
            fragment = embeddedTypes[FRAGMENT$1];
        }
        if (embeddedTypes[NODE]) {
            node = embeddedTypes[NODE];
        }
        if (embeddedTypes[TEXT$1]) {
            text = embeddedTypes[TEXT$1];
        }
    }
    // Decode a fragment or node if they exist.
    if (fragment) {
        fragment = Base64.deserializeNode(fragment);
    }
    if (node) {
        node = Base64.deserializeNode(node);
    }
    // COMPAT: Edge sometimes throws 'NotSupportedError'
    // when accessing `transfer.items` (2017/7/12)
    try {
        // Get and normalize files if they exist.
        if (transfer.items && transfer.items.length) {
            files = Array.from(transfer.items)
                .map((item) => (item.kind === 'file' ? item.getAsFile() : null))
                .filter(exists => exists);
        }
        else if (transfer.files && transfer.files.length) {
            files = Array.from(transfer.files);
        }
    }
    catch (err) {
        if (transfer.files && transfer.files.length) {
            files = Array.from(transfer.files);
        }
    }
    // Determine the type of the data.
    const data = { files, fragment, html, node, rich, text };
    data.type = getTransferType(data);
    return data;
}
/**
 * Takes text input, checks whether contains embedded data
 * and returns object with original text +/- additional data
 *
 * @param {String} text
 * @return {Object}
 */
function getEmbeddedTypes(text) {
    const prefix = 'SLATE-DATA-EMBED::';
    if (text.substring(0, prefix.length) !== prefix) {
        return { TEXT: text };
    }
    // Attempt to parse, if fails then just standard text/plain
    // Otherwise, already had data embedded
    try {
        return JSON.parse(text.substring(prefix.length));
    }
    catch (err) {
        throw new Error('Unable to parse custom Slate drag event data.');
    }
}
/**
 * Get the type of a transfer from its `data`.
 *
 * @param {Object} data
 * @return {String}
 */
function getTransferType(data) {
    if (data.fragment)
        return 'fragment';
    if (data.node)
        return 'node';
    // COMPAT: Microsoft Word adds an image of the selected text to the data.
    // Since files are preferred over HTML or text, this would cause the type to
    // be considered `files`. But it also adds rich text data so we can check
    // for that and properly set the type to `html` or `text`. (2016/11/21)
    if (data.rich && data.html)
        return 'html';
    if (data.rich && data.text)
        return 'text';
    if (data.files && data.files.length)
        return 'files';
    if (data.html)
        return 'html';
    if (data.text)
        return 'text';
    return 'unknown';
}
/**
 * Get one of types `TYPES.FRAGMENT`, `TYPES.NODE`, `text/html`, `text/rtf` or
 * `text/plain` from transfers's `data` if possible, otherwise return null.
 *
 * @param {Object} transfer
 * @param {String} type
 * @return {String}
 */
function getType(transfer, type) {
    if (!transfer.types || !transfer.types.length) {
        // COMPAT: In IE 11, there is no `types` field but `getData('Text')`
        // is supported`. (2017/06/23)
        return type === TEXT$1 ? transfer.getData('Text') || null : null;
    }
    // COMPAT: In Edge, transfer.types doesn't respond to `indexOf`. (2017/10/25)
    const types = Array.from(transfer.types);
    return types.indexOf(type) !== -1 ? transfer.getData(type) || null : null;
}

/**
 * The default plain text transfer type.
 *
 * @type {String}
 */
const { TEXT: TEXT$2 } = TRANSFER_TYPES;
/**
 * Set data with `type` and `content` on an `event`.
 *
 * COMPAT: In Edge, custom types throw errors, so embed all non-standard
 * types in text/plain compound object. (2017/7/12)
 *
 * @param {Event} event
 * @param {String} type
 * @param {String} content
 */
function setEventTransfer(event, type, content) {
    const mime = TRANSFER_TYPES[type.toUpperCase()];
    if (!mime) {
        throw new Error(`Cannot set unknown transfer type "${mime}".`);
    }
    if (event.nativeEvent) {
        event = event.nativeEvent;
    }
    const transfer = event.dataTransfer || event.clipboardData;
    try {
        transfer.setData(mime, content);
        // COMPAT: Safari needs to have the 'text' (and not 'text/plain') value in dataTransfer
        // to display the cursor while dragging internally.
        transfer.setData('text', transfer.getData('text'));
    }
    catch (err) {
        const prefix = 'SLATE-DATA-EMBED::';
        const text = transfer.getData(TEXT$2);
        let obj = {};
        // If the existing plain text data is prefixed, it's Slate JSON data.
        if (text.substring(0, prefix.length) === prefix) {
            try {
                obj = JSON.parse(text.substring(prefix.length));
            }
            catch (e) {
                throw new Error('Failed to parse Slate data from `DataTransfer` object.');
            }
        }
        else {
            // Otherwise, it's just set it as is.
            obj[TEXT$2] = text;
        }
        obj[mime] = content;
        const stringData = `${prefix}${JSON.stringify(obj)}`;
        transfer.setData(TEXT$2, stringData);
    }
}

const TAB_SPACE = '    ';
/**
 * Debug.
 *
 * @type {Function}
 */
const debug = Debug('slate:after');
debug.beforeInput = Debug('slate:after-before-input');
class AfterPlugin {
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBeforeInput(event, editor, next) {
        const { value } = editor;
        const isSynthetic = !!event.nativeEvent;
        // let mustPreventNative = false;
        // const globalThis = window;
        // const nativeSelection = window.getSelection();
        // if (!mustPreventNative) {
        //     if (
        //         nativeSelection.anchorNode &&
        //         nativeSelection.anchorNode.nodeType === Node.TEXT_NODE
        //     ) {
        //         const parentNode = nativeSelection.anchorNode.parentNode;
        //         mustPreventNative =
        //             parentNode.nodeName === 'SPAN' &&
        //             parentNode.firstChild.nodeType === Node.TEXT_NODE &&
        //             !editor.value.anchorText.text &&
        //             !editor.value.endText.text;
        //     } else {
        //         mustPreventNative = true;
        //     }
        // }
        // If the event is synthetic, it's React's polyfill of `beforeinput` that
        // isn't a true `beforeinput` event with meaningful information. It only
        // gets triggered for character insertions, so we can just insert directly.
        if (isSynthetic) {
            debug.beforeInput('onBeforeInput', { event });
            // cancel preventDefault, prevent emit native selectionchange to move focus next component
            if (editor.value.anchorText.text === '') {
                setTimeout(() => {
                    editor.insertText(event.data);
                });
                return next();
            }
            event.nativeEvent.preventDefault();
            editor.insertText(event.data);
            // if (mustPreventNative) {
            //     event.nativeEvent.preventDefault();
            //     editor.insertText(event.data);
            // } else {
            //     // setImmediate(() => {
            //     //     editor.insertText(event.data);
            //     // });
            // }
            return next();
        }
        // Otherwise, we can use the information in the `beforeinput` event to
        // figure out the exact change that will occur, and prevent it.
        const [targetRange] = event.getTargetRanges();
        if (!targetRange) {
            return next();
        }
        debug('onBeforeInput', { event });
        event.preventDefault();
        const { document, selection } = value;
        const range = editor.findRange(targetRange);
        switch (event.inputType) {
            case 'deleteByDrag':
            case 'deleteByCut':
            case 'deleteContent':
            case 'deleteContentBackward':
            case 'deleteContentForward': {
                editor.deleteAtRange(range);
                break;
            }
            case 'deleteWordBackward': {
                editor.deleteWordBackwardAtRange(range);
                break;
            }
            case 'deleteWordForward': {
                editor.deleteWordForwardAtRange(range);
                break;
            }
            case 'deleteSoftLineBackward':
            case 'deleteHardLineBackward': {
                editor.deleteLineBackwardAtRange(range);
                break;
            }
            case 'deleteSoftLineForward':
            case 'deleteHardLineForward': {
                editor.deleteLineForwardAtRange(range);
                break;
            }
            case 'insertLineBreak':
            case 'insertParagraph': {
                const hasVoidParent = document.hasVoidParent(selection.start.path, editor);
                if (hasVoidParent) {
                    editor.moveToStartOfNextText();
                }
                else {
                    editor.splitBlockAtRange(range);
                }
                break;
            }
            case 'insertFromYank':
            case 'insertReplacementText':
            case 'insertText': {
                // COMPAT: `data` should have the text for the `insertText` input type
                // and `dataTransfer` should have the text for the
                // `insertReplacementText` input type, but Safari uses `insertText` for
                // spell check replacements and sets `data` to `null`. (2018/08/09)
                const text = event.data == null
                    ? event.dataTransfer.getData('text/plain')
                    : event.data;
                if (text == null) {
                    break;
                }
                editor.insertTextAtRange(range, text, selection.marks);
                // If the text was successfully inserted, and the selection had marks
                // on it, unset the selection's marks.
                if (selection.marks &&
                    value.document !== editor.value.document) {
                    editor.select({ marks: null });
                }
                break;
            }
        }
        next();
    }
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBlur(event, editor, next) {
        debug('onBlur', { event });
        editor.blur();
        next();
    }
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onClick(event, editor, next) {
        if (editor.readOnly)
            return next();
        const { value } = editor;
        const { document } = value;
        const path = editor.findPath(event.target);
        if (!path)
            return next();
        debug('onClick', { event });
        const node = document.getNode(path);
        const ancestors = document.getAncestors(path);
        const isVoid = node &&
            (editor.isVoid(node) || ancestors.some(a => editor.isVoid(a)));
        if (isVoid) {
            // COMPAT: In Chrome & Safari, selections that are at the zero offset of
            // an inline node will be automatically replaced to be at the last offset
            // of a previous inline node, which screws us up, so we always want to set
            // it to the end of the node. (2016/11/29)
            editor.focus().moveToEndOfNode(node);
        }
        next();
    }
    /**
     * On copy.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCopy(event, editor, next) {
        debug('onCopy', { event });
        cloneFragment(event, editor);
        next();
    }
    /**
     * On cut.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCut(event, editor, next) {
        debug('onCut', { event });
        // Once the fake cut content has successfully been added to the clipboard,
        // delete the content in the current selection.
        cloneFragment(event, editor, () => {
            // If user cuts a void block node or a void inline node,
            // manually removes it since selection is collapsed in this case.
            const { value } = editor;
            const { document, selection } = value;
            const { end, isCollapsed } = selection;
            let voidPath;
            if (isCollapsed) {
                for (const [node, path] of document.ancestors(end.path)) {
                    if (editor.isVoid(node)) {
                        voidPath = path;
                        break;
                    }
                }
            }
            if (voidPath) {
                editor.removeNodeByKey(voidPath);
            }
            else {
                editor.delete();
            }
        });
        next();
    }
    /**
     * On drag end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnd(event, editor, next) {
        debug('onDragEnd', { event });
        AfterPlugin.isDraggingInternally = null;
        next();
    }
    /**
     * On drag start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragStart(event, editor, next) {
        debug('onDragStart', { event });
        AfterPlugin.isDraggingInternally = true;
        const { value } = editor;
        const { document } = value;
        const path = editor.findPath(event.target);
        const node = document.getNode(path);
        const ancestors = document.getAncestors(path);
        const isVoid = node &&
            (editor.isVoid(node) || ancestors.some(a => editor.isVoid(a)));
        const selectionIncludesNode = value.blocks.some(block => block === node);
        // If a void block is dragged and is not selected, select it (necessary for local drags).
        if (isVoid && !selectionIncludesNode) {
            editor.moveToRangeOfNode(node);
        }
        const fragment = editor.value.fragment;
        const encoded = Base64.serializeNode(fragment);
        setEventTransfer(event, 'fragment', encoded);
        next();
    }
    /**
     * On drop.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDrop(event, editor, next) {
        const { value } = editor;
        const { document, selection } = value;
        const window = getWindow(event.target);
        let target = editor.findEventRange(event);
        if (!target) {
            return next();
        }
        debug('onDrop', { event });
        const transfer = getEventTransfer(event);
        const { type, fragment, text } = transfer;
        editor.focus();
        // If the drag is internal and the target is after the selection, it
        // needs to account for the selection's content being deleted.
        if (AfterPlugin.isDraggingInternally &&
            selection.end.offset < target.end.offset &&
            selection.end.path.equals(target.end.path)) {
            target = target.moveForward(selection.start.path.equals(selection.end.path)
                ? 0 - selection.end.offset + selection.start.offset
                : 0 - selection.end.offset);
        }
        if (AfterPlugin.isDraggingInternally) {
            editor.delete();
        }
        editor.select(target);
        if (type === 'text' || type === 'html') {
            const { anchor } = target;
            let hasVoidParent = document.hasVoidParent(anchor.path, editor);
            if (hasVoidParent) {
                let p = anchor.path;
                let n = document.getNode(anchor.path);
                while (hasVoidParent) {
                    const [nxt] = document.texts({ path: p });
                    if (!nxt) {
                        break;
                    }
                    [n, p] = nxt;
                    hasVoidParent = document.hasVoidParent(p, editor);
                }
                if (n)
                    editor.moveToStartOfNode(n);
            }
            if (text) {
                text.split('\n').forEach((line, i) => {
                    if (i > 0)
                        editor.splitBlock();
                    editor.insertText(line);
                });
            }
        }
        if (type === 'fragment') {
            editor.insertFragment(fragment);
        }
        // COMPAT: React's onSelect event breaks after an onDrop event
        // has fired in a node: https://github.com/facebook/react/issues/11379.
        // Until this is fixed in React, we dispatch a mouseup event on that
        // DOM node, since that will make it go back to normal.
        const el = editor.findDOMNode(target.focus.path);
        if (el) {
            el.dispatchEvent(new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        }
        next();
    }
    /**
     * On focus.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onFocus(event, editor, next) {
        debug('onFocus', { event });
        // COMPAT: If the focus event is a mouse-based one, it will be shortly
        // followed by a `selectionchange`, so we need to deselect here to prevent
        // the old selection from being set by the `updateSelection` of `<Content>`,
        // preventing the `selectionchange` from firing. (2018/11/07)
        if (AfterPlugin.isMouseDown && !IS_IE && !IS_EDGE) {
            editor.deselect().focus();
        }
        else {
            editor.focus();
        }
        next();
    }
    /**
     * On input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onInput(event, editor, next) {
        debug('onInput');
        const window = getWindow(event.target);
        const domSelection = window.getSelection();
        const selection = editor.findSelection(domSelection);
        if (selection) {
            editor.select(selection);
        }
        else {
            editor.blur();
        }
        const { anchorNode } = domSelection;
        editor.reconcileDOMNode(anchorNode);
        next();
    }
    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onKeyDown(event, editor, next) {
        debug('onKeyDown', { event });
        const { value } = editor;
        const { document, selection } = value;
        const { start } = selection;
        const hasVoidParent = document.hasVoidParent(start.path, editor);
        // COMPAT: In iOS, some of these hotkeys are handled in the
        // `onNativeBeforeInput` handler of the `<Content>` component in order to
        // preserve native autocorrect behavior, so they shouldn't be handled here.
        if (Hotkeys.isSplitBlock(event) && !IS_IOS) {
            return hasVoidParent
                ? editor.moveToStartOfNextText()
                : editor.splitBlock();
        }
        if (Hotkeys.isDeleteBackward(event) && !IS_IOS) {
            return editor.deleteCharBackward();
        }
        if (Hotkeys.isDeleteForward(event) && !IS_IOS) {
            return editor.deleteCharForward();
        }
        if (Hotkeys.isDeleteLineBackward(event)) {
            return editor.deleteLineBackward();
        }
        if (Hotkeys.isDeleteLineForward(event)) {
            return editor.deleteLineForward();
        }
        if (Hotkeys.isDeleteWordBackward(event)) {
            return editor.deleteWordBackward();
        }
        if (Hotkeys.isDeleteWordForward(event)) {
            return editor.deleteWordForward();
        }
        if (Hotkeys.isRedo(event)) {
            return editor.redo();
        }
        if (Hotkeys.isUndo(event)) {
            return editor.undo();
        }
        // COMPAT: Certain browsers don't handle the selection updates properly. In
        // Chrome, the selection isn't properly extended. And in Firefox, the
        // selection isn't properly collapsed. (2017/10/17)
        if (Hotkeys.isMoveLineBackward(event)) {
            event.preventDefault();
            return editor.moveToStartOfBlock();
        }
        if (Hotkeys.isMoveLineForward(event)) {
            event.preventDefault();
            return editor.moveToEndOfBlock();
        }
        if (Hotkeys.isExtendLineBackward(event)) {
            event.preventDefault();
            return editor.moveFocusToStartOfBlock();
        }
        if (Hotkeys.isExtendLineForward(event)) {
            event.preventDefault();
            return editor.moveFocusToEndOfBlock();
        }
        // COMPAT: If a void node is selected, or a zero-width text node adjacent to
        // an inline is selected, we need to handle these hotkeys manually because
        // browsers won't know what to do.
        if (Hotkeys.isMoveBackward(event)) {
            event.preventDefault();
            if (!selection.isCollapsed) {
                return editor.moveToStart();
            }
            return editor.moveBackward();
        }
        if (Hotkeys.isMoveForward(event)) {
            event.preventDefault();
            if (!selection.isCollapsed) {
                return editor.moveToEnd();
            }
            return editor.moveForward();
        }
        if (Hotkeys.isMoveWordBackward(event)) {
            event.preventDefault();
            return editor.moveWordBackward();
        }
        if (Hotkeys.isMoveWordForward(event)) {
            event.preventDefault();
            return editor.moveWordForward();
        }
        if (Hotkeys.isExtendBackward(event)) {
            const startText = document.getNode(start.path);
            const [prevEntry] = document.texts({
                path: start.path,
                direction: 'backward'
            });
            let isPrevInVoid = false;
            if (prevEntry) {
                const [, prevPath] = prevEntry;
                isPrevInVoid = document.hasVoidParent(prevPath, editor);
            }
            if (hasVoidParent || isPrevInVoid || startText.text === '') {
                event.preventDefault();
                return editor.moveFocusBackward();
            }
        }
        if (Hotkeys.isExtendForward(event)) {
            const startText = document.getNode(start.path);
            const [nextEntry] = document.texts({ path: start.path });
            let isNextInVoid = false;
            if (nextEntry) {
                const [, nextPath] = nextEntry;
                isNextInVoid = document.hasVoidParent(nextPath, editor);
            }
            if (hasVoidParent || isNextInVoid || startText.text === '') {
                event.preventDefault();
                return editor.moveFocusForward();
            }
        }
        if (event.keyCode === TAB) {
            event.preventDefault();
            return editor.insertText(TAB_SPACE);
        }
        next();
    }
    /**
     * On mouse down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onMouseDown(event, editor, next) {
        debug('onMouseDown', { event });
        AfterPlugin.isMouseDown = true;
        next();
    }
    /**
     * On mouse up.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onMouseUp(event, editor, next) {
        debug('onMouseUp', { event });
        AfterPlugin.isMouseDown = false;
        next();
    }
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onPaste(event, editor, next) {
        debug('onPaste', { event });
        const { value } = editor;
        const transfer = getEventTransfer(event);
        const { type, fragment, text } = transfer;
        if (type === 'fragment') {
            editor.insertFragment(fragment);
        }
        if (type === 'text' || type === 'html') {
            if (!text)
                return next();
            const { document, selection, startBlock } = value;
            if (editor.isVoid(startBlock))
                return next();
            const defaultBlock = startBlock;
            const defaultMarks = document.getInsertMarksAtRange(selection);
            const frag = Plain.deserialize(text, { defaultBlock, defaultMarks })
                .document;
            editor.insertFragment(frag);
        }
        next();
    }
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onSelect(event, editor, next) {
        debug('onSelect', { event });
        const window = getWindow(event.target);
        const domSelection = window.getSelection();
        // slate-next fix select the range interrupted
        if (domSelection.rangeCount) {
            const range = editor.findRange(domSelection);
            if (range) {
                const selection = editor.findSelection(domSelection);
                editor.select(selection);
            }
        }
        else {
            editor.blur();
        }
        // COMPAT: reset the `AfterPlugin.isMouseDown` state here in case a `mouseup` event
        // happens outside the editor. This is needed for `onFocus` handling.
        AfterPlugin.isMouseDown = false;
        next();
    }
}
AfterPlugin.isDraggingInternally = null;
AfterPlugin.isMouseDown = false;

const debug$1 = Debug('slate:before');
debug$1.track = Debug('slate:track');
class BeforePlugin {
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBeforeInput(event, editor, next) {
        const isSynthetic = !!event.nativeEvent;
        if (editor.readOnly)
            return;
        // COMPAT: If the browser supports Input Events Level 2, we will have
        // attached a custom handler for the real `beforeinput` events, instead of
        // allowing React's synthetic polyfill, so we need to ignore synthetics.
        // if (isSynthetic && HAS_INPUT_EVENTS_LEVEL_2) return;
        debug$1('onBeforeInput', { event });
        next();
    }
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBlur(event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (editor.readOnly)
            return;
        const { relatedTarget, target } = event;
        const window = getWindow(target);
        // COMPAT: If the current `activeElement` is still the previous one, this is
        // due to the window being blurred when the tab itself becomes unfocused, so
        // we want to abort early to allow to editor to stay focused when the tab
        // becomes focused again.
        if (BeforePlugin.activeElement === window.document.activeElement) {
            return;
        }
        // COMPAT: The `relatedTarget` can be null when the new focus target is not
        // a "focusable" element (eg. a `<div>` without `tabindex` set).
        if (relatedTarget) {
            const el = editor.findDOMNode([]);
            // COMPAT: The event should be ignored if the focus is returning to the
            // editor from an embedded editable element (eg. an <input> element inside
            // a void node).
            if (relatedTarget === el)
                return;
            // COMPAT: The event should be ignored if the focus is moving from the
            // editor to inside a void node's spacer element.
            if (relatedTarget.hasAttribute(DATA_ATTRS.SPACER))
                return;
            // COMPAT: The event should be ignored if the focus is moving to a non-
            // editable section of an element that isn't a void node (eg. a list item
            // of the check list example).
            const node = editor.findNode(relatedTarget);
            if (el.contains(relatedTarget) && node && !editor.isVoid(node)) {
                return;
            }
        }
        debug$1('onBlur', { event });
        next();
    }
    /**
     * On composition end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCompositionEnd(event, editor, next) {
        const n = BeforePlugin.compositionCount;
        // The `count` check here ensures that if another composition starts
        // before the timeout has closed out this one, we will abort unsetting the
        // `isComposing` flag, since a composition is still in affect.
        window.setTimeout(() => {
            if (BeforePlugin.compositionCount > n)
                return;
            BeforePlugin.isComposing = false;
        }, 100);
        debug$1('onCompositionEnd', { event });
        next();
    }
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onClick(event, editor, next) {
        debug$1('onClick', { event });
        next();
    }
    /**
     * On composition start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCompositionStart(event, editor, next) {
        BeforePlugin.isComposing = true;
        BeforePlugin.compositionCount++;
        const { value } = editor;
        const { selection } = value;
        if (!selection.isCollapsed) {
            // https://github.com/ianstormtaylor/slate/issues/1879
            // When composition starts and the current selection is not collapsed, the
            // second composition key-down would drop the text wrapping <spans> which
            // resulted on crash in content.updateSelection after composition ends
            // (because it cannot find <span> nodes in DOM). This is a workaround that
            // erases selection as soon as composition starts and preventing <spans>
            // to be dropped.
            editor.delete();
        }
        debug$1('onCompositionStart', { event });
        next();
    }
    /**
     * On copy.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCopy(event, editor, next) {
        const window = getWindow(event.target);
        BeforePlugin.isCopying = true;
        window.requestAnimationFrame(() => (BeforePlugin.isCopying = false));
        debug$1('onCopy', { event });
        next();
    }
    /**
     * On cut.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCut(event, editor, next) {
        if (editor.readOnly)
            return;
        const window = getWindow(event.target);
        BeforePlugin.isCopying = true;
        window.requestAnimationFrame(() => (BeforePlugin.isCopying = false));
        debug$1('onCut', { event });
        next();
    }
    /**
     * On drag end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnd(event, editor, next) {
        BeforePlugin.isDragging = false;
        debug$1('onDragEnd', { event });
        next();
    }
    /**
     * On drag enter.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnter(event, editor, next) {
        debug$1('onDragEnter', { event });
        next();
    }
    /**
     * On drag exit.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragExit(event, editor, next) {
        debug$1('onDragExit', { event });
        next();
    }
    /**
     * On drag leave.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragLeave(event, editor, next) {
        debug$1('onDragLeave', { event });
        next();
    }
    /**
     * On drag over.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragOver(event, editor, next) {
        // If the target is inside a void node, and only in this case,
        // call `preventDefault` to signal that drops are allowed.
        // When the target is editable, dropping is already allowed by
        // default, and calling `preventDefault` hides the cursor.
        const node = editor.findNode(event.target);
        if (!node || editor.isVoid(node)) {
            event.preventDefault();
        }
        // COMPAT: IE won't call onDrop on contentEditables unless the
        // default dragOver is prevented:
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/913982/
        // (2018/07/11)
        if (IS_IE) {
            event.preventDefault();
        }
        // If a drag is already in progress, don't do this again.
        if (!BeforePlugin.isDragging) {
            BeforePlugin.isDragging = true;
            // COMPAT: IE will raise an `unspecified error` if dropEffect is
            // set. (2018/07/11)
            if (!IS_IE) {
                event.nativeEvent.dataTransfer.dropEffect = 'move';
            }
        }
        debug$1('onDragOver', { event });
        next();
    }
    /**
     * On drag start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragStart(event, editor, next) {
        BeforePlugin.isDragging = true;
        debug$1('onDragStart', { event });
        next();
    }
    /**
     * On drop.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDrop(event, editor, next) {
        if (editor.readOnly)
            return;
        // Prevent default so the DOM's value isn't corrupted.
        event.preventDefault();
        debug$1('onDrop', { event });
        next();
    }
    /**
     * On focus.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onFocus(event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (editor.readOnly)
            return;
        const el = editor.findDOMNode([]);
        // Save the new `activeElement`.
        const window = getWindow(event.target);
        BeforePlugin.activeElement = window.document.activeElement;
        // COMPAT: If the editor has nested editable elements, the focus can go to
        // those elements. In Firefox, this must be prevented because it results in
        // issues with keyboard navigation. (2017/03/30)
        if (IS_FIREFOX && event.target !== el) {
            el.focus();
            return;
        }
        debug$1('onFocus', { event });
        next();
    }
    /**
     * On input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onInput(event, editor, next) {
        if (BeforePlugin.isComposing)
            return;
        if (editor.value.selection.isBlurred)
            return;
        debug$1('onInput', { event });
        next();
    }
    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onKeyDown(event, editor, next) {
        if (editor.readOnly)
            return;
        // When composing, we need to prevent all hotkeys from executing while
        // typing. However, certain characters also move the selection before
        // we're able to handle it, so prevent their default behavior.
        if (BeforePlugin.isComposing) {
            if (Hotkeys.isCompose(event))
                event.preventDefault();
            return;
        }
        // Certain hotkeys have native editing behaviors in `contenteditable`
        // elements which will editor the DOM and cause our value to be out of sync,
        // so they need to always be prevented.
        if (!IS_IOS &&
            (Hotkeys.isBold(event) ||
                Hotkeys.isDeleteBackward(event) ||
                Hotkeys.isDeleteForward(event) ||
                Hotkeys.isDeleteLineBackward(event) ||
                Hotkeys.isDeleteLineForward(event) ||
                Hotkeys.isDeleteWordBackward(event) ||
                Hotkeys.isDeleteWordForward(event) ||
                Hotkeys.isItalic(event) ||
                Hotkeys.isRedo(event) ||
                Hotkeys.isSplitBlock(event) ||
                Hotkeys.isTransposeCharacter(event) ||
                Hotkeys.isUndo(event))) {
            event.preventDefault();
        }
        debug$1('onKeyDown', { event });
        debug$1.track('track start : onKeyDown');
        next();
    }
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onPaste(event, editor, next) {
        if (editor.readOnly)
            return;
        // Prevent defaults so the DOM state isn't corrupted.
        event.preventDefault();
        debug$1('onPaste', { event });
        next();
    }
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onSelect(event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (BeforePlugin.isComposing)
            return;
        if (editor.readOnly)
            return;
        // Save the new `activeElement`.
        const window = getWindow(event.target);
        BeforePlugin.activeElement = window.document.activeElement;
        debug$1('onSelect', { event });
        next();
    }
}
BeforePlugin.activeElement = null;
BeforePlugin.compositionCount = 0;
BeforePlugin.isComposing = false;
BeforePlugin.isCopying = false;
BeforePlugin.isDragging = false;

function DOMPlugin(options = {}) {
    const { plugins = [] } = options;
    // COMPAT: Add Android specific handling separately before it gets to the
    // other plugins because it is specific (other browser don't need it) and
    // finicky (it has to come before other plugins to work).
    // const androidPlugins = IS_ANDROID
    //   ? [AndroidPlugin(options), NoopPlugin(options)]
    //   : [];
    return [BeforePlugin, ...plugins, AfterPlugin];
}

class CommandsPlugin {
    static reconcileNode(editor, node) {
        const { value } = editor;
        const { document, selection } = value;
        const path = document.getPath(node.key);
        const domElement = editor.findDOMNode(path);
        const block = document.getClosestBlock(path);
        // Get text information
        const { text } = node;
        let { textContent: domText } = domElement;
        const isLastNode = block.nodes.last() === node;
        const lastChar = domText.charAt(domText.length - 1);
        // COMPAT: If this is the last leaf, and the DOM text ends in a new line,
        // we will have added another new line in <Leaf>'s render method to account
        // for browsers collapsing a single trailing new lines, so remove it.
        if (isLastNode && lastChar === '\n') {
            domText = domText.slice(0, -1);
        }
        // If the text is no different, abort.
        if (text === domText)
            return;
        let entire = selection.moveAnchorTo(path, 0).moveFocusTo(path, text.length);
        entire = document.resolveRange(entire);
        // Change the current value to have the leaf's text replaced.
        editor.insertTextAtRange(entire, domText, node.marks);
        return;
    }
    static reconcileDOMNode(editor, domNode) {
        const domElement = domNode.parentElement.closest('[data-key]');
        const node = editor.findNode(domElement);
        editor.reconcileNode(node);
    }
    // slate origin remove mark method
    static removeMarkOrigin(editor, mark) {
        const { value } = editor;
        const { document, selection, anchorText } = value;
        if (selection.isExpanded) {
            editor.removeMarkAtRange(selection, mark);
        }
        else if (selection.marks) {
            const marks = selection.marks.remove(mark);
            const sel = selection.set('marks', marks);
            editor.select(sel);
        }
        else {
            const marks = document.getActiveMarksAtRange(selection).remove(mark);
            const sel = selection.set('marks', marks);
            editor.select(sel);
        }
    }
    static removeMark(editor, mark) {
        const { value } = editor;
        const { document, selection, anchorText } = value;
        if (selection.isExpanded) {
            editor.removeMarkAtRange(selection, mark);
        }
        else if (selection.marks) {
            const marks = selection.marks.remove(mark);
            const sel = selection.set('marks', marks);
            editor.select(sel);
        }
        else {
            const marks = document.getActiveMarksAtRange(selection).remove(mark);
            const sel = selection.set('marks', marks);
            editor.select(sel);
        }
        // The cursor position is still in mark when mark is cancelled
        if (selection.isCollapsed && anchorText.text === '\u200B') {
            editor.removeMarkByPath(selection.start.path, 0, 1, mark);
        }
        if (selection.isCollapsed && anchorText.text !== '\u200B' && anchorText.text !== '') {
            editor.insertText('\u200B');
        }
    }
    static addMark(editor, mark) {
        const { value } = editor;
        const { document, selection, anchorText } = value;
        if (selection.isExpanded) {
            editor.addMarkAtRange(selection, mark);
        }
        else if (selection.marks) {
            const marks = selection.marks.add(mark);
            const sel = selection.set('marks', marks);
            editor.select(sel);
        }
        else {
            const marks = document.getActiveMarksAtRange(selection).add(mark);
            const sel = selection.set('marks', marks);
            editor.select(sel);
        }
        // The cursor position is still in mark when mark is cancelled
        if (selection.isCollapsed && anchorText.text === '\u200B') {
            editor.addMarkByPath(selection.start.path, 0, 1, mark);
        }
        if (selection.isCollapsed && anchorText.text !== '\u200B' && anchorText.text !== '') {
            editor.insertText('\u200B');
        }
    }
}
var CommandsPlugin$1 = {
    commands: CommandsPlugin
};

class QueriesPlugin {
    /**
     * Find the native DOM element for a node at `path`.
     *
     * @param {Editor} editor
     * @param {Array|List} path
     * @return {DOMNode|Null}
     */
    static findDOMNode(editor, path) {
        path = PathUtils.create(path);
        const contentRef = editor.tmp.contentRef;
        if (!contentRef) {
            return null;
        }
        if (!path.size) {
            return contentRef.rootNode || null;
        }
        const search = (instance, p) => {
            if (!instance) {
                return null;
            }
            if (!p.size) {
                return instance.rootNode || null;
            }
            const index = p.first();
            const rest = p.rest();
            const ref = instance.getNodeRef(index);
            return search(ref, rest);
        };
        const documentNodeRef = contentRef.nodeRef;
        const el = search(documentNodeRef, path);
        return el;
    }
    /**
     * Find a native DOM selection point from a Slate `point`.
     *
     * @param {Editor} editor
     * @param {Point} point
     * @return {Object|Null}
     */
    static findDOMPoint(editor, point) {
        const el = editor.findDOMNode(point.path);
        let start = 0;
        if (!el) {
            return null;
        }
        // For each leaf, we need to isolate its content, which means filtering to its
        // direct text and zero-width spans. (We have to filter out any other siblings
        // that may have been rendered alongside them.)
        const texts = Array.from(el.querySelectorAll(`${SELECTORS.STRING}, ${SELECTORS.ZERO_WIDTH}`));
        for (const text of texts) {
            const node = text.childNodes[0];
            const domLength = node.textContent.length;
            let slateLength = domLength;
            if (text.hasAttribute(DATA_ATTRS.LENGTH)) {
                slateLength = parseInt(text.getAttribute(DATA_ATTRS.LENGTH), 10);
            }
            const end = start + slateLength;
            if (point.offset <= end) {
                const offset = Math.min(domLength, Math.max(0, point.offset - start));
                // adjust empty text selection, prevent delete comment of Angular when clear compsition input
                if (offset === 0 && domLength === 1 && node.textContent === '\u200B') {
                    return { node, offset: offset + 1 };
                }
                return { node, offset };
            }
            start = end;
        }
        return null;
    }
    /**
     * Find a native DOM range from a Slate `range`.
     *
     * @param {Editor} editor
     * @param {Range} range
     * @return {DOMRange|Null}
     */
    static findDOMRange(editor, range) {
        const { anchor, focus, isBackward, isCollapsed } = range;
        const domAnchor = editor.findDOMPoint(anchor);
        const domFocus = isCollapsed ? domAnchor : editor.findDOMPoint(focus);
        if (!domAnchor || !domFocus) {
            return null;
        }
        const window = getWindow(domAnchor.node);
        const r = window.document.createRange();
        const start = isBackward ? domFocus : domAnchor;
        const end = isBackward ? domAnchor : domFocus;
        r.setStart(start.node, start.offset);
        r.setEnd(end.node, end.offset);
        return r;
    }
    /**
     * Find a Slate node from a native DOM `element`.
     *
     * @param {Editor} editor
     * @param {Element} element
     * @return {List|Null}
     */
    static findNode(editor, element) {
        const path = editor.findPath(element);
        if (!path) {
            return null;
        }
        const { value } = editor;
        const { document } = value;
        const node = document.getNode(path);
        return node;
    }
    /**
     * Get the target range from a DOM `event`.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @return {Range}
     */
    static findEventRange(editor, event) {
        if (event.nativeEvent) {
            event = event.nativeEvent;
        }
        const { clientX: x, clientY: y, target } = event;
        if (x == null || y == null)
            return null;
        const { value } = editor;
        const { document } = value;
        const path = editor.findPath(event.target);
        if (!path)
            return null;
        const node = document.getNode(path);
        // If the drop target is inside a void node, move it into either the next or
        // previous node, depending on which side the `x` and `y` coordinates are
        // closest to.
        if (editor.isVoid(node)) {
            const rect = target.getBoundingClientRect();
            const isPrevious = node.object === 'inline'
                ? x - rect.left < rect.left + rect.width - x
                : y - rect.top < rect.top + rect.height - y;
            const range = document.createRange();
            const move = isPrevious ? 'moveToEndOfNode' : 'moveToStartOfNode';
            const entry = document[isPrevious ? 'getPreviousText' : 'getNextText'](path);
            if (entry) {
                return range[move](entry);
            }
            return null;
        }
        // Else resolve a range from the caret position where the drop occured.
        const window = getWindow(target);
        let native;
        // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
        if (window.document.caretRangeFromPoint) {
            native = window.document.caretRangeFromPoint(x, y);
        }
        else if (window.document.caretPositionFromPoint) {
            const position = window.document.caretPositionFromPoint(x, y);
            native = window.document.createRange();
            native.setStart(position.offsetNode, position.offset);
            native.setEnd(position.offsetNode, position.offset);
        }
        else if (window.document.body.createTextRange) {
            // COMPAT: In IE, `caretRangeFromPoint` and
            // `caretPositionFromPoint` don't exist. (2018/07/11)
            native = window.document.body.createTextRange();
            try {
                native.moveToPoint(x, y);
            }
            catch (error) {
                // IE11 will raise an `unspecified error` if `moveToPoint` is
                // called during a dropEvent.
                return null;
            }
        }
        // Resolve a Slate range from the DOM range.
        const retRange = editor.findRange(native);
        return retRange;
    }
    /**
     * Find the path of a native DOM `element` by searching React refs.
     *
     * @param {Editor} editor
     * @param {Element} element
     * @return {List|Null}
     */
    static findPath(editor, element) {
        const contentRef = editor.tmp.contentRef;
        let nodeElement = element;
        // If element does not have a key, it is likely a string or
        // mark, return the closest parent Node that can be looked up.
        if (!nodeElement.hasAttribute(DATA_ATTRS.KEY)) {
            nodeElement = nodeElement.closest(SELECTORS.KEY);
        }
        if (!nodeElement || !nodeElement.getAttribute(DATA_ATTRS.KEY)) {
            return null;
        }
        if (nodeElement === contentRef.rootNode) {
            return PathUtils.create([]);
        }
        const search = (instance, p) => {
            if (nodeElement === instance.rootNode) {
                return p;
            }
            if (!instance.nodeRefs) {
                return null;
            }
            const nodeRefs = instance.nodeRefs;
            let i = 0;
            for (const nodeRef of nodeRefs) {
                const retPath = search(nodeRef, [...p, i]);
                i++;
                if (retPath) {
                    return retPath;
                }
            }
            return null;
        };
        const documentNodeRef = contentRef.nodeRef;
        const path = search(documentNodeRef, []);
        if (!path) {
            return null;
        }
        return PathUtils.create(path);
    }
    /**
     * Find a Slate point from a DOM selection's `nativeNode` and `nativeOffset`.
     *
     * @param {Editor} editor
     * @param {Element} nativeNode
     * @param {Number} nativeOffset
     * @return {Point}
     */
    static findPoint(editor, nativeNode, nativeOffset) {
        const { node: nearestNode, offset: nearestOffset } = normalizeNodeAndOffset(nativeNode, nativeOffset);
        const window = getWindow(nativeNode);
        const { parentNode } = nearestNode;
        let leafNode = parentNode.closest(SELECTORS.LEAF);
        let textNode;
        let offset;
        let node;
        // Calculate how far into the text node the `nearestNode` is, so that we can
        // determine what the offset relative to the text node is.
        if (leafNode) {
            textNode = leafNode.closest(SELECTORS.TEXT);
            const range = window.document.createRange();
            range.setStart(textNode, 0);
            range.setEnd(nearestNode, nearestOffset);
            const contents = range.cloneContents();
            const zeroWidths = contents.querySelectorAll(SELECTORS.ZERO_WIDTH);
            Array.from(zeroWidths).forEach((el) => {
                el.parentNode.removeChild(el);
            });
            // COMPAT: Edge has a bug where Range.prototype.toString() will convert \n
            // into \r\n. The bug causes a loop when slate-react attempts to reposition
            // its cursor to match the native position. Use textContent.length instead.
            // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10291116/
            offset = contents.textContent.length;
            node = textNode;
        }
        else {
            // For void nodes, the element with the offset key will be a cousin, not an
            // ancestor, so find it by going down from the nearest void parent.
            const voidNode = parentNode.closest(SELECTORS.VOID);
            if (!voidNode) {
                return null;
            }
            leafNode = voidNode.querySelector(SELECTORS.LEAF);
            if (!leafNode) {
                return null;
            }
            textNode = leafNode.closest(SELECTORS.TEXT);
            node = leafNode;
            offset = node.textContent.length;
        }
        // COMPAT: If the parent node is a Slate zero-width space, this is because the
        // text node should have no characters. However, during IME composition the
        // ASCII characters will be prepended to the zero-width space, so subtract 1
        // from the offset to account for the zero-width space character.
        if (offset === node.textContent.length &&
            parentNode.hasAttribute(DATA_ATTRS.ZERO_WIDTH)) {
            offset--;
        }
        // COMPAT: If someone is clicking from one Slate editor into another, the
        // select event fires twice, once for the old editor's `element` first, and
        // then afterwards for the correct `element`. (2017/03/03)
        const path = editor.findPath(textNode);
        if (!path) {
            return null;
        }
        const { value } = editor;
        const { document } = value;
        const point = document.createPoint({ path, offset });
        return point;
    }
    /**
     * Find a Slate range from a DOM range or selection.
     *
     * @param {Editor} editor
     * @param {Selection} domRange
     * @return {Range}
     */
    static findRange(editor, domRange) {
        const el = domRange.anchorNode || domRange.startContainer;
        if (!el) {
            return null;
        }
        const window = getWindow(el);
        // If the `domRange` object is a DOM `Range` or `StaticRange` object, change it
        // into something that looks like a DOM `Selection` instead.
        if (domRange instanceof window.Range ||
            (window.StaticRange && domRange instanceof window.StaticRange)) {
            domRange = {
                anchorNode: domRange.startContainer,
                anchorOffset: domRange.startOffset,
                focusNode: domRange.endContainer,
                focusOffset: domRange.endOffset
            };
        }
        const { anchorNode, anchorOffset, focusNode, focusOffset, isCollapsed } = domRange;
        const { value } = editor;
        const anchor = editor.findPoint(anchorNode, anchorOffset);
        const focus = isCollapsed
            ? anchor
            : editor.findPoint(focusNode, focusOffset);
        if (!anchor || !focus) {
            return null;
        }
        const { document } = value;
        const range = document.createRange({
            anchor,
            focus
        });
        return range;
    }
    /**
     * Find a Slate selection from a DOM selection.
     *
     * @param {Editor} editor
     * @param {Selection} domSelection
     * @return {Range}
     */
    static findSelection(editor, domSelection) {
        const { value } = editor;
        const { document } = value;
        // If there are no ranges, the editor was blurred natively.
        if (!domSelection.rangeCount) {
            return null;
        }
        // Otherwise, determine the Slate selection from the native one.
        let range = editor.findRange(domSelection);
        if (!range) {
            return null;
        }
        const { anchor, focus } = range;
        const anchorText = document.getNode(anchor.path);
        const focusText = document.getNode(focus.path);
        const anchorInline = document.getClosestInline(anchor.path);
        const focusInline = document.getClosestInline(focus.path);
        const focusBlock = document.getClosestBlock(focus.path);
        const anchorBlock = document.getClosestBlock(anchor.path);
        // COMPAT: If the anchor point is at the start of a non-void, and the
        // focus point is inside a void node with an offset that isn't `0`, set
        // the focus offset to `0`. This is due to void nodes <span>'s being
        // positioned off screen, resulting in the offset always being greater
        // than `0`. Since we can't know what it really should be, and since an
        // offset of `0` is less destructive because it creates a hanging
        // selection, go with `0`. (2017/09/07)
        if (anchorBlock &&
            !editor.isVoid(anchorBlock) &&
            anchor.offset === 0 &&
            focusBlock &&
            editor.isVoid(focusBlock) &&
            focus.offset !== 0) {
            range = range.setFocus(focus.setOffset(0));
        }
        // COMPAT: If the selection is at the end of a non-void inline node, and
        // there is a node after it, put it in the node after instead. This
        // standardizes the behavior, since it's indistinguishable to the user.
        // selection is at start of a non-void inline node
        // there is a node after it, put it in the node before instead
        if (anchorInline &&
            !editor.isVoid(anchorInline)) {
            const block = document.getClosestBlock(anchor.path);
            const depth = document.getDepth(block.key);
            const relativePath = PathUtils.drop(anchor.path, depth);
            if (anchor.offset === anchorText.text.length) {
                const [next] = block.texts({ path: relativePath });
                if (next) {
                    const [, nextPath] = next;
                    const absolutePath = anchor.path
                        .slice(0, depth)
                        .concat(nextPath);
                    range = range.moveAnchorTo(absolutePath, 0);
                }
            }
            else if (anchor.offset === 0) {
                const [previousText] = block.texts({ path: relativePath, direction: 'backward' });
                if (previousText) {
                    const [previous, previousPath] = previousText;
                    const absolutePath = anchor.path
                        .slice(0, depth)
                        .concat(previousPath);
                    range = range.moveAnchorTo(absolutePath, previous.text.length);
                }
            }
        }
        if (focusInline &&
            !editor.isVoid(focusInline)) {
            const block = document.getClosestBlock(focus.path);
            const depth = document.getDepth(block.key);
            const relativePath = PathUtils.drop(focus.path, depth);
            if (focus.offset === focusText.text.length) {
                const [next] = block.texts({ path: relativePath });
                if (next) {
                    const [, nextPath] = next;
                    const absolutePath = focus.path
                        .slice(0, depth)
                        .concat(nextPath);
                    range = range.moveFocusTo(absolutePath, 0);
                }
            }
            else if (focus.offset === 0) {
                const [previousTextEntry] = block.texts({ path: relativePath, direction: 'backward' });
                if (previousTextEntry) {
                    const [previous, previousPath] = previousTextEntry;
                    const absolutePath = focus.path
                        .slice(0, depth)
                        .concat(previousPath);
                    range = range.moveFocusTo(absolutePath, previous.text.length);
                }
            }
        }
        let selection = document.createSelection(range);
        // COMPAT: Ensure that the `isFocused` argument is set.
        selection = selection.setIsFocused(true);
        // COMPAT: Preserve the marks, since we have no way of knowing what the DOM
        // selection's marks were. They will be cleared automatically by the
        // `select` command if the selection moves.
        selection = selection.set('marks', value.selection.marks);
        return selection;
    }
}
/**
 * From a DOM selection's `node` and `offset`, normalize so that it always
 * refers to a text node.
 *
 * @param {Element} node
 * @param {Number} offset
 * @return {Object}
 */
function normalizeNodeAndOffset(node, offset) {
    // If it's an element node, its offset refers to the index of its children
    // including comment nodes, so try to find the right text child node.
    if (node.nodeType === 1 && node.childNodes.length) {
        const isLast = offset === node.childNodes.length;
        const direction = isLast ? 'backward' : 'forward';
        const index = isLast ? offset - 1 : offset;
        node = getEditableChild(node, index, direction);
        // If the node has children, traverse until we have a leaf node. Leaf nodes
        // can be either text nodes, or other void DOM nodes.
        while (node.nodeType === 1 && node.childNodes.length) {
            const i = isLast ? node.childNodes.length - 1 : 0;
            node = getEditableChild(node, i, direction);
        }
        // Determine the new offset inside the text node.
        offset = isLast ? node.textContent.length : 0;
    }
    // Return the node and offset.
    return { node, offset };
}
/**
 * Get the nearest editable child at `index` in a `parent`, preferring
 * `direction`.
 *
 * @param {Element} parent
 * @param {Number} index
 * @param {String} direction ('forward' or 'backward')
 * @return {Element|Null}
 */
function getEditableChild(parent, index, direction) {
    const { childNodes } = parent;
    let child = childNodes[index];
    let i = index;
    let triedForward = false;
    let triedBackward = false;
    // While the child is a comment node, or an element node with no children,
    // keep iterating to find a sibling non-void, non-comment node.
    while (child.nodeType === 8 ||
        (child.nodeType === 1 && child.childNodes.length === 0) ||
        (child.nodeType === 1 &&
            child.getAttribute('contenteditable') === 'false')) {
        if (triedForward && triedBackward)
            break;
        if (i >= childNodes.length) {
            triedForward = true;
            i = index - 1;
            direction = 'backward';
            continue;
        }
        if (i < 0) {
            triedBackward = true;
            i = index + 1;
            direction = 'forward';
            continue;
        }
        child = childNodes[i];
        if (direction === 'forward')
            i++;
        if (direction === 'backward')
            i--;
    }
    return child || null;
}
var QueriesPlugin$1 = {
    queries: QueriesPlugin
};

/**
 * A plugin that adds the React-specific rendering logic to the editor.
 *
 * @param {Object} options
 * @return {Object}
 */
function AngularPlugin(options = {}) {
    const editorPropsPlugin = EditorPropsPlugin(options);
    const domPlugin = DOMPlugin(options);
    return [editorPropsPlugin, domPlugin, CommandsPlugin$1, QueriesPlugin$1];
}

/**
 * CSS overflow values that would cause scrolling.
 *
 * @type {Array}
 */
const OVERFLOWS = ['auto', 'overlay', 'scroll'];
/**
 * Detect whether we are running IOS version 11
 */
const IS_IOS_11 = IS_IOS && !!window.navigator.userAgent.match(/os 11_/i);
function isBackward(selection) {
    const startNode = selection.anchorNode;
    const startOffset = selection.anchorOffset;
    const endNode = selection.focusNode;
    const endOffset = selection.focusOffset;
    const position = startNode.compareDocumentPosition(endNode);
    return !(position === 4 /* Node.DOCUMENT_POSITION_FOLLOWING */ ||
        (position === 0 && startOffset < endOffset));
}
/**
 * Find the nearest parent with scrolling, or window.
 *
 * @param {el} Element
 */
function findScrollContainer(el, window) {
    let parent = el.parentNode;
    let scroller;
    while (!scroller) {
        if (!parent.parentNode)
            break;
        const style = window.getComputedStyle(parent);
        const { overflowY } = style;
        if (OVERFLOWS.includes(overflowY)) {
            scroller = parent;
            break;
        }
        parent = parent.parentNode;
    }
    // COMPAT: Because Chrome does not allow doucment.body.scrollTop, we're
    // assuming that window.scrollTo() should be used if the scrollable element
    // turns out to be document.body or document.documentElement. This will work
    // unless body is intentionally set to scrollable by restricting its height
    // (e.g. height: 100vh).
    if (!scroller) {
        return window.document.body;
    }
    return scroller;
}
/**
 * Scroll the current selection's focus point into view if needed.
 *
 * @param {Selection} selection
 */
function scrollToSelection(selection) {
    if (IS_IOS_11)
        return;
    if (!selection.anchorNode)
        return;
    const window = getWindow(selection.anchorNode);
    const scroller = findScrollContainer(selection.anchorNode, window);
    const isWindow = scroller === window.document.body || scroller === window.document.documentElement;
    const backward = isBackward(selection);
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(backward);
    let cursorRect = range.getBoundingClientRect();
    // COMPAT: range.getBoundingClientRect() returns 0s in Safari when range is
    // collapsed. Expanding the range by 1 is a relatively effective workaround
    // for vertical scroll, although horizontal may be off by 1 character.
    // https://bugs.webkit.org/show_bug.cgi?id=138949
    // https://bugs.chromium.org/p/chromium/issues/detail?id=435438
    if (IS_SAFARI) {
        if (range.collapsed && cursorRect.top === 0 && cursorRect.height === 0) {
            if (range.startOffset === 0) {
                range.setEnd(range.endContainer, 1);
            }
            else {
                range.setStart(range.startContainer, range.startOffset - 1);
            }
            cursorRect = range.getBoundingClientRect();
            if (cursorRect.top === 0 && cursorRect.height === 0) {
                if (range.getClientRects().length) {
                    cursorRect = range.getClientRects()[0];
                }
            }
        }
    }
    let width;
    let height;
    let yOffset;
    let xOffset;
    let scrollerTop = 0;
    let scrollerLeft = 0;
    let scrollerBordersY = 0;
    let scrollerBordersX = 0;
    let scrollerPaddingTop = 0;
    let scrollerPaddingBottom = 0;
    let scrollerPaddingLeft = 0;
    let scrollerPaddingRight = 0;
    if (isWindow) {
        const { innerWidth, innerHeight, pageYOffset, pageXOffset } = window;
        width = innerWidth;
        height = innerHeight;
        yOffset = pageYOffset;
        xOffset = pageXOffset;
    }
    else {
        const { offsetWidth, offsetHeight, scrollTop, scrollLeft } = scroller;
        const { borderTopWidth, borderBottomWidth, borderLeftWidth, borderRightWidth, paddingTop, paddingBottom, paddingLeft, paddingRight } = window.getComputedStyle(scroller);
        const scrollerRect = scroller.getBoundingClientRect();
        width = offsetWidth;
        height = offsetHeight;
        scrollerTop = scrollerRect.top + parseInt(borderTopWidth, 10);
        scrollerLeft = scrollerRect.left + parseInt(borderLeftWidth, 10);
        scrollerBordersY = parseInt(borderTopWidth, 10) + parseInt(borderBottomWidth, 10);
        scrollerBordersX = parseInt(borderLeftWidth, 10) + parseInt(borderRightWidth, 10);
        scrollerPaddingTop = parseInt(paddingTop, 10);
        scrollerPaddingBottom = parseInt(paddingBottom, 10);
        scrollerPaddingLeft = parseInt(paddingLeft, 10);
        scrollerPaddingRight = parseInt(paddingRight, 10);
        yOffset = scrollTop;
        xOffset = scrollLeft;
    }
    const cursorTop = cursorRect.top + yOffset - scrollerTop;
    const cursorLeft = cursorRect.left + xOffset - scrollerLeft;
    let x = xOffset;
    let y = yOffset;
    if (cursorLeft < xOffset) {
        // selection to the left of viewport
        x = cursorLeft - scrollerPaddingLeft;
    }
    else if (cursorLeft + cursorRect.width + scrollerBordersX > xOffset + width) {
        // selection to the right of viewport
        x = cursorLeft + scrollerBordersX + scrollerPaddingRight - width;
    }
    if (cursorTop < yOffset) {
        // selection above viewport
        y = cursorTop - scrollerPaddingTop;
    }
    else if (cursorTop + cursorRect.height + scrollerBordersY > yOffset + height) {
        // selection below viewport
        y = cursorTop + scrollerBordersY + scrollerPaddingBottom + cursorRect.height - height;
    }
    if (isWindow) {
        window.scrollTo(x, y);
    }
    else {
        scroller.scrollTop = y;
        scroller.scrollLeft = x;
    }
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const canUseDOM = !!(typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined');

const TOP_BLUR = 'blur';
const TOP_COMPOSITION_END = 'compositionend';
const TOP_KEY_DOWN = 'keydown';
const TOP_KEY_PRESS = 'keypress';
const TOP_KEY_UP = 'keyup';
const TOP_MOUSE_DOWN = 'mousedown';
const TOP_TEXT_INPUT = 'textInput';
const TOP_PASTE = 'paste';

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * These variables store information about text content of a target node,
 * allowing comparison of content before and after a given event.
 *
 * Identify the node where selection currently begins, then observe
 * both its text content and its current position in the DOM. Since the
 * browser may natively replace the target node during composition, we can
 * use its position to find its replacement.
 *
 *
 */
let root = null;
let startText = null;
let fallbackText = null;
function reset() {
    root = null;
    startText = null;
    fallbackText = null;
}
function getData() {
    if (fallbackText) {
        return fallbackText;
    }
    let start;
    const startValue = startText;
    const startLength = startValue.length;
    let end;
    const endValue = getText();
    const endLength = endValue.length;
    for (start = 0; start < startLength; start++) {
        if (startValue[start] !== endValue[start]) {
            break;
        }
    }
    const minEnd = startLength - start;
    for (end = 1; end <= minEnd; end++) {
        if (startValue[startLength - end] !== endValue[endLength - end]) {
            break;
        }
    }
    const sliceTail = end > 1 ? 1 - end : undefined;
    fallbackText = endValue.slice(start, sliceTail);
    return fallbackText;
}
function getText() {
    if ('value' in root) {
        return root.value;
    }
    return root.textContent;
}

class BeforeInputEvent {
    constructor() {
        this.data = null;
    }
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import SyntheticCompositionEvent from './SyntheticCompositionEvent';
// import SyntheticInputEvent from './SyntheticInputEvent';
const END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
const START_KEYCODE = 229;
let HAS_TEXT_INPUT = false;
const canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;
let documentMode = null;
if (canUseDOM && 'documentMode' in document) {
    documentMode = document.documentMode;
}
// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
const canUseTextInputEvent = canUseDOM && 'TextEvent' in window && !documentMode;
// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
const useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || (documentMode && documentMode > 8 && documentMode <= 11));
const SPACEBAR_CODE = 32;
const SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
// Track whether we've ever handled a keypress on the space key.
let hasSpaceKeypress = false;
/**
 * Return whether a native keypress event is assumed to be a command.
 * This is required because Firefox fires `keypress` events for key commands
 * (cut, copy, select-all, etc.) even though no character is inserted.
 */
function isKeypressCommand(nativeEvent) {
    return ((nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) &&
        // ctrlKey && altKey is equivalent to AltGr, and is not a command.
        !(nativeEvent.ctrlKey && nativeEvent.altKey));
}
/**
 * Does our fallback mode think that this event is the end of composition?
 *
 */
function isFallbackCompositionEnd(topLevelType, nativeEvent) {
    switch (topLevelType) {
        case TOP_KEY_UP:
            // Command keys insert or clear IME input.
            return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
        case TOP_KEY_DOWN:
            // Expect IME keyCode on each keydown. If we get any other
            // code we must have exited earlier.
            return nativeEvent.keyCode !== START_KEYCODE;
        case TOP_KEY_PRESS:
        case TOP_MOUSE_DOWN:
        case TOP_BLUR:
            // Events are not possible without cancelling IME.
            return true;
        default:
            return false;
    }
}
/**
 * Google Input Tools provides composition data via a CustomEvent,
 * with the `data` property populated in the `detail` object. If this
 * is available on the event object, use it. If not, this is a plain
 * composition event and we have nothing special to extract.
 *
 */
function getDataFromCustomEvent(nativeEvent) {
    const detail = nativeEvent.detail;
    if (typeof detail === 'object' && 'data' in detail) {
        return detail.data;
    }
    if (nativeEvent.data) {
        return nativeEvent.data;
    }
    return null;
}
/**
 * Check if a composition event was triggered by Korean IME.
 * Our fallback mode does not work well with IE's Korean IME,
 * so just use native composition events when Korean IME is used.
 * Although CompositionEvent.locale property is deprecated,
 * it is available in IE, where our fallback mode is enabled.
 *
 */
function isUsingKoreanIME(nativeEvent) {
    return nativeEvent.locale === 'ko';
}
// Track the current IME composition status, if any.
let isComposing = false;
function getNativeBeforeInputChars(topLevelType, nativeEvent) {
    switch (topLevelType) {
        case TOP_COMPOSITION_END:
            if (HAS_TEXT_INPUT) {
                HAS_TEXT_INPUT = false;
                return;
            }
            return getDataFromCustomEvent(nativeEvent);
        case TOP_KEY_PRESS:
            /**
             * If native `textInput` events are available, our goal is to make
             * use of them. However, there is a special case: the spacebar key.
             * In Webkit, preventing default on a spacebar `textInput` event
             * cancels character insertion, but it *also* causes the browser
             * to fall back to its default spacebar behavior of scrolling the
             * page.
             *
             * Tracking at:
             * https://code.google.com/p/chromium/issues/detail?id=355103
             *
             * To avoid this issue, use the keypress event as if no `textInput`
             * event is available.
             */
            const which = nativeEvent.which;
            if (which !== SPACEBAR_CODE) {
                return null;
            }
            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;
        case TOP_TEXT_INPUT:
            // Record the characters to be added to the DOM.
            const chars = nativeEvent.data;
            // If it's a spacebar character, assume that we have already handled
            // it at the keypress level and bail immediately. Android Chrome
            // doesn't give us keycodes, so we need to ignore it.
            if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
                return null;
            }
            HAS_TEXT_INPUT = true;
            return chars;
        default:
            // For other native event types, do nothing.
            return null;
    }
}
/**
 * For browsers that do not provide the `textInput` event, extract the
 * appropriate string to use for SyntheticInputEvent.
 *
 */
function getFallbackBeforeInputChars(topLevelType, nativeEvent) {
    // If we are currently composing (IME) and using a fallback to do so,
    // try to extract the composed characters from the fallback object.
    // If composition event is available, we extract a string only at
    // compositionevent, otherwise extract it at fallback events.
    if (isComposing) {
        if (topLevelType === TOP_COMPOSITION_END || (!canUseCompositionEvent && isFallbackCompositionEnd(topLevelType, nativeEvent))) {
            const chars = getData();
            reset();
            isComposing = false;
            return chars;
        }
        return null;
    }
    switch (topLevelType) {
        case TOP_PASTE:
            // If a paste event occurs after a keypress, throw out the input
            // chars. Paste events should not lead to BeforeInput events.
            return null;
        case TOP_KEY_PRESS:
            /**
             * As of v27, Firefox may fire keypress events even when no character
             * will be inserted. A few possibilities:
             *
             * - `which` is `0`. Arrow keys, Esc key, etc.
             *
             * - `which` is the pressed key code, but no char is available.
             *   Ex: 'AltGr + d` in Polish. There is no modified character for
             *   this key combination and no character is inserted into the
             *   document, but FF fires the keypress for char code `100` anyway.
             *   No `input` event will occur.
             *
             * - `which` is the pressed key code, but a command combination is
             *   being used. Ex: `Cmd+C`. No character is inserted, and no
             *   `input` event will occur.
             */
            if (!isKeypressCommand(nativeEvent)) {
                // IE fires the `keypress` event when a user types an emoji via
                // Touch keyboard of Windows.  In such a case, the `char` property
                // holds an emoji character like `\uD83D\uDE0A`.  Because its length
                // is 2, the property `which` does not represent an emoji correctly.
                // In such a case, we directly return the `char` property instead of
                // using `which`.
                if (nativeEvent.char && nativeEvent.char.length > 1) {
                    return nativeEvent.char;
                }
                else if (nativeEvent.which) {
                    return String.fromCharCode(nativeEvent.which);
                }
            }
            return null;
        case TOP_COMPOSITION_END:
            return useFallbackCompositionData && !isUsingKoreanIME(nativeEvent) ? null : nativeEvent.data;
        default:
            return null;
    }
}
/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 *
 */
function extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    let chars;
    if (canUseTextInputEvent) {
        chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
    }
    else {
        chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
    }
    // If no characters are being inserted, no BeforeInput event should
    // be fired.
    if (!chars) {
        return null;
    }
    const beforeInputEvent = new BeforeInputEvent();
    beforeInputEvent.data = chars;
    beforeInputEvent.nativeEvent = nativeEvent;
    return beforeInputEvent;
    //   const event = SyntheticInputEvent.getPooled(
    //     eventTypes.beforeInput,
    //     targetInst,
    //     nativeEvent,
    //     nativeEventTarget
    //   );
    //   event.data = chars;
    //   accumulateTwoPhaseDispatches(event);
    //   return event;
}
const ɵ0 = (topLevelType, targetInst, nativeEvent, nativeEventTarget) => {
    const beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    if (beforeInput === null) {
        return null;
    }
    return beforeInput;
};
/**
 * Create an `onBeforeInput` event to match
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * This event plugin is based on the native `textInput` event
 * available in Chrome, Safari, Opera, and IE. This event fires after
 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
 *
 * `beforeInput` is spec'd but not implemented in any browsers, and
 * the `input` event does not provide any useful information about what has
 * actually been added, contrary to the spec. Thus, `textInput` is the best
 * available event to identify the characters that have actually been inserted
 * into the target node.
 *
 * This plugin is also responsible for emitting `composition` events, thus
 * allowing us to share composition fallback code for both `beforeInput` and
 * `composition` event types.
 */
const BeforeInputEventPlugin = {
    //   eventTypes: eventTypes,
    extractEvents: ɵ0
};

class SlaLeafRenderConfig {
}
/**
 * pluginRender parameter config
 */
class SlaNodeRenderConfig {
}
class SlaNestedNodeRef {
    constructor(rootNode, componentRef) {
        this.rootNode = rootNode;
        this.componentRef = componentRef;
    }
}

class ChildNodeBase {
}

function setNodeAttributes(ele, attributes) {
    for (const key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            ele.setAttribute(key, attributes[key]);
        }
    }
}
function setNodeStyles(ele, styles) {
    for (const key in styles) {
        if (styles.hasOwnProperty(key)) {
            ele.style[key] = styles[key];
        }
    }
}

class SlaVoidComponent {
    constructor(viewContainerRef, elementRef) {
        this.viewContainerRef = viewContainerRef;
        this.elementRef = elementRef;
        this.readOnly = false;
        this.void = 'true';
        this.key = '';
    }
    set node(value) {
        this.internalNode = value;
        if (this.nodeComponentRef) {
            this.nodeComponentRef.componentRef.instance.node = this.internalNode;
        }
    }
    get node() {
        return this.internalNode;
    }
    ngOnInit() {
        this.render();
        this.key = this.node.key;
        if (this.node.object === 'inline') {
            this.elementRef.nativeElement.contentEditable = 'false';
        }
    }
    createElement() {
        const tag = this.node.object === 'block' ? 'div' : 'span';
        return document.createElement(tag);
    }
    render() {
        if (!this.readOnly) {
            this.elementRef.nativeElement.appendChild(this.renderSpacer());
        }
        else {
            this.children.remove();
        }
        this.elementRef.nativeElement.appendChild(this.renderContent());
    }
    renderSpacer() {
        const style = {
            height: '0',
            color: 'transparent',
            outline: 'none',
            position: 'absolute',
        };
        const spacerAttrs = {
            [DATA_ATTRS.SPACER]: 'true',
        };
        const spacer = this.createElement();
        setNodeStyles(spacer, style);
        setNodeAttributes(spacer, spacerAttrs);
        spacer.appendChild(this.nodeRefs.first.rootNode);
        return spacer;
    }
    renderContent() {
        const content = this.createElement();
        content.setAttribute(`contentEditable`, this.readOnly ? null : 'false');
        content.appendChild(this.children);
        return content;
    }
}
SlaVoidComponent.decorators = [
    { type: Component, args: [{
                selector: 'div[slaVoid]',
                template: ""
            }] }
];
/** @nocollapse */
SlaVoidComponent.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
SlaVoidComponent.propDecorators = {
    editor: [{ type: Input }],
    selection: [{ type: Input }],
    parent: [{ type: Input }],
    block: [{ type: Input }],
    decorations: [{ type: Input }],
    annotations: [{ type: Input }],
    children: [{ type: Input }],
    nodeRef: [{ type: Input }],
    readOnly: [{ type: Input }],
    nodeRefs: [{ type: Input }],
    node: [{ type: Input }],
    void: [{ type: HostBinding, args: ['attr.data-slate-void',] }],
    key: [{ type: HostBinding, args: ['attr.data-key',] }]
};

class SlaPluginRenderService {
    constructor(cfr) {
        this.cfr = cfr;
    }
    renderDom(tagName, children, attributes, styles) {
        const node = document.createElement(tagName);
        this.setNodeAttributes(node, attributes);
        if (styles) {
            this.setNodeStyles(node, styles);
        }
        if (children instanceof HTMLCollection) {
            for (let index = 0; index < children.length; index++) {
                const element = children.item(index);
                node.appendChild(element);
            }
            return node;
        }
        if (children instanceof HTMLElement) {
            node.appendChild(children);
            return node;
        }
        if (children instanceof QueryList) {
            const nodeRefs = children.toArray();
            for (const nodeRef of nodeRefs) {
                node.appendChild(nodeRef.rootNode);
            }
            return node;
        }
        return node;
    }
    renderComponent(componentType, config) {
        const componentFactory = this.cfr.resolveComponentFactory(componentType);
        const componentRef = config.nodeViewContainerRef.createComponent(componentFactory);
        Object.assign(componentRef.instance, Object.assign({}, config));
        componentRef.changeDetectorRef.detectChanges();
        return new SlaNestedNodeRef(this.getComponentRootNode(componentRef), componentRef);
    }
    setNodeAttributes(ele, attributes) {
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                ele.setAttribute(key, attributes[key]);
            }
        }
    }
    setNodeStyles(ele, styles) {
        for (const key in styles) {
            if (styles.hasOwnProperty(key)) {
                ele.style[key] = styles[key];
            }
        }
    }
    getComponentRootNode(componentRef) {
        return componentRef.hostView.rootNodes[0];
    }
}
SlaPluginRenderService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
/** @nocollapse */
SlaPluginRenderService.ctorParameters = () => [
    { type: ComponentFactoryResolver }
];
SlaPluginRenderService.ngInjectableDef = ɵɵdefineInjectable({ factory: function SlaPluginRenderService_Factory() { return new SlaPluginRenderService(ɵɵinject(ComponentFactoryResolver)); }, token: SlaPluginRenderService, providedIn: "root" });

const debug$2 = Debug('slate:node');
debug$2.render = Debug('slate:node-render');
debug$2.check = Debug('slate:docheck');
debug$2.change = Debug('slate:change');
const nodeBinding = {
    provide: ChildNodeBase,
    useExisting: forwardRef(() => SlaNodeComponent)
};
class SlaNodeComponent extends ChildNodeBase {
    constructor(viewContainerRef, elementRef, slaPluginRenderService, ngZone, differs) {
        super();
        this.viewContainerRef = viewContainerRef;
        this.elementRef = elementRef;
        this.slaPluginRenderService = slaPluginRenderService;
        this.ngZone = ngZone;
        this.differs = differs;
        this.subSelections = [];
        this.readOnly = false;
        this.rendered = true;
    }
    set node(value) {
        debug$2('set: node', value.toJSON());
        const oldNode = this.internalNode || value;
        this.internalNode = value;
        if (this.nodeComponentRef) {
            this.ngZone.run(() => {
                this.nodeComponentRef.componentRef.instance.node = this.internalNode;
                this.nodeComponentRef.componentRef.changeDetectorRef.detectChanges();
            });
        }
        else {
            if (!this.internalNode.data.equals(oldNode.data)) {
                this.render();
            }
        }
    }
    get node() {
        return this.internalNode;
    }
    ngOnInit() {
        debug$2(`ngOnInit node`, this.node.toJSON());
        this.rootNode = this.elementRef.nativeElement;
    }
    ngAfterViewInit() {
        this.render();
        this.differ = this.differs.find(this.nodeRefs).create((index, item) => {
            return item.rootNode;
        });
        this.differ.diff(this.nodeRefs);
        this.nodeRefs.changes.subscribe(() => {
            const iterableChanges = this.differ.diff(this.nodeRefs);
            if (iterableChanges) {
                iterableChanges.forEachAddedItem((record) => {
                    const rootNode = record.item.rootNode;
                    let childrenContent;
                    if (this.nodeComponentRef) {
                        childrenContent = this.nodeComponentRef.componentRef.instance.childrenContent.nativeElement;
                    }
                    else {
                        childrenContent = this.rootNode;
                    }
                    const childNodes = Array.from(childrenContent.childNodes).filter((node) => node.hasAttribute('data-slate-object') || node.hasAttribute('data-slate-void'));
                    const nextNode = childNodes[record.currentIndex];
                    if (nextNode) {
                        childrenContent.insertBefore(rootNode, nextNode);
                    }
                    else {
                        childrenContent.appendChild(rootNode);
                    }
                });
            }
        });
    }
    ngAfterViewChecked() { }
    getRelativeRange(node, index, range) {
        if (range.isUnset) {
            return null;
        }
        const child = node.nodes.get(index);
        let { start, end } = range;
        const { path: startPath } = start;
        const { path: endPath } = end;
        const startIndex = startPath.first();
        const endIndex = endPath.first();
        if (startIndex === index) {
            start = start.setPath(startPath.rest());
        }
        else if (startIndex < index && index <= endIndex) {
            if (child.object === 'text') {
                start = start.moveTo(PathUtils.create([index]), 0).setKey(child.key);
            }
            else {
                const [first] = child.texts();
                const [firstNode, firstPath] = first;
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
                const length = child.text.length;
                end = end.moveTo(PathUtils.create([index]), length).setKey(child.key);
            }
            else {
                const [last] = child.texts({ direction: 'backward' });
                const [lastNode, lastPath] = last;
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
    }
    trackBy(index, node) {
        return `${node.key}_${node.type}`;
    }
    render() {
        debug$2.render('exec render', this.node.toJSON());
        let pluginRender;
        if (this.node.object === 'block') {
            pluginRender = 'renderBlock';
        }
        else if (this.node.object === 'document') {
            pluginRender = 'renderDocument';
        }
        else if (this.node.object === 'inline') {
            pluginRender = 'renderInline';
        }
        const config = {
            editor: this.editor,
            isFocused: !!this.selection && this.selection.isFocused,
            isSelected: !!this.selection,
            node: this.node,
            parent: null,
            readOnly: this.readOnly,
            children: this.nodeRefs,
            attributes: {
                [DATA_ATTRS.OBJECT]: this.node.object,
                [DATA_ATTRS.KEY]: this.node.key
            },
            nodeViewContainerRef: this.viewContainerRef
        };
        const renderResult = this.editor.run(pluginRender, config);
        let renderDom = null;
        if (renderResult instanceof SlaNestedNodeRef) {
            this.nodeComponentRef = renderResult;
            renderDom = this.nodeComponentRef.rootNode;
        }
        else {
            renderDom = renderResult;
        }
        if (this.editor.isVoid(this.node)) {
            config.children = renderDom;
            const voidRootNode = this.slaPluginRenderService.renderComponent(SlaVoidComponent, Object.assign(config, { nodeRefs: this.nodeRefs })).rootNode;
            this.rootNode.replaceWith(voidRootNode);
            this.rootNode = voidRootNode;
        }
        else {
            this.rootNode.replaceWith(renderDom);
            this.rootNode = renderDom;
        }
    }
    getNodeRef(index) {
        if (!this.nodeRefs) {
            warning(false, 'nodeRefs is undefined.');
            return null;
        }
        return this.nodeRefs.find((item, i, array) => i === index);
    }
    ngOnChanges(simpleChanges) {
        if (simpleChanges.node || simpleChanges.decorations || simpleChanges.annotations || simpleChanges.selection) {
            this.memoSubNodes();
        }
        debug$2.change(`node changes`, simpleChanges);
        const selectionChange = simpleChanges.selection;
        if (selectionChange && !selectionChange.firstChange) {
            if (this.nodeComponentRef) {
                const isFocused = !!this.selection && this.selection.isFocused;
                if (isFocused !== this.nodeComponentRef.componentRef.instance.isFocused) {
                    this.ngZone.run(() => {
                        this.nodeComponentRef.componentRef.instance.isFocused = isFocused;
                        this.nodeComponentRef.componentRef.changeDetectorRef.detectChanges();
                    });
                }
            }
        }
    }
    ngDoCheck() {
        debug$2.check('check node');
    }
    ngOnDestroy() {
        debug$2(`ngOnDestroy node`);
        this.rootNode.remove();
    }
    memoSubNodes() {
        for (let i = 0; i < this.node.nodes.size; i++) {
            const selection = this.selection && this.getRelativeRange(this.node, i, this.selection);
            if (!(selection && selection.equals(this.subSelections[i]))) {
                this.subSelections[i] = selection;
            }
        }
    }
}
SlaNodeComponent.decorators = [
    { type: Component, args: [{
                selector: 'sla-node,[slaNode]',
                template: "<ng-container *ngFor=\"let child of node.nodes; let i = index; trackBy: trackBy\">\n    <span\n        *ngIf=\"child.object === 'text'\"\n        slaText\n        [attr.data-slate-object]=\"child.object\"\n        [slaTextNode]=\"child\"\n        [parent]=\"node\"\n        [editor]=\"editor\"\n        [attr.data-key]=\"child.key\"\n    ></span>\n    <div\n        *ngIf=\"child.object !== 'text'\"\n        slaNode\n        [node]=\"child\"\n        [selection]=\"subSelections[i]\"\n        [editor]=\"editor\"\n        [readOnly]=\"readOnly\"\n    ></div>\n</ng-container>\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                providers: [nodeBinding]
            }] }
];
/** @nocollapse */
SlaNodeComponent.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef },
    { type: SlaPluginRenderService },
    { type: NgZone },
    { type: IterableDiffers }
];
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

class SlaEventService {
    fromSlaEvents(element, $destroy) {
        return merge(...NGX_SLATE_EVENTS.map((eventEntity) => {
            return fromEvent(element, eventEntity.name).pipe(map(event => {
                return { event, eventEntity };
            }));
        })).pipe(takeUntil($destroy));
    }
}
SlaEventService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
SlaEventService.ngInjectableDef = ɵɵdefineInjectable({ factory: function SlaEventService_Factory() { return new SlaEventService(); }, token: SlaEventService, providedIn: "root" });

const FIREFOX_NODE_TYPE_ACCESS_ERROR = /Permission denied to access property "nodeType"/;
//#endregion
const debug$3 = Debug('slate:content');
debug$3.update = Debug('slate:update');
debug$3.render = Debug('slate:content-render');
debug$3.track = Debug('slate:track');
class SlaContentComponent {
    constructor(ngZone, elementRef, cdr, slaEventService) {
        this.ngZone = ngZone;
        this.elementRef = elementRef;
        this.cdr = cdr;
        this.slaEventService = slaEventService;
        this.$destroy = new Subject();
        this.hasSpaceKeypress = false;
        this.isComposing = false;
        this.isUpdateSelection = false;
        this.readOnly = false;
        this.tmp = {
            isUpdatingSelection: false,
            contentKey: 0
        };
    }
    set slaValue(value) {
        this.isUpdateSelection = true;
        debug$3.render('set: slateValue');
        this.editorData = value;
    }
    ngOnInit() {
        this.rootNode = this.elementRef.nativeElement;
        this.document = this.editor.value.document;
        this.selection = this.editor.value.selection;
        this.ngZone.runOutsideAngular(() => {
            this.slaEventService.fromSlaEvents(this.rootNode, this.$destroy).subscribe(({ event, eventEntity }) => {
                const target = event.target;
                if (target && target.closest) {
                    const isSkip = target.closest(SELECTORS.SKIP_EVENT);
                    if (isSkip) {
                        return;
                    }
                }
                if (eventEntity.isTriggerBeforeInput) {
                    const beforeInputEvent = BeforeInputEventPlugin.extractEvents(event.type, null, event, event.target);
                    if (beforeInputEvent) {
                        this.onEventHandle('onBeforeInput', beforeInputEvent);
                    }
                }
                if (eventEntity.handler) {
                    this.onEventHandle(eventEntity.handler, event);
                }
            });
            fromEvent(window.document, 'selectionchange')
                .pipe(throttle((value) => {
                return interval(100);
            }, { trailing: true, leading: true }), takeUntil(this.$destroy))
                .subscribe((event) => {
                this.onNativeSelectionChange(event);
            });
            // if (HAS_INPUT_EVENTS_LEVEL_2) {
            //     fromEvent(this.rootNode, 'beforeinput')
            //         .pipe(takeUntil(this.$destroy))
            //         .subscribe(event => {
            //             this.onEventHandle('onBeforeInput', event);
            //         });
            // }
        });
    }
    onEventHandle(handler, event) {
        debug$3('slaEvent', handler);
        const nativeEvent = event.nativeEvent || event;
        const isUndoRedo = event.type === 'keydown' && (Hotkeys.isUndo(nativeEvent) || Hotkeys.isRedo(nativeEvent));
        // Ignore `onBlur`, `onFocus` and `onSelect` events generated
        // programmatically while updating selection.
        if ((this.tmp.isUpdatingSelection || isUndoRedo) && (handler === 'onSelect' || handler === 'onBlur' || handler === 'onFocus')) {
            return;
        }
        // COMPAT: There are situations where a select event will fire with a new
        // native selection that resolves to the same internal position. In those
        // cases we don't need to trigger any changes, since our internal model is
        // already up to date, but we do want to update the native selection again
        // to make sure it is in sync. (2017/10/16)
        //
        // ANDROID: The updateSelection causes issues in Android when you are
        // at the end of a block. The selection ends up to the left of the inserted
        // character instead of to the right. This behavior continues even if
        // you enter more than one character. (2019/01/03)
        if (!IS_ANDROID && handler === 'onSelect') {
            // const { editor } = this.props;
            const { value } = this.editor;
            const { selection } = value;
            const window = getWindow(event.target);
            const domSelection = window.getSelection();
            const range = this.editor.findRange(domSelection);
            if (range && range.equals(selection.toRange())) {
                this.updateSelection();
                return;
            }
        }
        // Don't handle drag and drop events coming from embedded editors.
        if (handler === 'onDragEnd' ||
            handler === 'onDragEnter' ||
            handler === 'onDragExit' ||
            handler === 'onDragLeave' ||
            handler === 'onDragOver' ||
            handler === 'onDragStart' ||
            handler === 'onDrop') {
            const closest = event.target.closest(SELECTORS.EDITOR);
            if (closest !== this.rootNode) {
                return;
            }
        }
        // Some events require being in editable in the editor, so if the event
        // target isn't, ignore them.
        if (handler === 'onBeforeInput' ||
            handler === 'onBlur' ||
            handler === 'onCompositionEnd' ||
            handler === 'onCompositionStart' ||
            handler === 'onCopy' ||
            handler === 'onCut' ||
            handler === 'onFocus' ||
            handler === 'onInput' ||
            handler === 'onKeyDown' ||
            handler === 'onKeyUp' ||
            handler === 'onPaste' ||
            handler === 'onSelect') {
            const target = event.target ? event.target : event.nativeEvent.target;
            if (!this.isInEditor(target)) {
                return;
            }
        }
        this.slaEvent(handler, event);
    }
    onNativeSelectionChange(event) {
        if (this.readOnly) {
            return;
        }
        const window = getWindow(event.target);
        const { activeElement } = window.document;
        debug$3.update('onNativeSelectionChange', {
            anchorOffset: window.getSelection().anchorOffset
        });
        if (activeElement !== this.rootNode) {
            return;
        }
        this.slaEvent('onSelect', event);
    }
    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }
    /**
     * Update the native DOM selection to reflect the internal model.
     */
    updateSelection() {
        const { value } = this.editor;
        const { selection } = value;
        const { isBackward } = selection;
        const window = getWindow(this.rootNode);
        const native = window.getSelection();
        const { activeElement } = window.document;
        if (debug$3.update.enabled) {
            debug$3.update('updateSelection', { selection: selection.toJSON() });
        }
        // COMPAT: In Firefox, there's a but where `getSelection` can return `null`.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=827585 (2018/11/07)
        if (!native) {
            return;
        }
        const { rangeCount, anchorNode } = native;
        let updated = false;
        // If the Slate selection is blurred, but the DOM's active element is still
        // the editor, we need to blur it.
        if (selection.isBlurred && activeElement === this.rootNode) {
            this.rootNode.blur();
            updated = true;
        }
        // If the Slate selection is unset, but the DOM selection has a range
        // selected in the editor, we need to remove the range.
        if (selection.isUnset && rangeCount && this.isInEditor(anchorNode)) {
            // removeAllRanges(native);
            updated = true;
        }
        // If the Slate selection is focused, but the DOM's active element is not
        // the editor, we need to focus it. We prevent scrolling because we handle
        // scrolling to the correct selection.
        if (selection.isFocused && activeElement !== this.rootNode) {
            this.rootNode.focus({ preventScroll: true });
            updated = true;
        }
        // Otherwise, figure out which DOM nodes should be selected...
        if (selection.isFocused && selection.isSet) {
            const current = !!native.rangeCount && native.getRangeAt(0);
            const range = this.editor.findDOMRange(selection);
            if (!range) {
                warning(false, 'Unable to find a native DOM range from the current selection.');
                return;
            }
            const { startContainer, startOffset, endContainer, endOffset } = range;
            // If the new range matches the current selection, there is nothing to fix.
            // COMPAT: The native `Range` object always has it's "start" first and "end"
            // last in the DOM. It has no concept of "backwards/forwards", so we have
            // to check both orientations here. (2017/10/31)
            if (current) {
                if ((startContainer === current.startContainer &&
                    startOffset === current.startOffset &&
                    endContainer === current.endContainer &&
                    endOffset === current.endOffset) ||
                    (startContainer === current.endContainer &&
                        startOffset === current.endOffset &&
                        endContainer === current.startContainer &&
                        endOffset === current.startOffset)) {
                    return;
                }
            }
            // Otherwise, set the `isUpdatingSelection` flag and update the selection.
            updated = true;
            this.tmp.isUpdatingSelection = true;
            // removeAllRanges(native);
            // COMPAT: IE 11 does not support `setBaseAndExtent`. (2018/11/07)
            if (native.setBaseAndExtent) {
                // COMPAT: Since the DOM range has no concept of backwards/forwards
                // we need to check and do the right thing here.
                if (isBackward) {
                    native.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);
                }
                else {
                    native.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
                }
            }
            else {
                native.addRange(range);
            }
            debug$3.track('track end : updateSelection');
            // Scroll to the selection, in case it's out of view.
            scrollToSelection(native);
            // // Then unset the `isUpdatingSelection` flag after a delay.
            setTimeout(() => {
                // COMPAT: In Firefox, it's not enough to create a range, you also need
                // to focus the contenteditable element too. (2016/11/16)
                if (IS_FIREFOX && this.rootNode) {
                    this.rootNode.focus();
                }
                this.tmp.isUpdatingSelection = false;
                debug$3.update('updateSelection:setTimeout', {
                    anchorOffset: window.getSelection().anchorOffset
                });
            });
            if (updated && (debug$3.enabled || debug$3.update.enabled)) {
                debug$3('updateSelection', { selection, native, activeElement });
                debug$3.update('updateSelection:applied', {
                    selection: selection.toJSON(),
                    native: {
                        anchorOffset: native.anchorOffset,
                        focusOffset: native.focusOffset
                    }
                });
            }
        }
    }
    isInEditor(target) {
        let el;
        try {
            // COMPAT: Text nodes don't have `isContentEditable` property. So, when
            // `target` is a text node use its parent node for check.
            el = target.nodeType === 3 ? target.parentNode : target;
        }
        catch (err) {
            // COMPAT: In Firefox, `target.nodeType` will throw an error if target is
            // originating from an internal "restricted" element (e.g. a stepper
            // arrow on a number input)
            // see github.com/ianstormtaylor/slate/issues/1819
            if (IS_FIREFOX && FIREFOX_NODE_TYPE_ACCESS_ERROR.test(err.message)) {
                return false;
            }
            throw err;
        }
        return el.isContentEditable && (el === this.rootNode || el.closest(SELECTORS.EDITOR) === this.rootNode);
    }
    ngAfterViewChecked() {
        if (this.isUpdateSelection) {
            this.isUpdateSelection = false;
            this.ngZone.runOutsideAngular(() => {
                this.updateSelection();
            });
        }
    }
}
SlaContentComponent.decorators = [
    { type: Component, args: [{
                selector: 'sla-content,[slaContent]',
                template: "<sla-node\n    [editor]=\"editor\"\n    [node]=\"editorData.document\"\n    [selection]=\"editorData.selection\"\n    [readOnly]=\"readOnly\"\n></sla-node>\n",
                changeDetection: ChangeDetectionStrategy.OnPush
            }] }
];
/** @nocollapse */
SlaContentComponent.ctorParameters = () => [
    { type: NgZone },
    { type: ElementRef },
    { type: ChangeDetectorRef },
    { type: SlaEventService }
];
SlaContentComponent.propDecorators = {
    nodeRef: [{ type: ViewChild, args: [SlaNodeComponent, { static: true },] }],
    readOnly: [{ type: Input }],
    slaValue: [{ type: Input }],
    editor: [{ type: Input }],
    slaEvent: [{ type: Input }]
};

class Rendering {
    constructor(slaPluginRenderService) {
        this.slaPluginRenderService = slaPluginRenderService;
        this.renderBlock = (config) => {
            return this.slaPluginRenderService.renderDom('div', config.children, config.attributes, { position: 'relative' });
        };
        this.renderDocument = (config) => {
            return this.slaPluginRenderService.renderDom('div', config.children, config.attributes);
        };
        this.renderInline = (config) => {
            return this.slaPluginRenderService.renderDom('span', config.children, config.attributes);
        };
    }
}
Rendering.decorators = [
    { type: Injectable }
];
/** @nocollapse */
Rendering.ctorParameters = () => [
    { type: SlaPluginRenderService }
];

class SlaEditorComponent {
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

/**
 * Offset key parser regex.
 *
 * @type {RegExp}
 */
const PARSER = /^([\w-]+)(?::(\d+))?$/;
/**
 * Parse an offset key `string`.
 *
 * @param {String} string
 * @return {Object}
 */
function parse(value) {
    const matches = PARSER.exec(value);
    if (!matches) {
        throw new Error(`Invalid offset key string "${value}".`);
    }
    const [original, key, index] = matches; // eslint-disable-line no-unused-vars
    return {
        key,
        index: parseInt(index, 10)
    };
}
/**
 * Stringify an offset key `object`.
 *
 * @param {Object} object
 *   @property {String} key
 *   @property {Number} index
 * @return {String}
 */
function stringify(object) {
    return `${object.key}:${object.index}`;
}
/**
 * Export.
 *
 * @type {Object}
 */
var OffsetKey = {
    parse,
    stringify
};

const debug$4 = Debug('slate:text');
debug$4.check = Debug('slate:docheck');
const textBinding = {
    provide: ChildNodeBase,
    useExisting: forwardRef(() => SlaTextComponent)
};
class SlaTextComponent extends ChildNodeBase {
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
        debug$4('set: slaTextNode', value.toJSON());
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
        debug$4('ngOnInit');
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
        debug$4.check('check text', this.node);
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

class SlaEditorModule {
    constructor() { }
}
SlaEditorModule.decorators = [
    { type: NgModule, args: [{
                declarations: [SlaEditorComponent, SlaContentComponent, SlaNodeComponent, SlaVoidComponent, SlaTextComponent],
                imports: [BrowserModule, PortalModule],
                exports: [SlaEditorComponent, SlaContentComponent, SlaNodeComponent, SlaTextComponent, SlaVoidComponent],
                entryComponents: [SlaTextComponent, SlaVoidComponent],
                providers: [Rendering]
            },] }
];
/** @nocollapse */
SlaEditorModule.ctorParameters = () => [];

class ValueChange {
}

class SlaPluginComponentBase {
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    initPluginComponent() {
        this.insertChildrenView();
        this.setNodeAttributes(this.elementRef.nativeElement, this.attributes);
    }
    getData(key) {
        return this.node.data.get(key);
    }
    isNodeChange(changes) {
        const node = changes.node;
        if (node && !node.isFirstChange) {
            return true;
        }
        return false;
    }
    updateHostClass(classMap) {
        for (const key in classMap) {
            if (classMap.hasOwnProperty(key)) {
                const value = classMap[key];
                const classList = this.elementRef.nativeElement.classList;
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
    }
    setNodeAttributes(ele, attributes) {
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                ele.setAttribute(key, attributes[key]);
            }
        }
    }
    insertChildrenView() {
        if (this.childrenContent) {
            const nodeRefs = this.children.toArray();
            for (const nodeRef of nodeRefs) {
                this.childrenContent.nativeElement.appendChild(nodeRef.rootNode);
            }
        }
    }
    removeNode(event) {
        event.preventDefault();
        const path = this.editor.value.document.getPath(this.node.key);
        let focusNode = this.editor.value.document.getPreviousBlock(path);
        if (!focusNode) {
            focusNode = this.editor.value.document.getNextBlock(path);
        }
        this.editor.focus().moveToEndOfNode(focusNode);
        this.editor.removeNodeByKey(this.node.key);
    }
}
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

function findDOMNode(key, win = window) {
    warning(false, 'As of slate-react@0.22 the `findDOMNode(key)` helper is deprecated in favor of `editor.findDOMNode(path)`.');
    if (Node.isNode(key)) {
        key = key.key;
    }
    const el = win.document.querySelector(`[${DATA_ATTRS.KEY}="${key}"]`);
    if (!el) {
        throw new Error(`Unable to find a DOM node for "${key}". This is often because of forgetting to add \`props.attributes\` to a custom component.`);
    }
    return el;
}

/*
 * Public API Surface of ngx-slate-angular
 */

/**
 * Generated bundle index. Do not edit.
 */

export { SlaContentComponent as ɵb, SlaEditorComponent as ɵa, SlaNodeComponent as ɵd, nodeBinding as ɵc, SlaTextComponent as ɵk, textBinding as ɵj, SlaVoidComponent as ɵi, ChildNodeBase as ɵe, SlaEventService as ɵg, SlaPluginRenderService as ɵf, Rendering as ɵh, SlaEditorComponent, SlaContentComponent, nodeBinding, SlaNodeComponent, textBinding, SlaTextComponent, SlaVoidComponent, SlaEditorModule, ValueChange, SlaLeafRenderConfig, SlaNodeRenderConfig, SlaNestedNodeRef, SlaPluginRenderService, SlaPluginComponentBase, SlaEventService, cloneFragment, findDOMNode, getEventTransfer };

//# sourceMappingURL=ngx-slate-core.js.map