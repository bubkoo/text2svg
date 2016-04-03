var fs       = require('fs');
var path     = require('path');
var opentype = require('opentype.js');


var cache = {};

function Text2svg(font) {

  if (!font) {
    throw new Error('Bad font');
  }

  if (typeof font === 'string') {
    if (cache[font]) {
      font = cache[font];
    } else {
      return Text2svg.loadSync(font);
    }
  }

  this.font = font;
}

Text2svg.load = function (url, callback) {

  if (cache[url]) {

    callback(new Text2svg(cache[url]));

  } else {

    opentype.load(url, function (err, font) {

      if (err) {
        throw err;
      } else {

        // cache for speed up
        cache[url] = font;

        if (callback && typeof callback === 'function') {
          callback(new Text2svg(font));
        }
      }
    });
  }
};

Text2svg.loadSync = function (file) {

  if (!file) {
    throw new Error('The path of font must be specified.');
  }

  if (cache[file]) {
    return new Text2svg(cache[file]);
  }

  var uri  = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  var font = opentype.loadSync(uri);

  // cache for speed up
  cache[file] = font;

  return new Text2svg(font);
};

Text2svg.prototype.toPathData = function (text, options) {

  options = options || {};

  var kerning   = options.kerning !== false;
  var divided   = options.divided === true;
  var spacing   = options.spacing || 0;
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

  var width  = fixToInt(x + padding.right + strokeWidth);
  var height = fixToInt(ascender - descender + padding.top + padding.bottom + strokeWidth * 2);
  var result = {
    glyphs: glyphs,
    width: width,
    height: height
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

Text2svg.prototype.toPath = function (text, options) {

  options = options || {};

  var attr     = options.path;
  var result   = this.toPathData(text, options);
  var pathData = result.pathData;

  if (Array.isArray(pathData)) {
    result.path = pathData.map(function (data, index) {

      if (!data) {
        return '';
      }

      var attrX = options['path' + index];

      return buildElement('path', mergeAttr(attr, attrX, { d: data }));
    });
  } else {
    result.path = buildElement('path', mergeAttr(attr, { d: pathData }));
  }

  return result;
};

Text2svg.prototype.toSVG = function (text, options) {

  options = options || {};

  var content = '';
  var title   = options.title || text;
  var desc    = options.desc;

  if (title) {
    content += buildElement('title', null, title);
  }

  if (desc) {
    content += buildElement('desc', null, desc);
  }

  // path
  var result = this.toPath(text, options);
  var path   = result.path;
  var inner  = path;

  if (Array.isArray(path)) {
    if (options.grouped !== false) {
      inner = buildElement('g', options.g, path.join(''));
    } else {
      inner = path.join('');
    }
  }

  content += inner;

  var x      = options.x || 0;
  var y      = options.y || 0;
  var width  = result.width;
  var height = result.height;

  var attr = {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'role': 'img',
    'width': width,
    'height': height,
    'viewbox': [x, y, width, height].join(' ')
  };

  if (options.svg) {
    attr = mergeAttr(attr, options.svg);
  }

  result.svg = buildElement('svg', attr, content);

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

function buildElement(tagName, attr, content) {
  return '<' + tagName + parseAttr(attr) + '>'
    + (content || '')
    + '</' + tagName + '>';
}


// exports
// -------

module.exports = Text2svg;
