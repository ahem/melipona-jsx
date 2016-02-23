
import chai from 'chai';
chai.use(require('./asserters/htmlEqual'));

const jsdom = require('jsdom');
const assert = chai.assert;

import { Melipona } from  '../src/index';

function stripIds(html) {
    return html.replace(/\bdata-melipona-id="[^"]+"/g, '');
}

describe('tree operations', () => {

    beforeEach(() => {
        global.document = jsdom.jsdom('<!doctype html><html><body></body></html>', {
            virtualConsole: jsdom.createVirtualConsole().sendTo(console)
        });
        global.window = document.defaultView;
    });

    it('find node with find()', () => {
        const Component = () => ({
            render() { return '<div></div>'; },
            get prop() { return true; }
        });
        const root = Melipona.render(<div> <Component ref="test" /> </div>, document.body);
        const component = Melipona.find(root, 'test');
        assert.ok(component);
        assert.isTrue(component.prop);
    });

    it('remove node with removeChild()', () => {
        const Component = props => ({
            render() { return `<div>${props.text}</div>`; }
        });
        const root = Melipona.render(<div>
                <Component ref="a" text="abc" />
                <Component ref="b" text="efg" />
            </div>, document.body);
        const component = Melipona.find(root, 'a');
        Melipona.removeChild(root, component);
        assert.htmlEqual(stripIds(document.body.innerHTML),
            `<div>
                <div>efg</div>
            </div>`);
    });
});
