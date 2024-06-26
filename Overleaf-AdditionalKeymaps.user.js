// ==UserScript==
// @name         (mine) Overleaf - Additional Keymaps
// @namespace    https://github.com/KatyBlumer/overleaf-userscripts-forked
// @version      0.2
// @description  Adds new keybindings to Overleaf
// @author       Benjamin Lumbye, Katy Blumer
// @license      GPL-3
// @match        https://www.overleaf.com/project/*
// @grant        GM_addStyle
// ==/UserScript==

'use strict';


//  // Make ctrl+f highlights show up better
// Make all found ones yellow
GM_addStyle(`
.cm-searchMatch.cm-searchMatch {
    background-color: #cbd50ce6 !important;
}`);
// Make currently highlighted one green
GM_addStyle(`
.cm-searchMatch.cm-searchMatch.cm-searchMatch-selected {
    background-color: #3cd313ed !important;
}`);



(function () {
  window.addEventListener('UNSTABLE_editor:extensions', (event) => {
    const { CodeMirror, CodeMirrorVim, extensions } = event.detail;

    // Add CodeMirror keymaps: NOTE: Alt = Opt on mac
    extensions.push(
      CodeMirror.keymap.of([
        { // Verbatim / typewriter font
          key: 'Alt-v',
          run(view) {
            wrapSelection(CodeMirror, view, '\\texttt{', '}');
            return true;
          },
        },
        {  // Math (inline)
          key: 'Alt-m',
          run(view) {
            wrapSelection(CodeMirror, view, '$', '$');
            return true;
          },
        },
        {  // Escape all special characters
          key: 'Alt-e',
          run(view) {
            escapeSelection(CodeMirror, view);
            return true;
          },
        },
      ]),
    );

    // Add other keymaps
    window.onkeydown = (event) => {
      if (event.key === 'F2') {
        const selectedTreeItem = document.querySelector('.selected[role="treeitem"]');
        if (selectedTreeItem.contains(document.activeElement)) {
          event.preventDefault();
          document.querySelector('.toolbar-right > button:has(> .fa-pencil)').click();
        }
      }
    };
  });
})();

/**
 * Puts some text before and after what is currently selected
 * @param {*} CodeMirror The CodeMirror instance
 * @param {*} view The CodeMirror view
 * @param {string} before The text to put before the selection
 * @param {string} after The text to put after the selection
 */
function wrapSelection(CodeMirror, view, before, after) {
  view.dispatch(
    view.state.changeByRange((range) => ({
      changes: [
        { from: range.from, insert: before },
        { from: range.to, insert: after },
      ],
      range: CodeMirror.EditorSelection.range(range.from + before.length, range.to + before.length),
    })),
  );
}

/**
 * Escapes the characters # $ % & { } _ ~ ^ \ in the current selection
 * @param {*} CodeMirror The CodeMirror instance
 * @param {*} view The CodeMirror view
 */
function escapeSelection(CodeMirror, view) {
  view.dispatch(
    view.state.changeByRange((range) => {
      const changes = [];
      let lengthOfChanges = 0;
      const text = view.state.doc.sliceString(range.from, range.to);
      console.log(text);

      // Replace # $ % & { } _ with \# \$ \% \& \{ \} \_
      for (const match of text.matchAll(/[#$%&{}_]/g)) {
        console.log(match);
        changes.push({
          from: range.from + match.index,
          to: range.from + match.index + match[0].length,
          insert: `\\${match[0]}`,
        });
        lengthOfChanges++;
      }

      // Replace ~ ^ with \~{} \^{}
      for (const match of text.matchAll(/[~^]/g)) {
        console.log(match);
        changes.push({
          from: range.from + match.index,
          to: range.from + match.index + match[0].length,
          insert: `\\${match[0]}{}`,
        });
        lengthOfChanges += 3;
      }

      // Replace \ with \textbackslash{}
      for (const match of text.matchAll(/\\/g)) {
        console.log(match);
        changes.push({
          from: range.from + match.index,
          to: range.from + match.index + match[0].length,
          insert: `\\textbackslash{}`,
        });
        lengthOfChanges += 15;
      }

      return {
        changes,
        range: CodeMirror.EditorSelection.range(range.from, range.to + lengthOfChanges),
      };
    }),
  );
}
