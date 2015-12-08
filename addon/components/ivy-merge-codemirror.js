import CodeMirror from 'codemirror';
import Ember from 'ember';
import IvyCodeMirror from 'ivy-codemirror/components/ivy-codemirror';

export default IvyCodeMirror.extend({
  target: null,
  value: null,
  leftValue: null,
  rightValue: null,
  panels: 2,

  revertButtons: false,
  connect: "align",
  collapseIdentical: false,
  allowEditingOriginals: false,
  showDifferences: false,

  tagName: 'div',

  _createCodeMirror() {
    var mergeCodeMirror = CodeMirror.MergeView(this.$()[0], {
      value: this.get('value') || '',
      origLeft: this.get('leftValue') || (this.get('panels') === 3 ? '' : null),
      origRight: this.get('rightValue') || '',
    });

    let leftOriginal = mergeCodeMirror.leftOriginal();
    let rightOriginal = mergeCodeMirror.rightOriginal();
    let edit = mergeCodeMirror.edit;

    this.set('mergeCodeMirror', mergeCodeMirror);
    this.set('leftOriginal', leftOriginal);
    this.set('rightOriginal', rightOriginal);

    this.set('codeMirror', edit);
  },
  _bindOptions() {
    // all the options will now be set on the codeMirror instance (the 'middle' one)
    this._super();

    // now set the same options on the left/right instances
    let leftOriginal = this.get('leftOriginal');
    let rightOriginal = this.get('rightOriginal');
    let edit = this.get('codeMirror');
    let options = this.get('codeMirror.options');

    Object.keys(options).forEach(function(option) {
      // skip values
      if (['value', 'origLeft', 'origRight', 'readOnly'].indexOf(option) < 0) {
        let optionValue = edit.getOption(option);

        if (leftOriginal) { leftOriginal.setOption(option, optionValue); }
        if (rightOriginal) { rightOriginal.setOption(option, optionValue); }
      }
    });
  },
  _bindProperties() {
    this._super();

    this._bindCodeMirrorProperty('leftValue', this, '_leftValueDidChange');
    this._leftValueDidChange();
    this._bindCodeMirrorProperty('rightValue', this, '_rightValueDidChange');
    this._rightValueDidChange();
  },

  _leftValueDidChange() {
    let leftOriginal = this.get('leftOriginal');
    let value = this.get('leftValue');

    if (leftOriginal && value !== leftOriginal.getValue()) {
      leftOriginal.setValue(value || '');
    }
  },
  _rightValueDidChange() {
    let rightOriginal = this.get('rightOriginal');
    let value = this.get('rightValue');

    if (rightOriginal && value !== rightOriginal.getValue()) {
      rightOriginal.setValue(value || '');
    }
  },

  updateSize: function() {
    this._super();

    let leftOriginal = this.get('leftOriginal');
    let rightOriginal = this.get('rightOriginal');

    // after the right panel has updated (there'll always be at least a right
    // panel), find the maximum height of all the panes (left included) and set
    // the gap's height to that
    // this also fires if the editable pane is resized (typed into, the value is set)
    rightOriginal.on('update', function(codeMirror) {
      let mergeCodeMirror = Ember.$(codeMirror.getWrapperElement()).parents('.CodeMirror-merge');
      let paneHeights = mergeCodeMirror.find('[class^="CodeMirror-merge-pane"]').map(function(i, p) { return Ember.$(p).height(); });
      mergeCodeMirror
        .find('.CodeMirror-merge-gap')
        .css('height', Math.max.apply(null, paneHeights));
    });

    if (leftOriginal) { leftOriginal.setSize(this.get("width"), this.get("height")); }
    if (rightOriginal) { rightOriginal.setSize(this.get("width"), this.get("height")); }
  },
});

