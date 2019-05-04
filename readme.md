# @rubix-code/ini
This project is a fork of [evangelion1204/multi-ini](https://github.com/evangelion1204/multi-ini)

An ini-file parser which supports multi line, multiple levels and arrays to get a maximum of compatibility with Zend config files.

Please note that this is a work in progress and may be ditched, all contributions are welcome!

## Install

```shell
npm install @rubix-code/ini
```

## Usage

```js
ini = require('@rubix-code/ini');
content = ini.read(file);
content.section.key = value;
ini.write(file, content);

```

## Options

Following options are available:
* encoding \[*'utf8'*\] - directly passed to readFileSync
* keep_quotes \[*false*\] - does not strip quotes around values
* filters - predefined *lowercase*, *uppercase*, *trim*, *constants*, *boolean*

### Examples

#### encoding

```js
ini = require('@rubix-code/ini');
content = ini.read(file, {encoding: 'utf8'});
content.section.key = value;
ini.write(file, content, {encoding: 'utf8'});
```

#### keep_quotes
This option is by default off to be backward compatible, if you ever need the value containing the quotes then use this.
```ini
key="value"
```
Enabling this option will result in **"value"** instead of **value**.

```js
ini = require('@rubix-code/ini');
content = ini.read(file, {keep_quotes: true});
```

This will also affect the Serializer and serialized values. Using it will not quote anything automatically.
```js
{
    production: {
        quoted: '"quoted"',
        not_quoted: 'not_quoted'
    }
}
```

Will result in a ini like
```ini
[production]
quoted="quoted"
not_quotes=not_quoted
```

#### filters

```js
Ini = require('@rubix-code/ini');
ini = new Ini.Class({
    filters: [Ini.filters.lowercase]
});
content = ini.read(file);
```

*Replacing constants*
```js
Ini = require('@rubix-code/ini');
ini = new Ini.Class({
  constants: {'CONSTANT': 'replacement'},
  filters: [Ini.filters.constants]
});
content = ini.read(file);
```


*Define a custom filter*
```js
Ini = require('@rubix-code/ini');
ini = new Ini.Class({
    filters: [
        function (value) {
            return "Prepend " + value;
        }
    ]
});
content = ini.read(file);
```

#### line_breaks

Either `unix` or `windows` for line breaks.

```js
ini = require('@rubix-code/ini');
content = ini.read(file, {line_breaks: 'windows'});
content.section.key = value;
```

#### Parser

It's also possible to parse a ini file from an array of strings.

```js
ini = require('@rubix-code/ini');
parser = new ini.Parser();
content = parser.parse(lines);
```

#### Serializer

Like parsing it's also possible to serialize an ini object to a string.

```js
ini = require('@rubix-code/ini');
serializer = new ini.Serializer();
content = serializer.serialize({
    production: {
        base_url: 'https://google.com'
    }
});
```

## Changelog

### 0.0.2
* Rewritten in `Typescript`