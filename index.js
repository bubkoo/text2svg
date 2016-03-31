var fs       = require('fs');
var path     = require('path');
var opentype = require('opentype.js');


function StringToPath(font) {

  if (!font || !font.getPath) {
    throw new Error('Bad font');
  }

  this.font = font;
};

StringToPath.load = function (url, callback) {
  opentype.loadSync(url, function (err, font) {
    if (err) {
      throw err;
    } else {
      if (callback && typeof callback === 'function') {
        callback(new StringToPath(font))
      }
    }
  });
};

StringToPath.loadSync = function (file) {

  if (!file) {
    throw new Error('The path of font must be specified.');
  }

  var uri  = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  var font = opentype.loadSync(uri);

  return new StringToPath(font);
};

StringToPath.prototype.toPathData = function (text, options) {

  options = options || {};

  var kerning   = options.kerning !== false;
  var divided   = options.divided === true;
  var fontSize  = options.fontSize || 72;
  var fontScale = 1 / this.font.unitsPerEm * fontSize;
  var height    = (this.font.ascender + this.font.descender) * fontScale;

  var x = options.x || 0;
  var y = (options.y || 0) + height;

  var method = divided ? 'getPaths' : 'getPath';
  var paths  = this.font[method](text, x, y, fontSize, { kerning: kerning });

  if (divided) {
    return paths.map(function (path) {
      return path.toPathData();
    });
  }

  return paths.toPathData();
};

StringToPath.prototype.toPath = function (text, options) {

  options = options || {};

  var attr = options.path;
  var comm = parseAttr(attr);

  var paths = this.toPathData(text, options);

  if (Array.isArray(paths)) {
    return paths.map(function (path, index) {

      if (!path) {
        return '';
      }

      var curr  = comm;
      var attrX = options['path' + index];

      if (attrX) {
        curr = attr
          ? parseAttr(mergeAttr(attr, attrX))
          : parseAttr(attrX);
      }

      return '<path' + curr + ' d="' + path + '"></path>';

    });

  } else {

    return '<path' + comm + ' d="' + paths + '"></path>';
  }
};

StringToPath.prototype.toSvg = function (text, options) {

  options = options || {};

  var paths = this.toPath(text, options);
  var inner = paths;

  if (Array.isArray(paths)) {

    if (options.grouped !== false) {
      inner = '<g' + parseAttr(options.g) + '>' + paths.join('') + '</g>';
    } else {
      inner = paths.join('');
    }
  }

  var attr = {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  };

  if (options.svg) {
    attr = mergeAttr(attr, options.svg);
  }

  return '<svg' + parseAttr(attr) + '>' + inner + '</svg>';
};


// helpers
// -------

function parseAttr(attr) {

  var result = '';

  if (attr) {
    for (var name in attr) {
      if ({}.hasOwnProperty.call(attr, name) && typeof attr[name] !== 'undefined') {
        result += ' ' + name + '="' + attr[name] + '"';
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


// exports
// -------

module.exports = StringToPath;
