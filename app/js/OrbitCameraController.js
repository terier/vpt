var OrbitCameraController = (function() {

function OrbitCameraController(camera, element, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._camera = camera;
    this._element = element;

    this._rotationSpeed = this._opts.rotationSpeed;
    this._zoomSpeed = this._opts.zoomSpeed;

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);

    this._addEventListeners();
}

OrbitCameraController.defaults = {
    rotationSpeed: 0.01,
    zoomSpeed: 0.01
};

var _ = OrbitCameraController.prototype;

_.destroy = function() {
    this._removeEventListeners();
};

_._addEventListeners = function() {
    this._element.addEventListener('mousedown', this._handleMouseDown);
    this._element.addEventListener('mouseup', this._handleMouseUp);
    this._element.addEventListener('mousemove', this._handleMouseMove);
    this._element.addEventListener('mousewheel', this._handleMouseWheel);
};

_._removeEventListeners = function() {
    this._element.removeEventListener('mousedown', this._handleMouseDown);
    this._element.removeEventListener('mouseup', this._handleMouseUp);
    this._element.removeEventListener('mousemove', this._handleMouseMove);
    this._element.removeEventListener('mousewheel', this._handleMouseWheel);
};

_._handleMouseDown = function(e) {
};

_._handleMouseUp = function(e) {
};

_._handleMouseMove = function(e) {
};

_._handleMouseWheel = function(e) {
    var amount = e.deltaY * this._zoomSpeed;
    this._camera.zoom(amount);
    if (e.shiftKey) {
        var scale = Math.exp(amount);
        this._camera.position.mul(new Vector(scale, scale, scale, 1));
    }
};

return OrbitCameraController;

})();
