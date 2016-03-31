var fs       = require('fs');
var path     = require('path');
var opentype = require('opentype.js');

var cache = {};

function StringToPath(font) {

  if (!font) {
    throw new Error('Bad font');
  }

  if (typeof font === 'string') {
    if (cache[font]) {
      font = cache[font];
    } else {
      return StringToPath.loadSync(font);
    }
  }

  this.font = font;
}

StringToPath.load = function (url, callback) {

  if (cache[url]) {

    callback(new StringToPath(cache[url]));

  } else {

    opentype.load(url, function (err, font) {

      if (err) {
        throw err;
      } else {

        // cache for speed up
        cache[url] = font;

        if (callback && typeof callback === 'function') {
          callback(new StringToPath(font));
        }
      }
    });
  }
};

StringToPath.loadSync = function (file) {

  if (!file) {
    throw new Error('The path of font must be specified.');
  }

  if (cache[file]) {
    return new StringToPath(cache[file]);
  }

  var uri  = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  var font = opentype.loadSync(uri);

  // cache for speed up
  cache[file] = font;

  return new StringToPath(font);
};

StringToPath.prototype.toPathData = function (text, options) {

  options = options || {};

  var kerning   = options.kerning !== false;
  var divided   = options.divided === true;
  var spacing   = options.letterSpacing || 0;
  var fontSize  = options.fontSize || 72;
  var fontScale = 1 / this.font.unitsPerEm * fontSize;

  var padding     = parsePadding(options);
  var strokeWidth = getMaxStrokeWidth(options);

  var ascender  = this.font.ascender * fontScale;
  var descender = this.font.descender * fontScale;
  var baseline  = ascender + padding.top + strokeWidth * 2;

  var x = (options.x || 0) + padding.left + strokeWidth;
  var y = (options.y || 0) + baseline;

  // auto spacing when stroke-width > 1
  if (strokeWidth > 1 && options.autoSpacing) {
    spacing += strokeWidth;
  }

  var paths  = [];
  var glyphs = this.font.stringToGlyphs(text);

  for (var i = 0, l = glyphs.length; i < l; i++) {

    var glyph = glyphs[i];
    var path  = glyph.getPath(x, y, fontSize);

    paths.push(path);

    // update x position
    if (kerning && i < l - 1) {
      var kerningValue = this.font.getKerningValue(glyph, glyphs[i + 1]);
      x += kerningValue * fontScale;
      x += spacing;
    }

    if (glyph.advanceWidth) {
      x += glyph.advanceWidth * fontScale;
    }
  }

  var result = {
    width: x + padding.right + strokeWidth,
    height: ascender - descender + padding.top + padding.bottom + strokeWidth * 2
  };


  if (divided) {
    result.pathData = paths.map(function (path) {
      return path.toPathData();
    });
  } else {

    var full = new opentype.Path();

    paths.forEach(function (path) {
      full.extend(path);
    });

    result.pathData = full.toPathData();
  }

  return result;
};

StringToPath.prototype.toPath = function (text, options) {

  options = options || {};

  var attr = options.path;
  var comm = parseAttr(attr);

  var result = this.toPathData(text, options);
  var data   = result.pathData;

  if (Array.isArray(data)) {
    result.path = data.map(function (pathData, index) {
      if (!pathData) {
        return '';
      }

      var curr  = comm;
      var attrX = options['path' + index];
      if (attrX) {
        curr = attr
          ? parseAttr(mergeAttr(attr, attrX))
          : parseAttr(attrX);
      }
      return '<path' + curr + ' d="' + pathData + '"></path>';
    });
  } else {
    result.path = '<path' + comm + ' d="' + data + '"></path>';
  }

  return result;
};

StringToPath.prototype.toSVG = function (text, options) {

  options = options || {};

  var x = options.x || 0;
  var y = options.y || 0;

  var result = this.toPath(text, options);
  var path   = result.path;
  var inner  = path;

  if (Array.isArray(path)) {
    if (options.grouped !== false) {
      inner = '<g' + parseAttr(options.g) + '>' + path.join('') + '</g>';
    } else {
      inner = path.join('');
    }
  }

  var width  = fixToInt(result.width);
  var height = fixToInt(result.height);

  var attr = {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'width': width,
    'height': height,
    'viewbox': [x, y, width, height].join(' ')
  };

  if (options.svg) {
    attr = mergeAttr(attr, options.svg);
  }

  result.svg = '<svg' + parseAttr(attr) + '>' + inner + '</svg>';

  return result;
};


// helpers
// -------

function fixToInt(val, precision) {

  precision = precision || 2;

  var rounded = Math.round(val);
  if (rounded === val) {
    return '' + rounded;
  } else {

    var fixed = val.toFixed(precision);

    rounded = Math.round(fixed);

    if (rounded === +fixed) {
      return '' + rounded;
    }

    return Math.ceil(fixed);
  }
}

function parseAttr(attr) {

  var result = '';

  if (attr) {
    for (var name in attr) {
      if ({}.hasOwnProperty.call(attr, name) && typeof attr[name] !== 'undefined') {

        var val = attr[name];

        if (typeof val === 'undefined' || (typeof val === 'string' && !val)) {
          continue;
        }

        result += ' ' + name + '="' + val + '"';
      }
    }
  }

  return result;
}

function mergeAttr() {

  var sources = [].slice.call(arguments);
  var result  = {};

  sources.forEach(function (attr) {

    if (attr) {
      for (var name in attr) {
        if ({}.hasOwnProperty.call(attr, name)) {
          result[name] = attr[name];
        }
      }
    }

  });

  return result;
}

function getMaxStrokeWidth(options) {
  var max = 1;

  if (options) {
    for (var key in options) {
      if (key.match(/path(\d+)?/)) {
        var attr  = options[key];
        var width = attr['stroke-width'];
        if (width) {
          max = Math.max(max, width);
        }
      }
    }
  }

  return max;
}

function parsePadding(options) {

  var raw = options.padding;

  var padding = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };

  if (raw) {
    if (typeof raw === 'object') {
      padding = mergeAttr(padding, raw);
    } else {
      raw = parseFloat(raw);
      if (!isNaN(raw)) {
        padding = {
          top: raw,
          left: raw,
          right: raw,
          bottom: raw
        }
      }
    }
  }

  padding.top    = options.paddingTop || options['padding-top'] || padding.top;
  padding.left   = options.paddingLeft || options['padding-left'] || padding.left;
  padding.right  = options.paddingRight || options['padding-right'] || padding.right;
  padding.bottom = options.paddingBottom || options['padding-bottom'] || padding.bottom;

  return padding;
}


// exports
// -------

module.exports = StringToPath;
