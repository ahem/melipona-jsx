
import chai from 'chai';
chai.use(require('./asserters/htmlEqual'));

const jsdom = require('jsdom');
const assert = chai.assert;

import { Melipona } from  '../src/index';

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
});
