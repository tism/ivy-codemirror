(function(){;
var define, requireModule, require, requirejs;

(function() {

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    };
  } else {
    _isArray = Array.isArray;
  }
  
  var registry = {}, seen = {}, state = {};
  var FAILED = false;

  define = function(name, deps, callback) {
  
    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }
  
    registry[name] = {
      deps: deps,
      callback: callback
    };
  };

  function reify(deps, name, seen) {
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    var exports;

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        exports = reified[i] = seen;
      } else {
        reified[i] = require(resolve(dep, name));
      }
    }

    return {
      deps: reified,
      exports: exports
    };
  }

  requirejs = require = requireModule = function(name) {
    if (state[name] !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    if (!registry[name]) {
      throw new Error('Could not find module ' + name);
    }

    var mod = registry[name];
    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    try {
      reified = reify(mod.deps, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    } finally {
      if (!loaded) {
        state[name] = FAILED;
      }
    }

    return reified.exports ? seen[name] : (seen[name] = module);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase;

    if (nameParts.length === 1) {
      parentBase = nameParts;
    } else {
      parentBase = nameParts.slice(0, -1);
    }

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') { parentBase.pop(); }
      else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

;define("ivy-codemirror/index",
  ["ivy-codemirror/components/ivy-codemirror","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var IvyCodemirrorComponent = __dependency1__["default"];

    __exports__.IvyCodemirrorComponent = IvyCodemirrorComponent;
  });
;define("ivy-codemirror/components/ivy-codemirror",
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global CodeMirror */
    // import CodeMirror from 'codemirror';
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Component.extend({
      /**
       * The value of the editor.
       *
       * @property value
       * @type {String}
       * @default null
       */
      value: null,

      autofocus: false,
      coverGutterNextToScrollbar: false,
      electricChars: true,
      extraKeys: null,
      firstLineNumber: 1,
      fixedGutter: true,
      historyEventDelay: 1250,
      indentUnit: 2,
      indentWithTabs: false,
      keyMap: 'default',
      lineNumbers: false,
      lineWrapping: false,
      mode: null,
      readOnly: false,
      rtlMoveVisually: true,
      showCursorWhenSelecting: false,
      smartIndent: true,
      tabSize: 4,
      tabindex: null,
      theme: 'default',
      undoDepth: 200,

      tagName: 'textarea',

      /**
       * Force CodeMirror to refresh.
       *
       * @method refresh
       */
      refresh: function() {
        this.get('codeMirror').refresh();
      },

      _initCodemirror: Ember.on('didInsertElement', function() {
        var codeMirror = CodeMirror.fromTextArea(this.get('element'));

        // Stash away the CodeMirror instance.
        this.set('codeMirror', codeMirror);

        // Set up handlers for CodeMirror events.
        this._bindCodeMirrorEvent('change', this, '_updateValue');

        // Set up bindings for CodeMirror options.
        this._bindCodeMirrorOption('autofocus');
        this._bindCodeMirrorOption('coverGutterNextToScrollbar');
        this._bindCodeMirrorOption('electricChars');
        this._bindCodeMirrorOption('extraKeys');
        this._bindCodeMirrorOption('firstLineNumber');
        this._bindCodeMirrorOption('fixedGutter');
        this._bindCodeMirrorOption('historyEventDelay');
        this._bindCodeMirrorOption('indentUnit');
        this._bindCodeMirrorOption('indentWithTabs');
        this._bindCodeMirrorOption('keyMap');
        this._bindCodeMirrorOption('lineNumbers');
        this._bindCodeMirrorOption('lineWrapping');
        this._bindCodeMirrorOption('mode');
        this._bindCodeMirrorOption('readOnly');
        this._bindCodeMirrorOption('rtlMoveVisually');
        this._bindCodeMirrorOption('showCursorWhenSelecting');
        this._bindCodeMirrorOption('smartIndent');
        this._bindCodeMirrorOption('tabSize');
        this._bindCodeMirrorOption('tabindex');
        this._bindCodeMirrorOption('theme');
        this._bindCodeMirrorOption('undoDepth');

        this._bindCodeMirrorProperty('value', this, '_valueDidChange');
        this._valueDidChange();

        // Force a refresh on `becameVisible`, since CodeMirror won't render itself
        // onto a hidden element.
        this.on('becameVisible', this, 'refresh');
      }),

      /**
       * Bind a handler for `event`, to be torn down in `willDestroyElement`.
       *
       * @private
       * @method _bindCodeMirrorEvent
       */
      _bindCodeMirrorEvent: function(event, target, method) {
        var callback = Ember.run.bind(target, method);

        this.get('codeMirror').on(event, callback);

        this.on('willDestroyElement', this, function() {
          this.get('codeMirror').off(event, callback);
        });
      },

      /**
       * @private
       * @method _bindCodeMirrorProperty
       */
      _bindCodeMirrorOption: function(key) {
        this._bindCodeMirrorProperty(key, this, '_optionDidChange');

        // Set the initial option synchronously.
        this._optionDidChange(this, key);
      },

      /**
       * Bind an observer on `key`, to be torn down in `willDestroyElement`.
       *
       * @private
       * @method _bindCodeMirrorProperty
       */
      _bindCodeMirrorProperty: function(key, target, method) {
        this.addObserver(key, target, method);

        this.on('willDestroyElement', this, function() {
          this.removeObserver(key, target, method);
        });
      },

      /**
       * Sync a local option value with CodeMirror.
       *
       * @private
       * @method _optionDidChange
       */
      _optionDidChange: function(sender, key) {
        this.get('codeMirror').setOption(key, this.get(key));
      },

      /**
       * Update the `value` property when a CodeMirror `change` event occurs.
       *
       * @private
       * @method _updateValue
       */
      _updateValue: function(instance) {
        this.set('value', instance.getValue());
      },

      _valueDidChange: function() {
        var codeMirror = this.get('codeMirror'),
            value = this.get('value');

        if (value !== codeMirror.getValue()) {
          codeMirror.setValue(value || '');
        }
      }
    });
  });
;define("app/components/ivy-codemirror",
  ["ivy-codemirror/components/ivy-codemirror","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var IvyCodemirrorComponent = __dependency1__["default"];

    __exports__["default"] = IvyCodemirrorComponent;
  });
;define('undefined', ["exports"], function(__exports__) {__exports__.initialize = function(container){
container.register('component:ivy-codemirror', require('app/components/ivy-codemirror')['default']);
container.register('component:ivyCodemirror', require('app/components/ivy-codemirror')['default']);
};});
;/* global define, require, window */
var addonName = 'ivy-codemirror';

define('ember', ['exports'], function(__exports__) {
  __exports__['default'] = window.Ember;
});

var index = addonName + '/index';
define(addonName, ['exports'], function(__exports__) {
  var library = require(index);
  Object.keys(lf).forEach(function(key) {
    __exports__[key] = library[key];
  });
});

// Glue library to a global var
window.IvyTabs = require(index);

// Register library items in the container
var shim = addonName + '-shim';
window.Ember.Application.initializer({
  name: shim,

  initialize: function(container) {
    require(shim).initialize(container);
  }
});
})();