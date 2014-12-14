/**
 * Inheriting for browsers
 *
 * @param  {Function} ctor - class to extends
 * @param  {Function} superCtor - class to extend with
 */
function inherits(ctor, superCtor) {
    ctor.super_ = superCtor.prototype;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
}