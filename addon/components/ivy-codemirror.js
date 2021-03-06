import CodeMirror from 'codemirror';
import Ember from 'ember';

export default Ember.Component.extend({
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
  fixedGutter: false,
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
  lint: false,
  gutters: [],
  viewportMargin: 10,
  width: null,
  height: null,

  lintChanged: function() {
    Ember.run.debounce(this, 'updateLintGutter', 250);
  }.observes('lint'),

  updateLintGutter: function() {
    var lintGutterClass = "CodeMirror-lint-markers";

    if (this.get('lint')) {
      this.codeMirror.setOption('gutters', [lintGutterClass].concat(this.get('gutters')));
      this.codeMirror.setOption('lint', true);
    }
    else {
      var currentGutters = this.get('gutters');
      var index = currentGutters.indexOf(lintGutterClass);
      var updatedGutters = currentGutters;

      this.codeMirror.setOption('lint', false);
      if (index >= 0) {
        updatedGutters = currentGutters.splice(index, 1);
        this.codeMirror.setOption('gutters', updatedGutters);
      }
    }
  },

  sizeChanged: function() {
    Ember.run.debounce(this, 'updateSize', 250);
  }.observes('width', 'height'),

  updateSize: function() {
    this.codeMirror.setSize(this.get("width"), this.get("height"));
  },

  tagName: 'textarea',

  /**
   * Force CodeMirror to refresh.
   *
   * @method refresh
   */
  refresh: function() {
    this.get('codeMirror').refresh();
  },

  _initCodeMirror: Ember.on('didInsertElement', function() {
    this._createCodeMirror();
    this._bindEvents();
    this._bindOptions();
    this._bindProperties();
    this._triggerUpdates();
  }),
  _createCodeMirror() {
    var codeMirror = CodeMirror.fromTextArea(this.get('element'));
    this.set('codeMirror', codeMirror);
  },
  _bindEvents() {
    this._bindCodeMirrorEvent('beforeChange', this, '_beforeUpdateValue');
    this._bindCodeMirrorEvent('change', this, '_updateValue');
  },
  _bindOptions() {
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
  },
  _bindProperties() {
    this._bindCodeMirrorProperty('gutters', this, 'refresh');
    this._bindCodeMirrorProperty('value', this, '_valueDidChange');
    this._valueDidChange();
  },
  _triggerUpdates() {
    // Force a refresh on `becameVisible`, since CodeMirror won't render itself
    // onto a hidden element.
    this.on('becameVisible', this, 'refresh');

    this.updateLintGutter();
    this.updateSize();
  },

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
    var value = instance.getValue();
    this.set('value', value);
    this.get('targetObject').sendAction('valueDidChange', this.get('targetObject'), value);
  },

  _beforeUpdateValue: function(instance) {
    var value = instance.getValue();
    this.get('targetObject').sendAction('valueWillChange', this.get('targetObject'), value);
  },

  _valueDidChange: function() {
    var codeMirror = this.get('codeMirror'),
        value = this.get('value');

    if (value !== codeMirror.getValue()) {
      codeMirror.setValue(value || '');
    }
  }
});
