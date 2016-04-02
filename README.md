# string-to-path

> Convert string to svg path

[![MIT License](https://img.shields.io/badge/license-MIT_License-green.svg?style=flat-square)](https://github.com/bubkoo/string-to-path/blob/master/LICENSE) 

[![npm:](https://img.shields.io/npm/v/string-to-path.svg?style=flat-square)](https://www.npmjs.com/packages/string-to-path)
[![downloads:?](https://img.shields.io/npm/dm/string-to-path.svg?style=flat-square)](https://www.npmjs.com/packages/string-to-path)
[![dependencies:?](https://img.shields.io/david/bubkoo/string-to-path.svg?style=flat-square)](https://david-dm.org/bubkoo/string-to-path)


## Install

```
$ npm install string-to-path --save
```

## Usage

```js
var StringToPath = require('string-to-path');
var stringToPath = new StringToPath('localFontPath');
var svg = stringToPath.toSVG('something', options);
```

## API

### Constructor

There are three ways to get an instance of `StringToPath`:

- new StringToPath('localFontPath')
- StringToPath.loadSync('localFontPath')
- StringToPath.load('fontUrl', callback)

The `callback` function looks like:

```js
function (stringToPath) {
    // ...
}
``` 

### stringToPath.toPathData(text, options)

Convert the `text` to path data, which is the attribute value of `d` in the `<path>` element. Return:

```js
{
	width   : width,   // Int, total width
    height  : height,  // Int, total Height
    pathData: pathData // Array/String
}
```

If `options.divided` is `true` the pathData will be an Array.

### stringToPath.toPath(text, options)

Convert the `text` to `<path>` element(s). Return:

```js
{
	width   : width,   // Int, total width
    height  : height,  // Int, total Height
    pathData: pathData // Array/String
    path    : path     // Array/String
}
```

### stringToPath.toSVG(text, options)
 
Convert the `text` to `<svg>` element. Return:

```js
{
	width   : width,   // Int, total width
    height  : height,  // Int, total Height
    pathData: pathData // Array/String
    path    : path     // Array/String
    svg     : svg
}
```

## Options

### x

Horizontal position of the beginning of the text. (default: 0)

### y

Vertical position of the baseline of the text. (default: 0)

### fontSize

Size of the text. (default: 72)

### spacing

The letter spacing. (default: 0)

### kerning

 If `true` takes `kerning` information into account. (default: `true`)

### divided

If `true` generates individual path for every char. (default: `false`)

### grouped

If `true` groups the individual `<path>` with `<g></g>` element. (default: `false`)

This option only works for `toSVG()`.

### title

If specified will generate a `<title>` at the root of `<svg>`. (default: `text`)

### desc

If specified will generate a `<desc>` at the root of `<svg>`. (default: `null`)

### Styling the elements

Specify the padding of the `<path>` relative to the `<svg>`: 

- options.padding
- options.paddingTop/options['padding-top']
- options.paddingRight/options['padding-right']
- options.paddingBottom/options['padding-bottom']
- options.paddingLeft/options['padding-left']

The `<svg>`, `<path>` and `<g>` element can be styled by any valid attribute styles. 

The generated `<svg>` has the following default attributes:

```js
{
	'version'    : '1.1',
    'xmlns'      : 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'role'   : 'img',
    'width'  : width,
    'height' : height,
    'viewbox': [x, y, width, height].join(' ')
}
```

We can add/update/remove by `options.svg`, except for `width`, `height` and `viewbox`, you should not specify them :

```js
options.svg = {
	'version': '',     // remove this attribute
    'role'   : 'logo', // update this attribute
    'fill'   : 'red'   // add some custiom styles
}
```

**Note** that the `width`, `height` and `viewbox` can't be specified.

Styling the `<path>` by `options.path`. If `divided` is `true` we can style the individual `<path>` element by `options.path?`, and the `?` is the index of each char in the `text`:

```js
// style for every path(s)
options.path  = {
    fill: yellow
};

// style the first char
options.path0 = {
    fill: '#FF0000',
    'stroke': '#000000'
};
```

As the same `options.g` specified the style of `<g>` element. 

## Contributing

Contributing are highly welcome!  


