import chai from 'chai';
chai.use(require('./asserters/htmlEqual'));

const jsdom = require('jsdom');
const assert = chai.assert;

import { Melipona } from  '../src/index';

function stripIds(html) {
    return html.replace(/\bdata-melipona-id="[^"]+"/g, '');
}

describe('lifecycle events', () => {

    beforeEach(() => {
        global.document = jsdom.jsdom('<!doctype html><html><body></body></html>', {
            virtualConsole: jsdom.createVirtualConsole().sendTo(console)
        });
        global.window = document.defaultView;
    });

    it('should render all, then attach all', () => {

        let renderCnt = 0;
        let attachCnt = 0;

        const Component = (props, children) => {
            let renderCalled = false;
            let attachCalled = false;
            return {
                render() {
                    renderCnt++;
                    renderCalled = true;
                    assert.isFalse(attachCalled);
                    const el = document.createElement('div');
                    el.className = props.className;
                    el.appendChild(Melipona.renderChildren(children));
                    return el;
                },

                attach() {
                    attachCnt++;
                    attachCalled = true;
                    assert.isTrue(renderCalled);
                }
            };
        };

        Melipona.render(
            <Component className="a">
                <Component className="b">
                    <Component className="c" />
                </Component>
                <Component className="d" />
            </Component>, document.body);

        assert.htmlEqual(stripIds(document.body.innerHTML),
            `<div class="a">
                <div class="b">
                    <div class="c"></div>
                </div>
                <div class="d"></div>
            </div>`
        );

        assert.equal(renderCnt, 4, 'render calls');
        assert.equal(attachCnt, 4, 'attach calls');
    });

    it('should call dettach when component is removed from tree', () => {
        let dettachCalled = false;

        const Component = () => {
            return {
                render() { return '<div></div>'; },
                dettach() { dettachCalled = true; }
            };
        };

        const root = Melipona.render(<div><Component ref="a" /></div>, document.body);
        Melipona.removeChild(root, Melipona.find(root, 'a'));
        assert.isTrue(dettachCalled, 'dettach not called');
    });

    it('should not call dettach when component is removed from tree that isn\'t rendered', () => {
        let dettachCalled = false;

        const Component = () => {
            return {
                render() { return '<div></div>'; },
                dettach() { dettachCalled = true; }
            };
        };
        const root = (<div><Component ref="a" /></div>);
        Melipona.removeChild(root, Melipona.find(root, 'a'));
        assert.isFalse(dettachCalled, 'dettach called');
    });

    it('should call attach when component is added to tree', () => {
        let attachCalled = false;
        let node;

        const Component = () => {
            return {
                render() { return '<div id="id"></div>'; },
                attach(el) {
                    node = el;
                    attachCalled = true;
                }
            };
        };
        const root = Melipona.render(<div ref="a"></div>, document.body);
        Melipona.appendChild(root, (<Component />));
        assert.isTrue(attachCalled, 'attach not called');
        assert.equal(node.id, 'id', 'attach called with wrong node');
    });

    it('should not call attach when component is added to tree that isn\'t rendered', () => {
        let attachCalled = false;

        const Component = () => {
            return {
                render() { return '<div></div>'; },
                attach() { attachCalled = true; }
            };
        };
        const root = (<div ref="a"></div>);
        Melipona.appendChild(root, (<Component />));
        assert.isFalse(attachCalled, 'attach called');
    });

    it('should call attach and dettach with correct node', () => {
        let attachNode, dettachNode;
        let attachCalled = false;
        let dettachCalled = false;
        const Component = () => {
            return {
                render() { return '<div id="id"></div>'; },
                attach(el) {
                    attachCalled = true;
                    attachNode = el;
                },
                dettach(el) {
                    dettachNode = el;
                    dettachCalled = true;
                }
            };
        };
        const root = Melipona.render(<div><Component ref="a" /></div>, document.body);
        assert.isTrue(attachCalled, 'attach not called');
        assert.isOk(attachNode, 'attach called without node');
        assert.equal(attachNode.id, 'id', 'attach called with wrong node');

        Melipona.removeChild(root, Melipona.find(root, 'a'));
        assert.isTrue(dettachCalled, 'dettach not called');
        assert.isOk(dettachNode, 'dettach called without node');
        assert.equal(dettachNode.id, 'id', 'dettach called with wrong node');

        assert.strictEqual(attachNode, dettachNode, 'dettach and attach not called with same node');
    });
});

