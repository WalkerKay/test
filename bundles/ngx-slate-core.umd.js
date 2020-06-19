(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('slate-plain-serializer'), require('slate-base64-serializer'), require('@angular/cdk/keycodes'), require('slate-hotkeys'), require('get-window'), require('slate-dev-environment'), require('slate'), require('rxjs'), require('rxjs/operators'), require('debug'), require('@angular/platform-browser'), require('@angular/cdk/portal'), require('@angular/core'), require('tiny-warning')) :
    typeof define === 'function' && define.amd ? define('@ngx-slate/core', ['exports', 'slate-plain-serializer', 'slate-base64-serializer', '@angular/cdk/keycodes', 'slate-hotkeys', 'get-window', 'slate-dev-environment', 'slate', 'rxjs', 'rxjs/operators', 'debug', '@angular/platform-browser', '@angular/cdk/portal', '@angular/core', 'tiny-warning'], factory) :
    (factory((global['ngx-slate'] = global['ngx-slate'] || {}, global['ngx-slate'].core = {}),global.Plain,global.Base64,global.ng.cdk.keycodes,global.Hotkeys,global.getWindow,global.slateDevEnvironment,global.slate,global.rxjs,global.rxjs.operators,global.Debug,global.ng.platformBrowser,global.ng.cdk.portal,global.ng.core,global.warning));
}(this, (function (exports,Plain,Base64,keycodes,Hotkeys,getWindow,slateDevEnvironment,slate,rxjs,operators,Debug,platformBrowser,portal,i0,warning) { 'use strict';

    Plain = Plain && Plain.hasOwnProperty('default') ? Plain['default'] : Plain;
    Base64 = Base64 && Base64.hasOwnProperty('default') ? Base64['default'] : Base64;
    Hotkeys = Hotkeys && Hotkeys.hasOwnProperty('default') ? Hotkeys['default'] : Hotkeys;
    getWindow = getWindow && getWindow.hasOwnProperty('default') ? getWindow['default'] : getWindow;
    Debug = Debug && Debug.hasOwnProperty('default') ? Debug['default'] : Debug;
    warning = warning && warning.hasOwnProperty('default') ? warning['default'] : warning;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (b.hasOwnProperty(p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var EVENT_HANDLERS = [
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
    var NGX_SLATE_EVENTS = [
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

    var PROPS = __spread(EVENT_HANDLERS, [
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
    ]);
    function EditorPropsPlugin(options) {
        if (options === void 0) {
            options = {};
        }
        var plugin = PROPS.reduce(function (memo, prop) {
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
        if (slateDevEnvironment.IS_IE) {
            var range = window.document.body.createTextRange();
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
        BLOCK: "[" + DATA_ATTRS.OBJECT + "=\"block\"]",
        EDITOR: "[" + DATA_ATTRS.EDITOR + "]",
        INLINE: "[" + DATA_ATTRS.OBJECT + "=\"inline\"]",
        KEY: "[" + DATA_ATTRS.KEY + "]",
        LEAF: "[" + DATA_ATTRS.LEAF + "]",
        OBJECT: "[" + DATA_ATTRS.OBJECT + "]",
        STRING: "[" + DATA_ATTRS.STRING + "]",
        TEXT: "[" + DATA_ATTRS.OBJECT + "=\"text\"]",
        VOID: "[" + DATA_ATTRS.VOID + "]",
        ZERO_WIDTH: "[" + DATA_ATTRS.ZERO_WIDTH + "]",
        SKIP_EVENT: "[" + DATA_ATTRS.SKIP_EVENT + "]"
    };

    var FRAGMENT = TRANSFER_TYPES.FRAGMENT, HTML = TRANSFER_TYPES.HTML, TEXT = TRANSFER_TYPES.TEXT;
    function cloneFragment(event, editor, callback) {
        if (callback === void 0) {
            callback = function () { return undefined; };
        }
        var window = getWindow(event.target);
        var native = window.getSelection();
        var value = editor.value;
        var document = value.document, fragment = value.fragment, selection = value.selection;
        var start = selection.start, end = selection.end;
        var startVoid = document.getClosestVoid(start.path, editor);
        var endVoid = document.getClosestVoid(end.path, editor);
        // If the selection is collapsed, and it isn't inside a void node, abort.
        if (native.isCollapsed && !startVoid) {
            return;
        }
        // Create a fake selection so that we can add a Base64-encoded copy of the
        // fragment to the HTML, to decode on future pastes.
        var encoded = Base64.serializeNode(fragment);
        var range = native.getRangeAt(0);
        var contents = range.cloneContents();
        var attach = contents.childNodes[0];
        // Make sure attach is a non-empty node, since empty nodes will not get copied
        contents.childNodes.forEach(function (node) {
            if (node.textContent && node.textContent.trim() !== '') {
                attach = node;
            }
        });
        // COMPAT: If the end node is a void node, we need to move the end of the
        // range from the void node's spacer span, to the end of the void node's
        // content, since the spacer is before void's content in the DOM.
        if (endVoid) {
            var r = range.cloneRange();
            var node = editor.findDOMNode(document.getPath(endVoid));
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
        [].slice.call(contents.querySelectorAll(SELECTORS.ZERO_WIDTH)).forEach(function (zw) {
            var isNewline = zw.getAttribute(DATA_ATTRS.ZERO_WIDTH) === 'n';
            zw.textContent = isNewline ? '\n' : '';
        });
        // Set a `data-slate-fragment` attribute on a non-empty node, so it shows up
        // in the HTML, and can be used for intra-Slate pasting. If it's a text
        // node, wrap it in a `<span>` so we have something to set an attribute on.
        if (attach.nodeType === 3) {
            var span = window.document.createElement('span');
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
        var valFromSelection = slate.Value.create({ document: fragment });
        var plainText = Plain.serialize(valFromSelection);
        // Add the phony content to a div element. This is needed to copy the
        // contents into the html clipboard register.
        var div = window.document.createElement('div');
        div.appendChild(contents);
        // For browsers supporting it, we set the clipboard registers manually,
        // since the result is more predictable.
        // COMPAT: IE supports the setData method, but only in restricted sense.
        // IE doesn't support arbitrary MIME types or common ones like 'text/plain';
        // it only accepts "Text" (which gets mapped to 'text/plain') and "Url"
        // (mapped to 'text/url-list'); so, we should only enter block if !IS_IE
        if (event.clipboardData && event.clipboardData.setData && !slateDevEnvironment.IS_IE) {
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
        var editorEl = event.target.closest(SELECTORS.EDITOR);
        div.setAttribute('contenteditable', true);
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        editorEl.appendChild(div);
        native.selectAllChildren(div);
        // Revert to the previous selection right after copying.
        window.requestAnimationFrame(function () {
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
    var FRAGMENT$1 = TRANSFER_TYPES.FRAGMENT, HTML$1 = TRANSFER_TYPES.HTML, NODE = TRANSFER_TYPES.NODE, RICH = TRANSFER_TYPES.RICH, TEXT$1 = TRANSFER_TYPES.TEXT;
    /**
     * Fragment matching regexp for HTML nodes.
     *
     * @type {RegExp}
     */
    var FRAGMENT_MATCHER = / data-slate-fragment="([^\s"]+)"/;
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
        if (!slateDevEnvironment.IS_IE && event.nativeEvent) {
            event = event.nativeEvent;
        }
        var transfer = event.dataTransfer || event.clipboardData;
        var fragment = getType(transfer, FRAGMENT$1);
        var node = getType(transfer, NODE);
        var html = getType(transfer, HTML$1);
        var rich = getType(transfer, RICH);
        var text = getType(transfer, TEXT$1);
        var files;
        // If there isn't a fragment, but there is HTML, check to see if the HTML is
        // actually an encoded fragment.
        // tslint:disable-next-line:no-bitwise
        if (!fragment && html && ~html.indexOf(" " + DATA_ATTRS.FRAGMENT + "=\"")) {
            var matches = FRAGMENT_MATCHER.exec(html);
            var _a = __read(matches, 2), full = _a[0], encoded = _a[1]; // eslint-disable-line no-unused-vars
            if (encoded) {
                fragment = encoded;
            }
        }
        // COMPAT: Edge doesn't handle custom data types
        // These will be embedded in text/plain in this case (2017/7/12)
        if (text) {
            var embeddedTypes = getEmbeddedTypes(text);
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
                    .map(function (item) { return (item.kind === 'file' ? item.getAsFile() : null); })
                    .filter(function (exists) { return exists; });
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
        var data = { files: files, fragment: fragment, html: html, node: node, rich: rich, text: text };
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
        var prefix = 'SLATE-DATA-EMBED::';
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
        var types = Array.from(transfer.types);
        return types.indexOf(type) !== -1 ? transfer.getData(type) || null : null;
    }

    /**
     * The default plain text transfer type.
     *
     * @type {String}
     */
    var TEXT$2 = TRANSFER_TYPES.TEXT;
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
        var mime = TRANSFER_TYPES[type.toUpperCase()];
        if (!mime) {
            throw new Error("Cannot set unknown transfer type \"" + mime + "\".");
        }
        if (event.nativeEvent) {
            event = event.nativeEvent;
        }
        var transfer = event.dataTransfer || event.clipboardData;
        try {
            transfer.setData(mime, content);
            // COMPAT: Safari needs to have the 'text' (and not 'text/plain') value in dataTransfer
            // to display the cursor while dragging internally.
            transfer.setData('text', transfer.getData('text'));
        }
        catch (err) {
            var prefix = 'SLATE-DATA-EMBED::';
            var text = transfer.getData(TEXT$2);
            var obj = {};
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
            var stringData = "" + prefix + JSON.stringify(obj);
            transfer.setData(TEXT$2, stringData);
        }
    }

    var TAB_SPACE = '    ';
    /**
     * Debug.
     *
     * @type {Function}
     */
    var debug = Debug('slate:after');
    debug.beforeInput = Debug('slate:after-before-input');
    var AfterPlugin = /** @class */ (function () {
        function AfterPlugin() {
        }
        /**
         * On before input.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onBeforeInput = function (event, editor, next) {
            var value = editor.value;
            var isSynthetic = !!event.nativeEvent;
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
                debug.beforeInput('onBeforeInput', { event: event });
                // cancel preventDefault, prevent emit native selectionchange to move focus next component
                if (editor.value.anchorText.text === '') {
                    setTimeout(function () {
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
            var _a = __read(event.getTargetRanges(), 1), targetRange = _a[0];
            if (!targetRange) {
                return next();
            }
            debug('onBeforeInput', { event: event });
            event.preventDefault();
            var document = value.document, selection = value.selection;
            var range = editor.findRange(targetRange);
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
                    var hasVoidParent = document.hasVoidParent(selection.start.path, editor);
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
                    var text = event.data == null
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
        };
        /**
         * On blur.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onBlur = function (event, editor, next) {
            debug('onBlur', { event: event });
            editor.blur();
            next();
        };
        /**
         * On click.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onClick = function (event, editor, next) {
            if (editor.readOnly)
                return next();
            var value = editor.value;
            var document = value.document;
            var path = editor.findPath(event.target);
            if (!path)
                return next();
            debug('onClick', { event: event });
            var node = document.getNode(path);
            var ancestors = document.getAncestors(path);
            var isVoid = node &&
                (editor.isVoid(node) || ancestors.some(function (a) { return editor.isVoid(a); }));
            if (isVoid) {
                // COMPAT: In Chrome & Safari, selections that are at the zero offset of
                // an inline node will be automatically replaced to be at the last offset
                // of a previous inline node, which screws us up, so we always want to set
                // it to the end of the node. (2016/11/29)
                editor.focus().moveToEndOfNode(node);
            }
            next();
        };
        /**
         * On copy.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onCopy = function (event, editor, next) {
            debug('onCopy', { event: event });
            cloneFragment(event, editor);
            next();
        };
        /**
         * On cut.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onCut = function (event, editor, next) {
            debug('onCut', { event: event });
            // Once the fake cut content has successfully been added to the clipboard,
            // delete the content in the current selection.
            cloneFragment(event, editor, function () {
                var e_1, _a;
                // If user cuts a void block node or a void inline node,
                // manually removes it since selection is collapsed in this case.
                var value = editor.value;
                var document = value.document, selection = value.selection;
                var end = selection.end, isCollapsed = selection.isCollapsed;
                var voidPath;
                if (isCollapsed) {
                    try {
                        for (var _b = __values(document.ancestors(end.path)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var _d = __read(_c.value, 2), node = _d[0], path = _d[1];
                            if (editor.isVoid(node)) {
                                voidPath = path;
                                break;
                            }
                        }
                    }
                    catch (e_1_1) {
                        e_1 = { error: e_1_1 };
                    }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return))
                                _a.call(_b);
                        }
                        finally {
                            if (e_1)
                                throw e_1.error;
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
        };
        /**
         * On drag end.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onDragEnd = function (event, editor, next) {
            debug('onDragEnd', { event: event });
            AfterPlugin.isDraggingInternally = null;
            next();
        };
        /**
         * On drag start.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onDragStart = function (event, editor, next) {
            debug('onDragStart', { event: event });
            AfterPlugin.isDraggingInternally = true;
            var value = editor.value;
            var document = value.document;
            var path = editor.findPath(event.target);
            var node = document.getNode(path);
            var ancestors = document.getAncestors(path);
            var isVoid = node &&
                (editor.isVoid(node) || ancestors.some(function (a) { return editor.isVoid(a); }));
            var selectionIncludesNode = value.blocks.some(function (block) { return block === node; });
            // If a void block is dragged and is not selected, select it (necessary for local drags).
            if (isVoid && !selectionIncludesNode) {
                editor.moveToRangeOfNode(node);
            }
            var fragment = editor.value.fragment;
            var encoded = Base64.serializeNode(fragment);
            setEventTransfer(event, 'fragment', encoded);
            next();
        };
        /**
         * On drop.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onDrop = function (event, editor, next) {
            var _a;
            var value = editor.value;
            var document = value.document, selection = value.selection;
            var window = getWindow(event.target);
            var target = editor.findEventRange(event);
            if (!target) {
                return next();
            }
            debug('onDrop', { event: event });
            var transfer = getEventTransfer(event);
            var type = transfer.type, fragment = transfer.fragment, text = transfer.text;
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
                var anchor = target.anchor;
                var hasVoidParent = document.hasVoidParent(anchor.path, editor);
                if (hasVoidParent) {
                    var p = anchor.path;
                    var n = document.getNode(anchor.path);
                    while (hasVoidParent) {
                        var _b = __read(document.texts({ path: p }), 1), nxt = _b[0];
                        if (!nxt) {
                            break;
                        }
                        _a = __read(nxt, 2), n = _a[0], p = _a[1];
                        hasVoidParent = document.hasVoidParent(p, editor);
                    }
                    if (n)
                        editor.moveToStartOfNode(n);
                }
                if (text) {
                    text.split('\n').forEach(function (line, i) {
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
            var el = editor.findDOMNode(target.focus.path);
            if (el) {
                el.dispatchEvent(new MouseEvent('mouseup', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                }));
            }
            next();
        };
        /**
         * On focus.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onFocus = function (event, editor, next) {
            debug('onFocus', { event: event });
            // COMPAT: If the focus event is a mouse-based one, it will be shortly
            // followed by a `selectionchange`, so we need to deselect here to prevent
            // the old selection from being set by the `updateSelection` of `<Content>`,
            // preventing the `selectionchange` from firing. (2018/11/07)
            if (AfterPlugin.isMouseDown && !slateDevEnvironment.IS_IE && !slateDevEnvironment.IS_EDGE) {
                editor.deselect().focus();
            }
            else {
                editor.focus();
            }
            next();
        };
        /**
         * On input.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onInput = function (event, editor, next) {
            debug('onInput');
            var window = getWindow(event.target);
            var domSelection = window.getSelection();
            var selection = editor.findSelection(domSelection);
            if (selection) {
                editor.select(selection);
            }
            else {
                editor.blur();
            }
            var anchorNode = domSelection.anchorNode;
            editor.reconcileDOMNode(anchorNode);
            next();
        };
        /**
         * On key down.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onKeyDown = function (event, editor, next) {
            debug('onKeyDown', { event: event });
            var value = editor.value;
            var document = value.document, selection = value.selection;
            var start = selection.start;
            var hasVoidParent = document.hasVoidParent(start.path, editor);
            // COMPAT: In iOS, some of these hotkeys are handled in the
            // `onNativeBeforeInput` handler of the `<Content>` component in order to
            // preserve native autocorrect behavior, so they shouldn't be handled here.
            if (Hotkeys.isSplitBlock(event) && !slateDevEnvironment.IS_IOS) {
                return hasVoidParent
                    ? editor.moveToStartOfNextText()
                    : editor.splitBlock();
            }
            if (Hotkeys.isDeleteBackward(event) && !slateDevEnvironment.IS_IOS) {
                return editor.deleteCharBackward();
            }
            if (Hotkeys.isDeleteForward(event) && !slateDevEnvironment.IS_IOS) {
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
                var startText = document.getNode(start.path);
                var _a = __read(document.texts({
                    path: start.path,
                    direction: 'backward'
                }), 1), prevEntry = _a[0];
                var isPrevInVoid = false;
                if (prevEntry) {
                    var _b = __read(prevEntry, 2), prevPath = _b[1];
                    isPrevInVoid = document.hasVoidParent(prevPath, editor);
                }
                if (hasVoidParent || isPrevInVoid || startText.text === '') {
                    event.preventDefault();
                    return editor.moveFocusBackward();
                }
            }
            if (Hotkeys.isExtendForward(event)) {
                var startText = document.getNode(start.path);
                var _c = __read(document.texts({ path: start.path }), 1), nextEntry = _c[0];
                var isNextInVoid = false;
                if (nextEntry) {
                    var _d = __read(nextEntry, 2), nextPath = _d[1];
                    isNextInVoid = document.hasVoidParent(nextPath, editor);
                }
                if (hasVoidParent || isNextInVoid || startText.text === '') {
                    event.preventDefault();
                    return editor.moveFocusForward();
                }
            }
            if (event.keyCode === keycodes.TAB) {
                event.preventDefault();
                return editor.insertText(TAB_SPACE);
            }
            next();
        };
        /**
         * On mouse down.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onMouseDown = function (event, editor, next) {
            debug('onMouseDown', { event: event });
            AfterPlugin.isMouseDown = true;
            next();
        };
        /**
         * On mouse up.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onMouseUp = function (event, editor, next) {
            debug('onMouseUp', { event: event });
            AfterPlugin.isMouseDown = false;
            next();
        };
        /**
         * On paste.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onPaste = function (event, editor, next) {
            debug('onPaste', { event: event });
            var value = editor.value;
            var transfer = getEventTransfer(event);
            var type = transfer.type, fragment = transfer.fragment, text = transfer.text;
            if (type === 'fragment') {
                editor.insertFragment(fragment);
            }
            if (type === 'text' || type === 'html') {
                if (!text)
                    return next();
                var document_1 = value.document, selection = value.selection, startBlock = value.startBlock;
                if (editor.isVoid(startBlock))
                    return next();
                var defaultBlock = startBlock;
                var defaultMarks = document_1.getInsertMarksAtRange(selection);
                var frag = Plain.deserialize(text, { defaultBlock: defaultBlock, defaultMarks: defaultMarks })
                    .document;
                editor.insertFragment(frag);
            }
            next();
        };
        /**
         * On select.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        AfterPlugin.onSelect = function (event, editor, next) {
            debug('onSelect', { event: event });
            var window = getWindow(event.target);
            var domSelection = window.getSelection();
            // slate-next fix select the range interrupted
            if (domSelection.rangeCount) {
                var range = editor.findRange(domSelection);
                if (range) {
                    var selection = editor.findSelection(domSelection);
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
        };
        AfterPlugin.isDraggingInternally = null;
        AfterPlugin.isMouseDown = false;
        return AfterPlugin;
    }());

    var debug$1 = Debug('slate:before');
    debug$1.track = Debug('slate:track');
    var BeforePlugin = /** @class */ (function () {
        function BeforePlugin() {
        }
        /**
         * On before input.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onBeforeInput = function (event, editor, next) {
            var isSynthetic = !!event.nativeEvent;
            if (editor.readOnly)
                return;
            // COMPAT: If the browser supports Input Events Level 2, we will have
            // attached a custom handler for the real `beforeinput` events, instead of
            // allowing React's synthetic polyfill, so we need to ignore synthetics.
            // if (isSynthetic && HAS_INPUT_EVENTS_LEVEL_2) return;
            debug$1('onBeforeInput', { event: event });
            next();
        };
        /**
         * On blur.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onBlur = function (event, editor, next) {
            if (BeforePlugin.isCopying)
                return;
            if (editor.readOnly)
                return;
            var relatedTarget = event.relatedTarget, target = event.target;
            var window = getWindow(target);
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
                var el = editor.findDOMNode([]);
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
                var node = editor.findNode(relatedTarget);
                if (el.contains(relatedTarget) && node && !editor.isVoid(node)) {
                    return;
                }
            }
            debug$1('onBlur', { event: event });
            next();
        };
        /**
         * On composition end.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onCompositionEnd = function (event, editor, next) {
            var n = BeforePlugin.compositionCount;
            // The `count` check here ensures that if another composition starts
            // before the timeout has closed out this one, we will abort unsetting the
            // `isComposing` flag, since a composition is still in affect.
            window.setTimeout(function () {
                if (BeforePlugin.compositionCount > n)
                    return;
                BeforePlugin.isComposing = false;
            }, 100);
            debug$1('onCompositionEnd', { event: event });
            next();
        };
        /**
         * On click.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onClick = function (event, editor, next) {
            debug$1('onClick', { event: event });
            next();
        };
        /**
         * On composition start.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onCompositionStart = function (event, editor, next) {
            BeforePlugin.isComposing = true;
            BeforePlugin.compositionCount++;
            var value = editor.value;
            var selection = value.selection;
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
            debug$1('onCompositionStart', { event: event });
            next();
        };
        /**
         * On copy.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onCopy = function (event, editor, next) {
            var window = getWindow(event.target);
            BeforePlugin.isCopying = true;
            window.requestAnimationFrame(function () { return (BeforePlugin.isCopying = false); });
            debug$1('onCopy', { event: event });
            next();
        };
        /**
         * On cut.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onCut = function (event, editor, next) {
            if (editor.readOnly)
                return;
            var window = getWindow(event.target);
            BeforePlugin.isCopying = true;
            window.requestAnimationFrame(function () { return (BeforePlugin.isCopying = false); });
            debug$1('onCut', { event: event });
            next();
        };
        /**
         * On drag end.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDragEnd = function (event, editor, next) {
            BeforePlugin.isDragging = false;
            debug$1('onDragEnd', { event: event });
            next();
        };
        /**
         * On drag enter.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDragEnter = function (event, editor, next) {
            debug$1('onDragEnter', { event: event });
            next();
        };
        /**
         * On drag exit.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDragExit = function (event, editor, next) {
            debug$1('onDragExit', { event: event });
            next();
        };
        /**
         * On drag leave.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDragLeave = function (event, editor, next) {
            debug$1('onDragLeave', { event: event });
            next();
        };
        /**
         * On drag over.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDragOver = function (event, editor, next) {
            // If the target is inside a void node, and only in this case,
            // call `preventDefault` to signal that drops are allowed.
            // When the target is editable, dropping is already allowed by
            // default, and calling `preventDefault` hides the cursor.
            var node = editor.findNode(event.target);
            if (!node || editor.isVoid(node)) {
                event.preventDefault();
            }
            // COMPAT: IE won't call onDrop on contentEditables unless the
            // default dragOver is prevented:
            // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/913982/
            // (2018/07/11)
            if (slateDevEnvironment.IS_IE) {
                event.preventDefault();
            }
            // If a drag is already in progress, don't do this again.
            if (!BeforePlugin.isDragging) {
                BeforePlugin.isDragging = true;
                // COMPAT: IE will raise an `unspecified error` if dropEffect is
                // set. (2018/07/11)
                if (!slateDevEnvironment.IS_IE) {
                    event.nativeEvent.dataTransfer.dropEffect = 'move';
                }
            }
            debug$1('onDragOver', { event: event });
            next();
        };
        /**
         * On drag start.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDragStart = function (event, editor, next) {
            BeforePlugin.isDragging = true;
            debug$1('onDragStart', { event: event });
            next();
        };
        /**
         * On drop.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onDrop = function (event, editor, next) {
            if (editor.readOnly)
                return;
            // Prevent default so the DOM's value isn't corrupted.
            event.preventDefault();
            debug$1('onDrop', { event: event });
            next();
        };
        /**
         * On focus.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onFocus = function (event, editor, next) {
            if (BeforePlugin.isCopying)
                return;
            if (editor.readOnly)
                return;
            var el = editor.findDOMNode([]);
            // Save the new `activeElement`.
            var window = getWindow(event.target);
            BeforePlugin.activeElement = window.document.activeElement;
            // COMPAT: If the editor has nested editable elements, the focus can go to
            // those elements. In Firefox, this must be prevented because it results in
            // issues with keyboard navigation. (2017/03/30)
            if (slateDevEnvironment.IS_FIREFOX && event.target !== el) {
                el.focus();
                return;
            }
            debug$1('onFocus', { event: event });
            next();
        };
        /**
         * On input.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onInput = function (event, editor, next) {
            if (BeforePlugin.isComposing)
                return;
            if (editor.value.selection.isBlurred)
                return;
            debug$1('onInput', { event: event });
            next();
        };
        /**
         * On key down.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onKeyDown = function (event, editor, next) {
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
            if (!slateDevEnvironment.IS_IOS &&
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
            debug$1('onKeyDown', { event: event });
            debug$1.track('track start : onKeyDown');
            next();
        };
        /**
         * On paste.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onPaste = function (event, editor, next) {
            if (editor.readOnly)
                return;
            // Prevent defaults so the DOM state isn't corrupted.
            event.preventDefault();
            debug$1('onPaste', { event: event });
            next();
        };
        /**
         * On select.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @param {Function} next
         */
        BeforePlugin.onSelect = function (event, editor, next) {
            if (BeforePlugin.isCopying)
                return;
            if (BeforePlugin.isComposing)
                return;
            if (editor.readOnly)
                return;
            // Save the new `activeElement`.
            var window = getWindow(event.target);
            BeforePlugin.activeElement = window.document.activeElement;
            debug$1('onSelect', { event: event });
            next();
        };
        BeforePlugin.activeElement = null;
        BeforePlugin.compositionCount = 0;
        BeforePlugin.isComposing = false;
        BeforePlugin.isCopying = false;
        BeforePlugin.isDragging = false;
        return BeforePlugin;
    }());

    function DOMPlugin(options) {
        if (options === void 0) {
            options = {};
        }
        var _a = options.plugins, plugins = _a === void 0 ? [] : _a;
        // COMPAT: Add Android specific handling separately before it gets to the
        // other plugins because it is specific (other browser don't need it) and
        // finicky (it has to come before other plugins to work).
        // const androidPlugins = IS_ANDROID
        //   ? [AndroidPlugin(options), NoopPlugin(options)]
        //   : [];
        return __spread([BeforePlugin], plugins, [AfterPlugin]);
    }

    var CommandsPlugin = /** @class */ (function () {
        function CommandsPlugin() {
        }
        CommandsPlugin.reconcileNode = function (editor, node) {
            var value = editor.value;
            var document = value.document, selection = value.selection;
            var path = document.getPath(node.key);
            var domElement = editor.findDOMNode(path);
            var block = document.getClosestBlock(path);
            // Get text information
            var text = node.text;
            var domText = domElement.textContent;
            var isLastNode = block.nodes.last() === node;
            var lastChar = domText.charAt(domText.length - 1);
            // COMPAT: If this is the last leaf, and the DOM text ends in a new line,
            // we will have added another new line in <Leaf>'s render method to account
            // for browsers collapsing a single trailing new lines, so remove it.
            if (isLastNode && lastChar === '\n') {
                domText = domText.slice(0, -1);
            }
            // If the text is no different, abort.
            if (text === domText)
                return;
            var entire = selection.moveAnchorTo(path, 0).moveFocusTo(path, text.length);
            entire = document.resolveRange(entire);
            // Change the current value to have the leaf's text replaced.
            editor.insertTextAtRange(entire, domText, node.marks);
            return;
        };
        CommandsPlugin.reconcileDOMNode = function (editor, domNode) {
            var domElement = domNode.parentElement.closest('[data-key]');
            var node = editor.findNode(domElement);
            editor.reconcileNode(node);
        };
        // slate origin remove mark method
        CommandsPlugin.removeMarkOrigin = function (editor, mark) {
            var value = editor.value;
            var document = value.document, selection = value.selection, anchorText = value.anchorText;
            if (selection.isExpanded) {
                editor.removeMarkAtRange(selection, mark);
            }
            else if (selection.marks) {
                var marks = selection.marks.remove(mark);
                var sel = selection.set('marks', marks);
                editor.select(sel);
            }
            else {
                var marks = document.getActiveMarksAtRange(selection).remove(mark);
                var sel = selection.set('marks', marks);
                editor.select(sel);
            }
        };
        CommandsPlugin.removeMark = function (editor, mark) {
            var value = editor.value;
            var document = value.document, selection = value.selection, anchorText = value.anchorText;
            if (selection.isExpanded) {
                editor.removeMarkAtRange(selection, mark);
            }
            else if (selection.marks) {
                var marks = selection.marks.remove(mark);
                var sel = selection.set('marks', marks);
                editor.select(sel);
            }
            else {
                var marks = document.getActiveMarksAtRange(selection).remove(mark);
                var sel = selection.set('marks', marks);
                editor.select(sel);
            }
            // The cursor position is still in mark when mark is cancelled
            if (selection.isCollapsed && anchorText.text === '\u200B') {
                editor.removeMarkByPath(selection.start.path, 0, 1, mark);
            }
            if (selection.isCollapsed && anchorText.text !== '\u200B' && anchorText.text !== '') {
                editor.insertText('\u200B');
            }
        };
        CommandsPlugin.addMark = function (editor, mark) {
            var value = editor.value;
            var document = value.document, selection = value.selection, anchorText = value.anchorText;
            if (selection.isExpanded) {
                editor.addMarkAtRange(selection, mark);
            }
            else if (selection.marks) {
                var marks = selection.marks.add(mark);
                var sel = selection.set('marks', marks);
                editor.select(sel);
            }
            else {
                var marks = document.getActiveMarksAtRange(selection).add(mark);
                var sel = selection.set('marks', marks);
                editor.select(sel);
            }
            // The cursor position is still in mark when mark is cancelled
            if (selection.isCollapsed && anchorText.text === '\u200B') {
                editor.addMarkByPath(selection.start.path, 0, 1, mark);
            }
            if (selection.isCollapsed && anchorText.text !== '\u200B' && anchorText.text !== '') {
                editor.insertText('\u200B');
            }
        };
        return CommandsPlugin;
    }());
    var CommandsPlugin$1 = {
        commands: CommandsPlugin
    };

    var QueriesPlugin = /** @class */ (function () {
        function QueriesPlugin() {
        }
        /**
         * Find the native DOM element for a node at `path`.
         *
         * @param {Editor} editor
         * @param {Array|List} path
         * @return {DOMNode|Null}
         */
        QueriesPlugin.findDOMNode = function (editor, path) {
            path = slate.PathUtils.create(path);
            var contentRef = editor.tmp.contentRef;
            if (!contentRef) {
                return null;
            }
            if (!path.size) {
                return contentRef.rootNode || null;
            }
            var search = function (instance, p) {
                if (!instance) {
                    return null;
                }
                if (!p.size) {
                    return instance.rootNode || null;
                }
                var index = p.first();
                var rest = p.rest();
                var ref = instance.getNodeRef(index);
                return search(ref, rest);
            };
            var documentNodeRef = contentRef.nodeRef;
            var el = search(documentNodeRef, path);
            return el;
        };
        /**
         * Find a native DOM selection point from a Slate `point`.
         *
         * @param {Editor} editor
         * @param {Point} point
         * @return {Object|Null}
         */
        QueriesPlugin.findDOMPoint = function (editor, point) {
            var e_1, _a;
            var el = editor.findDOMNode(point.path);
            var start = 0;
            if (!el) {
                return null;
            }
            // For each leaf, we need to isolate its content, which means filtering to its
            // direct text and zero-width spans. (We have to filter out any other siblings
            // that may have been rendered alongside them.)
            var texts = Array.from(el.querySelectorAll(SELECTORS.STRING + ", " + SELECTORS.ZERO_WIDTH));
            try {
                for (var texts_1 = __values(texts), texts_1_1 = texts_1.next(); !texts_1_1.done; texts_1_1 = texts_1.next()) {
                    var text = texts_1_1.value;
                    var node = text.childNodes[0];
                    var domLength = node.textContent.length;
                    var slateLength = domLength;
                    if (text.hasAttribute(DATA_ATTRS.LENGTH)) {
                        slateLength = parseInt(text.getAttribute(DATA_ATTRS.LENGTH), 10);
                    }
                    var end = start + slateLength;
                    if (point.offset <= end) {
                        var offset = Math.min(domLength, Math.max(0, point.offset - start));
                        // adjust empty text selection, prevent delete comment of Angular when clear compsition input
                        if (offset === 0 && domLength === 1 && node.textContent === '\u200B') {
                            return { node: node, offset: offset + 1 };
                        }
                        return { node: node, offset: offset };
                    }
                    start = end;
                }
            }
            catch (e_1_1) {
                e_1 = { error: e_1_1 };
            }
            finally {
                try {
                    if (texts_1_1 && !texts_1_1.done && (_a = texts_1.return))
                        _a.call(texts_1);
                }
                finally {
                    if (e_1)
                        throw e_1.error;
                }
            }
            return null;
        };
        /**
         * Find a native DOM range from a Slate `range`.
         *
         * @param {Editor} editor
         * @param {Range} range
         * @return {DOMRange|Null}
         */
        QueriesPlugin.findDOMRange = function (editor, range) {
            var anchor = range.anchor, focus = range.focus, isBackward = range.isBackward, isCollapsed = range.isCollapsed;
            var domAnchor = editor.findDOMPoint(anchor);
            var domFocus = isCollapsed ? domAnchor : editor.findDOMPoint(focus);
            if (!domAnchor || !domFocus) {
                return null;
            }
            var window = getWindow(domAnchor.node);
            var r = window.document.createRange();
            var start = isBackward ? domFocus : domAnchor;
            var end = isBackward ? domAnchor : domFocus;
            r.setStart(start.node, start.offset);
            r.setEnd(end.node, end.offset);
            return r;
        };
        /**
         * Find a Slate node from a native DOM `element`.
         *
         * @param {Editor} editor
         * @param {Element} element
         * @return {List|Null}
         */
        QueriesPlugin.findNode = function (editor, element) {
            var path = editor.findPath(element);
            if (!path) {
                return null;
            }
            var value = editor.value;
            var document = value.document;
            var node = document.getNode(path);
            return node;
        };
        /**
         * Get the target range from a DOM `event`.
         *
         * @param {Event} event
         * @param {Editor} editor
         * @return {Range}
         */
        QueriesPlugin.findEventRange = function (editor, event) {
            if (event.nativeEvent) {
                event = event.nativeEvent;
            }
            var x = event.clientX, y = event.clientY, target = event.target;
            if (x == null || y == null)
                return null;
            var value = editor.value;
            var document = value.document;
            var path = editor.findPath(event.target);
            if (!path)
                return null;
            var node = document.getNode(path);
            // If the drop target is inside a void node, move it into either the next or
            // previous node, depending on which side the `x` and `y` coordinates are
            // closest to.
            if (editor.isVoid(node)) {
                var rect = target.getBoundingClientRect();
                var isPrevious = node.object === 'inline'
                    ? x - rect.left < rect.left + rect.width - x
                    : y - rect.top < rect.top + rect.height - y;
                var range = document.createRange();
                var move = isPrevious ? 'moveToEndOfNode' : 'moveToStartOfNode';
                var entry = document[isPrevious ? 'getPreviousText' : 'getNextText'](path);
                if (entry) {
                    return range[move](entry);
                }
                return null;
            }
            // Else resolve a range from the caret position where the drop occured.
            var window = getWindow(target);
            var native;
            // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
            if (window.document.caretRangeFromPoint) {
                native = window.document.caretRangeFromPoint(x, y);
            }
            else if (window.document.caretPositionFromPoint) {
                var position = window.document.caretPositionFromPoint(x, y);
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
            var retRange = editor.findRange(native);
            return retRange;
        };
        /**
         * Find the path of a native DOM `element` by searching React refs.
         *
         * @param {Editor} editor
         * @param {Element} element
         * @return {List|Null}
         */
        QueriesPlugin.findPath = function (editor, element) {
            var contentRef = editor.tmp.contentRef;
            var nodeElement = element;
            // If element does not have a key, it is likely a string or
            // mark, return the closest parent Node that can be looked up.
            if (!nodeElement.hasAttribute(DATA_ATTRS.KEY)) {
                nodeElement = nodeElement.closest(SELECTORS.KEY);
            }
            if (!nodeElement || !nodeElement.getAttribute(DATA_ATTRS.KEY)) {
                return null;
            }
            if (nodeElement === contentRef.rootNode) {
                return slate.PathUtils.create([]);
            }
            var search = function (instance, p) {
                var e_2, _a;
                if (nodeElement === instance.rootNode) {
                    return p;
                }
                if (!instance.nodeRefs) {
                    return null;
                }
                var nodeRefs = instance.nodeRefs;
                var i = 0;
                try {
                    for (var nodeRefs_1 = __values(nodeRefs), nodeRefs_1_1 = nodeRefs_1.next(); !nodeRefs_1_1.done; nodeRefs_1_1 = nodeRefs_1.next()) {
                        var nodeRef = nodeRefs_1_1.value;
                        var retPath = search(nodeRef, __spread(p, [i]));
                        i++;
                        if (retPath) {
                            return retPath;
                        }
                    }
                }
                catch (e_2_1) {
                    e_2 = { error: e_2_1 };
                }
                finally {
                    try {
                        if (nodeRefs_1_1 && !nodeRefs_1_1.done && (_a = nodeRefs_1.return))
                            _a.call(nodeRefs_1);
                    }
                    finally {
                        if (e_2)
                            throw e_2.error;
                    }
                }
                return null;
            };
            var documentNodeRef = contentRef.nodeRef;
            var path = search(documentNodeRef, []);
            if (!path) {
                return null;
            }
            return slate.PathUtils.create(path);
        };
        /**
         * Find a Slate point from a DOM selection's `nativeNode` and `nativeOffset`.
         *
         * @param {Editor} editor
         * @param {Element} nativeNode
         * @param {Number} nativeOffset
         * @return {Point}
         */
        QueriesPlugin.findPoint = function (editor, nativeNode, nativeOffset) {
            var _a = normalizeNodeAndOffset(nativeNode, nativeOffset), nearestNode = _a.node, nearestOffset = _a.offset;
            var window = getWindow(nativeNode);
            var parentNode = nearestNode.parentNode;
            var leafNode = parentNode.closest(SELECTORS.LEAF);
            var textNode;
            var offset;
            var node;
            // Calculate how far into the text node the `nearestNode` is, so that we can
            // determine what the offset relative to the text node is.
            if (leafNode) {
                textNode = leafNode.closest(SELECTORS.TEXT);
                var range = window.document.createRange();
                range.setStart(textNode, 0);
                range.setEnd(nearestNode, nearestOffset);
                var contents = range.cloneContents();
                var zeroWidths = contents.querySelectorAll(SELECTORS.ZERO_WIDTH);
                Array.from(zeroWidths).forEach(function (el) {
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
                var voidNode = parentNode.closest(SELECTORS.VOID);
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
            var path = editor.findPath(textNode);
            if (!path) {
                return null;
            }
            var value = editor.value;
            var document = value.document;
            var point = document.createPoint({ path: path, offset: offset });
            return point;
        };
        /**
         * Find a Slate range from a DOM range or selection.
         *
         * @param {Editor} editor
         * @param {Selection} domRange
         * @return {Range}
         */
        QueriesPlugin.findRange = function (editor, domRange) {
            var el = domRange.anchorNode || domRange.startContainer;
            if (!el) {
                return null;
            }
            var window = getWindow(el);
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
            var anchorNode = domRange.anchorNode, anchorOffset = domRange.anchorOffset, focusNode = domRange.focusNode, focusOffset = domRange.focusOffset, isCollapsed = domRange.isCollapsed;
            var value = editor.value;
            var anchor = editor.findPoint(anchorNode, anchorOffset);
            var focus = isCollapsed
                ? anchor
                : editor.findPoint(focusNode, focusOffset);
            if (!anchor || !focus) {
                return null;
            }
            var document = value.document;
            var range = document.createRange({
                anchor: anchor,
                focus: focus
            });
            return range;
        };
        /**
         * Find a Slate selection from a DOM selection.
         *
         * @param {Editor} editor
         * @param {Selection} domSelection
         * @return {Range}
         */
        QueriesPlugin.findSelection = function (editor, domSelection) {
            var value = editor.value;
            var document = value.document;
            // If there are no ranges, the editor was blurred natively.
            if (!domSelection.rangeCount) {
                return null;
            }
            // Otherwise, determine the Slate selection from the native one.
            var range = editor.findRange(domSelection);
            if (!range) {
                return null;
            }
            var anchor = range.anchor, focus = range.focus;
            var anchorText = document.getNode(anchor.path);
            var focusText = document.getNode(focus.path);
            var anchorInline = document.getClosestInline(anchor.path);
            var focusInline = document.getClosestInline(focus.path);
            var focusBlock = document.getClosestBlock(focus.path);
            var anchorBlock = document.getClosestBlock(anchor.path);
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
                var block = document.getClosestBlock(anchor.path);
                var depth = document.getDepth(block.key);
                var relativePath = slate.PathUtils.drop(anchor.path, depth);
                if (anchor.offset === anchorText.text.length) {
                    var _a = __read(block.texts({ path: relativePath }), 1), next = _a[0];
                    if (next) {
                        var _b = __read(next, 2), nextPath = _b[1];
                        var absolutePath = anchor.path
                            .slice(0, depth)
                            .concat(nextPath);
                        range = range.moveAnchorTo(absolutePath, 0);
                    }
                }
                else if (anchor.offset === 0) {
                    var _c = __read(block.texts({ path: relativePath, direction: 'backward' }), 1), previousText = _c[0];
                    if (previousText) {
                        var _d = __read(previousText, 2), previous = _d[0], previousPath = _d[1];
                        var absolutePath = anchor.path
                            .slice(0, depth)
                            .concat(previousPath);
                        range = range.moveAnchorTo(absolutePath, previous.text.length);
                    }
                }
            }
            if (focusInline &&
                !editor.isVoid(focusInline)) {
                var block = document.getClosestBlock(focus.path);
                var depth = document.getDepth(block.key);
                var relativePath = slate.PathUtils.drop(focus.path, depth);
                if (focus.offset === focusText.text.length) {
                    var _e = __read(block.texts({ path: relativePath }), 1), next = _e[0];
                    if (next) {
                        var _f = __read(next, 2), nextPath = _f[1];
                        var absolutePath = focus.path
                            .slice(0, depth)
                            .concat(nextPath);
                        range = range.moveFocusTo(absolutePath, 0);
                    }
                }
                else if (focus.offset === 0) {
                    var _g = __read(block.texts({ path: relativePath, direction: 'backward' }), 1), previousTextEntry = _g[0];
                    if (previousTextEntry) {
                        var _h = __read(previousTextEntry, 2), previous = _h[0], previousPath = _h[1];
                        var absolutePath = focus.path
                            .slice(0, depth)
                            .concat(previousPath);
                        range = range.moveFocusTo(absolutePath, previous.text.length);
                    }
                }
            }
            var selection = document.createSelection(range);
            // COMPAT: Ensure that the `isFocused` argument is set.
            selection = selection.setIsFocused(true);
            // COMPAT: Preserve the marks, since we have no way of knowing what the DOM
            // selection's marks were. They will be cleared automatically by the
            // `select` command if the selection moves.
            selection = selection.set('marks', value.selection.marks);
            return selection;
        };
        return QueriesPlugin;
    }());
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
            var isLast = offset === node.childNodes.length;
            var direction = isLast ? 'backward' : 'forward';
            var index = isLast ? offset - 1 : offset;
            node = getEditableChild(node, index, direction);
            // If the node has children, traverse until we have a leaf node. Leaf nodes
            // can be either text nodes, or other void DOM nodes.
            while (node.nodeType === 1 && node.childNodes.length) {
                var i = isLast ? node.childNodes.length - 1 : 0;
                node = getEditableChild(node, i, direction);
            }
            // Determine the new offset inside the text node.
            offset = isLast ? node.textContent.length : 0;
        }
        // Return the node and offset.
        return { node: node, offset: offset };
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
        var childNodes = parent.childNodes;
        var child = childNodes[index];
        var i = index;
        var triedForward = false;
        var triedBackward = false;
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
    function AngularPlugin(options) {
        if (options === void 0) {
            options = {};
        }
        var editorPropsPlugin = EditorPropsPlugin(options);
        var domPlugin = DOMPlugin(options);
        return [editorPropsPlugin, domPlugin, CommandsPlugin$1, QueriesPlugin$1];
    }

    /**
     * CSS overflow values that would cause scrolling.
     *
     * @type {Array}
     */
    var OVERFLOWS = ['auto', 'overlay', 'scroll'];
    /**
     * Detect whether we are running IOS version 11
     */
    var IS_IOS_11 = slateDevEnvironment.IS_IOS && !!window.navigator.userAgent.match(/os 11_/i);
    function isBackward(selection) {
        var startNode = selection.anchorNode;
        var startOffset = selection.anchorOffset;
        var endNode = selection.focusNode;
        var endOffset = selection.focusOffset;
        var position = startNode.compareDocumentPosition(endNode);
        return !(position === 4 /* Node.DOCUMENT_POSITION_FOLLOWING */ ||
            (position === 0 && startOffset < endOffset));
    }
    /**
     * Find the nearest parent with scrolling, or window.
     *
     * @param {el} Element
     */
    function findScrollContainer(el, window) {
        var parent = el.parentNode;
        var scroller;
        while (!scroller) {
            if (!parent.parentNode)
                break;
            var style = window.getComputedStyle(parent);
            var overflowY = style.overflowY;
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
        var window = getWindow(selection.anchorNode);
        var scroller = findScrollContainer(selection.anchorNode, window);
        var isWindow = scroller === window.document.body || scroller === window.document.documentElement;
        var backward = isBackward(selection);
        var range = selection.getRangeAt(0).cloneRange();
        range.collapse(backward);
        var cursorRect = range.getBoundingClientRect();
        // COMPAT: range.getBoundingClientRect() returns 0s in Safari when range is
        // collapsed. Expanding the range by 1 is a relatively effective workaround
        // for vertical scroll, although horizontal may be off by 1 character.
        // https://bugs.webkit.org/show_bug.cgi?id=138949
        // https://bugs.chromium.org/p/chromium/issues/detail?id=435438
        if (slateDevEnvironment.IS_SAFARI) {
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
        var width;
        var height;
        var yOffset;
        var xOffset;
        var scrollerTop = 0;
        var scrollerLeft = 0;
        var scrollerBordersY = 0;
        var scrollerBordersX = 0;
        var scrollerPaddingTop = 0;
        var scrollerPaddingBottom = 0;
        var scrollerPaddingLeft = 0;
        var scrollerPaddingRight = 0;
        if (isWindow) {
            var innerWidth_1 = window.innerWidth, innerHeight_1 = window.innerHeight, pageYOffset_1 = window.pageYOffset, pageXOffset_1 = window.pageXOffset;
            width = innerWidth_1;
            height = innerHeight_1;
            yOffset = pageYOffset_1;
            xOffset = pageXOffset_1;
        }
        else {
            var offsetWidth = scroller.offsetWidth, offsetHeight = scroller.offsetHeight, scrollTop = scroller.scrollTop, scrollLeft = scroller.scrollLeft;
            var _a = window.getComputedStyle(scroller), borderTopWidth = _a.borderTopWidth, borderBottomWidth = _a.borderBottomWidth, borderLeftWidth = _a.borderLeftWidth, borderRightWidth = _a.borderRightWidth, paddingTop = _a.paddingTop, paddingBottom = _a.paddingBottom, paddingLeft = _a.paddingLeft, paddingRight = _a.paddingRight;
            var scrollerRect = scroller.getBoundingClientRect();
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
        var cursorTop = cursorRect.top + yOffset - scrollerTop;
        var cursorLeft = cursorRect.left + xOffset - scrollerLeft;
        var x = xOffset;
        var y = yOffset;
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
    var canUseDOM = !!(typeof window !== 'undefined' &&
        typeof window.document !== 'undefined' &&
        typeof window.document.createElement !== 'undefined');

    var TOP_BLUR = 'blur';
    var TOP_COMPOSITION_END = 'compositionend';
    var TOP_KEY_DOWN = 'keydown';
    var TOP_KEY_PRESS = 'keypress';
    var TOP_KEY_UP = 'keyup';
    var TOP_MOUSE_DOWN = 'mousedown';
    var TOP_TEXT_INPUT = 'textInput';
    var TOP_PASTE = 'paste';

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
    var root = null;
    var startText = null;
    var fallbackText = null;
    function reset() {
        root = null;
        startText = null;
        fallbackText = null;
    }
    function getData() {
        if (fallbackText) {
            return fallbackText;
        }
        var start;
        var startValue = startText;
        var startLength = startValue.length;
        var end;
        var endValue = getText();
        var endLength = endValue.length;
        for (start = 0; start < startLength; start++) {
            if (startValue[start] !== endValue[start]) {
                break;
            }
        }
        var minEnd = startLength - start;
        for (end = 1; end <= minEnd; end++) {
            if (startValue[startLength - end] !== endValue[endLength - end]) {
                break;
            }
        }
        var sliceTail = end > 1 ? 1 - end : undefined;
        fallbackText = endValue.slice(start, sliceTail);
        return fallbackText;
    }
    function getText() {
        if ('value' in root) {
            return root.value;
        }
        return root.textContent;
    }

    var BeforeInputEvent = /** @class */ (function () {
        function BeforeInputEvent() {
            this.data = null;
        }
        return BeforeInputEvent;
    }());

    /**
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    // import SyntheticCompositionEvent from './SyntheticCompositionEvent';
    // import SyntheticInputEvent from './SyntheticInputEvent';
    var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
    var START_KEYCODE = 229;
    var HAS_TEXT_INPUT = false;
    var canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;
    var documentMode = null;
    if (canUseDOM && 'documentMode' in document) {
        documentMode = document.documentMode;
    }
    // Webkit offers a very useful `textInput` event that can be used to
    // directly represent `beforeInput`. The IE `textinput` event is not as
    // useful, so we don't use it.
    var canUseTextInputEvent = canUseDOM && 'TextEvent' in window && !documentMode;
    // In IE9+, we have access to composition events, but the data supplied
    // by the native compositionend event may be incorrect. Japanese ideographic
    // spaces, for instance (\u3000) are not recorded correctly.
    var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || (documentMode && documentMode > 8 && documentMode <= 11));
    var SPACEBAR_CODE = 32;
    var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
    // Track whether we've ever handled a keypress on the space key.
    var hasSpaceKeypress = false;
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
        var detail = nativeEvent.detail;
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
    var isComposing = false;
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
                var which = nativeEvent.which;
                if (which !== SPACEBAR_CODE) {
                    return null;
                }
                hasSpaceKeypress = true;
                return SPACEBAR_CHAR;
            case TOP_TEXT_INPUT:
                // Record the characters to be added to the DOM.
                var chars = nativeEvent.data;
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
                var chars = getData();
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
        var chars;
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
        var beforeInputEvent = new BeforeInputEvent();
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
    var ɵ0 = function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);
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
    var BeforeInputEventPlugin = {
        //   eventTypes: eventTypes,
        extractEvents: ɵ0
    };

    var SlaLeafRenderConfig = /** @class */ (function () {
        function SlaLeafRenderConfig() {
        }
        return SlaLeafRenderConfig;
    }());
    /**
     * pluginRender parameter config
     */
    var SlaNodeRenderConfig = /** @class */ (function () {
        function SlaNodeRenderConfig() {
        }
        return SlaNodeRenderConfig;
    }());
    var SlaNestedNodeRef = /** @class */ (function () {
        function SlaNestedNodeRef(rootNode, componentRef) {
            this.rootNode = rootNode;
            this.componentRef = componentRef;
        }
        return SlaNestedNodeRef;
    }());

    var ChildNodeBase = /** @class */ (function () {
        function ChildNodeBase() {
        }
        return ChildNodeBase;
    }());

    function setNodeAttributes(ele, attributes) {
        for (var key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                ele.setAttribute(key, attributes[key]);
            }
        }
    }
    function setNodeStyles(ele, styles) {
        for (var key in styles) {
            if (styles.hasOwnProperty(key)) {
                ele.style[key] = styles[key];
            }
        }
    }

    var SlaVoidComponent = /** @class */ (function () {
        function SlaVoidComponent(viewContainerRef, elementRef) {
            this.viewContainerRef = viewContainerRef;
            this.elementRef = elementRef;
            this.readOnly = false;
            this.void = 'true';
            this.key = '';
        }
        Object.defineProperty(SlaVoidComponent.prototype, "node", {
            get: function () {
                return this.internalNode;
            },
            set: function (value) {
                this.internalNode = value;
                if (this.nodeComponentRef) {
                    this.nodeComponentRef.componentRef.instance.node = this.internalNode;
                }
            },
            enumerable: true,
            configurable: true
        });
        SlaVoidComponent.prototype.ngOnInit = function () {
            this.render();
            this.key = this.node.key;
            if (this.node.object === 'inline') {
                this.elementRef.nativeElement.contentEditable = 'false';
            }
        };
        SlaVoidComponent.prototype.createElement = function () {
            var tag = this.node.object === 'block' ? 'div' : 'span';
            return document.createElement(tag);
        };
        SlaVoidComponent.prototype.render = function () {
            if (!this.readOnly) {
                this.elementRef.nativeElement.appendChild(this.renderSpacer());
            }
            else {
                this.children.remove();
            }
            this.elementRef.nativeElement.appendChild(this.renderContent());
        };
        SlaVoidComponent.prototype.renderSpacer = function () {
            var _a;
            var style = {
                height: '0',
                color: 'transparent',
                outline: 'none',
                position: 'absolute',
            };
            var spacerAttrs = (_a = {},
                _a[DATA_ATTRS.SPACER] = 'true',
                _a);
            var spacer = this.createElement();
            setNodeStyles(spacer, style);
            setNodeAttributes(spacer, spacerAttrs);
            spacer.appendChild(this.nodeRefs.first.rootNode);
            return spacer;
        };
        SlaVoidComponent.prototype.renderContent = function () {
            var content = this.createElement();
            content.setAttribute("contentEditable", this.readOnly ? null : 'false');
            content.appendChild(this.children);
            return content;
        };
        SlaVoidComponent.decorators = [
            { type: i0.Component, args: [{
                        selector: 'div[slaVoid]',
                        template: ""
                    }] }
        ];
        /** @nocollapse */
        SlaVoidComponent.ctorParameters = function () {
            return [
                { type: i0.ViewContainerRef },
                { type: i0.ElementRef }
            ];
        };
        SlaVoidComponent.propDecorators = {
            editor: [{ type: i0.Input }],
            selection: [{ type: i0.Input }],
            parent: [{ type: i0.Input }],
            block: [{ type: i0.Input }],
            decorations: [{ type: i0.Input }],
            annotations: [{ type: i0.Input }],
            children: [{ type: i0.Input }],
            nodeRef: [{ type: i0.Input }],
            readOnly: [{ type: i0.Input }],
            nodeRefs: [{ type: i0.Input }],
            node: [{ type: i0.Input }],
            void: [{ type: i0.HostBinding, args: ['attr.data-slate-void',] }],
            key: [{ type: i0.HostBinding, args: ['attr.data-key',] }]
        };
        return SlaVoidComponent;
    }());

    var SlaPluginRenderService = /** @class */ (function () {
        function SlaPluginRenderService(cfr) {
            this.cfr = cfr;
        }
        SlaPluginRenderService.prototype.renderDom = function (tagName, children, attributes, styles) {
            var e_1, _a;
            var node = document.createElement(tagName);
            this.setNodeAttributes(node, attributes);
            if (styles) {
                this.setNodeStyles(node, styles);
            }
            if (children instanceof HTMLCollection) {
                for (var index = 0; index < children.length; index++) {
                    var element = children.item(index);
                    node.appendChild(element);
                }
                return node;
            }
            if (children instanceof HTMLElement) {
                node.appendChild(children);
                return node;
            }
            if (children instanceof i0.QueryList) {
                var nodeRefs = children.toArray();
                try {
                    for (var nodeRefs_1 = __values(nodeRefs), nodeRefs_1_1 = nodeRefs_1.next(); !nodeRefs_1_1.done; nodeRefs_1_1 = nodeRefs_1.next()) {
                        var nodeRef = nodeRefs_1_1.value;
                        node.appendChild(nodeRef.rootNode);
                    }
                }
                catch (e_1_1) {
                    e_1 = { error: e_1_1 };
                }
                finally {
                    try {
                        if (nodeRefs_1_1 && !nodeRefs_1_1.done && (_a = nodeRefs_1.return))
                            _a.call(nodeRefs_1);
                    }
                    finally {
                        if (e_1)
                            throw e_1.error;
                    }
                }
                return node;
            }
            return node;
        };
        SlaPluginRenderService.prototype.renderComponent = function (componentType, config) {
            var componentFactory = this.cfr.resolveComponentFactory(componentType);
            var componentRef = config.nodeViewContainerRef.createComponent(componentFactory);
            Object.assign(componentRef.instance, __assign({}, config));
            componentRef.changeDetectorRef.detectChanges();
            return new SlaNestedNodeRef(this.getComponentRootNode(componentRef), componentRef);
        };
        SlaPluginRenderService.prototype.setNodeAttributes = function (ele, attributes) {
            for (var key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    ele.setAttribute(key, attributes[key]);
                }
            }
        };
        SlaPluginRenderService.prototype.setNodeStyles = function (ele, styles) {
            for (var key in styles) {
                if (styles.hasOwnProperty(key)) {
                    ele.style[key] = styles[key];
                }
            }
        };
        SlaPluginRenderService.prototype.getComponentRootNode = function (componentRef) {
            return componentRef.hostView.rootNodes[0];
        };
        SlaPluginRenderService.decorators = [
            { type: i0.Injectable, args: [{
                        providedIn: 'root'
                    },] }
        ];
        /** @nocollapse */
        SlaPluginRenderService.ctorParameters = function () {
            return [
                { type: i0.ComponentFactoryResolver }
            ];
        };
        SlaPluginRenderService.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function SlaPluginRenderService_Factory() { return new SlaPluginRenderService(i0.ɵɵinject(i0.ComponentFactoryResolver)); }, token: SlaPluginRenderService, providedIn: "root" });
        return SlaPluginRenderService;
    }());

    var debug$2 = Debug('slate:node');
    debug$2.render = Debug('slate:node-render');
    debug$2.check = Debug('slate:docheck');
    debug$2.change = Debug('slate:change');
    var nodeBinding = {
        provide: ChildNodeBase,
        useExisting: i0.forwardRef(function () { return SlaNodeComponent; })
    };
    var SlaNodeComponent = /** @class */ (function (_super) {
        __extends(SlaNodeComponent, _super);
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
                debug$2('set: node', value.toJSON());
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
            debug$2("ngOnInit node", this.node.toJSON());
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
                    start = start.moveTo(slate.PathUtils.create([index]), 0).setKey(child.key);
                }
                else {
                    var _a = __read(child.texts(), 1), first = _a[0];
                    var _b = __read(first, 2), firstNode = _b[0], firstPath = _b[1];
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
                    end = end.moveTo(slate.PathUtils.create([index]), length_1).setKey(child.key);
                }
                else {
                    var _c = __read(child.texts({ direction: 'backward' }), 1), last = _c[0];
                    var _d = __read(last, 2), lastNode = _d[0], lastPath = _d[1];
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
            debug$2.render('exec render', this.node.toJSON());
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
            debug$2.change("node changes", simpleChanges);
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
            debug$2.check('check node');
        };
        SlaNodeComponent.prototype.ngOnDestroy = function () {
            debug$2("ngOnDestroy node");
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
            { type: i0.Component, args: [{
                        selector: 'sla-node,[slaNode]',
                        template: "<ng-container *ngFor=\"let child of node.nodes; let i = index; trackBy: trackBy\">\n    <span\n        *ngIf=\"child.object === 'text'\"\n        slaText\n        [attr.data-slate-object]=\"child.object\"\n        [slaTextNode]=\"child\"\n        [parent]=\"node\"\n        [editor]=\"editor\"\n        [attr.data-key]=\"child.key\"\n    ></span>\n    <div\n        *ngIf=\"child.object !== 'text'\"\n        slaNode\n        [node]=\"child\"\n        [selection]=\"subSelections[i]\"\n        [editor]=\"editor\"\n        [readOnly]=\"readOnly\"\n    ></div>\n</ng-container>\n",
                        changeDetection: i0.ChangeDetectionStrategy.OnPush,
                        providers: [nodeBinding]
                    }] }
        ];
        /** @nocollapse */
        SlaNodeComponent.ctorParameters = function () {
            return [
                { type: i0.ViewContainerRef },
                { type: i0.ElementRef },
                { type: SlaPluginRenderService },
                { type: i0.NgZone },
                { type: i0.IterableDiffers }
            ];
        };
        SlaNodeComponent.propDecorators = {
            editor: [{ type: i0.Input }],
            selection: [{ type: i0.Input }],
            block: [{ type: i0.Input }],
            index: [{ type: i0.Input }],
            nodeRef: [{ type: i0.Input }],
            readOnly: [{ type: i0.Input }],
            node: [{ type: i0.Input }],
            nodeRefs: [{ type: i0.ViewChildren, args: [ChildNodeBase,] }]
        };
        return SlaNodeComponent;
    }(ChildNodeBase));

    var SlaEventService = /** @class */ (function () {
        function SlaEventService() {
        }
        SlaEventService.prototype.fromSlaEvents = function (element, $destroy) {
            return rxjs.merge.apply(void 0, __spread(NGX_SLATE_EVENTS.map(function (eventEntity) {
                return rxjs.fromEvent(element, eventEntity.name).pipe(operators.map(function (event) {
                    return { event: event, eventEntity: eventEntity };
                }));
            }))).pipe(operators.takeUntil($destroy));
        };
        SlaEventService.decorators = [
            { type: i0.Injectable, args: [{
                        providedIn: 'root'
                    },] }
        ];
        SlaEventService.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function SlaEventService_Factory() { return new SlaEventService(); }, token: SlaEventService, providedIn: "root" });
        return SlaEventService;
    }());

    var FIREFOX_NODE_TYPE_ACCESS_ERROR = /Permission denied to access property "nodeType"/;
    //#endregion
    var debug$3 = Debug('slate:content');
    debug$3.update = Debug('slate:update');
    debug$3.render = Debug('slate:content-render');
    debug$3.track = Debug('slate:track');
    var SlaContentComponent = /** @class */ (function () {
        function SlaContentComponent(ngZone, elementRef, cdr, slaEventService) {
            this.ngZone = ngZone;
            this.elementRef = elementRef;
            this.cdr = cdr;
            this.slaEventService = slaEventService;
            this.$destroy = new rxjs.Subject();
            this.hasSpaceKeypress = false;
            this.isComposing = false;
            this.isUpdateSelection = false;
            this.readOnly = false;
            this.tmp = {
                isUpdatingSelection: false,
                contentKey: 0
            };
        }
        Object.defineProperty(SlaContentComponent.prototype, "slaValue", {
            set: function (value) {
                this.isUpdateSelection = true;
                debug$3.render('set: slateValue');
                this.editorData = value;
            },
            enumerable: true,
            configurable: true
        });
        SlaContentComponent.prototype.ngOnInit = function () {
            var _this = this;
            this.rootNode = this.elementRef.nativeElement;
            this.document = this.editor.value.document;
            this.selection = this.editor.value.selection;
            this.ngZone.runOutsideAngular(function () {
                _this.slaEventService.fromSlaEvents(_this.rootNode, _this.$destroy).subscribe(function (_a) {
                    var event = _a.event, eventEntity = _a.eventEntity;
                    var target = event.target;
                    if (target && target.closest) {
                        var isSkip = target.closest(SELECTORS.SKIP_EVENT);
                        if (isSkip) {
                            return;
                        }
                    }
                    if (eventEntity.isTriggerBeforeInput) {
                        var beforeInputEvent = BeforeInputEventPlugin.extractEvents(event.type, null, event, event.target);
                        if (beforeInputEvent) {
                            _this.onEventHandle('onBeforeInput', beforeInputEvent);
                        }
                    }
                    if (eventEntity.handler) {
                        _this.onEventHandle(eventEntity.handler, event);
                    }
                });
                rxjs.fromEvent(window.document, 'selectionchange')
                    .pipe(operators.throttle(function (value) {
                    return rxjs.interval(100);
                }, { trailing: true, leading: true }), operators.takeUntil(_this.$destroy))
                    .subscribe(function (event) {
                    _this.onNativeSelectionChange(event);
                });
                // if (HAS_INPUT_EVENTS_LEVEL_2) {
                //     fromEvent(this.rootNode, 'beforeinput')
                //         .pipe(takeUntil(this.$destroy))
                //         .subscribe(event => {
                //             this.onEventHandle('onBeforeInput', event);
                //         });
                // }
            });
        };
        SlaContentComponent.prototype.onEventHandle = function (handler, event) {
            debug$3('slaEvent', handler);
            var nativeEvent = event.nativeEvent || event;
            var isUndoRedo = event.type === 'keydown' && (Hotkeys.isUndo(nativeEvent) || Hotkeys.isRedo(nativeEvent));
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
            if (!slateDevEnvironment.IS_ANDROID && handler === 'onSelect') {
                // const { editor } = this.props;
                var value = this.editor.value;
                var selection = value.selection;
                var window_1 = getWindow(event.target);
                var domSelection = window_1.getSelection();
                var range = this.editor.findRange(domSelection);
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
                var closest = event.target.closest(SELECTORS.EDITOR);
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
                var target = event.target ? event.target : event.nativeEvent.target;
                if (!this.isInEditor(target)) {
                    return;
                }
            }
            this.slaEvent(handler, event);
        };
        SlaContentComponent.prototype.onNativeSelectionChange = function (event) {
            if (this.readOnly) {
                return;
            }
            var window = getWindow(event.target);
            var activeElement = window.document.activeElement;
            debug$3.update('onNativeSelectionChange', {
                anchorOffset: window.getSelection().anchorOffset
            });
            if (activeElement !== this.rootNode) {
                return;
            }
            this.slaEvent('onSelect', event);
        };
        SlaContentComponent.prototype.ngOnDestroy = function () {
            this.$destroy.next();
            this.$destroy.complete();
        };
        /**
         * Update the native DOM selection to reflect the internal model.
         */
        SlaContentComponent.prototype.updateSelection = function () {
            var _this = this;
            var value = this.editor.value;
            var selection = value.selection;
            var isBackward = selection.isBackward;
            var window = getWindow(this.rootNode);
            var native = window.getSelection();
            var activeElement = window.document.activeElement;
            if (debug$3.update.enabled) {
                debug$3.update('updateSelection', { selection: selection.toJSON() });
            }
            // COMPAT: In Firefox, there's a but where `getSelection` can return `null`.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=827585 (2018/11/07)
            if (!native) {
                return;
            }
            var rangeCount = native.rangeCount, anchorNode = native.anchorNode;
            var updated = false;
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
                var current = !!native.rangeCount && native.getRangeAt(0);
                var range = this.editor.findDOMRange(selection);
                if (!range) {
                    warning(false, 'Unable to find a native DOM range from the current selection.');
                    return;
                }
                var startContainer = range.startContainer, startOffset = range.startOffset, endContainer = range.endContainer, endOffset = range.endOffset;
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
                setTimeout(function () {
                    // COMPAT: In Firefox, it's not enough to create a range, you also need
                    // to focus the contenteditable element too. (2016/11/16)
                    if (slateDevEnvironment.IS_FIREFOX && _this.rootNode) {
                        _this.rootNode.focus();
                    }
                    _this.tmp.isUpdatingSelection = false;
                    debug$3.update('updateSelection:setTimeout', {
                        anchorOffset: window.getSelection().anchorOffset
                    });
                });
                if (updated && (debug$3.enabled || debug$3.update.enabled)) {
                    debug$3('updateSelection', { selection: selection, native: native, activeElement: activeElement });
                    debug$3.update('updateSelection:applied', {
                        selection: selection.toJSON(),
                        native: {
                            anchorOffset: native.anchorOffset,
                            focusOffset: native.focusOffset
                        }
                    });
                }
            }
        };
        SlaContentComponent.prototype.isInEditor = function (target) {
            var el;
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
                if (slateDevEnvironment.IS_FIREFOX && FIREFOX_NODE_TYPE_ACCESS_ERROR.test(err.message)) {
                    return false;
                }
                throw err;
            }
            return el.isContentEditable && (el === this.rootNode || el.closest(SELECTORS.EDITOR) === this.rootNode);
        };
        SlaContentComponent.prototype.ngAfterViewChecked = function () {
            var _this = this;
            if (this.isUpdateSelection) {
                this.isUpdateSelection = false;
                this.ngZone.runOutsideAngular(function () {
                    _this.updateSelection();
                });
            }
        };
        SlaContentComponent.decorators = [
            { type: i0.Component, args: [{
                        selector: 'sla-content,[slaContent]',
                        template: "<sla-node\n    [editor]=\"editor\"\n    [node]=\"editorData.document\"\n    [selection]=\"editorData.selection\"\n    [readOnly]=\"readOnly\"\n></sla-node>\n",
                        changeDetection: i0.ChangeDetectionStrategy.OnPush
                    }] }
        ];
        /** @nocollapse */
        SlaContentComponent.ctorParameters = function () {
            return [
                { type: i0.NgZone },
                { type: i0.ElementRef },
                { type: i0.ChangeDetectorRef },
                { type: SlaEventService }
            ];
        };
        SlaContentComponent.propDecorators = {
            nodeRef: [{ type: i0.ViewChild, args: [SlaNodeComponent, { static: true },] }],
            readOnly: [{ type: i0.Input }],
            slaValue: [{ type: i0.Input }],
            editor: [{ type: i0.Input }],
            slaEvent: [{ type: i0.Input }]
        };
        return SlaContentComponent;
    }());

    var Rendering = /** @class */ (function () {
        function Rendering(slaPluginRenderService) {
            var _this = this;
            this.slaPluginRenderService = slaPluginRenderService;
            this.renderBlock = function (config) {
                return _this.slaPluginRenderService.renderDom('div', config.children, config.attributes, { position: 'relative' });
            };
            this.renderDocument = function (config) {
                return _this.slaPluginRenderService.renderDom('div', config.children, config.attributes);
            };
            this.renderInline = function (config) {
                return _this.slaPluginRenderService.renderDom('span', config.children, config.attributes);
            };
        }
        Rendering.decorators = [
            { type: i0.Injectable }
        ];
        /** @nocollapse */
        Rendering.ctorParameters = function () {
            return [
                { type: SlaPluginRenderService }
            ];
        };
        return Rendering;
    }());

    var SlaEditorComponent = /** @class */ (function () {
        function SlaEditorComponent(ngZone, render2, element, rendering) {
            this.ngZone = ngZone;
            this.render2 = render2;
            this.element = element;
            this.rendering = rendering;
            this.spellcheck = false;
            this.plugins = [];
            this.slaOnChange = new i0.EventEmitter();
            this.slaEditorInitComplete = new i0.EventEmitter();
            this.tmp = {
                mounted: false,
                change: null,
                resolves: 0,
                updates: 0,
                contentRef: null
            };
        }
        SlaEditorComponent.prototype.ngOnInit = function () {
            var _this = this;
            this.setEditorContainerClass();
            var _a = this, value = _a.slaValue, readOnly = _a.slaReadOnly;
            this.ngZone.runOutsideAngular(function () {
                var angularPlugins = AngularPlugin(_this);
                var onChange = function (change) {
                    // if (this.tmp.mounted) {
                    //     this.slaOnChange.emit(change);
                    // } else {
                    //     this.tmp.change = change;
                    // }
                    _this.slaOnChange.emit(change);
                };
                _this.editor = new slate.Editor({
                    plugins: __spread(angularPlugins, [_this.rendering]),
                    onChange: onChange,
                    value: value,
                    readOnly: readOnly
                });
                _this.editor.tmp.contentRef = _this.contentRef;
                _this.slaEditorInitComplete.emit(_this.editor);
            });
        };
        SlaEditorComponent.prototype.slaEvent = function (handler, event) {
            this.editor.run(handler, event);
        };
        SlaEditorComponent.prototype.setEditorContainerClass = function () {
            var _a;
            var classList = ['sla-editor-container'];
            if (this.slaContainerClass) {
                classList.push(this.slaContainerClass);
            }
            (_a = this.element.nativeElement.classList).add.apply(_a, __spread(classList));
        };
        SlaEditorComponent.decorators = [
            { type: i0.Component, args: [{
                        selector: 'sla-editor,[slaEditor]',
                        template: "<div\n    slaContent\n    class=\"sla-editor-container\"\n    [readOnly]=\"slaReadOnly\"\n    [editor]=\"editor\"\n    [slaEvent]=\"slaEvent\"\n    [slaValue]=\"slaValue\"\n    [attr.tabIndex]=\"tabIndex\"\n    [attr.contenteditable]=\"slaReadOnly ? null : true\"\n    [attr.data-slate-editor]=\"true\"\n    [attr.data-key]=\"slaValue?.document?.key\"\n    [attr.spellcheck]=\"spellcheck\"\n></div>\n"
                    }] }
        ];
        /** @nocollapse */
        SlaEditorComponent.ctorParameters = function () {
            return [
                { type: i0.NgZone },
                { type: i0.Renderer2 },
                { type: i0.ElementRef },
                { type: Rendering }
            ];
        };
        SlaEditorComponent.propDecorators = {
            slaValue: [{ type: i0.Input }],
            slaReadOnly: [{ type: i0.Input }],
            slaPlaceholder: [{ type: i0.Input }],
            spellcheck: [{ type: i0.Input }],
            tabIndex: [{ type: i0.Input }],
            slaContainerClass: [{ type: i0.Input }],
            plugins: [{ type: i0.Input }],
            commands: [{ type: i0.Input }],
            queries: [{ type: i0.Input }],
            schema: [{ type: i0.Input }],
            decorateNode: [{ type: i0.Input }],
            renderAnnotation: [{ type: i0.Input }],
            renderBlock: [{ type: i0.Input }],
            renderDecoration: [{ type: i0.Input }],
            renderDocument: [{ type: i0.Input }],
            renderEditor: [{ type: i0.Input }],
            renderInline: [{ type: i0.Input }],
            renderMark: [{ type: i0.Input }],
            onBeforeInput: [{ type: i0.Input }],
            onBlur: [{ type: i0.Input }],
            onClick: [{ type: i0.Input }],
            onContextMenu: [{ type: i0.Input }],
            onCompositionEnd: [{ type: i0.Input }],
            onCompositionStart: [{ type: i0.Input }],
            onCopy: [{ type: i0.Input }],
            onCut: [{ type: i0.Input }],
            onDragEnd: [{ type: i0.Input }],
            onDragEnter: [{ type: i0.Input }],
            onDragLeave: [{ type: i0.Input }],
            onDragOver: [{ type: i0.Input }],
            onDragStart: [{ type: i0.Input }],
            onDrop: [{ type: i0.Input }],
            onInput: [{ type: i0.Input }],
            onFocus: [{ type: i0.Input }],
            onKeyDown: [{ type: i0.Input }],
            onKeyUp: [{ type: i0.Input }],
            onMouseDown: [{ type: i0.Input }],
            onMouseUp: [{ type: i0.Input }],
            onPaste: [{ type: i0.Input }],
            onSelect: [{ type: i0.Input }],
            slaOnChange: [{ type: i0.Output }],
            slaEditorInitComplete: [{ type: i0.Output }],
            contentRef: [{ type: i0.ViewChild, args: [SlaContentComponent, { static: true },] }]
        };
        return SlaEditorComponent;
    }());

    /**
     * Offset key parser regex.
     *
     * @type {RegExp}
     */
    var PARSER = /^([\w-]+)(?::(\d+))?$/;
    /**
     * Parse an offset key `string`.
     *
     * @param {String} string
     * @return {Object}
     */
    function parse(value) {
        var matches = PARSER.exec(value);
        if (!matches) {
            throw new Error("Invalid offset key string \"" + value + "\".");
        }
        var _a = __read(matches, 3), original = _a[0], key = _a[1], index = _a[2]; // eslint-disable-line no-unused-vars
        return {
            key: key,
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
        return object.key + ":" + object.index;
    }
    /**
     * Export.
     *
     * @type {Object}
     */
    var OffsetKey = {
        parse: parse,
        stringify: stringify
    };

    var debug$4 = Debug('slate:text');
    debug$4.check = Debug('slate:docheck');
    var textBinding = {
        provide: ChildNodeBase,
        useExisting: i0.forwardRef(function () { return SlaTextComponent; })
    };
    var SlaTextComponent = /** @class */ (function (_super) {
        __extends(SlaTextComponent, _super);
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
            },
            enumerable: true,
            configurable: true
        });
        SlaTextComponent.prototype.ngOnInit = function () {
            debug$4('ngOnInit');
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
            debug$4.check('check text', this.node);
        };
        SlaTextComponent.decorators = [
            { type: i0.Component, args: [{
                        selector: 'sla-text,[slaText]',
                        template: "<span #leaf [attr.data-slate-leaf]=\"true\" [attr.data-offset-key]=\"offsetKey\">\n    <!-- break compisiton input -->\n    <!-- <span contenteditable=\"false\" class=\"non-editable-area\"></span> -->\n    <!-- move zero order to adjust empty text selection when delete last char-->\n    <span #text *ngIf=\"!isZeroWidthString\" data-slate-string=\"true\">{{ node.text }}{{ isTrailing ? '\\n' : null }}</span>\n    <span\n        *ngIf=\"isZeroWidthString\"\n        attr.data-slate-zero-width=\"{{ isLineBreak ? 'n' : 'z' }}\"\n        attr.data-slate-length=\"{{ zeroWidthStringLength }}\"\n        >{{ '\\u200B' }}<br *ngIf=\"isLineBreak\" />\n    </span>\n</span>\n",
                        providers: [textBinding],
                        changeDetection: i0.ChangeDetectionStrategy.OnPush
                    }] }
        ];
        /** @nocollapse */
        SlaTextComponent.ctorParameters = function () {
            return [
                { type: i0.ElementRef },
                { type: i0.ChangeDetectorRef },
                { type: i0.NgZone }
            ];
        };
        SlaTextComponent.propDecorators = {
            editor: [{ type: i0.Input }],
            parent: [{ type: i0.Input }],
            block: [{ type: i0.Input }],
            slaTextNode: [{ type: i0.Input }],
            leafContainer: [{ type: i0.ViewChild, args: ['leaf', { static: true },] }]
        };
        return SlaTextComponent;
    }(ChildNodeBase));

    var SlaEditorModule = /** @class */ (function () {
        function SlaEditorModule() {
        }
        SlaEditorModule.decorators = [
            { type: i0.NgModule, args: [{
                        declarations: [SlaEditorComponent, SlaContentComponent, SlaNodeComponent, SlaVoidComponent, SlaTextComponent],
                        imports: [platformBrowser.BrowserModule, portal.PortalModule],
                        exports: [SlaEditorComponent, SlaContentComponent, SlaNodeComponent, SlaTextComponent, SlaVoidComponent],
                        entryComponents: [SlaTextComponent, SlaVoidComponent],
                        providers: [Rendering]
                    },] }
        ];
        /** @nocollapse */
        SlaEditorModule.ctorParameters = function () { return []; };
        return SlaEditorModule;
    }());

    var ValueChange = /** @class */ (function () {
        function ValueChange() {
        }
        return ValueChange;
    }());

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
                    for (var nodeRefs_1 = __values(nodeRefs), nodeRefs_1_1 = nodeRefs_1.next(); !nodeRefs_1_1.done; nodeRefs_1_1 = nodeRefs_1.next()) {
                        var nodeRef = nodeRefs_1_1.value;
                        this.childrenContent.nativeElement.appendChild(nodeRef.rootNode);
                    }
                }
                catch (e_1_1) {
                    e_1 = { error: e_1_1 };
                }
                finally {
                    try {
                        if (nodeRefs_1_1 && !nodeRefs_1_1.done && (_a = nodeRefs_1.return))
                            _a.call(nodeRefs_1);
                    }
                    finally {
                        if (e_1)
                            throw e_1.error;
                    }
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
            editor: [{ type: i0.Input }],
            node: [{ type: i0.Input }],
            parent: [{ type: i0.Input }],
            isFocused: [{ type: i0.Input }],
            isSelected: [{ type: i0.Input }],
            readOnly: [{ type: i0.Input }],
            children: [{ type: i0.Input }],
            attributes: [{ type: i0.Input }],
            nodeViewContainerRef: [{ type: i0.Input }],
            childrenContent: [{ type: i0.ViewChild, args: ['childrenContent', { read: i0.ElementRef, static: true },] }]
        };
        return SlaPluginComponentBase;
    }());

    function findDOMNode(key, win) {
        if (win === void 0) {
            win = window;
        }
        warning(false, 'As of slate-react@0.22 the `findDOMNode(key)` helper is deprecated in favor of `editor.findDOMNode(path)`.');
        if (Node.isNode(key)) {
            key = key.key;
        }
        var el = win.document.querySelector("[" + DATA_ATTRS.KEY + "=\"" + key + "\"]");
        if (!el) {
            throw new Error("Unable to find a DOM node for \"" + key + "\". This is often because of forgetting to add `props.attributes` to a custom component.");
        }
        return el;
    }

    /*
     * Public API Surface of ngx-slate-angular
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.ɵb = SlaContentComponent;
    exports.ɵa = SlaEditorComponent;
    exports.ɵd = SlaNodeComponent;
    exports.ɵc = nodeBinding;
    exports.ɵk = SlaTextComponent;
    exports.ɵj = textBinding;
    exports.ɵi = SlaVoidComponent;
    exports.ɵe = ChildNodeBase;
    exports.ɵg = SlaEventService;
    exports.ɵf = SlaPluginRenderService;
    exports.ɵh = Rendering;
    exports.SlaEditorComponent = SlaEditorComponent;
    exports.SlaContentComponent = SlaContentComponent;
    exports.nodeBinding = nodeBinding;
    exports.SlaNodeComponent = SlaNodeComponent;
    exports.textBinding = textBinding;
    exports.SlaTextComponent = SlaTextComponent;
    exports.SlaVoidComponent = SlaVoidComponent;
    exports.SlaEditorModule = SlaEditorModule;
    exports.ValueChange = ValueChange;
    exports.SlaLeafRenderConfig = SlaLeafRenderConfig;
    exports.SlaNodeRenderConfig = SlaNodeRenderConfig;
    exports.SlaNestedNodeRef = SlaNestedNodeRef;
    exports.SlaPluginRenderService = SlaPluginRenderService;
    exports.SlaPluginComponentBase = SlaPluginComponentBase;
    exports.SlaEventService = SlaEventService;
    exports.cloneFragment = cloneFragment;
    exports.findDOMNode = findDOMNode;
    exports.getEventTransfer = getEventTransfer;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=ngx-slate-core.umd.js.map