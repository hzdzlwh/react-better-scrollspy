# react-better-scrollspy

[![npm version](https://img.shields.io/npm/v/react-better-scrollspy.svg?style=flat-square)](https://www.npmjs.com/package/react-better-scrollspy)
[![dependencies](http://img.shields.io/david/makotot/react-better-scrollspy.svg?style=flat-square)](https://github.com/makotot/react-better-scrollspy)
[![DevDependencies](http://img.shields.io/david/dev/makotot/react-better-scrollspy.svg?style=flat-square)](https://github.com/makotot/react-better-scrollspy)
[![License](http://img.shields.io/npm/l/react-better-scrollspy.svg?style=flat-square)](https://github.com/makotot/react-better-scrollspy)
[![downloads](https://img.shields.io/npm/dm/react-better-scrollspy.svg)](https://www.npmjs.com/package/react-better-scrollspy)

Scrollspy, animated, scroll, React
[]

## Installation

```sh
$ npm i react-better-scrollspy
```

## Usage

```js
import Scroll from 'react-better-scrollspy'
```

```html
<Scroll.SpyLink activeClass="customActive">
  <div>
      <ul>
        <li>
          <a>Menu 1</a>
        </li>
        <li>
          <a>Menu 2</a>
        </li>
      </ul>
  </div>
</Scroll.SpyLink>
<Scroll.Spy>
  <div>
      <div>
          <h1>header 1</h1>
          <p>content 1</p>
      </div>
      <div>
          <h1>header 2</h1>
          <p>content 2</p>
      </div>
  </div>
</Scroll.Spy>
```

## Development
```shell
cd example && yarn install && yarn dev
```

## License
MIT
