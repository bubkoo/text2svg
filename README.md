# text2svg

> Convert text to svg path

[![MIT License](https://img.shields.io/badge/license-MIT_License-green.svg?style=flat-square)](https://github.com/bubkoo/text2svg/blob/master/LICENSE) 
[![npm:](https://img.shields.io/npm/v/text2svg.svg?style=flat-square)](https://www.npmjs.com/packages/text2svg)


## Install

```
$ npm install --save text2svg 
```

## Usage

```js
var Text2svg = require('text2svg');
var text2svg = new Text2svg('localFontPath');
var svg = text2svg.toSVG('something', options);
```

## API

### Constructor

There are three ways to get an instance of `Text2svg`:

- new Text2svg('localFontPath')
- Text2svg.loadSync('localFontPath')
- Text2svg.load('fontUrl', callback)

The `callback` function looks like:

```js
function (text2svg) {
    // ...
}
``` 

### toPathData(text, options)

Convert the `text` to path data, which is the attribute value of `d` in the `<path>` element. Return:

```js
{
    width   : width,   // Int, total width
    height  : height,  // Int, total Height
    pathData: pathData // Array/String
}
```

If `options.divided` is `true` the pathData will be an Array.

### toPath(text, options)

Convert the `text` to `<path>` element(s). Return:

```js
{
    width   : width,   // Int, total width
    height  : height,  // Int, total Height
    pathData: pathData // Array/String
    path    : path     // Array/String
}
```

### toSVG(text, options)
 
Convert the `text` to `<svg>` element. Return:

```js
{
    width   : width,   // Int, total width
    height  : height,  // Int, total Height
    pathData: pathData // Array/String
    path    : path     // Array/String
    svg     : svg      // String
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

This option only works for `toSVG()`.

### desc

If specified will generate a `<desc>` at the root of `<svg>`. (default: `null`)

This option only works for `toSVG()`.

### Styling the elements

Specify the padding of the `<path>` relative to the `<svg>`: 

- options.padding
- options.paddingTop/options['padding-top']
- options.paddingRight/options['padding-right']
- options.paddingBottom/options['padding-bottom']
- options.paddingLeft/options['padding-left']

The `<svg>`, `<path>` and `<g>` elements can be styled by any valid attributes. 

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

We can **add**/**update**/**remove** by `options.svg`:

```js
options.svg = {
	'version': '',     // remove this attribute
    'role'   : 'logo', // update this attribute
    'fill'   : 'red'   // add some custiom styles
}
```

**Note** that the `width`, `height` and `viewbox` can't be specified.

Styling the `<path>` by `options.path`. If `divided` is `true` we can style the individual `<path>` element by `options.path?`, which `?` is the index of each char in the `text`:

```js
// style for every path(s)
options.path  = {
    'fill': yellow
};

// style the first char
options.path0 = {
    'fill': '#FF0000',
    'stroke': '#000000'
};
```

As the same `options.g` specified the style of `<g>` element. 


 
## Related
   
- [logo.svg](https://github.com/bubkoo/logo.svg) Generate a svg logo, then you can embed it in you `README.md`.


## Contributing

Pull requests and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/bubkoo/text2svg/issues/new).
