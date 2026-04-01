if (typeof globalThis.DOMException === 'undefined') {
    globalThis.DOMException = function DOMException(message, name) {
        this.message = message || '';
        this.name = name || 'Error';
    };
    DOMException.prototype = Object.create(Error.prototype);
    DOMException.prototype.constructor = DOMException;
}
