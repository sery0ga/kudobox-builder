(function() {

    this.Create = Create;

    /**
     * Class, managing all user interactions with a create page
     *
     * @param {Object} options
     */
    function Create(options) {
        this.builder = new KudoBuilder($('#kudo_img_builder'), options);
        this.selectedCard = 0;
        this.initState(options.cardId);
        this.initHandlers();
        this.resizeSections();
    }

    Create.FONT_SELECTOR = '.kudo_font_selector';
    Create.CARD_MIN_HEIGHT = 330;
    Create.CARD_MAX_HEIGHT = 430;
    Create.DEFAULT_IMAGE = 1;

    Create.prototype = {

        /**
         * @private
         */
        initHandlers: function() {
            // when the content is changed we send its updated length to the app
            this.builder.on('contentchanged', function(e) {
                var length = this.getText().length;
                Ti.App.fireEvent('app:contentChanged', { length: length });
            });
            var that = this;
            // when a user change a font we fire the event, the widget catches
            //  it and updates the font
            Ti.App.addEventListener('app:changeFont', function(e) {
                that.selectFont(e.fontName);
            });
            // when a user wants to share a kudo we fire the event, the widget
            //  catches it, generates an image of the kudo and passes it back
            //  to the application
            Ti.App.addEventListener('app:generateKudo', function(e) {
                var text = that.builder.getText();
                var image = that.builder.getImageData();
                if (text && image) {
                    Ti.App.fireEvent('app:kudoReady', { text: text, image: image });
                }
            });
        },

        /**
         * @private
         *
         * @param {Integer} cardId
         */
        initState: function(cardId) {
            this.selectCard(cardId);
            this.selectFont('festus');
        },

        /**
         * @private
         *
         * @param {String} fontName
         */
        selectFont: function(fontName) {
            this.builder.setFont(fontName);
        },

        /**
         * @private
         *
         * @param {Integer} imageId
         */
        selectCard: function(imageId) {
            this.selectedCard = imageId;
            this.builder.setImage(imageId);
        },

        /**
         * @private
         */
        resizeSections: function () {
            var windowWidth = $(window).width();
            var card = $('#kudo_img_builder'),
                newCardWidth = null,
                newCardHeight = null;

            newCardWidth = windowWidth;
            newCardHeight = newCardWidth * KudoBuilder.DEFAULTS.heightWidthRation;

            card.css('width', newCardWidth);
            card.css('height', newCardHeight);
            if (this.builder.canvas) {
                this.builder.canvas.css('width', newCardWidth);
                this.builder.canvas.css('height', newCardHeight);
            }
        }

    };

}).call(this);
