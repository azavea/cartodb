cdb.admin.overlays.Image = cdb.admin.overlays.Text.extend({

  className: "image overlay",

  events: {

    "mouseup":            "_onMouseUp",

    "mouseenter .text":  "_onMouseEnter",
    "mouseleave .text":  "_onMouseLeave",

    "click .close":      "_close",
    "click .content":    "_click",
    "dblclick .content": "_dblClick",

    "keyup .text":       "_onKeyUp",
    "click .text":       "_killEvent",
    "paste .text":       "_onPaste"

  },

  initialize: function() {

    _.bindAll(this, "_click", "_close", "_dblClick", "_onChangeMode", "_onKeyDown", "_putOnTop", "_onLoadSuccess", "_onLoadError");

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    this.template = this.getTemplate('table/views/overlays/image');

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    var self  = this;
    var extra = this.model.get("extra");

    this.model.set({ url: extra.url }, { silent: true });

    var applyStyle = function() {
      self._applyStyle(true);
    };

    // Bindings
    this.model.bind('change:url',     this._setURL,          this);
    this.model.bind('change:style',   applyStyle,            this);
    this.model.bind('change:extra',   this._onChangeExtra,   this);
    this.model.bind('change:display', this._onChangeDisplay, this);

    // Internal model to store the editing state
    this.editModel = new cdb.core.Model({ mode: "" });
    this.editModel.bind('change:mode', this._onChangeMode, this);

    this.add_related_model(this.editModel);

  },

  // Element events 
  _onKeyUp: function(e) {

    var self = this;

    var temp      = "";
    var domString = "";

    if (this.timeout)      clearTimeout(this.timeout);
    if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);
    if (this.savingTimeout) clearTimeout(this.savingTimeout);

    var value = this.$text.html();

    if (cdb.Utils.stripHTML(value) == "") {

      this.keyUpTimeout = setTimeout(function() {

        self.model.set({ url: "" }, { silent: true });
        self._close();

      }, 600);

    }  else {


      if (cdb.Utils.isURL(value)) {
        this.model.set({ url: value }, { silent: true });
      }

      if (!this.$el.hasClass("hover") && this.$text.text()) {
        this.savingTimeout = setTimeout(function() {

          self._disableEditingMode();

        }, 500);

      }

    }

  },

  _onPaste: function(e) {

    var self = this;

    var text = cdb.Utils.stripHTML(self.$text.text());

    if (cdb.Utils.isURL(text)) {
      self.model.set("url", text);
    }

  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.dropdown.hide();
    this.dropdown.clean();

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  /*
   * Applies style to the content of the overlay
   */

  _applyStyle: function(save) {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css("background-color", rgbaCol);
    this.$el.find("img").css("width", boxWidth);

    if (save) this.model.save();

  },

  _enableEditingMode: function() {

    var self = this;
    var text = this.model.get("url");

    this.$el
    .removeClass("error")
    .addClass("editable")
    .addClass("disabled");

    this.$text.attr("contenteditable", true).focus();

    setTimeout(function() {

      var h = self.$text.outerHeight(true);
      var w = self.$text.width();

      self.$text.html(text);
      self.$text.css({ height: h, minHeight: self.$text.height(), minWidth: w });

    }, 100);

  },

  _disableEditingMode: function() {

    var url       = this.model.get("url");
    var style     = this.model.get("style");
    var boxWidth  = style["box-width"];
    var extra     = this.model.get("extra");
    var img       = "<img src='" + url + "' style='width: " + boxWidth + "px'/>";

    this.$el
    .removeClass("editable")
    .removeClass("disabled")
    .addClass("loader");

    if (!this.error) this.$el.removeClass("error");
    else this.$el.addClass("error");

    this.$text.html(img);
    this.$text.attr("contenteditable", false);

    var self = this;

    extra.url = url;

    if (extra.url !== extra.default_image_url) extra.has_default_image = false;

    this.model.set({ extra: extra }, { silent: true });

    this.model.save();

    this.$text.css({ height: "auto", minHeight: "0", minWidth: "0" });

  },

  _setURL: function() {

    this._loadImage(this.model.get("url"));

  },

  _loadImage: function(url) {

    var self = this;

    var success = function() {
      self._onLoadSuccess(url);
    };

    var error = function() {
      self._onLoadError(url);
    };

    $("<img/>")
    .load(success)
    .error(error)
    .attr("src", url);

  },

  _onLoadError: function(url) {

    this.$el.removeClass("loader");
    this.$el.addClass('error');
    this.error = true;

  },

  _onLoadSuccess: function(url) {

    this.$el.removeClass("error");
    this.$el.removeClass("loader");

    this.error = false;

    var style     = this.model.get("style");
    var boxWidth  = style["box-width"];
    var extra     = this.model.get("extra");
    var img       = "<img src='" + url + "' style='width: " + boxWidth + "px'/>";

    extra.rendered_text = img;
    this.model.set({ extra: extra }, { silent: true });

    this.$el
    .removeClass("editable")
    .removeClass("disabled");

    this.$text.html(img);
    this.$text.attr("contenteditable", false);
    this.$text.css("height", "auto");

    this.editModel.set("mode", "");

  },

  _addDropdown: function() {

    this.dropdown = new cdb.admin.OverlayPropertiesDropdown({
      tick: "left",
      target: this.$el.find(".edit"),
      model: this.model,
      horizontal_position: "left",
      horizontal_offset: 26,
      vertical_offset: 24,
      template_base: 'table/views/overlays/properties_dropdown',
      form_data: [{
        name: 'Box Style',
        form: {
          'box-color':  { type: 'color', value: '#000' },
          'box-opacity':  { type: 'simple_opacity', value: .7, min:0, max:1, inc: .1 },
        }

      }, {
        name: 'Width',
        form: {
          'box-width':  { type: 'simple_number', value: 300, min: 50, max: 2000, inc: 10 },
        }

      }]

    });

    var self = this;

    this.dropdown.on("saved", function() {
      self.dropdown.move();
    });

    this._bindDropdown();

    this.$el.append(this.dropdown.render().el);

  },

  _bindDropdown: function() {

    this.dropdown.bind("onDropdownShown", function() {
      this.$el.addClass("open");

      this._putOnTop();

    }, this);

    this.dropdown.bind("onDropdownHidden", function() {
      this.$el.removeClass("open");
    }, this);

    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

  },

  _putOnTop: function() {

    $(".overlay").css("z-index", 999);
    this.$el.css("z-index", 2001);

  },

  render: function() {

    this._place();

    this.$el.append(this.template());

    this.$text = this.$el.find(".content div.text");

    this._setURL();
    this._applyStyle(false);
    this._onChangeExtra();
    this._addDropdown();

    this.$el.addClass(this.model.get("device"));

    return this;

  }

});

