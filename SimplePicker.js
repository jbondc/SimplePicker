var SimplePicker = (function () {
    function SimplePicker(sliderId, pickerId, resultId) {
        this.step = 0.01;
        this.slider = document.getElementById(sliderId);
        this.picker = document.getElementById(pickerId);
        this.cbox = document.getElementById(resultId);
        if(this.slider.offsetHeight > this.slider.offsetWidth) {
            this.verticalHue = true;
        } else {
            this.verticalHue = false;
        }
        this.rgb = new MV.color.RGB();
        this.hsl = new MV.color.HSL();
        this.pointer = {
            type: null
        };
        this._createContainer(this.picker, "P");
        this._createContainer(this.slider, "S");
        this.range = {
            red: null,
            blue: null,
            green: null,
            hue: null,
            sat: null,
            lum: null
        };
        this.input = {
            rgb: null,
            hsl: null
        };
        this.slider.onmousedown = function (evt) {
            this.pointer.type = 'S';
            evt.preventDefault();
        }.bind(this);
        this.picker.onmousedown = function (evt) {
            this.pointer.type = 'P';
            evt.preventDefault();
        }.bind(this);
        this.slider.onmouseout = this.picker.onmouseout = function (evt) {
            this.pointer.type = null;
        }.bind(this);
        this.slider.onmouseup = function (evt) {
            if(this.pointer.type !== 'S') {
                return;
            }
            var pos = dom.getMousePos(this.slider, evt);
            this.updateFromPointer(pos.x, pos.y);
            this.pointer.type = null;
            this._updateControls();
            this._updatePointer('S', pos.x, pos.y);
            this.drawColorPicker();
        }.bind(this);
        this.picker.onmouseup = function (evt) {
            if(this.pointer.type !== 'P') {
                return;
            }
            var pos = dom.getMousePos(this.picker, evt);
            this.updateFromPointer(pos.x, pos.y);
            this.pointer.type = null;
            this._updatePointer('P', pos.x, pos.y);
            this._updateControls();
        }.bind(this);
        this.picker.addEventListener('mousemove', function (evt) {
            if(this.pointer.type !== 'P') {
                return;
            }
            var pos = dom.getMousePos(this.picker, evt);
            this.updateFromPointer(pos.x, pos.y);
        }.bind(this), false);
        this.slider.addEventListener('mousemove', function (evt) {
            if(this.pointer.type !== 'S') {
                return;
            }
            var pos = dom.getMousePos(this.slider, evt);
            this.updateFromPointer(pos.x, pos.y);
        }.bind(this), false);
        this.setRGB(255, 0, 0);
    }
    SimplePicker.prototype._createContainer = function (canvas, type) {
        var className = (type === 'P') ? 'pickerColor' : 'pickerSlider';
        var elm = document.createElement('div');
        elm.className = 'pickerContainer ' + className;
        canvas.parentNode.replaceChild(elm, canvas);
        elm.appendChild(canvas);
        var p = document.createElement('div');
        p.className = 'pointer';
        elm.appendChild(p);
        var gcs = getComputedStyle(p, null);
        if(type == 'P') {
            var bg = gcs.getPropertyValue("background-color");
            p.hsl = MV.color.Conversion.hexToHsl(bg);
        } else {
            p.className += this.verticalHue ? ' vertical' : ' horizontal';
        }
        p.style.width = gcs.getPropertyValue("width");
        p.style.height = gcs.getPropertyValue("height");
        this.pointer[type] = p;
    };
    SimplePicker.prototype.updateFromPointer = function (x, y) {
        if(this.pointer.type === 'S') {
            if(this.verticalHue === true) {
                this.hsl.hue = (y / this.slider.offsetHeight) * 360;
            } else {
                this.hsl.hue = (x / this.slider.offsetWidth) * 360;
            }
        } else {
            this.hsl.saturation = (x / this.picker.offsetWidth) * 100;
            this.hsl.luminance = (y / this.picker.offsetHeight) * 100;
        }
        this.updateHSL();
        this._updateColorBox();
    };
    SimplePicker.prototype.setRGBInput = function (elmId) {
        this.input.rgb = document.getElementById(elmId);
    };
    SimplePicker.prototype.setHSLInput = function (elmId) {
        this.input.hsl = document.getElementById(elmId);
    };
    SimplePicker.prototype.setRGBRangeControls = function (redId, greenId, blueId) {
        var me = this;
        this.range.red = document.getElementById(redId);
        this.range.red.onchange = function () {
            me.setFromRange('red');
        };
        this.range.green = document.getElementById(greenId);
        this.range.green.onchange = function () {
            me.setFromRange('green');
        };
        this.range.blue = document.getElementById(blueId);
        this.range.blue.onchange = function () {
            me.setFromRange('blue');
        };
    };
    SimplePicker.prototype.setHSLRangeControls = function (hueId, satId, lumId) {
        var me = this;
        this.range.hue = document.getElementById(hueId);
        this.range.hue.onchange = function () {
            me.setFromRange('hue');
        };
        this.range.sat = document.getElementById(satId);
        this.range.sat.onchange = function () {
            me.setFromRange('sat');
        };
        this.range.lum = document.getElementById(lumId);
        this.range.lum.onchange = function () {
            me.setFromRange('lum');
        };
    };
    SimplePicker.prototype.isRGB = function (name) {
        var rgbNames = [
            'red', 
            'green', 
            'blue'
        ];
        return (rgbNames.indexOf(name) === -1) ? false : true;
    };
    SimplePicker.prototype.setRGB = function (red, green, blue) {
        this.rgb.red = red;
        this.rgb.green = green;
        this.rgb.blue = blue;
        this.updateRGB();
    };
    SimplePicker.prototype.updateRGB = function () {
        this.rgb.validate();
        this.hsl = MV.color.Conversion.rgbToHsl(this.rgb);
        this.hex = this.rgb.toColor().toHex();
    };
    SimplePicker.prototype.setFromRange = function (name) {
        if(!this.range[name]) {
            throw new Error("Invalid range '" + name + "'");
        }
        var value = this.range[name].value;
        if(this.isRGB(name)) {
            this.rgb[name] = value;
            this.updateRGB();
        } else {
            this.hsl[name] = value;
            this.updateHSL();
        }
    };
    SimplePicker.prototype.setHSL = function (hue, saturation, luminance) {
        this.hsl.hue = hue;
        this.hsl.saturation = saturation;
        this.hsl.luminance = luminance;
        this.updateHSL();
    };
    SimplePicker.prototype.updateHSL = function () {
        this.hsl.validate();
        this.rgb = MV.color.Conversion.hslToColor(this.hsl).toRGB();
        this.hex = this.rgb.toColor().toHex();
    };
    SimplePicker.prototype.draw = function () {
        this.drawSlider();
        this.drawColorPicker();
        this._updatePointerFromColor(this.hsl);
        this._updateControls();
    };
    SimplePicker.prototype._updateControls = function () {
        this._updateInput();
        this._updateRange();
        this._updateColorBox();
    };
    SimplePicker.prototype._updateInput = function () {
        if(this.input.rgb != null) {
            this.input.rgb.value = '#' + this.hex;
        }
        if(this.input.hsl != null) {
            this.input.hsl.value = Math.round(this.hsl.hue) + "," + Math.round(this.hsl.saturation) + "%," + Math.round(this.hsl.luminance) + "%";
        }
    };
    SimplePicker.prototype._updateRange = function () {
        for(var name in this.range) {
            if(this.range[name] !== null) {
                this.range[name].value = this.isRGB(name) ? this.rgb[name] : this.hsl[name];
            }
        }
    };
    SimplePicker.prototype._updateColorBox = function () {
        this.cbox.style.backgroundColor = this.hex;
    };
    SimplePicker.prototype.drawSlider = function () {
        var hueContext = this.slider.getContext('2d');
        var hueGradient;
        if(this.verticalHue == true) {
            hueGradient = hueContext.createLinearGradient(this.slider.offsetWidth / 2, 0, this.slider.offsetWidth / 2, this.slider.offsetHeight);
        } else {
            hueGradient = hueContext.createLinearGradient(0, this.slider.offsetHeight / 2, this.slider.offsetWidth, this.slider.offsetHeight / 2);
        }
        hueGradient.addColorStop(0, "hsl(0, 100%, 50%)");
        hueGradient.addColorStop(0.1, "hsl(36, 100%, 50%)");
        hueGradient.addColorStop(0.2, "hsl(72, 100%, 50%)");
        hueGradient.addColorStop(0.3, "hsl(108, 100%, 50%)");
        hueGradient.addColorStop(0.4, "hsl(144, 100%, 50%)");
        hueGradient.addColorStop(0.5, "hsl(180, 100%, 50%)");
        hueGradient.addColorStop(0.6, "hsl(216, 100%, 50%)");
        hueGradient.addColorStop(0.7, "hsl(252, 100%, 50%)");
        hueGradient.addColorStop(0.8, "hsl(288, 100%, 50%)");
        hueGradient.addColorStop(0.9, "hsl(324, 100%, 50%)");
        hueGradient.addColorStop(1, "hsl(360, 100%, 50%)");
        hueContext.fillStyle = hueGradient;
        hueContext.fillRect(0, 0, this.slider.offsetWidth, this.slider.offsetHeight);
    };
    SimplePicker.prototype.drawColorPicker = function () {
        var context = this.picker.getContext('2d');
        var gradient;
        var step = 1 / this.picker.offsetHeight;
        for(var strip = 0; strip < 1; strip += step) {
            gradient = context.createLinearGradient(0, this.picker.offsetHeight * strip, this.picker.offsetWidth, this.picker.offsetHeight * (strip + 0.10));
            gradient.addColorStop(0, "hsl(" + this.hsl.hue + ",0%," + (strip * 100) + "%)");
            gradient.addColorStop(0.5, "hsl(" + this.hsl.hue + ",50%," + (strip * 100) + "%)");
            gradient.addColorStop(1, "hsl(" + this.hsl.hue + ",100%," + (strip * 100) + "%)");
            context.fillStyle = gradient;
            context.fillRect(0, this.picker.offsetHeight * strip, this.picker.offsetWidth, this.picker.offsetHeight * step);
        }
    };
    SimplePicker.prototype._updatePointerFromColor = function (hsl) {
        var x, y;
        x = (hsl.saturation / 100 * this.picker.offsetWidth);
        y = (hsl.luminance / 100 * this.picker.offsetHeight);
        this._updatePointer('P', x, y);
        if(this.verticalHue == true) {
            x = 0;
            y = (hsl.hue / 360) * this.slider.offsetHeight;
        } else {
            x = (hsl.hue / 360) * this.slider.offsetWidth;
            y = 0;
        }
        this._updatePointer('S', x, y);
    };
    SimplePicker.prototype._updatePointer = function (type, x, y) {
        var p = this.pointer[type];
        var mw = parseInt(p.style.width) / 2;
        var mh = parseInt(p.style.height) / 2;
        if(type === 'S') {
            if(this.verticalHue == true) {
                p.style.left = (this.slider.offsetWidth / 2 - mw) + 'px';
                p.style.top = (y - mh) + 'px';
            } else {
                p.style.left = (x - mw) + 'px';
                p.style.top = (this.slider.offsetHeight / 2 - mh) + 'px';
            }
        } else {
            p.style.top = (y - mh) + 'px';
            p.style.left = (x - mh) + 'px';
            var lum, sat, hue, diff, adjust;
            diff = Math.abs(p.hsl.luminance - this.hsl.luminance);
            if(diff > 35) {
                return;
            }
            adjust = (this.hsl.luminance > 50 ? -30 : 30);
            p.hsl.luminance = this.hsl.luminance + adjust;
            p.style.backgroundColor = '#' + MV.color.Conversion.hslToHex(p.hsl);
        }
    };
    return SimplePicker;
})();
var dom = (function () {
    function dom() { }
    dom.getMouseCoordinates = function getMouseCoordinates(elm, posx, posy) {
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var canvasX = 0;
        var canvasY = 0;
        do {
            totalOffsetX += elm.offsetLeft + elm.clientLeft;
            totalOffsetY += elm.offsetTop + elm.clientTop;
        }while(elm = elm.offsetParent);
        canvasX = posx - totalOffsetX;
        canvasY = posy - totalOffsetY;
        return {
            x: canvasX,
            y: canvasY
        };
    };
    dom.getMousePos = function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };
    return dom;
})();
