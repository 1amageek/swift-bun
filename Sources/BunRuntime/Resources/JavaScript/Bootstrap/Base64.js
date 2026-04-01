(function() {
    if (typeof globalThis.atob !== 'undefined') return;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    globalThis.btoa = function(input) {
        var str = String(input);
        var output = '';
        for (var i = 0; i < str.length;) {
            var a = str.charCodeAt(i++) & 0xFF;
            var b = i < str.length ? str.charCodeAt(i++) & 0xFF : 256;
            var c = i < str.length ? str.charCodeAt(i++) & 0xFF : 256;
            var bitmap = (a << 16) | (b < 256 ? b << 8 : 0) | (c < 256 ? c : 0);
            output += chars.charAt(bitmap >> 18 & 63)
                + chars.charAt(bitmap >> 12 & 63)
                + (b < 256 ? chars.charAt(bitmap >> 6 & 63) : '=')
                + (c < 256 ? chars.charAt(bitmap & 63) : '=');
        }
        return output;
    };

    globalThis.atob = function(input) {
        var str = String(input).replace(/[=]+$/, '');
        var output = '';
        for (var i = 0; i < str.length;) {
            var a = chars.indexOf(str.charAt(i++));
            var b = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
            var c = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
            var d = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
            if (b === -1) break;
            var bitmap = (a << 18) | (b << 12) | (c !== -1 ? c << 6 : 0) | (d !== -1 ? d : 0);
            output += String.fromCharCode((bitmap >> 16) & 0xFF);
            if (c !== -1) output += String.fromCharCode((bitmap >> 8) & 0xFF);
            if (d !== -1) output += String.fromCharCode(bitmap & 0xFF);
        }
        return output;
    };
})();
