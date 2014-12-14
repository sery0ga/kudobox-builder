(function() {
    var root = this;
    if (typeof exports !== 'undefined'
        && typeof module !== 'undefined'
        && module.exports
    ) {
        root = exports = module.exports;
    }

    root.DrawerWeb = DrawerWeb;

    /**
     * Extended version of drawer fits web requirements
     *
     */
    function DrawerWeb(canvas) {
        Drawer.call(this, canvas);

        this.showExtraElements = true;

        this.placeholder = null;
        this.focused = false;

        this.textrange = null;
        this.showCaret = false;
        this.caretOffset = 0;

        this.caretXPosition = null;
    }
    inherits(DrawerWeb, Drawer);

    /**
     * Get result image
     *
     * @return {String} base64-encoded image
     */
    DrawerWeb.prototype.getImage = function() {
        this.showExtraElements = false;
        var data = DrawerWeb.super_.getImage.call(this);
        this.showExtraElements = true;

        return data;
    };

    /**
     * Update canvas contents
     *
     */
    DrawerWeb.prototype.update = function() {
        if (!this.focused && !this.text) {
            this.context.fillStyle = '#a5a5a5';
        } else {
            this.context.fillStyle = '#000';
        }

        DrawerWeb.super_.update.call(this);

        if (this.showExtraElements) {
            this.drawCaret();
        }
    };

    /**
     * Get caret position for the line above current
     *
     * @return {Number}
     */
    Drawer.prototype.getCaretPositionAtUpperLine = function() {
        var lineData = this.getLineForPosition(this.textrange.position);
        if (!lineData) {
            this.caretXPosition = null;
            return this.lines[Object.keys(this.lines).length].caretTo;
        }
        if (!this.lines[lineData.n - 1]) {
            this.caretXPosition = null;
            return 0;
        }

        return this.getCaretPostionAtLine(lineData, this.lines[lineData.n - 1]);
    };

    /**
     * Get caret position for the line above current
     *
     * @return {Number}
     */
    Drawer.prototype.getCaretPositionAtLowerLine = function() {
        var lineData = this.getLineForPosition(this.textrange.position);
        if (!lineData) {
            this.caretXPosition = null;
            return this.textrange.position;
        }
        if (!this.lines[lineData.n + 1]) {
            this.caretXPosition = null;
            return lineData.caretTo;
        }

        return this.getCaretPostionAtLine(lineData, this.lines[lineData.n + 1]);
    };

    /**
     * Check if given coordinates fit into area with text
     *
     * @param {Number} x
     * @param {Numbet} y
     * @return {Boolean}
     */
    DrawerWeb.prototype.isTextArea = function(x, y) {
        return (x >= this.data.padding.left)
            && (x <= this.canvas.width - this.data.padding.right)
            && (y >= this.data.padding.top)
            && (y <= this.canvas.height - this.data.padding.bottom)
        ;
    };

    /**
     * Get closest caret position for given coordinates
     *
     * @param  {Number} x
     * @param  {Number} y
     * @return {Number}
     */
    DrawerWeb.prototype.getCaretAtCoords = function(x, y) {
        var linesNumber = Object.keys(this.lines).length;
        var lineData = null;
        for (var n = 1; n <= linesNumber; n++) {
            lineData = this.lines[n];
            if (this.lines[n].y > y) {
                break;
            }
        }

        return lineData.caretFrom + this.getCharactersForWidth(
            lineData.line, x - this.data.padding.left
        );
    };

    /**
     * Get text to fill on the card
     *
     * @return {String}
     * @private
     */
    DrawerWeb.prototype.getText = function() {
        if (this.focused) {
            return this.text;
        }

        return this.text || this.placeholder;
    };

    /**
     * Reset all saved data about the text
     *
     * @private
     */
    DrawerWeb.prototype.resetTextParams = function() {
        DrawerWeb.super_.resetTextParams.call(this);
        this.caretOffset = 0;
    };

    /**
     * Fill one line of a text, save all needed data about it
     * and update params for next line
     *
     * @private
     */
    DrawerWeb.prototype.fillLine = function(text) {
        if (!this.data.lines[this.lineParams.n]) {
            return;
        }
        DrawerWeb.super_.fillLine.call(this, text);
        this.lines[this.lineParams.n].caretFrom = this.caretOffset;
        this.lines[this.lineParams.n].caretTo = this.caretOffset + text.length;
        this.caretOffset += text.length + 1;
    };

    /**
     * @private
     */
    DrawerWeb.prototype.drawCaret = function() {
        if (!this.textrange) return;
        if (this.textrange.start != this.textrange.end) {
            return this.drawSelection();
        }

        if (!this.showCaret) return;

        var position = this.textrange.position;
        var lineData = this.getLineForPosition(position);
        if (!lineData) return;
        var currentLinePosition = position - lineData.caretFrom;

        var lineBeforeCaret = lineData.line.substr(0, currentLinePosition);
        var width = this.context.measureText(lineBeforeCaret).width;

        this.context.beginPath();
        this.context.moveTo(lineData.x + width + 1, lineData.y + 5);
        this.context.lineTo(lineData.x + width + 2, lineData.y - 25);
        this.context.lineWidth = 2;
        this.context.lineCap = 'round';
        this.context.stroke();
    };

    /**
     * @private
     */
    DrawerWeb.prototype.drawSelection = function() {
        var start = this.textrange.start;
        var end = this.textrange.end;

        if (start > end) {
            var tmp = start;
            start = end;
            end = tmp;
        }

        var startLineData = this.getLineForPosition(start);
        if (!startLineData) {
            return;
        }
        var endLineData = this.getLineForPosition(end);
        if (!endLineData) {
            endLineData = this.lines[Object.keys(this.lines).length];
        }

        var lineNumber = startLineData.n;
        while (lineNumber <= endLineData.n) {
            var lineData = this.lines[lineNumber];
            var xFrom = lineData.x;
            var xTo = lineData.x;

            if (lineNumber == startLineData.n) {
                xFrom += this.getTextWidth(
                    lineData.line, 0, start - lineData.caretFrom
                );
            }
            if (lineNumber == endLineData.n) {
                xTo += this.getTextWidth(
                    lineData.line, 0, end - lineData.caretFrom
                );
            } else {
                xTo += this.getTextWidth(lineData.line, 0, lineData.caretTo);
            }

            this.drawSelectionBlock(xFrom, xTo, lineData.y);
            lineNumber++;
        }
    };

    /**
     * @param  {Number} xFrom
     * @param  {Number} xTo
     * @param  {Number} y
     * @private
     */
    DrawerWeb.prototype.drawSelectionBlock = function(xFrom, xTo, y) {
        this.context.globalAlpha = 0.5;
        this.context.beginPath();
        this.context.rect(xFrom, y - 25, xTo - xFrom, 30);
        this.context.fillStyle = '#6CA7FF';
        this.context.fill();
        this.context.globalAlpha = 1;
    }

    /**
     * @param {Integer} position
     * @return {Object}
     * @private
     */
    DrawerWeb.prototype.getLineForPosition = function(position) {
        var n = 1;
        var line = this.lines[n];
        while (true) {
            n++;
            if (!this.lines[n]) {
                if (position <= line.caretTo) {
                    return line;
                } else {
                    return null;
                }
            }
            if (this.lines[n].caretFrom > position) {
                return line;
            }
            line = this.lines[n];
        }
    };

    /**
     * @param  {Object} currentLine
     * @param  {Object} newLine
     * @return {Number}
     */
    DrawerWeb.prototype.getCaretPostionAtLine = function(currentLine, newLine) {
        if (this.caretXPosition === null) {
            this.caretXPosition = this.context.measureText(
                currentLine.line.substr(
                    0, this.textrange.position - currentLine.caretFrom
                )
            ).width;
        }
        var newPosition = newLine.caretFrom + this.getCharactersForWidth(
            newLine.line, this.caretXPosition
        );

        return newPosition;
    };

    /**
     * @param  {String} line
     * @param  {Number} width
     * @return {Number}
     * @private
     */
    DrawerWeb.prototype.getCharactersForWidth = function(line, width) {
        var diff = null;
        for (var position = 0; position <= line.length; position++) {
            var testWidth = this.getTextWidth(line, 0, position);
            var newDiff = Math.abs(testWidth - width);
            if (diff !== null && (newDiff > diff)) {
                return position - 1;
            }
            diff = newDiff;
        }

        return position -1;
    };

    /**
     * @param  {String} text
     * @return {Number}
     */
    DrawerWeb.prototype.getTextWidth = function(text, from, to) {
        var line = text.substr(from, to - from);
        return this.context.measureText(line).width;
    };

}).call(this);