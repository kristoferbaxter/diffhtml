import { equal, throws } from 'assert';
import { createTree, html, innerHTML, outerHTML, use, release } from '../lib/index';
import validateMemory from './util/validateMemory';

const { assign } = Object;

describe('Use (Middleware)', function() {
  beforeEach(() => {
    this.unsubscribe = use({
      createTreeHook: (...args) => {
        if (this.createTreeHook) {
          return this.createTreeHook.apply(this, args);
        }
      },

      syncTreeHook: (...args) => {
        if (this.syncTreeHook) {
          return this.syncTreeHook.apply(this, args);
        }
      },
    });
  });

  afterEach(() => {
    this.unsubscribe();
    validateMemory();
  });

  it('will error if a value is passed that is not a function or object', () => {
    throws(() => use());
    throws(() => use(null));
    throws(() => use(undefined));
    throws(() => use(0));
    throws(() => use(NaN));
    throws(() => use(false));
    throws(() => use([]));
  });

  it('will allow modifying a vTree during creation', () => {
    //const Fn = ({ message }) => createTree('marquee', null, message);
    const Fn = ({ message }) => html`<marquee>${message}</marquee>`;
    const oldTree = document.createElement('div');

    let i = 0;

    this.createTreeHook = ({ rawNodeName, attributes }) => {
      if (i === 4) {
        return;
      }

      if (typeof rawNodeName === 'function') {
        i++;
        return rawNodeName(attributes);
      }
    };

    innerHTML(oldTree, html`
      <${Fn} message="Hello world" />
    `);

    equal(oldTree.outerHTML, `<div><marquee>Hello world</marquee></div>`);

    release(oldTree);
  });

  it.skip('will allow modifying a nested vTree during creation', () => {
    const Fn = ({ message }) => html`<marquee>${message}</marquee>`;

    const oldTree = document.createElement('div');
    const newTree = html`<div><${Fn} message="Hello world" /></div>`;

    this.createTreeHook = (vTree) => {
      if (typeof vTree.rawNodeName === 'function') {
        return vTree.rawNodeName(vTree.attributes);
      }
    };

    innerHTML(oldTree, newTree);

    equal(oldTree.outerHTML, `<div><marquee>Hello world</marquee></div>`);

    release(oldTree);
  });

  it('will allow modifying the newTree during sync', () => {
    const oldTree = document.createElement('div');
    const newTree = html`<div class="test" />`;

    this.syncTreeHook = () => {
      newTree.attributes['data-track'] = 'some-new-value';
    };

    innerHTML(oldTree, newTree);

    equal(oldTree.outerHTML, `<div><div class="test" data-track="some-new-value"></div></div>`);

    release(oldTree);
  });

  it('will allow replacing the newTree during sync', () => {
    const oldTree = document.createElement('div');
    const newTree = html`<div class="test" />`;

    this.syncTreeHook = (oldTree, newTree) => {
      newTree.childNodes.forEach((childNode, i) => {
        if (childNode.attributes.class === 'test') {
          newTree.childNodes[i] =  html`<div data-track="some-new-value" />`;
        }
      });
    };

    innerHTML(oldTree, newTree);

    equal(oldTree.innerHTML, `<div data-track="some-new-value"></div>`);

    release(oldTree);
  });

  it('will allow blackboxing an existing tree to avoid diffing', () => {
    const oldTree = document.createElement('div');
    const newTree = html`<div class="test" />`;

    this.syncTreeHook = (oldTree, newTree) => {
      if (newTree.attributes.class === 'test') {
        return oldTree;
      }
    };

    outerHTML(oldTree, newTree);

    equal(oldTree.outerHTML, `<div></div>`);

    release(oldTree);
  });

  it('will not diff children during blackboxing', () => {
    const oldTree = document.createElement('div');

    oldTree.innerHTML = `
      <h1>Updates</h1>
      <span key="immutable">Does not update: ever</span>
    `;

    this.syncTreeHook = (oldTree, newTree) => {
      if (newTree.nodeName === 'span') {
        return oldTree;
      }
    };

    innerHTML(oldTree, html`
      <h1>Updates</h1>
      <span key="immutable">Does not update: ${new Date().getSeconds()}</span>
    `);

    equal(oldTree.outerHTML, `<div><h1>Updates</h1>
      <span key="immutable">Does not update: ever</span></div>`);

    release(oldTree);
  });
});
