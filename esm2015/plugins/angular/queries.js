import getWindow from 'get-window';
import { PathUtils } from 'slate';
import DATA_ATTRS from '../../constants/data-attributes';
import SELECTORS from '../../constants/selectors';
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
export default {
    queries: QueriesPlugin
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcmllcy5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInBsdWdpbnMvYW5ndWxhci9xdWVyaWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sU0FBUyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRWxDLE9BQU8sVUFBVSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3pELE9BQU8sU0FBUyxNQUFNLDJCQUEyQixDQUFDO0FBRWxELE1BQU0sYUFBYTtJQUNmOzs7Ozs7T0FNRztJQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUk7UUFDM0IsSUFBSSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFFekMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNiLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNaLE9BQU8sVUFBVSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUM7U0FDdEM7UUFFRCxNQUFNLE1BQU0sR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNYLE9BQU8sSUFBSSxDQUFDO2FBQ2Y7WUFFRCxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDVCxPQUFPLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDO2FBQ3BDO1lBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3hCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FB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LFFBQVEsS0FBSyxDQUFDO1FBQ3BCLENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxPQUFPLENBQUMsRUFDeEQ7UUFDRSxJQUFJLFlBQVksSUFBSSxhQUFhO1lBQUUsTUFBTTtRQUV6QyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFO1lBQ3hCLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDcEIsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxTQUFTLEdBQUcsVUFBVSxDQUFDO1lBQ3ZCLFNBQVM7U0FDWjtRQUVELElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQ3RCLFNBQVM7U0FDWjtRQUVELEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxTQUFTLEtBQUssU0FBUztZQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pDLElBQUksU0FBUyxLQUFLLFVBQVU7WUFBRSxDQUFDLEVBQUUsQ0FBQztLQUNyQztJQUVELE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQztBQUN6QixDQUFDO0FBRUQsZUFBZTtJQUNYLE9BQU8sRUFBRSxhQUFhO0NBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZ2V0V2luZG93IGZyb20gJ2dldC13aW5kb3cnO1xuaW1wb3J0IHsgUGF0aFV0aWxzIH0gZnJvbSAnc2xhdGUnO1xuaW1wb3J0IHsgTGlzdCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgREFUQV9BVFRSUyBmcm9tICcuLi8uLi9jb25zdGFudHMvZGF0YS1hdHRyaWJ1dGVzJztcbmltcG9ydCBTRUxFQ1RPUlMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL3NlbGVjdG9ycyc7XG5cbmNsYXNzIFF1ZXJpZXNQbHVnaW4ge1xuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIG5hdGl2ZSBET00gZWxlbWVudCBmb3IgYSBub2RlIGF0IGBwYXRoYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0FycmF5fExpc3R9IHBhdGhcbiAgICAgKiBAcmV0dXJuIHtET01Ob2RlfE51bGx9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZERPTU5vZGUoZWRpdG9yLCBwYXRoKSB7XG4gICAgICAgIHBhdGggPSBQYXRoVXRpbHMuY3JlYXRlKHBhdGgpO1xuICAgICAgICBjb25zdCBjb250ZW50UmVmID0gZWRpdG9yLnRtcC5jb250ZW50UmVmO1xuXG4gICAgICAgIGlmICghY29udGVudFJlZikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXBhdGguc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRSZWYucm9vdE5vZGUgfHwgbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlYXJjaCA9IChpbnN0YW5jZSwgcCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXAuc2l6ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS5yb290Tm9kZSB8fCBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHAuZmlyc3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3QgPSBwLnJlc3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZiA9IGluc3RhbmNlLmdldE5vZGVSZWYoaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuIHNlYXJjaChyZWYsIHJlc3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50Tm9kZVJlZiA9IGNvbnRlbnRSZWYubm9kZVJlZjtcbiAgICAgICAgY29uc3QgZWwgPSBzZWFyY2goZG9jdW1lbnROb2RlUmVmLCBwYXRoKTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBuYXRpdmUgRE9NIHNlbGVjdGlvbiBwb2ludCBmcm9tIGEgU2xhdGUgYHBvaW50YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge1BvaW50fSBwb2ludFxuICAgICAqIEByZXR1cm4ge09iamVjdHxOdWxsfVxuICAgICAqL1xuXG4gICAgc3RhdGljIGZpbmRET01Qb2ludChlZGl0b3IsIHBvaW50KSB7XG4gICAgICAgIGNvbnN0IGVsID0gZWRpdG9yLmZpbmRET01Ob2RlKHBvaW50LnBhdGgpO1xuICAgICAgICBsZXQgc3RhcnQgPSAwO1xuXG4gICAgICAgIGlmICghZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9yIGVhY2ggbGVhZiwgd2UgbmVlZCB0byBpc29sYXRlIGl0cyBjb250ZW50LCB3aGljaCBtZWFucyBmaWx0ZXJpbmcgdG8gaXRzXG4gICAgICAgIC8vIGRpcmVjdCB0ZXh0IGFuZCB6ZXJvLXdpZHRoIHNwYW5zLiAoV2UgaGF2ZSB0byBmaWx0ZXIgb3V0IGFueSBvdGhlciBzaWJsaW5nc1xuICAgICAgICAvLyB0aGF0IG1heSBoYXZlIGJlZW4gcmVuZGVyZWQgYWxvbmdzaWRlIHRoZW0uKVxuICAgICAgICBjb25zdCB0ZXh0czogYW55ID0gQXJyYXkuZnJvbShcbiAgICAgICAgICAgIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoYCR7U0VMRUNUT1JTLlNUUklOR30sICR7U0VMRUNUT1JTLlpFUk9fV0lEVEh9YClcbiAgICAgICAgKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHRleHQgb2YgdGV4dHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0ZXh0LmNoaWxkTm9kZXNbMF07XG4gICAgICAgICAgICBjb25zdCBkb21MZW5ndGggPSBub2RlLnRleHRDb250ZW50Lmxlbmd0aDtcbiAgICAgICAgICAgIGxldCBzbGF0ZUxlbmd0aCA9IGRvbUxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHRleHQuaGFzQXR0cmlidXRlKERBVEFfQVRUUlMuTEVOR1RIKSkge1xuICAgICAgICAgICAgICAgIHNsYXRlTGVuZ3RoID0gcGFyc2VJbnQoXG4gICAgICAgICAgICAgICAgICAgIHRleHQuZ2V0QXR0cmlidXRlKERBVEFfQVRUUlMuTEVOR1RIKSxcbiAgICAgICAgICAgICAgICAgICAgMTBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIHNsYXRlTGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAocG9pbnQub2Zmc2V0IDw9IGVuZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICBkb21MZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KDAsIHBvaW50Lm9mZnNldCAtIHN0YXJ0KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IGVtcHR5IHRleHQgc2VsZWN0aW9uLCBwcmV2ZW50IGRlbGV0ZSBjb21tZW50IG9mIEFuZ3VsYXIgd2hlbiBjbGVhciBjb21wc2l0aW9uIGlucHV0XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gMCAmJiBkb21MZW5ndGggPT09IDEgJiYgbm9kZS50ZXh0Q29udGVudCA9PT0gJ1xcdTIwMEInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IG5vZGUsIG9mZnNldDogb2Zmc2V0ICsgMSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4geyBub2RlLCBvZmZzZXQgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhcnQgPSBlbmQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgbmF0aXZlIERPTSByYW5nZSBmcm9tIGEgU2xhdGUgYHJhbmdlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge1JhbmdlfSByYW5nZVxuICAgICAqIEByZXR1cm4ge0RPTVJhbmdlfE51bGx9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZERPTVJhbmdlKGVkaXRvciwgcmFuZ2UpIHtcbiAgICAgICAgY29uc3QgeyBhbmNob3IsIGZvY3VzLCBpc0JhY2t3YXJkLCBpc0NvbGxhcHNlZCB9ID0gcmFuZ2U7XG4gICAgICAgIGNvbnN0IGRvbUFuY2hvciA9IGVkaXRvci5maW5kRE9NUG9pbnQoYW5jaG9yKTtcbiAgICAgICAgY29uc3QgZG9tRm9jdXMgPSBpc0NvbGxhcHNlZCA/IGRvbUFuY2hvciA6IGVkaXRvci5maW5kRE9NUG9pbnQoZm9jdXMpO1xuXG4gICAgICAgIGlmICghZG9tQW5jaG9yIHx8ICFkb21Gb2N1cykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZG9tQW5jaG9yLm5vZGUpO1xuICAgICAgICBjb25zdCByID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaXNCYWNrd2FyZCA/IGRvbUZvY3VzIDogZG9tQW5jaG9yO1xuICAgICAgICBjb25zdCBlbmQgPSBpc0JhY2t3YXJkID8gZG9tQW5jaG9yIDogZG9tRm9jdXM7XG4gICAgICAgIHIuc2V0U3RhcnQoc3RhcnQubm9kZSwgc3RhcnQub2Zmc2V0KTtcbiAgICAgICAgci5zZXRFbmQoZW5kLm5vZGUsIGVuZC5vZmZzZXQpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgU2xhdGUgbm9kZSBmcm9tIGEgbmF0aXZlIERPTSBgZWxlbWVudGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybiB7TGlzdHxOdWxsfVxuICAgICAqL1xuXG4gICAgc3RhdGljIGZpbmROb2RlKGVkaXRvciwgZWxlbWVudCkge1xuICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmZpbmRQYXRoKGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBlZGl0b3I7XG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQuZ2V0Tm9kZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0YXJnZXQgcmFuZ2UgZnJvbSBhIERPTSBgZXZlbnRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHJldHVybiB7UmFuZ2V9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZEV2ZW50UmFuZ2UoZWRpdG9yLCBldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQubmF0aXZlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50ID0gZXZlbnQubmF0aXZlRXZlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGNsaWVudFg6IHgsIGNsaWVudFk6IHksIHRhcmdldCB9ID0gZXZlbnQ7XG4gICAgICAgIGlmICh4ID09IG51bGwgfHwgeSA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBlZGl0b3I7XG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmZpbmRQYXRoKGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGlmICghcGF0aCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LmdldE5vZGUocGF0aCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGRyb3AgdGFyZ2V0IGlzIGluc2lkZSBhIHZvaWQgbm9kZSwgbW92ZSBpdCBpbnRvIGVpdGhlciB0aGUgbmV4dCBvclxuICAgICAgICAvLyBwcmV2aW91cyBub2RlLCBkZXBlbmRpbmcgb24gd2hpY2ggc2lkZSB0aGUgYHhgIGFuZCBgeWAgY29vcmRpbmF0ZXMgYXJlXG4gICAgICAgIC8vIGNsb3Nlc3QgdG8uXG4gICAgICAgIGlmIChlZGl0b3IuaXNWb2lkKG5vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc3QgaXNQcmV2aW91cyA9XG4gICAgICAgICAgICAgICAgbm9kZS5vYmplY3QgPT09ICdpbmxpbmUnXG4gICAgICAgICAgICAgICAgICAgID8geCAtIHJlY3QubGVmdCA8IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLSB4XG4gICAgICAgICAgICAgICAgICAgIDogeSAtIHJlY3QudG9wIDwgcmVjdC50b3AgKyByZWN0LmhlaWdodCAtIHk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gKGRvY3VtZW50IGFzIGFueSkuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgIGNvbnN0IG1vdmUgPSBpc1ByZXZpb3VzID8gJ21vdmVUb0VuZE9mTm9kZScgOiAnbW92ZVRvU3RhcnRPZk5vZGUnO1xuICAgICAgICAgICAgY29uc3QgZW50cnkgPSBkb2N1bWVudFtcbiAgICAgICAgICAgICAgICBpc1ByZXZpb3VzID8gJ2dldFByZXZpb3VzVGV4dCcgOiAnZ2V0TmV4dFRleHQnXG4gICAgICAgICAgICBdKHBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZ2VbbW92ZV0oZW50cnkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVsc2UgcmVzb2x2ZSBhIHJhbmdlIGZyb20gdGhlIGNhcmV0IHBvc2l0aW9uIHdoZXJlIHRoZSBkcm9wIG9jY3VyZWQuXG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyh0YXJnZXQpO1xuICAgICAgICBsZXQgbmF0aXZlO1xuXG4gICAgICAgIC8vIENPTVBBVDogSW4gRmlyZWZveCwgYGNhcmV0UmFuZ2VGcm9tUG9pbnRgIGRvZXNuJ3QgZXhpc3QuICgyMDE2LzA3LzI1KVxuICAgICAgICBpZiAod2luZG93LmRvY3VtZW50LmNhcmV0UmFuZ2VGcm9tUG9pbnQpIHtcbiAgICAgICAgICAgIG5hdGl2ZSA9IHdpbmRvdy5kb2N1bWVudC5jYXJldFJhbmdlRnJvbVBvaW50KHgsIHkpO1xuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5kb2N1bWVudC5jYXJldFBvc2l0aW9uRnJvbVBvaW50KSB7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHdpbmRvdy5kb2N1bWVudC5jYXJldFBvc2l0aW9uRnJvbVBvaW50KHgsIHkpO1xuICAgICAgICAgICAgbmF0aXZlID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgICAgICBuYXRpdmUuc2V0U3RhcnQocG9zaXRpb24ub2Zmc2V0Tm9kZSwgcG9zaXRpb24ub2Zmc2V0KTtcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRFbmQocG9zaXRpb24ub2Zmc2V0Tm9kZSwgcG9zaXRpb24ub2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cuZG9jdW1lbnQuYm9keS5jcmVhdGVUZXh0UmFuZ2UpIHtcbiAgICAgICAgICAgIC8vIENPTVBBVDogSW4gSUUsIGBjYXJldFJhbmdlRnJvbVBvaW50YCBhbmRcbiAgICAgICAgICAgIC8vIGBjYXJldFBvc2l0aW9uRnJvbVBvaW50YCBkb24ndCBleGlzdC4gKDIwMTgvMDcvMTEpXG4gICAgICAgICAgICBuYXRpdmUgPSB3aW5kb3cuZG9jdW1lbnQuYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBuYXRpdmUubW92ZVRvUG9pbnQoeCwgeSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIElFMTEgd2lsbCByYWlzZSBhbiBgdW5zcGVjaWZpZWQgZXJyb3JgIGlmIGBtb3ZlVG9Qb2ludGAgaXNcbiAgICAgICAgICAgICAgICAvLyBjYWxsZWQgZHVyaW5nIGEgZHJvcEV2ZW50LlxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzb2x2ZSBhIFNsYXRlIHJhbmdlIGZyb20gdGhlIERPTSByYW5nZS5cbiAgICAgICAgY29uc3QgcmV0UmFuZ2UgPSBlZGl0b3IuZmluZFJhbmdlKG5hdGl2ZSk7XG4gICAgICAgIHJldHVybiByZXRSYW5nZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBwYXRoIG9mIGEgbmF0aXZlIERPTSBgZWxlbWVudGAgYnkgc2VhcmNoaW5nIFJlYWN0IHJlZnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybiB7TGlzdHxOdWxsfVxuICAgICAqL1xuXG4gICAgc3RhdGljIGZpbmRQYXRoKGVkaXRvciwgZWxlbWVudCk6IExpc3Q8bnVtYmVyPiB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRSZWYgPSBlZGl0b3IudG1wLmNvbnRlbnRSZWY7XG4gICAgICAgIGxldCBub2RlRWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgLy8gSWYgZWxlbWVudCBkb2VzIG5vdCBoYXZlIGEga2V5LCBpdCBpcyBsaWtlbHkgYSBzdHJpbmcgb3JcbiAgICAgICAgLy8gbWFyaywgcmV0dXJuIHRoZSBjbG9zZXN0IHBhcmVudCBOb2RlIHRoYXQgY2FuIGJlIGxvb2tlZCB1cC5cbiAgICAgICAgaWYgKCFub2RlRWxlbWVudC5oYXNBdHRyaWJ1dGUoREFUQV9BVFRSUy5LRVkpKSB7XG4gICAgICAgICAgICBub2RlRWxlbWVudCA9IG5vZGVFbGVtZW50LmNsb3Nlc3QoU0VMRUNUT1JTLktFWSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGVFbGVtZW50IHx8ICFub2RlRWxlbWVudC5nZXRBdHRyaWJ1dGUoREFUQV9BVFRSUy5LRVkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlRWxlbWVudCA9PT0gY29udGVudFJlZi5yb290Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFBhdGhVdGlscy5jcmVhdGUoW10pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VhcmNoID0gKGluc3RhbmNlLCBwKSA9PiB7XG4gICAgICAgICAgICBpZiAobm9kZUVsZW1lbnQgPT09IGluc3RhbmNlLnJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaW5zdGFuY2Uubm9kZVJlZnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5vZGVSZWZzID0gaW5zdGFuY2Uubm9kZVJlZnM7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5vZGVSZWYgb2Ygbm9kZVJlZnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXRQYXRoID0gc2VhcmNoKG5vZGVSZWYsIFsuLi5wLCBpXSk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGlmIChyZXRQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRQYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50Tm9kZVJlZiA9IGNvbnRlbnRSZWYubm9kZVJlZjtcbiAgICAgICAgY29uc3QgcGF0aCA9IHNlYXJjaChkb2N1bWVudE5vZGVSZWYsIFtdKTtcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFBhdGhVdGlscy5jcmVhdGUocGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhIFNsYXRlIHBvaW50IGZyb20gYSBET00gc2VsZWN0aW9uJ3MgYG5hdGl2ZU5vZGVgIGFuZCBgbmF0aXZlT2Zmc2V0YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IG5hdGl2ZU5vZGVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbmF0aXZlT2Zmc2V0XG4gICAgICogQHJldHVybiB7UG9pbnR9XG4gICAgICovXG5cbiAgICBzdGF0aWMgZmluZFBvaW50KGVkaXRvciwgbmF0aXZlTm9kZSwgbmF0aXZlT2Zmc2V0KSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIG5vZGU6IG5lYXJlc3ROb2RlLFxuICAgICAgICAgICAgb2Zmc2V0OiBuZWFyZXN0T2Zmc2V0XG4gICAgICAgIH0gPSBub3JtYWxpemVOb2RlQW5kT2Zmc2V0KG5hdGl2ZU5vZGUsIG5hdGl2ZU9mZnNldCk7XG5cbiAgICAgICAgY29uc3Qgd2luZG93ID0gZ2V0V2luZG93KG5hdGl2ZU5vZGUpO1xuICAgICAgICBjb25zdCB7IHBhcmVudE5vZGUgfSA9IG5lYXJlc3ROb2RlO1xuICAgICAgICBsZXQgbGVhZk5vZGUgPSBwYXJlbnROb2RlLmNsb3Nlc3QoU0VMRUNUT1JTLkxFQUYpO1xuICAgICAgICBsZXQgdGV4dE5vZGU7XG4gICAgICAgIGxldCBvZmZzZXQ7XG4gICAgICAgIGxldCBub2RlO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBob3cgZmFyIGludG8gdGhlIHRleHQgbm9kZSB0aGUgYG5lYXJlc3ROb2RlYCBpcywgc28gdGhhdCB3ZSBjYW5cbiAgICAgICAgLy8gZGV0ZXJtaW5lIHdoYXQgdGhlIG9mZnNldCByZWxhdGl2ZSB0byB0aGUgdGV4dCBub2RlIGlzLlxuICAgICAgICBpZiAobGVhZk5vZGUpIHtcbiAgICAgICAgICAgIHRleHROb2RlID0gbGVhZk5vZGUuY2xvc2VzdChTRUxFQ1RPUlMuVEVYVCk7XG4gICAgICAgICAgICBjb25zdCByYW5nZSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQodGV4dE5vZGUsIDApO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kKG5lYXJlc3ROb2RlLCBuZWFyZXN0T2Zmc2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gcmFuZ2UuY2xvbmVDb250ZW50cygpO1xuICAgICAgICAgICAgY29uc3QgemVyb1dpZHRocyA9IGNvbnRlbnRzLnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1JTLlpFUk9fV0lEVEgpO1xuXG4gICAgICAgICAgICBBcnJheS5mcm9tKHplcm9XaWR0aHMpLmZvckVhY2goKGVsOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDT01QQVQ6IEVkZ2UgaGFzIGEgYnVnIHdoZXJlIFJhbmdlLnByb3RvdHlwZS50b1N0cmluZygpIHdpbGwgY29udmVydCBcXG5cbiAgICAgICAgICAgIC8vIGludG8gXFxyXFxuLiBUaGUgYnVnIGNhdXNlcyBhIGxvb3Agd2hlbiBzbGF0ZS1yZWFjdCBhdHRlbXB0cyB0byByZXBvc2l0aW9uXG4gICAgICAgICAgICAvLyBpdHMgY3Vyc29yIHRvIG1hdGNoIHRoZSBuYXRpdmUgcG9zaXRpb24uIFVzZSB0ZXh0Q29udGVudC5sZW5ndGggaW5zdGVhZC5cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1pY3Jvc29mdC5jb20vZW4tdXMvbWljcm9zb2Z0LWVkZ2UvcGxhdGZvcm0vaXNzdWVzLzEwMjkxMTE2L1xuICAgICAgICAgICAgb2Zmc2V0ID0gY29udGVudHMudGV4dENvbnRlbnQubGVuZ3RoO1xuICAgICAgICAgICAgbm9kZSA9IHRleHROb2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRm9yIHZvaWQgbm9kZXMsIHRoZSBlbGVtZW50IHdpdGggdGhlIG9mZnNldCBrZXkgd2lsbCBiZSBhIGNvdXNpbiwgbm90IGFuXG4gICAgICAgICAgICAvLyBhbmNlc3Rvciwgc28gZmluZCBpdCBieSBnb2luZyBkb3duIGZyb20gdGhlIG5lYXJlc3Qgdm9pZCBwYXJlbnQuXG4gICAgICAgICAgICBjb25zdCB2b2lkTm9kZSA9IHBhcmVudE5vZGUuY2xvc2VzdChTRUxFQ1RPUlMuVk9JRCk7XG5cbiAgICAgICAgICAgIGlmICghdm9pZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGVhZk5vZGUgPSB2b2lkTm9kZS5xdWVyeVNlbGVjdG9yKFNFTEVDVE9SUy5MRUFGKTtcblxuICAgICAgICAgICAgaWYgKCFsZWFmTm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZXh0Tm9kZSA9IGxlYWZOb2RlLmNsb3Nlc3QoU0VMRUNUT1JTLlRFWFQpO1xuICAgICAgICAgICAgbm9kZSA9IGxlYWZOb2RlO1xuICAgICAgICAgICAgb2Zmc2V0ID0gbm9kZS50ZXh0Q29udGVudC5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBwYXJlbnQgbm9kZSBpcyBhIFNsYXRlIHplcm8td2lkdGggc3BhY2UsIHRoaXMgaXMgYmVjYXVzZSB0aGVcbiAgICAgICAgLy8gdGV4dCBub2RlIHNob3VsZCBoYXZlIG5vIGNoYXJhY3RlcnMuIEhvd2V2ZXIsIGR1cmluZyBJTUUgY29tcG9zaXRpb24gdGhlXG4gICAgICAgIC8vIEFTQ0lJIGNoYXJhY3RlcnMgd2lsbCBiZSBwcmVwZW5kZWQgdG8gdGhlIHplcm8td2lkdGggc3BhY2UsIHNvIHN1YnRyYWN0IDFcbiAgICAgICAgLy8gZnJvbSB0aGUgb2Zmc2V0IHRvIGFjY291bnQgZm9yIHRoZSB6ZXJvLXdpZHRoIHNwYWNlIGNoYXJhY3Rlci5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgb2Zmc2V0ID09PSBub2RlLnRleHRDb250ZW50Lmxlbmd0aCAmJlxuICAgICAgICAgICAgcGFyZW50Tm9kZS5oYXNBdHRyaWJ1dGUoREFUQV9BVFRSUy5aRVJPX1dJRFRIKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIG9mZnNldC0tO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBJZiBzb21lb25lIGlzIGNsaWNraW5nIGZyb20gb25lIFNsYXRlIGVkaXRvciBpbnRvIGFub3RoZXIsIHRoZVxuICAgICAgICAvLyBzZWxlY3QgZXZlbnQgZmlyZXMgdHdpY2UsIG9uY2UgZm9yIHRoZSBvbGQgZWRpdG9yJ3MgYGVsZW1lbnRgIGZpcnN0LCBhbmRcbiAgICAgICAgLy8gdGhlbiBhZnRlcndhcmRzIGZvciB0aGUgY29ycmVjdCBgZWxlbWVudGAuICgyMDE3LzAzLzAzKVxuICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmZpbmRQYXRoKHRleHROb2RlKTtcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCB7IGRvY3VtZW50IH0gPSB2YWx1ZTtcbiAgICAgICAgY29uc3QgcG9pbnQgPSBkb2N1bWVudC5jcmVhdGVQb2ludCh7IHBhdGgsIG9mZnNldCB9KTtcbiAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBTbGF0ZSByYW5nZSBmcm9tIGEgRE9NIHJhbmdlIG9yIHNlbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge1NlbGVjdGlvbn0gZG9tUmFuZ2VcbiAgICAgKiBAcmV0dXJuIHtSYW5nZX1cbiAgICAgKi9cblxuICAgIHN0YXRpYyBmaW5kUmFuZ2UoZWRpdG9yLCBkb21SYW5nZSkge1xuICAgICAgICBjb25zdCBlbCA9IGRvbVJhbmdlLmFuY2hvck5vZGUgfHwgZG9tUmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cbiAgICAgICAgaWYgKCFlbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZWwpO1xuXG4gICAgICAgIC8vIElmIHRoZSBgZG9tUmFuZ2VgIG9iamVjdCBpcyBhIERPTSBgUmFuZ2VgIG9yIGBTdGF0aWNSYW5nZWAgb2JqZWN0LCBjaGFuZ2UgaXRcbiAgICAgICAgLy8gaW50byBzb21ldGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgRE9NIGBTZWxlY3Rpb25gIGluc3RlYWQuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGRvbVJhbmdlIGluc3RhbmNlb2Ygd2luZG93LlJhbmdlIHx8XG4gICAgICAgICAgICAod2luZG93LlN0YXRpY1JhbmdlICYmIGRvbVJhbmdlIGluc3RhbmNlb2Ygd2luZG93LlN0YXRpY1JhbmdlKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGRvbVJhbmdlID0ge1xuICAgICAgICAgICAgICAgIGFuY2hvck5vZGU6IGRvbVJhbmdlLnN0YXJ0Q29udGFpbmVyLFxuICAgICAgICAgICAgICAgIGFuY2hvck9mZnNldDogZG9tUmFuZ2Uuc3RhcnRPZmZzZXQsXG4gICAgICAgICAgICAgICAgZm9jdXNOb2RlOiBkb21SYW5nZS5lbmRDb250YWluZXIsXG4gICAgICAgICAgICAgICAgZm9jdXNPZmZzZXQ6IGRvbVJhbmdlLmVuZE9mZnNldFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFuY2hvck5vZGUsXG4gICAgICAgICAgICBhbmNob3JPZmZzZXQsXG4gICAgICAgICAgICBmb2N1c05vZGUsXG4gICAgICAgICAgICBmb2N1c09mZnNldCxcbiAgICAgICAgICAgIGlzQ29sbGFwc2VkXG4gICAgICAgIH0gPSBkb21SYW5nZTtcbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCBhbmNob3IgPSBlZGl0b3IuZmluZFBvaW50KGFuY2hvck5vZGUsIGFuY2hvck9mZnNldCk7XG4gICAgICAgIGNvbnN0IGZvY3VzID0gaXNDb2xsYXBzZWRcbiAgICAgICAgICAgID8gYW5jaG9yXG4gICAgICAgICAgICA6IGVkaXRvci5maW5kUG9pbnQoZm9jdXNOb2RlLCBmb2N1c09mZnNldCk7XG5cbiAgICAgICAgaWYgKCFhbmNob3IgfHwgIWZvY3VzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKHtcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIGZvY3VzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByYW5nZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgU2xhdGUgc2VsZWN0aW9uIGZyb20gYSBET00gc2VsZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7U2VsZWN0aW9ufSBkb21TZWxlY3Rpb25cbiAgICAgKiBAcmV0dXJuIHtSYW5nZX1cbiAgICAgKi9cblxuICAgIHN0YXRpYyBmaW5kU2VsZWN0aW9uKGVkaXRvciwgZG9tU2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHsgdmFsdWUgfSA9IGVkaXRvcjtcbiAgICAgICAgY29uc3QgeyBkb2N1bWVudCB9ID0gdmFsdWU7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIHJhbmdlcywgdGhlIGVkaXRvciB3YXMgYmx1cnJlZCBuYXRpdmVseS5cbiAgICAgICAgaWYgKCFkb21TZWxlY3Rpb24ucmFuZ2VDb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGRldGVybWluZSB0aGUgU2xhdGUgc2VsZWN0aW9uIGZyb20gdGhlIG5hdGl2ZSBvbmUuXG4gICAgICAgIGxldCByYW5nZSA9IGVkaXRvci5maW5kUmFuZ2UoZG9tU2VsZWN0aW9uKTtcblxuICAgICAgICBpZiAoIXJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgYW5jaG9yLCBmb2N1cyB9ID0gcmFuZ2U7XG4gICAgICAgIGNvbnN0IGFuY2hvclRleHQgPSBkb2N1bWVudC5nZXROb2RlKGFuY2hvci5wYXRoKTtcbiAgICAgICAgY29uc3QgZm9jdXNUZXh0ID0gZG9jdW1lbnQuZ2V0Tm9kZShmb2N1cy5wYXRoKTtcbiAgICAgICAgY29uc3QgYW5jaG9ySW5saW5lID0gZG9jdW1lbnQuZ2V0Q2xvc2VzdElubGluZShhbmNob3IucGF0aCk7XG4gICAgICAgIGNvbnN0IGZvY3VzSW5saW5lID0gZG9jdW1lbnQuZ2V0Q2xvc2VzdElubGluZShmb2N1cy5wYXRoKTtcbiAgICAgICAgY29uc3QgZm9jdXNCbG9jayA9IGRvY3VtZW50LmdldENsb3Nlc3RCbG9jayhmb2N1cy5wYXRoKTtcbiAgICAgICAgY29uc3QgYW5jaG9yQmxvY2sgPSBkb2N1bWVudC5nZXRDbG9zZXN0QmxvY2soYW5jaG9yLnBhdGgpO1xuXG4gICAgICAgIC8vIENPTVBBVDogSWYgdGhlIGFuY2hvciBwb2ludCBpcyBhdCB0aGUgc3RhcnQgb2YgYSBub24tdm9pZCwgYW5kIHRoZVxuICAgICAgICAvLyBmb2N1cyBwb2ludCBpcyBpbnNpZGUgYSB2b2lkIG5vZGUgd2l0aCBhbiBvZmZzZXQgdGhhdCBpc24ndCBgMGAsIHNldFxuICAgICAgICAvLyB0aGUgZm9jdXMgb2Zmc2V0IHRvIGAwYC4gVGhpcyBpcyBkdWUgdG8gdm9pZCBub2RlcyA8c3Bhbj4ncyBiZWluZ1xuICAgICAgICAvLyBwb3NpdGlvbmVkIG9mZiBzY3JlZW4sIHJlc3VsdGluZyBpbiB0aGUgb2Zmc2V0IGFsd2F5cyBiZWluZyBncmVhdGVyXG4gICAgICAgIC8vIHRoYW4gYDBgLiBTaW5jZSB3ZSBjYW4ndCBrbm93IHdoYXQgaXQgcmVhbGx5IHNob3VsZCBiZSwgYW5kIHNpbmNlIGFuXG4gICAgICAgIC8vIG9mZnNldCBvZiBgMGAgaXMgbGVzcyBkZXN0cnVjdGl2ZSBiZWNhdXNlIGl0IGNyZWF0ZXMgYSBoYW5naW5nXG4gICAgICAgIC8vIHNlbGVjdGlvbiwgZ28gd2l0aCBgMGAuICgyMDE3LzA5LzA3KVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBhbmNob3JCbG9jayAmJlxuICAgICAgICAgICAgIWVkaXRvci5pc1ZvaWQoYW5jaG9yQmxvY2spICYmXG4gICAgICAgICAgICBhbmNob3Iub2Zmc2V0ID09PSAwICYmXG4gICAgICAgICAgICBmb2N1c0Jsb2NrICYmXG4gICAgICAgICAgICBlZGl0b3IuaXNWb2lkKGZvY3VzQmxvY2spICYmXG4gICAgICAgICAgICBmb2N1cy5vZmZzZXQgIT09IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByYW5nZSA9IHJhbmdlLnNldEZvY3VzKGZvY3VzLnNldE9mZnNldCgwKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBzZWxlY3Rpb24gaXMgYXQgdGhlIGVuZCBvZiBhIG5vbi12b2lkIGlubGluZSBub2RlLCBhbmRcbiAgICAgICAgLy8gdGhlcmUgaXMgYSBub2RlIGFmdGVyIGl0LCBwdXQgaXQgaW4gdGhlIG5vZGUgYWZ0ZXIgaW5zdGVhZC4gVGhpc1xuICAgICAgICAvLyBzdGFuZGFyZGl6ZXMgdGhlIGJlaGF2aW9yLCBzaW5jZSBpdCdzIGluZGlzdGluZ3Vpc2hhYmxlIHRvIHRoZSB1c2VyLlxuICAgICAgICAvLyBzZWxlY3Rpb24gaXMgYXQgc3RhcnQgb2YgYSBub24tdm9pZCBpbmxpbmUgbm9kZVxuICAgICAgICAvLyB0aGVyZSBpcyBhIG5vZGUgYWZ0ZXIgaXQsIHB1dCBpdCBpbiB0aGUgbm9kZSBiZWZvcmUgaW5zdGVhZFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBhbmNob3JJbmxpbmUgJiZcbiAgICAgICAgICAgICFlZGl0b3IuaXNWb2lkKGFuY2hvcklubGluZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBibG9jayA9IGRvY3VtZW50LmdldENsb3Nlc3RCbG9jayhhbmNob3IucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXB0aCA9IGRvY3VtZW50LmdldERlcHRoKGJsb2NrLmtleSk7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBQYXRoVXRpbHMuZHJvcChhbmNob3IucGF0aCwgZGVwdGgpO1xuICAgICAgICAgICAgaWYgKGFuY2hvci5vZmZzZXQgPT09IGFuY2hvclRleHQudGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbbmV4dF0gPSBibG9jay50ZXh0cyh7IHBhdGg6IHJlbGF0aXZlUGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbLCBuZXh0UGF0aF0gPSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBhbmNob3IucGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGRlcHRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdChuZXh0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlID0gcmFuZ2UubW92ZUFuY2hvclRvKGFic29sdXRlUGF0aCwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChhbmNob3Iub2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpb3VzVGV4dF0gPSBibG9jay50ZXh0cyh7IHBhdGg6IHJlbGF0aXZlUGF0aCwgZGlyZWN0aW9uOiAnYmFja3dhcmQnIH0pO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpb3VzLCBwcmV2aW91c1BhdGhdID0gcHJldmlvdXNUZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBhbmNob3IucGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIGRlcHRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdChwcmV2aW91c1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICByYW5nZSA9IHJhbmdlLm1vdmVBbmNob3JUbyhhYnNvbHV0ZVBhdGgsIHByZXZpb3VzLnRleHQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBmb2N1c0lubGluZSAmJlxuICAgICAgICAgICAgIWVkaXRvci5pc1ZvaWQoZm9jdXNJbmxpbmUpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgYmxvY2sgPSBkb2N1bWVudC5nZXRDbG9zZXN0QmxvY2soZm9jdXMucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXB0aCA9IGRvY3VtZW50LmdldERlcHRoKGJsb2NrLmtleSk7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBQYXRoVXRpbHMuZHJvcChmb2N1cy5wYXRoLCBkZXB0aCk7XG4gICAgICAgICAgICBpZiAoZm9jdXMub2Zmc2V0ID09PSBmb2N1c1RleHQudGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbbmV4dF0gPSBibG9jay50ZXh0cyh7IHBhdGg6IHJlbGF0aXZlUGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbLCBuZXh0UGF0aF0gPSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBmb2N1cy5wYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgZGVwdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KG5leHRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSByYW5nZS5tb3ZlRm9jdXNUbyhhYnNvbHV0ZVBhdGgsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9jdXMub2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpb3VzVGV4dEVudHJ5XSA9IGJsb2NrLnRleHRzKHsgcGF0aDogcmVsYXRpdmVQYXRoLCBkaXJlY3Rpb246ICdiYWNrd2FyZCcgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzVGV4dEVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFtwcmV2aW91cywgcHJldmlvdXNQYXRoXSA9IHByZXZpb3VzVGV4dEVudHJ5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBmb2N1cy5wYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgZGVwdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KHByZXZpb3VzUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlID0gcmFuZ2UubW92ZUZvY3VzVG8oYWJzb2x1dGVQYXRoLCBwcmV2aW91cy50ZXh0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZVNlbGVjdGlvbihyYW5nZSk7XG5cbiAgICAgICAgLy8gQ09NUEFUOiBFbnN1cmUgdGhhdCB0aGUgYGlzRm9jdXNlZGAgYXJndW1lbnQgaXMgc2V0LlxuICAgICAgICBzZWxlY3Rpb24gPSBzZWxlY3Rpb24uc2V0SXNGb2N1c2VkKHRydWUpO1xuXG4gICAgICAgIC8vIENPTVBBVDogUHJlc2VydmUgdGhlIG1hcmtzLCBzaW5jZSB3ZSBoYXZlIG5vIHdheSBvZiBrbm93aW5nIHdoYXQgdGhlIERPTVxuICAgICAgICAvLyBzZWxlY3Rpb24ncyBtYXJrcyB3ZXJlLiBUaGV5IHdpbGwgYmUgY2xlYXJlZCBhdXRvbWF0aWNhbGx5IGJ5IHRoZVxuICAgICAgICAvLyBgc2VsZWN0YCBjb21tYW5kIGlmIHRoZSBzZWxlY3Rpb24gbW92ZXMuXG4gICAgICAgIHNlbGVjdGlvbiA9IHNlbGVjdGlvbi5zZXQoJ21hcmtzJywgdmFsdWUuc2VsZWN0aW9uLm1hcmtzKTtcblxuICAgICAgICByZXR1cm4gc2VsZWN0aW9uO1xuICAgIH1cbn1cblxuLyoqXG4gKiBGcm9tIGEgRE9NIHNlbGVjdGlvbidzIGBub2RlYCBhbmQgYG9mZnNldGAsIG5vcm1hbGl6ZSBzbyB0aGF0IGl0IGFsd2F5c1xuICogcmVmZXJzIHRvIGEgdGV4dCBub2RlLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldFxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU5vZGVBbmRPZmZzZXQobm9kZSwgb2Zmc2V0KSB7XG4gICAgLy8gSWYgaXQncyBhbiBlbGVtZW50IG5vZGUsIGl0cyBvZmZzZXQgcmVmZXJzIHRvIHRoZSBpbmRleCBvZiBpdHMgY2hpbGRyZW5cbiAgICAvLyBpbmNsdWRpbmcgY29tbWVudCBub2Rlcywgc28gdHJ5IHRvIGZpbmQgdGhlIHJpZ2h0IHRleHQgY2hpbGQgbm9kZS5cbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBub2RlLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGlzTGFzdCA9IG9mZnNldCA9PT0gbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gaXNMYXN0ID8gJ2JhY2t3YXJkJyA6ICdmb3J3YXJkJztcbiAgICAgICAgY29uc3QgaW5kZXggPSBpc0xhc3QgPyBvZmZzZXQgLSAxIDogb2Zmc2V0O1xuICAgICAgICBub2RlID0gZ2V0RWRpdGFibGVDaGlsZChub2RlLCBpbmRleCwgZGlyZWN0aW9uKTtcblxuICAgICAgICAvLyBJZiB0aGUgbm9kZSBoYXMgY2hpbGRyZW4sIHRyYXZlcnNlIHVudGlsIHdlIGhhdmUgYSBsZWFmIG5vZGUuIExlYWYgbm9kZXNcbiAgICAgICAgLy8gY2FuIGJlIGVpdGhlciB0ZXh0IG5vZGVzLCBvciBvdGhlciB2b2lkIERPTSBub2Rlcy5cbiAgICAgICAgd2hpbGUgKG5vZGUubm9kZVR5cGUgPT09IDEgJiYgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaSA9IGlzTGFzdCA/IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggLSAxIDogMDtcbiAgICAgICAgICAgIG5vZGUgPSBnZXRFZGl0YWJsZUNoaWxkKG5vZGUsIGksIGRpcmVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIG5ldyBvZmZzZXQgaW5zaWRlIHRoZSB0ZXh0IG5vZGUuXG4gICAgICAgIG9mZnNldCA9IGlzTGFzdCA/IG5vZGUudGV4dENvbnRlbnQubGVuZ3RoIDogMDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG5vZGUgYW5kIG9mZnNldC5cbiAgICByZXR1cm4geyBub2RlLCBvZmZzZXQgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG5lYXJlc3QgZWRpdGFibGUgY2hpbGQgYXQgYGluZGV4YCBpbiBhIGBwYXJlbnRgLCBwcmVmZXJyaW5nXG4gKiBgZGlyZWN0aW9uYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge1N0cmluZ30gZGlyZWN0aW9uICgnZm9yd2FyZCcgb3IgJ2JhY2t3YXJkJylcbiAqIEByZXR1cm4ge0VsZW1lbnR8TnVsbH1cbiAqL1xuXG5mdW5jdGlvbiBnZXRFZGl0YWJsZUNoaWxkKHBhcmVudCwgaW5kZXgsIGRpcmVjdGlvbikge1xuICAgIGNvbnN0IHsgY2hpbGROb2RlcyB9ID0gcGFyZW50O1xuICAgIGxldCBjaGlsZCA9IGNoaWxkTm9kZXNbaW5kZXhdO1xuICAgIGxldCBpID0gaW5kZXg7XG4gICAgbGV0IHRyaWVkRm9yd2FyZCA9IGZhbHNlO1xuICAgIGxldCB0cmllZEJhY2t3YXJkID0gZmFsc2U7XG5cbiAgICAvLyBXaGlsZSB0aGUgY2hpbGQgaXMgYSBjb21tZW50IG5vZGUsIG9yIGFuIGVsZW1lbnQgbm9kZSB3aXRoIG5vIGNoaWxkcmVuLFxuICAgIC8vIGtlZXAgaXRlcmF0aW5nIHRvIGZpbmQgYSBzaWJsaW5nIG5vbi12b2lkLCBub24tY29tbWVudCBub2RlLlxuICAgIHdoaWxlIChcbiAgICAgICAgY2hpbGQubm9kZVR5cGUgPT09IDggfHxcbiAgICAgICAgKGNoaWxkLm5vZGVUeXBlID09PSAxICYmIGNoaWxkLmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB8fFxuICAgICAgICAoY2hpbGQubm9kZVR5cGUgPT09IDEgJiZcbiAgICAgICAgICAgIGNoaWxkLmdldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJykgPT09ICdmYWxzZScpXG4gICAgKSB7XG4gICAgICAgIGlmICh0cmllZEZvcndhcmQgJiYgdHJpZWRCYWNrd2FyZCkgYnJlYWs7XG5cbiAgICAgICAgaWYgKGkgPj0gY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRyaWVkRm9yd2FyZCA9IHRydWU7XG4gICAgICAgICAgICBpID0gaW5kZXggLSAxO1xuICAgICAgICAgICAgZGlyZWN0aW9uID0gJ2JhY2t3YXJkJztcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCAwKSB7XG4gICAgICAgICAgICB0cmllZEJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgIGkgPSBpbmRleCArIDE7XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSAnZm9yd2FyZCc7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2ZvcndhcmQnKSBpKys7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdiYWNrd2FyZCcpIGktLTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQgfHwgbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHF1ZXJpZXM6IFF1ZXJpZXNQbHVnaW5cbn07XG4iXX0=