# KoMvvm [![Build Status](https://travis-ci.org/spatools/komvvm.png)](https://travis-ci.org/spatools/komvvm) [![Bower version](https://badge.fury.io/bo/komvvm.png)](http://badge.fury.io/bo/komvvm) [![NuGet version](https://badge.fury.io/nu/komvvm.png)](http://badge.fury.io/nu/komvvm)

Knockout Utilities Extensions to simplify Knockout app development.

## Installation

Using Bower:

```console
$ bower install komvvm --save
```

Using NuGet: 

```console
$ Install-Package KoMvvm
```

## Usage

You could use komvvm in different context.

### Browser (AMD from source)

#### Configure RequireJS.

```javascript
requirejs.config({
    paths: {
        knockout: 'path/to/knockout',
        underscore: 'path/to/underscore',
        komvvm: 'path/to/komvvm'
    }
});
```

#### Load modules

```javascript
define(["komvvm/commands"], function(commands) {
    var command = new commands.AsynCommand({
        canExecute: function(isExecuting) { return !isExecuting && /* ... */; },
        execute: function(complete) { 
            // ...
            complete();
        }
    });
});
```

### Browser (with built file)

Include built script in your HTML file.

```html
<script type="text/javascript" src="path/to/knockout.js"></script>
<script type="text/javascript" src="path/to/underscore.js"></script>
<script type="text/javascript" src="path/to/komvvm.min.js"></script>
```

## Documentation

For now documentation can be found in code.