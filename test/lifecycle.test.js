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
});

