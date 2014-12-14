(function() {

    this.KudoBuilder = KudoBuilder;

    /**
     * Class, creating kudo building UI in the element
     *
     * @param {jQuery} element
     * @param {Object} options
     */
    function KudoBuilder(element, options) {
        this.element = element;
        this.images = {};

        this.initOptions(options || {});
        this.loadImages();
        // this is an event, when all fonts has been loaded,
        // maybe using WebFonts lib is a better solution
        document.onreadystatechange = function() {
            if (document.readyState === 'complete') {
                if (this.drawer) {
                    this.update();
                }
            }
        };
    }
    inherits(KudoBuilder, EventEmitter);

    /**
     * Default options for kudo builder
     *
     * @type {Object}
     */
    KudoBuilder.DEFAULTS = {
        font: 'festus',
        image: 1,
        text: '',
        placeholder: 'Type it right here',
        canvasWidth: 669,
        canvasHeight: 477,
        heightWidthRation: 0.71300448430493
    };
    KudoBuilder.FONTS = ['festus', 'marckscript', 'handyboldcyr'];
    KudoBuilder.IMAGES_COUNT = 7;
    KudoBuilder.CARET_BLINKING_INTERVAL = 600;

    /**
     * Get path to image with id given
     *
     * @param {String} id
     */
    KudoBuilder.getImageSrc = function(id) {
        var paths = {
            1: 'images/1.png',
            2: 'images/2.png',
            3: 'images/3.png',
            4: 'images/4.png',
            5: 'images/5.png',
            6: 'images/6.png',
            7: 'images/7.png'
        };

        return paths[id];
    };

    /**
     * List of used key codes
     *
     * @type {Object}
     */
    KudoBuilder.KEY = {
        TAB: 9,
        UP: 38,
        DOWN: 40
    };

    /**
     * Used key codes
     *
     * @type {Array}
     */
    KudoBuilder.CODES = [9, 38, 40];

    /**
     * Set font for kudo text
     *
     * @param {String} font
     */
    KudoBuilder.prototype.setFont = function(font) {
        if (KudoBuilder.FONTS.indexOf(font) < 0) return;

        if (!this.drawer) {
            this.options.font = font;
            return;
        };

        this.drawer.font = font;
        if (KUDO_DATA.fonts[font] && KUDO_DATA.fonts[font].size) {
            this.drawer.fontSize = KUDO_DATA.fonts[font].size;
        } else {
            this.drawer.fontSize = KUDO_DATA.fontSize;
        }
        this.update();
    };

    /**
     * Set image for kudo
     *
     * @param {String} image
     */
    KudoBuilder.prototype.setImage = function(image) {
        if (!this.images[image]) return;
        if (!KUDO_DATA[image]) return;

        if (!this.drawer) {
            this.options.image = image;
            return;
        }

        this.drawer.image = this.images[image];
        this.drawer.data = KUDO_DATA[image];
        this.update();
    },

    /**
     * Get builded image
     *
     * @return {String} base64-encdoded image data
     */
    KudoBuilder.prototype.getImageData = function() {
        if (!this.drawer) return;

        return this.drawer.getImage();
    };

    /**
     * Get text from the card
     *
     * @return {String}
     */
    KudoBuilder.prototype.getText = function() {
        return this.drawer.text;
    };

    /**
     * Set text for a card
     *
     * @return {String}
     */
    KudoBuilder.prototype.setText = function(text) {
        this.drawer.text = text;
        this.update();
    };

    /**
     * @param {Object} options
     * @private
     */
    KudoBuilder.prototype.initOptions = function(options) {
        this.options = KudoBuilder.DEFAULTS;
        $.extend(this.options, options);
    };

    /**
     * @private
     */
    KudoBuilder.prototype.update = function() {
        this.drawer.update();
        this.emit('changed');
    }

    /**
     * @private
     */
    KudoBuilder.prototype.updateWithContent = function() {
        this.drawer.update();
        this.emit('contentchanged');
    }

    /**
     * @private
     */
    KudoBuilder.prototype.loadImages = function() {
        var loadedImages = 0;
        var that = this;
        for (var i = 1; i <= KudoBuilder.IMAGES_COUNT; i++) {
            var image = new Image();
            image.onload = function() {
                loadedImages++;
                if (loadedImages == KudoBuilder.IMAGES_COUNT) {
                    that.initDrawer();
                }
            };
            image.src = KudoBuilder.getImageSrc(i);
            this.images[i] = image;
        }

    };

    /**
     * @private
     */
    KudoBuilder.prototype.initDrawer = function() {
        this.element.empty();
        this.initCanvas();
        this.initTextarea();

        this.drawer = new DrawerWeb(this.canvas[0]);
        this.drawer.font = this.options.font;
        if (KUDO_DATA.fonts[this.options.font]
            && KUDO_DATA.fonts[this.options.font].size
        ) {
            this.drawer.fontSize = KUDO_DATA.fonts[this.options.font].size;
        } else {
            this.drawer.fontSize = KUDO_DATA['fontSize'];
        }
        this.drawer.image = this.images[this.options.image];
        this.drawer.data = KUDO_DATA[this.options.image];
        this.drawer.placeholder = this.options.placeholder;
        this.drawer.text = this.textarea.val();

        this.drawer.textrange = this.textarea.textrange();
        this.update();
        this.initKeyboardEvents();
        this.initMouseEvents();
        this.initTextareaEvents();

        this.textarea.blur();
        this.emit('complete');
    };

    /**
     * @private
     */
    KudoBuilder.prototype.initCanvas = function() {
        this.canvas = $('<canvas>');
        this.canvas.css({
            width: this.element.css('width'),
            height: this.element.css('height')
        });
        this.canvas[0].width = this.options.canvasWidth;
        this.canvas[0].height = this.options.canvasHeight;
        this.element.append(this.canvas);
    };

    /**
     * @private
     */
    KudoBuilder.prototype.initTextarea = function() {
        this.textarea = $('<textarea>');
        this.textarea.css({
            position: 'relative',
            top: '-75%',
            left: '-1000px',
            'white-space': 'pre',
            overflow: 'hidden'
        });
        this.textarea.attr('wrap', 'off');
        this.textarea.val(this.options.text);
        this.element.append(this.textarea);
    };

    /**
     * @private
     */
    KudoBuilder.prototype.initKeyboardEvents = function() {
        var that = this;
        this.textarea.on('keydown', function(event) {
            if (KudoBuilder.CODES.indexOf(event.keyCode) > -1) {
                return false;
            }

            setTimeout(function() {
                that.drawer.textrange = that.textarea.textrange();
                that.drawer.text = that.textarea.val();
                that.updateWithContent();
            }, 0);
        });

        this.textarea.on('keyup', function(event) {
            if (KudoBuilder.CODES.indexOf(event.keyCode) < 0) {
                that.drawer.caretXPosition = null;
                that.drawer.textrange = that.textarea.textrange();
                that.drawer.text = that.textarea.val();
                that.updateWithContent();
                return;
            }

            if (event.keyCode == KudoBuilder.KEY.TAB) {
                that.textarea.textrange('replace', '    ');

                var range = that.drawer.textrange;
                that.updateTextrangePosition(range.end + (4 - range.length));
                that.setTextrange();

                that.drawer.text = that.textarea.val();
                that.updateWithContent();
                return;
            }

            var position = null;
            if (event.keyCode == KudoBuilder.KEY.UP) {
                position = that.drawer.getCaretPositionAtUpperLine();
            } else if (event.keyCode == KudoBuilder.KEY.DOWN) {
                position = that.drawer.getCaretPositionAtLowerLine();
            }

            if (event.shiftKey) {
                that.updateTextrangeSelectionEnd(position);
            } else {
                that.updateTextrangePosition(position);
            }
            that.setTextrange();
            that.updateWithContent();
        });
    };

    /**
     * @private
     */
    KudoBuilder.prototype.initMouseEvents = function() {
        var canvas = this.canvas[0];
        var getOnCanvasPosition = function(event) {
            var canvasRect = canvas.getBoundingClientRect();
            var x = event.clientX - canvasRect.left;
            var y = event.clientY - canvasRect.top;
            return {
                x: x / canvasRect.width * canvas.width,
                y: y / canvasRect.height * canvas.height
            }
        };

        var mouseDown = false;
        var mouseDownMoved = false;
        var that = this;
        this.canvas.on('mousedown', function(event) {
            if (event.button !== 0) {
                return true;
            }

            var coords = getOnCanvasPosition(event);
            if (!that.drawer.isTextArea(coords.x, coords.y)) {
                return;
            }

            mouseDown = true;
            var position = that.drawer.getCaretAtCoords(coords.x, coords.y);
            if (event.shiftKey) {
                that.updateTextrangeSelectionEnd(position);
            } else {
                that.updateTextrangePosition(position);
            }

            that.update();
        });

        this.canvas.on('mousemove', function(event) {
            var coords = getOnCanvasPosition(event);
            if (that.drawer.isTextArea(coords.x, coords.y)) {
                canvas.style.cursor = 'text';
            } else {
                canvas.style.cursor = 'default';
            }

            if (!mouseDown) {
                return;
            }

            mouseDownMoved = true;
            var position = that.drawer.getCaretAtCoords(coords.x, coords.y);
            that.updateTextrangeSelectionEnd(position);

            that.update();
        });

        this.canvas.on('mouseup', function(event) {
            if (event.button !== 0) {
                return true;
            }

            var coords = getOnCanvasPosition(event);
            if (!that.drawer.isTextArea(coords.x, coords.y)) {
                return;
            }

            that.setTextrange();
            mouseDown = false;

            that.textarea.focus();
        });

        this.canvas.on('mouseout', function(event) {
            if (mouseDown) {
                that.setTextrange();
                mouseDown = false;
                that.update();
            }
        });

        this.canvas.on('dblclick', function(event) {
            var text = that.drawer.text;
            var coords = getOnCanvasPosition(event);
            var position = that.drawer.getCaretAtCoords(coords.x, coords.y);

            var start = text.lastIndexOf(' ', position) + 1;

            var endSpace = text.indexOf(' ', position);
            if (endSpace < 0) endSpace = text.length;
            var endLine = text.indexOf('\n', position);
            if (endLine < 0) endLine = text.length;
            var end = Math.min(endSpace, endLine);

            that.updateTextrangePosition(start);
            that.updateTextrangeSelectionEnd(end);
            that.setTextrange();
            that.update();
        });

        this.canvas.on('tripleclick', function(event) {
            var text = that.drawer.text;
            var coords = getOnCanvasPosition(event);
            var position = that.drawer.getCaretAtCoords(coords.x, coords.y);

            var start = 0;
            var end = text.length;

            that.updateTextrangePosition(start);
            that.updateTextrangeSelectionEnd(end);
            that.setTextrange();
            that.update();
        });
    };

    /**
     * @private
     */
    KudoBuilder.prototype.initTextareaEvents = function() {
        var that = this;
        this.textarea.on('change', function(event) {
            that.drawer.text = that.textarea.val();
            that.updateWithContent();
        });
        this.textarea.on('focus', function() {
            that.startCaretBlinking();
            that.drawer.focused = true;
            that.drawer.textrange = that.textarea.textrange();
            that.update();
        });
        this.textarea.on('blur', function() {
            that.stopCaretBlinking();
            that.drawer.focused = false;
            that.update();
        });
    };

    /**
     * @param {Object} range
     * @param {Number} position
     * @private
     */
    KudoBuilder.prototype.updateTextrangeSelectionEnd = function(position) {
        var range = this.drawer.textrange;
        if (range.start == range.position) {
            range.start = position;
        } else {
            range.end = position;
        }
        range.position = position;
    };
    /**

     * @param {Object} range
     * @param {Number} position
     * @private
     */
    KudoBuilder.prototype.updateTextrangePosition = function(position) {
        this.drawer.textrange.start = position;
        this.drawer.textrange.end = position;
        this.drawer.textrange.position = position;
    };

    /**
     * @private
     */
    KudoBuilder.prototype.setTextrange = function() {
        var range = this.drawer.textrange;
        if (range.start == range.position) {
            this.textarea.textrange('set',
                range.end, range.start - range.end
            );
        } else {
            this.textarea.textrange('set',
                range.start, range.end - range.start
            );
        }
    };

    /**
     * @private
     */
    KudoBuilder.prototype.startCaretBlinking = function() {
        clearInterval(this.caretBlinkingInterval);
        this.drawer.showCaret = true;
        this.update();
        var that = this;
        this.caretBlinkingInterval = setInterval(function() {
            that.drawer.showCaret = !that.drawer.showCaret;
            if (that.drawer.textrange.start !=
                that.drawer.textrange.end
            ) {
                return;
            }
            that.update();
        }, KudoBuilder.CARET_BLINKING_INTERVAL);
    };

    /**
     * @private
     */
    KudoBuilder.prototype.stopCaretBlinking = function() {
        this.drawer.showCaret = false;
        clearInterval(this.caretBlinkingInterval);
    };

}).call(this);
