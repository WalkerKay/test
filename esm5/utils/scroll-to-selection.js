import getWindow from 'get-window';
import { IS_SAFARI, IS_IOS } from 'slate-dev-environment';
/**
 * CSS overflow values that would cause scrolling.
 *
 * @type {Array}
 */
var OVERFLOWS = ['auto', 'overlay', 'scroll'];
/**
 * Detect whether we are running IOS version 11
 */
var IS_IOS_11 = IS_IOS && !!window.navigator.userAgent.match(/os 11_/i);
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
 * Export.
 *
 * @type {Function}
 */
export default scrollToSelection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLXRvLXNlbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInV0aWxzL3Njcm9sbC10by1zZWxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFMUQ7Ozs7R0FJRztBQUVILElBQU0sU0FBUyxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUVoRDs7R0FFRztBQUVILElBQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRTFFLFNBQVMsVUFBVSxDQUFDLFNBQW9CO0lBQ3BDLElBQU0sU0FBUyxHQUFTLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFDN0MsSUFBTSxXQUFXLEdBQVcsU0FBUyxDQUFDLFlBQVksQ0FBQztJQUNuRCxJQUFNLE9BQU8sR0FBUyxTQUFTLENBQUMsU0FBUyxDQUFDO0lBQzFDLElBQU0sU0FBUyxHQUFXLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDaEQsSUFBTSxRQUFRLEdBQVcsU0FBUyxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXBFLE9BQU8sQ0FBQyxDQUNKLFFBQVEsS0FBSyxDQUFDLENBQUMsc0NBQXNDO1FBQ3JELENBQUMsUUFBUSxLQUFLLENBQUMsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQzlDLENBQUM7QUFDTixDQUFDO0FBRUQ7Ozs7R0FJRztBQUVILFNBQVMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLE1BQU07SUFDbkMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztJQUMzQixJQUFJLFFBQVEsQ0FBQztJQUViLE9B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LGdCQUFnQixHQUFHLHFCQUFxQixHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0tBQ3pGO0lBRUQsSUFBSSxRQUFRLEVBQUU7UUFDVixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN6QjtTQUFNO1FBQ0gsUUFBUSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDdkIsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7S0FDM0I7QUFDTCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUVILGVBQWUsaUJBQWlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZ2V0V2luZG93IGZyb20gJ2dldC13aW5kb3cnO1xuaW1wb3J0IHsgSVNfU0FGQVJJLCBJU19JT1MgfSBmcm9tICdzbGF0ZS1kZXYtZW52aXJvbm1lbnQnO1xuXG4vKipcbiAqIENTUyBvdmVyZmxvdyB2YWx1ZXMgdGhhdCB3b3VsZCBjYXVzZSBzY3JvbGxpbmcuXG4gKlxuICogQHR5cGUge0FycmF5fVxuICovXG5cbmNvbnN0IE9WRVJGTE9XUyA9IFsnYXV0bycsICdvdmVybGF5JywgJ3Njcm9sbCddO1xuXG4vKipcbiAqIERldGVjdCB3aGV0aGVyIHdlIGFyZSBydW5uaW5nIElPUyB2ZXJzaW9uIDExXG4gKi9cblxuY29uc3QgSVNfSU9TXzExID0gSVNfSU9TICYmICEhd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL29zIDExXy9pKTtcblxuZnVuY3Rpb24gaXNCYWNrd2FyZChzZWxlY3Rpb246IFNlbGVjdGlvbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN0YXJ0Tm9kZTogTm9kZSA9IHNlbGVjdGlvbi5hbmNob3JOb2RlO1xuICAgIGNvbnN0IHN0YXJ0T2Zmc2V0OiBudW1iZXIgPSBzZWxlY3Rpb24uYW5jaG9yT2Zmc2V0O1xuICAgIGNvbnN0IGVuZE5vZGU6IE5vZGUgPSBzZWxlY3Rpb24uZm9jdXNOb2RlO1xuICAgIGNvbnN0IGVuZE9mZnNldDogbnVtYmVyID0gc2VsZWN0aW9uLmZvY3VzT2Zmc2V0O1xuICAgIGNvbnN0IHBvc2l0aW9uOiBudW1iZXIgPSBzdGFydE5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24oZW5kTm9kZSk7XG5cbiAgICByZXR1cm4gIShcbiAgICAgICAgcG9zaXRpb24gPT09IDQgLyogTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkcgKi8gfHxcbiAgICAgICAgKHBvc2l0aW9uID09PSAwICYmIHN0YXJ0T2Zmc2V0IDwgZW5kT2Zmc2V0KVxuICAgICk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgbmVhcmVzdCBwYXJlbnQgd2l0aCBzY3JvbGxpbmcsIG9yIHdpbmRvdy5cbiAqXG4gKiBAcGFyYW0ge2VsfSBFbGVtZW50XG4gKi9cblxuZnVuY3Rpb24gZmluZFNjcm9sbENvbnRhaW5lcihlbCwgd2luZG93KSB7XG4gICAgbGV0IHBhcmVudCA9IGVsLnBhcmVudE5vZGU7XG4gICAgbGV0IHNjcm9sbGVyO1xuXG4gICAgd2hpbGUgKCFzY3JvbGxlcikge1xuICAgICAgICBpZiAoIXBhcmVudC5wYXJlbnROb2RlKSBicmVhaztcblxuICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG4gICAgICAgIGNvbnN0IHsgb3ZlcmZsb3dZIH0gPSBzdHlsZTtcblxuICAgICAgICBpZiAoT1ZFUkZMT1dTLmluY2x1ZGVzKG92ZXJmbG93WSkpIHtcbiAgICAgICAgICAgIHNjcm9sbGVyID0gcGFyZW50O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICB9XG5cbiAgICAvLyBDT01QQVQ6IEJlY2F1c2UgQ2hyb21lIGRvZXMgbm90IGFsbG93IGRvdWNtZW50LmJvZHkuc2Nyb2xsVG9wLCB3ZSdyZVxuICAgIC8vIGFzc3VtaW5nIHRoYXQgd2luZG93LnNjcm9sbFRvKCkgc2hvdWxkIGJlIHVzZWQgaWYgdGhlIHNjcm9sbGFibGUgZWxlbWVudFxuICAgIC8vIHR1cm5zIG91dCB0byBiZSBkb2N1bWVudC5ib2R5IG9yIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC4gVGhpcyB3aWxsIHdvcmtcbiAgICAvLyB1bmxlc3MgYm9keSBpcyBpbnRlbnRpb25hbGx5IHNldCB0byBzY3JvbGxhYmxlIGJ5IHJlc3RyaWN0aW5nIGl0cyBoZWlnaHRcbiAgICAvLyAoZS5nLiBoZWlnaHQ6IDEwMHZoKS5cbiAgICBpZiAoIXNjcm9sbGVyKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuYm9keTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2Nyb2xsZXI7XG59XG5cbi8qKlxuICogU2Nyb2xsIHRoZSBjdXJyZW50IHNlbGVjdGlvbidzIGZvY3VzIHBvaW50IGludG8gdmlldyBpZiBuZWVkZWQuXG4gKlxuICogQHBhcmFtIHtTZWxlY3Rpb259IHNlbGVjdGlvblxuICovXG5cbmZ1bmN0aW9uIHNjcm9sbFRvU2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIGlmIChJU19JT1NfMTEpIHJldHVybjtcbiAgICBpZiAoIXNlbGVjdGlvbi5hbmNob3JOb2RlKSByZXR1cm47XG5cbiAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coc2VsZWN0aW9uLmFuY2hvck5vZGUpO1xuICAgIGNvbnN0IHNjcm9sbGVyID0gZmluZFNjcm9sbENvbnRhaW5lcihzZWxlY3Rpb24uYW5jaG9yTm9kZSwgd2luZG93KTtcbiAgICBjb25zdCBpc1dpbmRvdyA9IHNjcm9sbGVyID09PSB3aW5kb3cuZG9jdW1lbnQuYm9keSB8fCBzY3JvbGxlciA9PT0gd2luZG93LmRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBjb25zdCBiYWNrd2FyZCA9IGlzQmFja3dhcmQoc2VsZWN0aW9uKTtcblxuICAgIGNvbnN0IHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkuY2xvbmVSYW5nZSgpO1xuICAgIHJhbmdlLmNvbGxhcHNlKGJhY2t3YXJkKTtcbiAgICBsZXQgY3Vyc29yUmVjdCA9IHJhbmdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gQ09NUEFUOiByYW5nZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSByZXR1cm5zIDBzIGluIFNhZmFyaSB3aGVuIHJhbmdlIGlzXG4gICAgLy8gY29sbGFwc2VkLiBFeHBhbmRpbmcgdGhlIHJhbmdlIGJ5IDEgaXMgYSByZWxhdGl2ZWx5IGVmZmVjdGl2ZSB3b3JrYXJvdW5kXG4gICAgLy8gZm9yIHZlcnRpY2FsIHNjcm9sbCwgYWx0aG91Z2ggaG9yaXpvbnRhbCBtYXkgYmUgb2ZmIGJ5IDEgY2hhcmFjdGVyLlxuICAgIC8vIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xMzg5NDlcbiAgICAvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00MzU0MzhcbiAgICBpZiAoSVNfU0FGQVJJKSB7XG4gICAgICAgIGlmIChyYW5nZS5jb2xsYXBzZWQgJiYgY3Vyc29yUmVjdC50b3AgPT09IDAgJiYgY3Vyc29yUmVjdC5oZWlnaHQgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChyYW5nZS5zdGFydE9mZnNldCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJhbmdlLnNldEVuZChyYW5nZS5lbmRDb250YWluZXIsIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByYW5nZS5zZXRTdGFydChyYW5nZS5zdGFydENvbnRhaW5lciwgcmFuZ2Uuc3RhcnRPZmZzZXQgLSAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3Vyc29yUmVjdCA9IHJhbmdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgICAgICBpZiAoY3Vyc29yUmVjdC50b3AgPT09IDAgJiYgY3Vyc29yUmVjdC5oZWlnaHQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UuZ2V0Q2xpZW50UmVjdHMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yUmVjdCA9IHJhbmdlLmdldENsaWVudFJlY3RzKClbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHdpZHRoO1xuICAgIGxldCBoZWlnaHQ7XG4gICAgbGV0IHlPZmZzZXQ7XG4gICAgbGV0IHhPZmZzZXQ7XG4gICAgbGV0IHNjcm9sbGVyVG9wID0gMDtcbiAgICBsZXQgc2Nyb2xsZXJMZWZ0ID0gMDtcbiAgICBsZXQgc2Nyb2xsZXJCb3JkZXJzWSA9IDA7XG4gICAgbGV0IHNjcm9sbGVyQm9yZGVyc1ggPSAwO1xuICAgIGxldCBzY3JvbGxlclBhZGRpbmdUb3AgPSAwO1xuICAgIGxldCBzY3JvbGxlclBhZGRpbmdCb3R0b20gPSAwO1xuICAgIGxldCBzY3JvbGxlclBhZGRpbmdMZWZ0ID0gMDtcbiAgICBsZXQgc2Nyb2xsZXJQYWRkaW5nUmlnaHQgPSAwO1xuXG4gICAgaWYgKGlzV2luZG93KSB7XG4gICAgICAgIGNvbnN0IHsgaW5uZXJXaWR0aCwgaW5uZXJIZWlnaHQsIHBhZ2VZT2Zmc2V0LCBwYWdlWE9mZnNldCB9ID0gd2luZG93O1xuICAgICAgICB3aWR0aCA9IGlubmVyV2lkdGg7XG4gICAgICAgIGhlaWdodCA9IGlubmVySGVpZ2h0O1xuICAgICAgICB5T2Zmc2V0ID0gcGFnZVlPZmZzZXQ7XG4gICAgICAgIHhPZmZzZXQgPSBwYWdlWE9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB7IG9mZnNldFdpZHRoLCBvZmZzZXRIZWlnaHQsIHNjcm9sbFRvcCwgc2Nyb2xsTGVmdCB9ID0gc2Nyb2xsZXI7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGJvcmRlclRvcFdpZHRoLFxuICAgICAgICAgICAgYm9yZGVyQm90dG9tV2lkdGgsXG4gICAgICAgICAgICBib3JkZXJMZWZ0V2lkdGgsXG4gICAgICAgICAgICBib3JkZXJSaWdodFdpZHRoLFxuICAgICAgICAgICAgcGFkZGluZ1RvcCxcbiAgICAgICAgICAgIHBhZGRpbmdCb3R0b20sXG4gICAgICAgICAgICBwYWRkaW5nTGVmdCxcbiAgICAgICAgICAgIHBhZGRpbmdSaWdodFxuICAgICAgICB9ID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoc2Nyb2xsZXIpO1xuXG4gICAgICAgIGNvbnN0IHNjcm9sbGVyUmVjdCA9IHNjcm9sbGVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB3aWR0aCA9IG9mZnNldFdpZHRoO1xuICAgICAgICBoZWlnaHQgPSBvZmZzZXRIZWlnaHQ7XG4gICAgICAgIHNjcm9sbGVyVG9wID0gc2Nyb2xsZXJSZWN0LnRvcCArIHBhcnNlSW50KGJvcmRlclRvcFdpZHRoLCAxMCk7XG4gICAgICAgIHNjcm9sbGVyTGVmdCA9IHNjcm9sbGVyUmVjdC5sZWZ0ICsgcGFyc2VJbnQoYm9yZGVyTGVmdFdpZHRoLCAxMCk7XG5cbiAgICAgICAgc2Nyb2xsZXJCb3JkZXJzWSA9IHBhcnNlSW50KGJvcmRlclRvcFdpZHRoLCAxMCkgKyBwYXJzZUludChib3JkZXJCb3R0b21XaWR0aCwgMTApO1xuXG4gICAgICAgIHNjcm9sbGVyQm9yZGVyc1ggPSBwYXJzZUludChib3JkZXJMZWZ0V2lkdGgsIDEwKSArIHBhcnNlSW50KGJvcmRlclJpZ2h0V2lkdGgsIDEwKTtcblxuICAgICAgICBzY3JvbGxlclBhZGRpbmdUb3AgPSBwYXJzZUludChwYWRkaW5nVG9wLCAxMCk7XG4gICAgICAgIHNjcm9sbGVyUGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KHBhZGRpbmdCb3R0b20sIDEwKTtcbiAgICAgICAgc2Nyb2xsZXJQYWRkaW5nTGVmdCA9IHBhcnNlSW50KHBhZGRpbmdMZWZ0LCAxMCk7XG4gICAgICAgIHNjcm9sbGVyUGFkZGluZ1JpZ2h0ID0gcGFyc2VJbnQocGFkZGluZ1JpZ2h0LCAxMCk7XG4gICAgICAgIHlPZmZzZXQgPSBzY3JvbGxUb3A7XG4gICAgICAgIHhPZmZzZXQgPSBzY3JvbGxMZWZ0O1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnNvclRvcCA9IGN1cnNvclJlY3QudG9wICsgeU9mZnNldCAtIHNjcm9sbGVyVG9wO1xuICAgIGNvbnN0IGN1cnNvckxlZnQgPSBjdXJzb3JSZWN0LmxlZnQgKyB4T2Zmc2V0IC0gc2Nyb2xsZXJMZWZ0O1xuXG4gICAgbGV0IHggPSB4T2Zmc2V0O1xuICAgIGxldCB5ID0geU9mZnNldDtcblxuICAgIGlmIChjdXJzb3JMZWZ0IDwgeE9mZnNldCkge1xuICAgICAgICAvLyBzZWxlY3Rpb24gdG8gdGhlIGxlZnQgb2Ygdmlld3BvcnRcbiAgICAgICAgeCA9IGN1cnNvckxlZnQgLSBzY3JvbGxlclBhZGRpbmdMZWZ0O1xuICAgIH0gZWxzZSBpZiAoY3Vyc29yTGVmdCArIGN1cnNvclJlY3Qud2lkdGggKyBzY3JvbGxlckJvcmRlcnNYID4geE9mZnNldCArIHdpZHRoKSB7XG4gICAgICAgIC8vIHNlbGVjdGlvbiB0byB0aGUgcmlnaHQgb2Ygdmlld3BvcnRcbiAgICAgICAgeCA9IGN1cnNvckxlZnQgKyBzY3JvbGxlckJvcmRlcnNYICsgc2Nyb2xsZXJQYWRkaW5nUmlnaHQgLSB3aWR0aDtcbiAgICB9XG5cbiAgICBpZiAoY3Vyc29yVG9wIDwgeU9mZnNldCkge1xuICAgICAgICAvLyBzZWxlY3Rpb24gYWJvdmUgdmlld3BvcnRcbiAgICAgICAgeSA9IGN1cnNvclRvcCAtIHNjcm9sbGVyUGFkZGluZ1RvcDtcbiAgICB9IGVsc2UgaWYgKGN1cnNvclRvcCArIGN1cnNvclJlY3QuaGVpZ2h0ICsgc2Nyb2xsZXJCb3JkZXJzWSA+IHlPZmZzZXQgKyBoZWlnaHQpIHtcbiAgICAgICAgLy8gc2VsZWN0aW9uIGJlbG93IHZpZXdwb3J0XG4gICAgICAgIHkgPSBjdXJzb3JUb3AgKyBzY3JvbGxlckJvcmRlcnNZICsgc2Nyb2xsZXJQYWRkaW5nQm90dG9tICsgY3Vyc29yUmVjdC5oZWlnaHQgLSBoZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKGlzV2luZG93KSB7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbyh4LCB5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY3JvbGxlci5zY3JvbGxUb3AgPSB5O1xuICAgICAgICBzY3JvbGxlci5zY3JvbGxMZWZ0ID0geDtcbiAgICB9XG59XG5cbi8qKlxuICogRXhwb3J0LlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBzY3JvbGxUb1NlbGVjdGlvbjtcbiJdfQ==