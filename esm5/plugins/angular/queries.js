import * as tslib_1 from "tslib";
import getWindow from 'get-window';
import { PathUtils } from 'slate';
import DATA_ATTRS from '../../constants/data-attributes';
import SELECTORS from '../../constants/selectors';
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
        path = PathUtils.create(path);
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
            for (var texts_1 = tslib_1.__values(texts), texts_1_1 = texts_1.next(); !texts_1_1.done; texts_1_1 = texts_1.next()) {
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
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (texts_1_1 && !texts_1_1.done && (_a = texts_1.return)) _a.call(texts_1);
            }
            finally { if (e_1) throw e_1.error; }
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
            return PathUtils.create([]);
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
                for (var nodeRefs_1 = tslib_1.__values(nodeRefs), nodeRefs_1_1 = nodeRefs_1.next(); !nodeRefs_1_1.done; nodeRefs_1_1 = nodeRefs_1.next()) {
                    var nodeRef = nodeRefs_1_1.value;
                    var retPath = search(nodeRef, tslib_1.__spread(p, [i]));
                    i++;
                    if (retPath) {
                        return retPath;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (nodeRefs_1_1 && !nodeRefs_1_1.done && (_a = nodeRefs_1.return)) _a.call(nodeRefs_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return null;
        };
        var documentNodeRef = contentRef.nodeRef;
        var path = search(documentNodeRef, []);
        if (!path) {
            return null;
        }
        return PathUtils.create(path);
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
            var relativePath = PathUtils.drop(anchor.path, depth);
            if (anchor.offset === anchorText.text.length) {
                var _a = tslib_1.__read(block.texts({ path: relativePath }), 1), next = _a[0];
                if (next) {
                    var _b = tslib_1.__read(next, 2), nextPath = _b[1];
                    var absolutePath = anchor.path
                        .slice(0, depth)
                        .concat(nextPath);
                    range = range.moveAnchorTo(absolutePath, 0);
                }
            }
            else if (anchor.offset === 0) {
                var _c = tslib_1.__read(block.texts({ path: relativePath, direction: 'backward' }), 1), previousText = _c[0];
                if (previousText) {
                    var _d = tslib_1.__read(previousText, 2), previous = _d[0], previousPath = _d[1];
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
            var relativePath = PathUtils.drop(focus.path, depth);
            if (focus.offset === focusText.text.length) {
                var _e = tslib_1.__read(block.texts({ path: relativePath }), 1), next = _e[0];
                if (next) {
                    var _f = tslib_1.__read(next, 2), nextPath = _f[1];
                    var absolutePath = focus.path
                        .slice(0, depth)
                        .concat(nextPath);
                    range = range.moveFocusTo(absolutePath, 0);
                }
            }
            else if (focus.offset === 0) {
                var _g = tslib_1.__read(block.texts({ path: relativePath, direction: 'backward' }), 1), previousTextEntry = _g[0];
                if (previousTextEntry) {
                    var _h = tslib_1.__read(previousTextEntry, 2), previous = _h[0], previousPath = _h[1];
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
export default {
    queries: QueriesPlugin
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInBsdWdpbnMvYW5ndWxhci9xdWVyaWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLFNBQVMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUVsQyxPQUFPLFVBQVUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN6RCxPQUFPLFNBQVMsTUFBTSwyQkFBMkIsQ0FBQztBQUVsRDtJQUFBO0lBZ2lCQSxDQUFDO0lBL2hCRzs7Ozs7O09BTUc7SUFFSSx5QkFBVyxHQUFsQixVQUFtQixNQUFNLEVBQUUsSUFBSTtRQUMzQixJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUV6QyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2IsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1osT0FBTyxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQztTQUN0QztRQUVELElBQU0sTUFBTSxHQUFHLFVBQUMsUUFBUSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDWCxPQUFPLElBQUksQ0FBQzthQUNmO1lBRUQsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ1QsT0FBTyxRQUFRLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQzthQUNwQztZQUVELElBQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QixJQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdEIsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMs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QUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxTQUFTLEtBQUssU0FBUztZQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pDLElBQUksU0FBUyxLQUFLLFVBQVU7WUFBRSxDQUFDLEVBQUUsQ0FBQztLQUNyQztJQUVELE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQztBQUN6QixDQUFDO0FBRUQsZUFBZTtJQUNYLE9BQU8sRUFBRSxhQUFhO0NBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZ2V0V2luZG93IGZyb20gJ2dldC13aW5kb3cnO1xuaW1wb3J0IHsgUGF0aFV0aWxzIH0gZnJvbSAnc2xhdGUnO1xuaW1wb3J0IHsgTGlzdCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgREFUQV9BVFRSUyBmcm9tICcuLi8uLi9jb25zdGFudHMvZGF0YS1hdHRyaWJ1dGVzJztcbmltcG9ydCBTRUxFQ1RPUlMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL3NlbGVjdG9ycyc7XG5cbmNsYXNzIFF1ZXJpZXNQbHVnaW4ge1xuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIG5hdGl2ZSBET00gZWxlbWVudCBmb3IgYSBub2RlIGF0IGBwYXRoYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0FycmF5fExpc3R9IHBhdGhcbiAgICAgKiBAcmV0dXJuIHtET01Ob2RlfE51bGx9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZERPTU5vZGUoZWRpdG9yLCBwYXRoKSB7XG4gICAgICAgIHBhdGggPSBQYXRoVXRpbHMuY3JlYXRlKHBhdGgpO1xuICAgICAgICBjb25zdCBjb250ZW50UmVmID0gZWRpdG9yLnRtcC5jb250ZW50UmVmO1xuXG4gICAgICAgIGlmICghY29udGVudFJlZikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXBhdGguc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRSZWYucm9vdE5vZGUgfHwgbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlYXJjaCA9IChpbnN0YW5jZSwgcCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXAuc2l6ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS5yb290Tm9kZSB8fCBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHAuZmlyc3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3QgPSBwLnJlc3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZiA9IGluc3RhbmNlLmdldE5vZGVSZWYoaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuIHNlYXJjaChyZWYsIHJlc3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50Tm9kZVJlZiA9IGNvbnRlbnRSZWYubm9kZVJlZjtcbiAgICAgICAgY29uc3QgZWwgPSBzZWFyY2goZG9jdW1lbnROb2RlUmVmLCBwYXRoKTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBuYXRpdmUgRE9NIHNlbGVjdGlvbiBwb2ludCBmcm9tIGEgU2xhdGUgYHBvaW50YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge1BvaW50fSBwb2ludFxuICAgICAqIEByZXR1cm4ge09iamVjdHxOdWxsfVxuICAgICAqL1xuXG4gICAgc3RhdGljIGZpbmRET01Qb2ludChlZGl0b3IsIHBvaW50KSB7XG4gICAgICAgIGNvbnN0IGVsID0gZWRpdG9yLmZpbmRET01Ob2RlKHBvaW50LnBhdGgpO1xuICAgICAgICBsZXQgc3RhcnQgPSAwO1xuXG4gICAgICAgIGlmICghZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9yIGVhY2ggbGVhZiwgd2UgbmVlZCB0byBpc29sYXRlIGl0cyBjb250ZW50LCB3aGljaCBtZWFucyBmaWx0ZXJpbmcgdG8gaXRzXG4gICAgICAgIC8vIGRpcmVjdCB0ZXh0IGFuZCB6ZXJvLXdpZHRoIHNwYW5zLiAoV2UgaGF2ZSB0byBmaWx0ZXIgb3V0IGFueSBvdGhlciBzaWJsaW5nc1xuICAgICAgICAvLyB0aGF0IG1heSBoYXZlIGJlZW4gcmVuZGVyZWQgYWxvbmdzaWRlIHRoZW0uKVxuICAgICAgICBjb25zdCB0ZXh0czogYW55ID0gQXJyYXkuZnJvbShcbiAgICAgICAgICAgIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoYCR7U0VMRUNUT1JTLlNUUklOR30sICR7U0VMRUNUT1JTLlpFUk9fV0lEVEh9YClcbiAgICAgICAgKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHRleHQgb2YgdGV4dHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0ZXh0LmNoaWxkTm9kZXNbMF07XG4gICAgICAgICAgICBjb25zdCBkb21MZW5ndGggPSBub2RlLnRleHRDb250ZW50Lmxlbmd0aDtcbiAgICAgICAgICAgIGxldCBzbGF0ZUxlbmd0aCA9IGRvbUxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHRleHQuaGFzQXR0cmlidXRlKERBVEFfQVRUUlMuTEVOR1RIKSkge1xuICAgICAgICAgICAgICAgIHNsYXRlTGVuZ3RoID0gcGFyc2VJbnQoXG4gICAgICAgICAgICAgICAgICAgIHRleHQuZ2V0QXR0cmlidXRlKERBVEFfQVRUUlMuTEVOR1RIKSxcbiAgICAgICAgICAgICAgICAgICAgMTBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIHNsYXRlTGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAocG9pbnQub2Zmc2V0IDw9IGVuZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICBkb21MZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KDAsIHBvaW50Lm9mZnNldCAtIHN0YXJ0KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IGVtcHR5IHRleHQgc2VsZWN0aW9uLCBwcmV2ZW50IGRlbGV0ZSBjb21tZW50IG9mIEFuZ3VsYXIgd2hlbiBjbGVhciBjb21wc2l0aW9uIGlucHV0XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gMCAmJiBkb21MZW5ndGggPT09IDEgJiYgbm9kZS50ZXh0Q29udGVudCA9PT0gJ1xcdTIwMEInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IG5vZGUsIG9mZnNldDogb2Zmc2V0ICsgMSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4geyBub2RlLCBvZmZzZXQgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhcnQgPSBlbmQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgbmF0aXZlIERPTSByYW5nZSBmcm9tIGEgU2xhdGUgYHJhbmdlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge1JhbmdlfSByYW5nZVxuICAgICAqIEByZXR1cm4ge0RPTVJhbmdlfE51bGx9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZERPTVJhbmdlKGVkaXRvciwgcmFuZ2UpIHtcbiAgICAgICAgY29uc3QgeyBhbmNob3IsIGZvY3VzLCBpc0JhY2t3YXJkLCBpc0NvbGxhcHNlZCB9ID0gcmFuZ2U7XG4gICAgICAgIGNvbnN0IGRvbUFuY2hvciA9IGVkaXRvci5maW5kRE9NUG9pbnQoYW5jaG9yKTtcbiAgICAgICAgY29uc3QgZG9tRm9jdXMgPSBpc0NvbGxhcHNlZCA/IGRvbUFuY2hvciA6IGVkaXRvci5maW5kRE9NUG9pbnQoZm9jdXMpO1xuXG4gICAgICAgIGlmICghZG9tQW5jaG9yIHx8ICFkb21Gb2N1cykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZG9tQW5jaG9yLm5vZGUpO1xuICAgICAgICBjb25zdCByID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaXNCYWNrd2FyZCA/IGRvbUZvY3VzIDogZG9tQW5jaG9yO1xuICAgICAgICBjb25zdCBlbmQgPSBpc0JhY2t3YXJkID8gZG9tQW5jaG9yIDogZG9tRm9jdXM7XG4gICAgICAgIHIuc2V0U3RhcnQoc3RhcnQubm9kZSwgc3RhcnQub2Zmc2V0KTtcbiAgICAgICAgci5zZXRFbmQoZW5kLm5vZGUsIGVuZC5vZmZzZXQpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgU2xhdGUgbm9kZSBmcm9tIGEgbmF0aXZlIERPTSBgZWxlbWVudGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybiB7TGlzdHxOdWxsfVxuICAgICAqL1xuXG4gICAgc3RhdGljIGZpbmROb2RlKGVkaXRvciwgZWxlbWVudCkge1xuICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmZpbmRQYXRoKGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBlZGl0b3I7XG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQuZ2V0Tm9kZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0YXJnZXQgcmFuZ2UgZnJvbSBhIERPTSBgZXZlbnRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHJldHVybiB7UmFuZ2V9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZEV2ZW50UmFuZ2UoZWRpdG9yLCBldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQubmF0aXZlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50ID0gZXZlbnQubmF0aXZlRXZlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGNsaWVudFg6IHgsIGNsaWVudFk6IHksIHRhcmdldCB9ID0gZXZlbnQ7XG4gICAgICAgIGlmICh4ID09IG51bGwgfHwgeSA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBlZGl0b3I7XG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmZpbmRQYXRoKGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGlmICghcGF0aCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LmdldE5vZGUocGF0aCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGRyb3AgdGFyZ2V0IGlzIGluc2lkZSBhIHZvaWQgbm9kZSwgbW92ZSBpdCBpbnRvIGVpdGhlciB0aGUgbmV4dCBvclxuICAgICAgICAvLyBwcmV2aW91cyBub2RlLCBkZXBlbmRpbmcgb24gd2hpY2ggc2lkZSB0aGUgYHhgIGFuZCBgeWAgY29vcmRpbmF0ZXMgYXJlXG4gICAgICAgIC8vIGNsb3Nlc3QgdG8uXG4gICAgICAgIGlmIChlZGl0b3IuaXNWb2lkKG5vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc3QgaXNQcmV2aW91cyA9XG4gICAgICAgICAgICAgICAgbm9kZS5vYmplY3QgPT09ICdpbmxpbmUnXG4gICAgICAgICAgICAgICAgICAgID8geCAtIHJlY3QubGVmdCA8IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLSB4XG4gICAgICAgICAgICAgICAgICAgIDogeSAtIHJlY3QudG9wIDwgcmVjdC50b3AgKyByZWN0LmhlaWdodCAtIHk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gKGRvY3VtZW50IGFzIGFueSkuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgIGNvbnN0IG1vdmUgPSBpc1ByZXZpb3VzID8gJ21vdmVUb0VuZE9mTm9kZScgOiAnbW92ZVRvU3RhcnRPZk5vZGUnO1xuICAgICAgICAgICAgY29uc3QgZW50cnkgPSBkb2N1bWVudFtcbiAgICAgICAgICAgICAgICBpc1ByZXZpb3VzID8gJ2dldFByZXZpb3VzVGV4dCcgOiAnZ2V0TmV4dFRleHQnXG4gICAgICAgICAgICBdKHBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZ2VbbW92ZV0oZW50cnkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVsc2UgcmVzb2x2ZSBhIHJhbmdlIGZyb20gdGhlIGNhcmV0IHBvc2l0aW9uIHdoZXJlIHRoZSBkcm9wIG9jY3VyZWQuXG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyh0YXJnZXQpO1xuICAgICAgICBsZXQgbmF0aXZlO1xuXG4gICAgICAgIC8vIENPTVBBVDogSW4gRmlyZWZveCwgYGNhcmV0UmFuZ2VGcm9tUG9pbnRgIGRvZXNuJ3QgZXhpc3QuICgyMDE2LzA3LzI1KVxuICAgICAgICBpZiAod2luZG93LmRvY3VtZW50LmNhcmV0UmFuZ2VGcm9tUG9pbnQpIHtcbiAgICAgICAgICAgIG5hdGl2ZSA9IHdpbmRvdy5kb2N1bWVudC5jYXJldFJhbmdlRnJvbVBvaW50KHgsIHkpO1xuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5kb2N1bWVudC5jYXJldFBvc2l0aW9uRnJvbVBvaW50KSB7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHdpbmRvdy5kb2N1bWVudC5jYXJldFBvc2l0aW9uRnJvbVBvaW50KHgsIHkpO1xuICAgICAgICAgICAgbmF0aXZlID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgICAgICBuYXRpdmUuc2V0U3RhcnQocG9zaXRpb24ub2Zmc2V0Tm9kZSwgcG9zaXRpb24ub2Zmc2V0KTtcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRFbmQocG9zaXRpb24ub2Zmc2V0Tm9kZSwgcG9zaXRpb24ub2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cuZG9jdW1lbnQuYm9keS5jcmVhdGVUZXh0UmFuZ2UpIHtcbiAgICAgICAgICAgIC8vIENPTVBBVDogSW4gSUUsIGBjYXJldFJhbmdlRnJvbVBvaW50YCBhbmRcbiAgICAgICAgICAgIC8vIGBjYXJldFBvc2l0aW9uRnJvbVBvaW50YCBkb24ndCBleGlzdC4gKDIwMTgvMDcvMTEpXG4gICAgICAgICAgICBuYXRpdmUgPSB3aW5kb3cuZG9jdW1lbnQuYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBuYXRpdmUubW92ZVRvUG9pbnQoeCwgeSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIElFMTEgd2lsbCByYWlzZSBhbiBgdW5zcGVjaWZpZWQgZXJyb3JgIGlmIGBtb3ZlVG9Qb2ludGAgaXNcbiAgICAgICAgICAgICAgICAvLyBjYWxsZWQgZHVyaW5nIGEgZHJvcEV2ZW50LlxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzb2x2ZSBhIFNsYXRlIHJhbmdlIGZyb20gdGhlIERPTSByYW5nZS5cbiAgICAgICAgY29uc3QgcmV0UmFuZ2UgPSBlZGl0b3IuZmluZFJhbmdlKG5hdGl2ZSk7XG4gICAgICAgIHJldHVybiByZXRSYW5nZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBwYXRoIG9mIGEgbmF0aXZlIERPTSBgZWxlbWVudGAgYnkgc2VhcmNoaW5nIFJlYWN0IHJlZnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybiB7TGlzdHxOdWxsfVxuICAgICAqL1xuXG4gICAgc3RhdGljIGZpbmRQYXRoKGVkaXRvciwgZWxlbWVudCk6IExpc3Q8bnVtYmVyPiB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRSZWYgPSBlZGl0b3IudG1wLmNvbnRlbnRSZWY7XG4gICAgICAgIGxldCBub2RlRWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgLy8gSWYgZWxlbWVudCBkb2VzIG5vdCBoYXZlIGEga2V5LCBpdCBpcyBsaWtlbHkgYSBzdHJpbmcgb3JcbiAgICAgICAgLy8gbWFyaywgcmV0dXJuIHRoZSBjbG9zZXN0IHBhcmVudCBOb2RlIHRoYXQgY2FuIGJlIGxvb2tlZCB1cC5cbiAgICAgICAgaWYgKCFub2RlRWxlbWVudC5oYXNBdHRyaWJ1dGUoREFUQV9BVFRSUy5LRVkpKSB7XG4gICAgICAgICAgICBub2RlRWxlbWVudCA9IG5vZGVFbGVtZW50LmNsb3Nlc3QoU0VMRUNUT1JTLktFWSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGVFbGVtZW50IHx8ICFub2RlRWxlbWVudC5nZXRBdHRyaWJ1dGUoREFUQV9BVFRSUy5LRVkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlRWxlbWVudCA9PT0gY29udGVudFJlZi5yb290Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFBhdGhVdGlscy5jcmVhdGUoW10pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VhcmNoID0gKGluc3RhbmNlLCBwKSA9PiB7XG4gICAgICAgICAgICBpZiAobm9kZUVsZW1lbnQgPT09IGluc3RhbmNlLnJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaW5zdGFuY2Uubm9kZVJlZnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5vZGVSZWZzID0gaW5zdGFuY2Uubm9kZVJlZnM7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5vZGVSZWYgb2Ygbm9kZVJlZnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXRQYXRoID0gc2VhcmNoKG5vZGVSZWYsIFsuLi5wLCBpXSk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGlmIChyZXRQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRQYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50Tm9kZVJlZiA9IGNvbnRlbnRSZWYubm9kZVJlZjtcbiAgICAgICAgY29uc3QgcGF0aCA9IHNlYXJjaChkb2N1bWVudE5vZGVSZWYsIFtdKTtcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFBhdGhVdGlscy5jcmVhdGUocGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhIFNsYXRlIHBvaW50IGZyb20gYSBET00gc2VsZWN0aW9uJ3MgYG5hdGl2ZU5vZGVgIGFuZCBgbmF0aXZlT2Zmc2V0YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IG5hdGl2ZU5vZGVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbmF0aXZlT2Zmc2V0XG4gICAgICogQHJldHVybiB7UG9pbnR9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZFBvaW50KGVkaXRvciwgbmF0aXZlTm9kZSwgbmF0aXZlT2Zmc2V0KSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIG5vZGU6IG5lYXJlc3ROb2RlLFxuICAgICAgICAgICAgb2Zmc2V0OiBuZWFyZXN0T2Zmc2V0XG4gICAgICAgIH0gPSBub3JtYWxpemVOb2RlQW5kT2Zmc2V0KG5hdGl2ZU5vZGUsIG5hdGl2ZU9mZnNldCk7XG5cbiAgICAgICAgY29uc3Qgd2luZG93ID0gZ2V0V2luZG93KG5hdGl2ZU5vZGUpO1xuICAgICAgICBjb25zdCB7IHBhcmVudE5vZGUgfSA9IG5lYXJlc3ROb2RlO1xuICAgICAgICBsZXQgbGVhZk5vZGUgPSBwYXJlbnROb2RlLmNsb3Nlc3QoU0VMRUNUT1JTLkxFQUYpO1xuICAgICAgICBsZXQgdGV4dE5vZGU7XG4gICAgICAgIGxldCBvZmZzZXQ7XG4gICAgICAgIGxldCBub2RlO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBob3cgZmFyIGludG8gdGhlIHRleHQgbm9kZSB0aGUgYG5lYXJlc3ROb2RlYCBpcywgc28gdGhhdCB3ZSBjYW5cbiAgICAgICAgLy8gZGV0ZXJtaW5lIHdoYXQgdGhlIG9mZnNldCByZWxhdGl2ZSB0byB0aGUgdGV4dCBub2RlIGlzLlxuICAgICAgICBpZiAobGVhZk5vZGUpIHtcbiAgICAgICAgICAgIHRleHROb2RlID0gbGVhZk5vZGUuY2xvc2VzdChTRUxFQ1RPUlMuVEVYVCk7XG4gICAgICAgICAgICBjb25zdCByYW5nZSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQodGV4dE5vZGUsIDApO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kKG5lYXJlc3ROb2RlLCBuZWFyZXN0T2Zmc2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gcmFuZ2UuY2xvbmVDb250ZW50cygpO1xuICAgICAgICAgICAgY29uc3QgemVyb1dpZHRocyA9IGNvbnRlbnRzLnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1JTLlpFUk9fV0lEVEgpO1xuXG4gICAgICAgICAgICBBcnJheS5mcm9tKHplcm9XaWR0aHMpLmZvckVhY2goKGVsOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDT01QQVQ6IEVkZ2UgaGFzIGEgYnVnIHdoZXJlIFJhbmdlLnByb3RvdHlwZS50b1N0cmluZygpIHdpbGwgY29udmVydCBcXG5cbiAgICAgICAgICAgIC8vIGludG8gXFxyXFxuLiBUaGUgYnVnIGNhdXNlcyBhIGxvb3Agd2hlbiBzbGF0ZS1yZWFjdCBhdHRlbXB0cyB0byByZXBvc2l0aW9uXG4gICAgICAgICAgICAvLyBpdHMgY3Vyc29yIHRvIG1hdGNoIHRoZSBuYXRpdmUgcG9zaXRpb24uIFVzZSB0ZXh0Q29udGVudC5sZW5ndGggaW5zdGVhZC5cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1pY3Jvc29mdC5jb20vZW4tdXMvbWljcm9zb2Z0LWVkZ2UvcGxhdGZvcm0vaXNzdWVzLzEwMjkxMTE2L1xuICAgICAgICAgICAgb2Zmc2V0ID0gY29udGVudHMudGV4dENvbnRlbnQubGVuZ3RoO1xuICAgICAgICAgICAgbm9kZSA9IHRleHROb2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRm9yIHZvaWQgbm9kZXMsIHRoZSBlbGVtZW50IHdpdGggdGhlIG9mZnNldCBrZXkgd2lsbCBiZSBhIGNvdXNpbiwgbm90IGFuXG4gICAgICAgICAgICAvLyBhbmNlc3Rvciwgc28gZmluZCBpdCBieSBnb2luZyBkb3duIGZyb20gdGhlIG5lYXJlc3Qgdm9pZCBwYXJlbnQuXG4gICAgICAgICAgICBjb25zdCB2b2lkTm9kZSA9IHBhcmVudE5vZGUuY2xvc2VzdChTRUxFQ1RPUlMuVk9JRCk7XG5cbiAgICAgICAgICAgIGlmICghdm9pZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGVhZk5vZGUgPSB2b2lkTm9kZS5xdWVyeVNlbGVjdG9yKFNFTEVDVE9SUy5MRUFGKTtcblxuICAgICAgICAgICAgaWYgKCFsZWFmTm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZXh0Tm9kZSA9IGxlYWZOb2RlLmNsb3Nlc3QoU0VMRUNUT1JTLlRFWFQpO1xuICAgICAgICAgICAgbm9kZSA9IGxlYWZOb2RlO1xuICAgICAgICAgICAgb2Zmc2V0ID0gbm9kZS50ZXh0Q29udGVudC5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBwYXJlbnQgbm9kZSBpcyBhIFNsYXRlIHplcm8td2lkdGggc3BhY2UsIHRoaXMgaXMgYmVjYXVzZSB0aGVcbiAgICAgICAgLy8gdGV4dCBub2RlIHNob3VsZCBoYXZlIG5vIGNoYXJhY3RlcnMuIEhvd2V2ZXIsIGR1cmluZyBJTUUgY29tcG9zaXRpb24gdGhlXG4gICAgICAgIC8vIEFTQ0lJIGNoYXJhY3RlcnMgd2lsbCBiZSBwcmVwZW5kZWQgdG8gdGhlIHplcm8td2lkdGggc3BhY2UsIHNvIHN1YnRyYWN0IDFcbiAgICAgICAgLy8gZnJvbSB0aGUgb2Zmc2V0IHRvIGFjY291bnQgZm9yIHRoZSB6ZXJvLXdpZHRoIHNwYWNlIGNoYXJhY3Rlci5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgb2Zmc2V0ID09PSBub2RlLnRleHRDb250ZW50Lmxlbmd0aCAmJlxuICAgICAgICAgICAgcGFyZW50Tm9kZS5oYXNBdHRyaWJ1dGUoREFUQV9BVFRSUy5aRVJPX1dJRFRIKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIG9mZnNldC0tO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBJZiBzb21lb25lIGlzIGNsaWNraW5nIGZyb20gb25lIFNsYXRlIGVkaXRvciBpbnRvIGFub3RoZXIsIHRoZVxuICAgICAgICAvLyBzZWxlY3QgZXZlbnQgZmlyZXMgdHdpY2UsIG9uY2UgZm9yIHRoZSBvbGQgZWRpdG9yJ3MgYGVsZW1lbnRgIGZpcnN0LCBhbmRcbiAgICAgICAgLy8gdGhlbiBhZnRlcndhcmRzIGZvciB0aGUgY29ycmVjdCBgZWxlbWVudGAuICgyMDE3LzAzLzAzKVxuICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmZpbmRQYXRoKHRleHROb2RlKTtcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCB7IGRvY3VtZW50IH0gPSB2YWx1ZTtcbiAgICAgICAgY29uc3QgcG9pbnQgPSBkb2N1bWVudC5jcmVhdGVQb2ludCh7IHBhdGgsIG9mZnNldCB9KTtcbiAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBTbGF0ZSByYW5nZSBmcm9tIGEgRE9NIHJhbmdlIG9yIHNlbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge1NlbGVjdGlvbn0gZG9tUmFuZ2VcbiAgICAgKiBAcmV0dXJuIHtSYW5nZX1cbiAgICAgKi9cblxuICAgIHN0YXRpYyBmaW5kUmFuZ2UoZWRpdG9yLCBkb21SYW5nZSkge1xuICAgICAgICBjb25zdCBlbCA9IGRvbVJhbmdlLmFuY2hvck5vZGUgfHwgZG9tUmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cbiAgICAgICAgaWYgKCFlbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZWwpO1xuXG4gICAgICAgIC8vIElmIHRoZSBgZG9tUmFuZ2VgIG9iamVjdCBpcyBhIERPTSBgUmFuZ2VgIG9yIGBTdGF0aWNSYW5nZWAgb2JqZWN0LCBjaGFuZ2UgaXRcbiAgICAgICAgLy8gaW50byBzb21ldGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgRE9NIGBTZWxlY3Rpb25gIGluc3RlYWQuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGRvbVJhbmdlIGluc3RhbmNlb2Ygd2luZG93LlJhbmdlIHx8XG4gICAgICAgICAgICAod2luZG93LlN0YXRpY1JhbmdlICYmIGRvbVJhbmdlIGluc3RhbmNlb2Ygd2luZG93LlN0YXRpY1JhbmdlKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGRvbVJhbmdlID0ge1xuICAgICAgICAgICAgICAgIGFuY2hvck5vZGU6IGRvbVJhbmdlLnN0YXJ0Q29udGFpbmVyLFxuICAgICAgICAgICAgICAgIGFuY2hvck9mZnNldDogZG9tUmFuZ2Uuc3RhcnRPZmZzZXQsXG4gICAgICAgICAgICAgICAgZm9jdXNOb2RlOiBkb21SYW5nZS5lbmRDb250YWluZXIsXG4gICAgICAgICAgICAgICAgZm9jdXNPZmZzZXQ6IGRvbVJhbmdlLmVuZE9mZnNldFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFuY2hvck5vZGUsXG4gICAgICAgICAgICBhbmNob3JPZmZzZXQsXG4gICAgICAgICAgICBmb2N1c05vZGUsXG4gICAgICAgICAgICBmb2N1c09mZnNldCxcbiAgICAgICAgICAgIGlzQ29sbGFwc2VkXG4gICAgICAgIH0gPSBkb21SYW5nZTtcbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCBhbmNob3IgPSBlZGl0b3IuZmluZFBvaW50KGFuY2hvck5vZGUsIGFuY2hvck9mZnNldCk7XG4gICAgICAgIGNvbnN0IGZvY3VzID0gaXNDb2xsYXBzZWRcbiAgICAgICAgICAgID8gYW5jaG9yXG4gICAgICAgICAgICA6IGVkaXRvci5maW5kUG9pbnQoZm9jdXNOb2RlLCBmb2N1c09mZnNldCk7XG5cbiAgICAgICAgaWYgKCFhbmNob3IgfHwgIWZvY3VzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKHtcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIGZvY3VzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByYW5nZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgU2xhdGUgc2VsZWN0aW9uIGZyb20gYSBET00gc2VsZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7U2VsZWN0aW9ufSBkb21TZWxlY3Rpb25cbiAgICAgKiBAcmV0dXJuIHtSYW5nZX1cbiAgICAgKi9cblxuICAgIHN0YXRpYyBmaW5kU2VsZWN0aW9uKGVkaXRvciwgZG9tU2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHsgdmFsdWUgfSA9IGVkaXRvcjtcbiAgICAgICAgY29uc3QgeyBkb2N1bWVudCB9ID0gdmFsdWU7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIHJhbmdlcywgdGhlIGVkaXRvciB3YXMgYmx1cnJlZCBuYXRpdmVseS5cbiAgICAgICAgaWYgKCFkb21TZWxlY3Rpb24ucmFuZ2VDb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRldGVybWluZSB0aGUgU2xhdGUgc2VsZWN0aW9uIGZyb20gdGhlIG5hdGl2ZSBvbmUuXG4gICAgICAgIGxldCByYW5nZSA9IGVkaXRvci5maW5kUmFuZ2UoZG9tU2VsZWN0aW9uKTtcblxuICAgICAgICBpZiAoIXJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgYW5jaG9yLCBmb2N1cyB9ID0gcmFuZ2U7XG4gICAgICAgIGNvbnN0IGFuY2hvclRleHQgPSBkb2N1bWVudC5nZXROb2RlKGFuY2hvci5wYXRoKTtcbiAgICAgICAgY29uc3QgZm9jdXNUZXh0ID0gZG9jdW1lbnQuZ2V0Tm9kZShmb2N1cy5wYXRoKTtcbiAgICAgICAgY29uc3QgYW5jaG9ySW5saW5lID0gZG9jdW1lbnQuZ2V0Q2xvc2VzdElubGluZShhbmNob3IucGF0aCk7XG4gICAgICAgIGNvbnN0IGZvY3VzSW5saW5lID0gZG9jdW1lbnQuZ2V0Q2xvc2VzdElubGluZShmb2N1cy5wYXRoKTtcbiAgICAgICAgY29uc3QgZm9jdXNCbG9jayA9IGRvY3VtZW50LmdldENsb3Nlc3RCbG9jayhmb2N1cy5wYXRoKTtcbiAgICAgICAgY29uc3QgYW5jaG9yQmxvY2sgPSBkb2N1bWVudC5nZXRDbG9zZXN0QmxvY2soYW5jaG9yLnBhdGgpO1xuXG4gICAgICAgIC8vIENPTVBBVDogSWYgdGhlIGFuY2hvciBwb2ludCBpcyBhdCB0aGUgc3RhcnQgb2YgYSBub24tdm9pZCwgYW5kIHRoZVxuICAgICAgICAvLyBmb2N1cyBwb2ludCBpcyBpbnNpZGUgYSB2b2lkIG5vZGUgd2l0aCBhbiBvZmZzZXQgdGhhdCBpc24ndCBgMGAsIHNldFxuICAgICAgICAvLyB0aGUgZm9jdXMgb2Zmc2V0IHRvIGAwYC4gVGhpcyBpcyBkdWUgdG8gdm9pZCBub2RlcyA8c3Bhbj4ncyBiZWluZ1xuICAgICAgICAvLyBwb3NpdGlvbmVkIG9mZiBzY3JlZW4sIHJlc3VsdGluZyBpbiB0aGUgb2Zmc2V0IGFsd2F5cyBiZWluZyBncmVhdGVyXG4gICAgICAgIC8vIHRoYW4gYDBgLiBTaW5jZSB3ZSBjYW4ndCBrbm93IHdoYXQgaXQgcmVhbGx5IHNob3VsZCBiZSwgYW5kIHNpbmNlIGFuXG4gICAgICAgIC8vIG9mZnNldCBvZiBgMGAgaXMgbGVzcyBkZXN0cnVjdGl2ZSBiZWNhdXNlIGl0IGNyZWF0ZXMgYSBoYW5naW5nXG4gICAgICAgIC8vIHNlbGVjdGlvbiwgZ28gd2l0aCBgMGAuICgyMDE3LzA5LzA3KVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBhbmNob3JCbG9jayAmJlxuICAgICAgICAgICAgIWVkaXRvci5pc1ZvaWQoYW5jaG9yQmxvY2spICYmXG4gICAgICAgICAgICBhbmNob3Iub2Zmc2V0ID09PSAwICYmXG4gICAgICAgICAgICBmb2N1c0Jsb2NrICYmXG4gICAgICAgICAgICBlZGl0b3IuaXNWb2lkKGZvY3VzQmxvY2spICYmXG4gICAgICAgICAgICBmb2N1cy5vZmZzZXQgIT09IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByYW5nZSA9IHJhbmdlLnNldEZvY3VzKGZvY3VzLnNldE9mZnNldCgwKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBzZWxlY3Rpb24gaXMgYXQgdGhlIGVuZCBvZiBhIG5vbi12b2lkIGlubGluZSBub2RlLCBhbmRcbiAgICAgICAgLy8gdGhlcmUgaXMgYSBub2RlIGFmdGVyIGl0LCBwdXQgaXQgaW4gdGhlIG5vZGUgYWZ0ZXIgaW5zdGVhZC4gVGhpc1xuICAgICAgICAvLyBzdGFuZGFyZGl6ZXMgdGhlIGJlaGF2aW9yLCBzaW5jZSBpdCdzIGluZGlzdGluZ3Vpc2hhYmxlIHRvIHRoZSB1c2VyLlxuICAgICAgICAvLyBzZWxlY3Rpb24gaXMgYXQgc3RhcnQgb2YgYSBub24tdm9pZCBpbmxpbmUgbm9kZVxuICAgICAgICAvLyB0aGVyZSBpcyBhIG5vZGUgYWZ0ZXIgaXQsIHB1dCBpdCBpbiB0aGUgbm9kZSBiZWZvcmUgaW5zdGVhZFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBhbmNob3JJbmxpbmUgJiZcbiAgICAgICAgICAgICFlZGl0b3IuaXNWb2lkKGFuY2hvcklubGluZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBibG9jayA9IGRvY3VtZW50LmdldENsb3Nlc3RCbG9jayhhbmNob3IucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXB0aCA9IGRvY3VtZW50LmdldERlcHRoKGJsb2NrLmtleSk7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBQYXRoVXRpbHMuZHJvcChhbmNob3IucGF0aCwgZGVwdGgpO1xuICAgICAgICAgICAgaWYgKGFuY2hvci5vZmZzZXQgPT09IGFuY2hvclRleHQudGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbbmV4dF0gPSBibG9jay50ZXh0cyh7IHBhdGg6IHJlbGF0aXZlUGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbLCBuZXh0UGF0aF0gPSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBhbmNob3IucGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGRlcHRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdChuZXh0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlID0gcmFuZ2UubW92ZUFuY2hvclRvKGFic29sdXRlUGF0aCwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChhbmNob3Iub2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpb3VzVGV4dF0gPSBibG9jay50ZXh0cyh7IHBhdGg6IHJlbGF0aXZlUGF0aCwgZGlyZWN0aW9uOiAnYmFja3dhcmQnIH0pO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpb3VzLCBwcmV2aW91c1BhdGhdID0gcHJldmlvdXNUZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBhbmNob3IucGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGRlcHRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdChwcmV2aW91c1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICByYW5nZSA9IHJhbmdlLm1vdmVBbmNob3JUbyhhYnNvbHV0ZVBhdGgsIHByZXZpb3VzLnRleHQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBmb2N1c0lubGluZSAmJlxuICAgICAgICAgICAgIWVkaXRvci5pc1ZvaWQoZm9jdXNJbmxpbmUpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgYmxvY2sgPSBkb2N1bWVudC5nZXRDbG9zZXN0QmxvY2soZm9jdXMucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXB0aCA9IGRvY3VtZW50LmdldERlcHRoKGJsb2NrLmtleSk7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBQYXRoVXRpbHMuZHJvcChmb2N1cy5wYXRoLCBkZXB0aCk7XG4gICAgICAgICAgICBpZiAoZm9jdXMub2Zmc2V0ID09PSBmb2N1c1RleHQudGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbbmV4dF0gPSBibG9jay50ZXh0cyh7IHBhdGg6IHJlbGF0aXZlUGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbLCBuZXh0UGF0aF0gPSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBmb2N1cy5wYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgZGVwdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KG5leHRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSByYW5nZS5tb3ZlRm9jdXNUbyhhYnNvbHV0ZVBhdGgsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9jdXMub2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpb3VzVGV4dEVudHJ5XSA9IGJsb2NrLnRleHRzKHsgcGF0aDogcmVsYXRpdmVQYXRoLCBkaXJlY3Rpb246ICdiYWNrd2FyZCcgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzVGV4dEVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFtwcmV2aW91cywgcHJldmlvdXNQYXRoXSA9IHByZXZpb3VzVGV4dEVudHJ5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBmb2N1cy5wYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgZGVwdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KHByZXZpb3VzUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlID0gcmFuZ2UubW92ZUZvY3VzVG8oYWJzb2x1dGVQYXRoLCBwcmV2aW91cy50ZXh0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZVNlbGVjdGlvbihyYW5nZSk7XG5cbiAgICAgICAgLy8gQ09NUEFUOiBFbnN1cmUgdGhhdCB0aGUgYGlzRm9jdXNlZGAgYXJndW1lbnQgaXMgc2V0LlxuICAgICAgICBzZWxlY3Rpb24gPSBzZWxlY3Rpb24uc2V0SXNGb2N1c2VkKHRydWUpO1xuXG4gICAgICAgIC8vIENPTVBBVDogUHJlc2VydmUgdGhlIG1hcmtzLCBzaW5jZSB3ZSBoYXZlIG5vIHdheSBvZiBrbm93aW5nIHdoYXQgdGhlIERPTVxuICAgICAgICAvLyBzZWxlY3Rpb24ncyBtYXJrcyB3ZXJlLiBUaGV5IHdpbGwgYmUgY2xlYXJlZCBhdXRvbWF0aWNhbGx5IGJ5IHRoZVxuICAgICAgICAvLyBgc2VsZWN0YCBjb21tYW5kIGlmIHRoZSBzZWxlY3Rpb24gbW92ZXMuXG4gICAgICAgIHNlbGVjdGlvbiA9IHNlbGVjdGlvbi5zZXQoJ21hcmtzJywgdmFsdWUuc2VsZWN0aW9uLm1hcmtzKTtcblxuICAgICAgICByZXR1cm4gc2VsZWN0aW9uO1xuICAgIH1cbn1cblxuLyoqXG4gKiBGcm9tIGEgRE9NIHNlbGVjdGlvbidzIGBub2RlYCBhbmQgYG9mZnNldGAsIG5vcm1hbGl6ZSBzbyB0aGF0IGl0IGFsd2F5c1xuICogcmVmZXJzIHRvIGEgdGV4dCBub2RlLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldFxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU5vZGVBbmRPZmZzZXQobm9kZSwgb2Zmc2V0KSB7XG4gICAgLy8gSWYgaXQncyBhbiBlbGVtZW50IG5vZGUsIGl0cyBvZmZzZXQgcmVmZXJzIHRvIHRoZSBpbmRleCBvZiBpdHMgY2hpbGRyZW5cbiAgICAvLyBpbmNsdWRpbmcgY29tbWVudCBub2Rlcywgc28gdHJ5IHRvIGZpbmQgdGhlIHJpZ2h0IHRleHQgY2hpbGQgbm9kZS5cbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBub2RlLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGlzTGFzdCA9IG9mZnNldCA9PT0gbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gaXNMYXN0ID8gJ2JhY2t3YXJkJyA6ICdmb3J3YXJkJztcbiAgICAgICAgY29uc3QgaW5kZXggPSBpc0xhc3QgPyBvZmZzZXQgLSAxIDogb2Zmc2V0O1xuICAgICAgICBub2RlID0gZ2V0RWRpdGFibGVDaGlsZChub2RlLCBpbmRleCwgZGlyZWN0aW9uKTtcblxuICAgICAgICAvLyBJZiB0aGUgbm9kZSBoYXMgY2hpbGRyZW4sIHRyYXZlcnNlIHVudGlsIHdlIGhhdmUgYSBsZWFmIG5vZGUuIExlYWYgbm9kZXNcbiAgICAgICAgLy8gY2FuIGJlIGVpdGhlciB0ZXh0IG5vZGVzLCBvciBvdGhlciB2b2lkIERPTSBub2Rlcy5cbiAgICAgICAgd2hpbGUgKG5vZGUubm9kZVR5cGUgPT09IDEgJiYgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaSA9IGlzTGFzdCA/IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggLSAxIDogMDtcbiAgICAgICAgICAgIG5vZGUgPSBnZXRFZGl0YWJsZUNoaWxkKG5vZGUsIGksIGRpcmVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIG5ldyBvZmZzZXQgaW5zaWRlIHRoZSB0ZXh0IG5vZGUuXG4gICAgICAgIG9mZnNldCA9IGlzTGFzdCA/IG5vZGUudGV4dENvbnRlbnQubGVuZ3RoIDogMDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG5vZGUgYW5kIG9mZnNldC5cbiAgICByZXR1cm4geyBub2RlLCBvZmZzZXQgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG5lYXJlc3QgZWRpdGFibGUgY2hpbGQgYXQgYGluZGV4YCBpbiBhIGBwYXJlbnRgLCBwcmVmZXJyaW5nXG4gKiBgZGlyZWN0aW9uYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge1N0cmluZ30gZGlyZWN0aW9uICgnZm9yd2FyZCcgb3IgJ2JhY2t3YXJkJylcbiAqIEByZXR1cm4ge0VsZW1lbnR8TnVsbH1cbiAqL1xuXG5mdW5jdGlvbiBnZXRFZGl0YWJsZUNoaWxkKHBhcmVudCwgaW5kZXgsIGRpcmVjdGlvbikge1xuICAgIGNvbnN0IHsgY2hpbGROb2RlcyB9ID0gcGFyZW50O1xuICAgIGxldCBjaGlsZCA9IGNoaWxkTm9kZXNbaW5kZXhdO1xuICAgIGxldCBpID0gaW5kZXg7XG4gICAgbGV0IHRyaWVkRm9yd2FyZCA9IGZhbHNlO1xuICAgIGxldCB0cmllZEJhY2t3YXJkID0gZmFsc2U7XG5cbiAgICAvLyBXaGlsZSB0aGUgY2hpbGQgaXMgYSBjb21tZW50IG5vZGUsIG9yIGFuIGVsZW1lbnQgbm9kZSB3aXRoIG5vIGNoaWxkcmVuLFxuICAgIC8vIGtlZXAgaXRlcmF0aW5nIHRvIGZpbmQgYSBzaWJsaW5nIG5vbi12b2lkLCBub24tY29tbWVudCBub2RlLlxuICAgIHdoaWxlIChcbiAgICAgICAgY2hpbGQubm9kZVR5cGUgPT09IDggfHxcbiAgICAgICAgKGNoaWxkLm5vZGVUeXBlID09PSAxICYmIGNoaWxkLmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB8fFxuICAgICAgICAoY2hpbGQubm9kZVR5cGUgPT09IDEgJiZcbiAgICAgICAgICAgIGNoaWxkLmdldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJykgPT09ICdmYWxzZScpXG4gICAgKSB7XG4gICAgICAgIGlmICh0cmllZEZvcndhcmQgJiYgdHJpZWRCYWNrd2FyZCkgYnJlYWs7XG5cbiAgICAgICAgaWYgKGkgPj0gY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRyaWVkRm9yd2FyZCA9IHRydWU7XG4gICAgICAgICAgICBpID0gaW5kZXggLSAxO1xuICAgICAgICAgICAgZGlyZWN0aW9uID0gJ2JhY2t3YXJkJztcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCAwKSB7XG4gICAgICAgICAgICB0cmllZEJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgIGkgPSBpbmRleCArIDE7XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSAnZm9yd2FyZCc7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2ZvcndhcmQnKSBpKys7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdiYWNrd2FyZCcpIGktLTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQgfHwgbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHF1ZXJpZXM6IFF1ZXJpZXNQbHVnaW5cbn07XG4iXX0=