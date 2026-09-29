const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

test('requires the demo password before opening the page', () => {
  let submit;
  let focusCount = 0;
  const form = { addEventListener: (_type, handler) => { submit = handler; } };
  const gate = { hidden: false };
  const password = { value: '', focus: () => { focusCount += 1; } };
  const error = { hidden: true };
  const sections = Array.from({ length: 3 }, () => ({ inert: true, removeAttribute(name) { if (name === 'inert') this.inert = false; } }));
  const body = { locked: true, classList: { remove(name) { if (name === 'access-locked') body.locked = false; } } };
  const elements = { 'access-form': form, 'access-gate': gate, 'access-password': password, 'access-error': error };
  const document = { body, getElementById: (id) => elements[id], querySelectorAll: () => sections };

  runInNewContext(readFileSync('js/access-gate.js', 'utf8'), { document });
  password.value = 'wrong';
  submit({ preventDefault() {} });
  assert.equal(gate.hidden, false);
  assert.equal(error.hidden, false);
  assert.equal(password.value, '');
  assert.equal(focusCount, 1);
  assert.ok(sections.every((section) => section.inert));

  password.value = '1357';
  submit({ preventDefault() {} });
  assert.equal(gate.hidden, true);
  assert.equal(body.locked, false);
  assert.ok(sections.every((section) => !section.inert));
});
