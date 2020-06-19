import TRANSFER_TYPES from '../constants/transfer-types';
/**
 * The default plain text transfer type.
 *
 * @type {String}
 */
const { TEXT } = TRANSFER_TYPES;
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
        const text = transfer.getData(TEXT);
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
            obj[TEXT] = text;
        }
        obj[mime] = content;
        const stringData = `${prefix}${JSON.stringify(obj)}`;
        transfer.setData(TEXT, stringData);
    }
}
/**
 * Export.
 *
 * @type {Function}
 */
export default setEventTransfer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0LWV2ZW50LXRyYW5zZmVyLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsidXRpbHMvc2V0LWV2ZW50LXRyYW5zZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sY0FBYyxNQUFNLDZCQUE2QixDQUFDO0FBRXpEOzs7O0dBSUc7QUFFSCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsY0FBYyxDQUFDO0FBRWhDOzs7Ozs7Ozs7R0FTRztBQUVILFNBQVMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPO0lBQzFDLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUVoRCxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsSUFBSSxJQUFJLENBQUMsQ0FBQztLQUNsRTtJQUVELElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtRQUNuQixLQUFLLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztLQUM3QjtJQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQztJQUUzRCxJQUFJO1FBQ0EsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEMsdUZBQXVGO1FBQ3ZGLG1EQUFtRDtRQUNuRCxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDdEQ7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDO1FBQ3BDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBRWIscUVBQXFFO1FBQ3JFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLE1BQU0sRUFBRTtZQUM3QyxJQUFJO2dCQUNBLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDbkQ7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDUixNQUFNLElBQUksS0FBSyxDQUNYLHdEQUF3RCxDQUMzRCxDQUFDO2FBQ0w7U0FDSjthQUFNO1lBQ0gscUNBQXFDO1lBQ3JDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDcEI7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQ3BCLE1BQU0sVUFBVSxHQUFHLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNyRCxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN0QztBQUNMLENBQUM7QUFFRDs7OztHQUlHO0FBRUgsZUFBZSxnQkFBZ0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBUUkFOU0ZFUl9UWVBFUyBmcm9tICcuLi9jb25zdGFudHMvdHJhbnNmZXItdHlwZXMnO1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHBsYWluIHRleHQgdHJhbnNmZXIgdHlwZS5cbiAqXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5cbmNvbnN0IHsgVEVYVCB9ID0gVFJBTlNGRVJfVFlQRVM7XG5cbi8qKlxuICogU2V0IGRhdGEgd2l0aCBgdHlwZWAgYW5kIGBjb250ZW50YCBvbiBhbiBgZXZlbnRgLlxuICpcbiAqIENPTVBBVDogSW4gRWRnZSwgY3VzdG9tIHR5cGVzIHRocm93IGVycm9ycywgc28gZW1iZWQgYWxsIG5vbi1zdGFuZGFyZFxuICogdHlwZXMgaW4gdGV4dC9wbGFpbiBjb21wb3VuZCBvYmplY3QuICgyMDE3LzcvMTIpXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudFxuICovXG5cbmZ1bmN0aW9uIHNldEV2ZW50VHJhbnNmZXIoZXZlbnQsIHR5cGUsIGNvbnRlbnQpIHtcbiAgICBjb25zdCBtaW1lID0gVFJBTlNGRVJfVFlQRVNbdHlwZS50b1VwcGVyQ2FzZSgpXTtcblxuICAgIGlmICghbWltZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzZXQgdW5rbm93biB0cmFuc2ZlciB0eXBlIFwiJHttaW1lfVwiLmApO1xuICAgIH1cblxuICAgIGlmIChldmVudC5uYXRpdmVFdmVudCkge1xuICAgICAgICBldmVudCA9IGV2ZW50Lm5hdGl2ZUV2ZW50O1xuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zZmVyID0gZXZlbnQuZGF0YVRyYW5zZmVyIHx8IGV2ZW50LmNsaXBib2FyZERhdGE7XG5cbiAgICB0cnkge1xuICAgICAgICB0cmFuc2Zlci5zZXREYXRhKG1pbWUsIGNvbnRlbnQpO1xuICAgICAgICAvLyBDT01QQVQ6IFNhZmFyaSBuZWVkcyB0byBoYXZlIHRoZSAndGV4dCcgKGFuZCBub3QgJ3RleHQvcGxhaW4nKSB2YWx1ZSBpbiBkYXRhVHJhbnNmZXJcbiAgICAgICAgLy8gdG8gZGlzcGxheSB0aGUgY3Vyc29yIHdoaWxlIGRyYWdnaW5nIGludGVybmFsbHkuXG4gICAgICAgIHRyYW5zZmVyLnNldERhdGEoJ3RleHQnLCB0cmFuc2Zlci5nZXREYXRhKCd0ZXh0JykpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBwcmVmaXggPSAnU0xBVEUtREFUQS1FTUJFRDo6JztcbiAgICAgICAgY29uc3QgdGV4dCA9IHRyYW5zZmVyLmdldERhdGEoVEVYVCk7XG4gICAgICAgIGxldCBvYmogPSB7fTtcblxuICAgICAgICAvLyBJZiB0aGUgZXhpc3RpbmcgcGxhaW4gdGV4dCBkYXRhIGlzIHByZWZpeGVkLCBpdCdzIFNsYXRlIEpTT04gZGF0YS5cbiAgICAgICAgaWYgKHRleHQuc3Vic3RyaW5nKDAsIHByZWZpeC5sZW5ndGgpID09PSBwcmVmaXgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgb2JqID0gSlNPTi5wYXJzZSh0ZXh0LnN1YnN0cmluZyhwcmVmaXgubGVuZ3RoKSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnRmFpbGVkIHRvIHBhcnNlIFNsYXRlIGRhdGEgZnJvbSBgRGF0YVRyYW5zZmVyYCBvYmplY3QuJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIGl0J3MganVzdCBzZXQgaXQgYXMgaXMuXG4gICAgICAgICAgICBvYmpbVEVYVF0gPSB0ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqW21pbWVdID0gY29udGVudDtcbiAgICAgICAgY29uc3Qgc3RyaW5nRGF0YSA9IGAke3ByZWZpeH0ke0pTT04uc3RyaW5naWZ5KG9iail9YDtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGF0YShURVhULCBzdHJpbmdEYXRhKTtcbiAgICB9XG59XG5cbi8qKlxuICogRXhwb3J0LlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBzZXRFdmVudFRyYW5zZmVyO1xuIl19