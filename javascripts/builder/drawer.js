(function() {
    var root = this;
    if (typeof exports !== 'undefined'
        && typeof module !== 'undefined'
        && module.exports
    ) {
        root = exports = module.exports;
    }

    root.Drawer = Drawer;

    /**
     * Class, that draws the kudo on given canvas
     *
     */
    function Drawer(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');

        this.font = null;
        this.fontSize = null;
        this.image = null;
        this.text = null;
        this.data = null;

        /**
         * Data for text drawing process
         */
        this.lines = null;
        this.lineParams = null;
    }

    /**
     * Get result image
     *
     * @return {String} base64-encoded image
     */
    Drawer.prototype.getImage = function() {
        this.update();
        return this.canvas.toDataURL('image/png');
    };

    /**
     * Update canvas contents
     */
    Drawer.prototype.update = function() {
        this.context.font = this.fontSize + ' ' + this.font;
        this.context.drawImage(this.image, 0, 0);
        this.drawText();
    };

    /**
     * Get text to fill on the card
     *
     * @return {String}
     * @private
     */
    Drawer.prototype.getText = function() {
        return this.text;
    };

    /**
     * @private
     */
    Drawer.prototype.drawText = function() {
        this.resetTextParams();

        var lines = this.getText().split('\n');
        for (var index = 0; index < lines.length; index++) {
            this.drawLine(lines[index]);
            this.selectNextLine();
        }
    };

    /**
     * Draw one line
     *
     * @param {String} line
     * @return {[type]} [description]
     */
    Drawer.prototype.drawLine = function(line) {
        var words = line.split(' ');
        var currentLine = words[0];

        for (var n = 1; n < words.length; n++) {
            testLine = currentLine + ' ' + words[n];
            var testWidth = this.context.measureText(testLine).width;

            if (testWidth > this.lineParams.width) {
                this.fillLine(currentLine);
                this.selectNextLine();
                currentLine = words[n];
            } else {
                currentLine = testLine;
            }
        }

        this.fillLine(currentLine);
    };

    /**
     * Reset all saved data about the text
     *
     * @private
     */
    Drawer.prototype.resetTextParams = function() {
        this.lines = {};
        this.lineParams = {
            n: 0,
            offset: 0,
            x: this.data.padding.left,
            y: this.data.padding.top,
            width: this.data.width,
            lineHeight: this.data.lineHeight
        };
        this.selectNextLine();
    };

    /**
     * Fill one line of a text, save all needed data about it
     * and update params for next line
     *
     * @private
     */
    Drawer.prototype.fillLine = function(text) {
        if (!this.data.lines[this.lineParams.n]) {
            return;
        }

        this.context.fillText(text, this.lineParams.x, this.lineParams.y);
        this.lines[this.lineParams.n] = {
            n: this.lineParams.n,
            line: text,
            x: this.lineParams.x,
            y: this.lineParams.y
        };
    };

    /**
     * Update current line params with next line's
     *
     * @return {Boolean} - whether line was selected
     * @private
     */
    Drawer.prototype.selectNextLine = function() {
        var params = this.lineParams;
        params.n++;

        var newParams = this.data.lines[params.n];
        if (!newParams) {
            return;
        }

        params.y += params.lineHeight;
        params.width = newParams.width || this.data.width;
        params.lineHeight = newParams.lineHeight || this.data.lineHeight;
    };

}).call(this);