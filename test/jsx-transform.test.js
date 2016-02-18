const chai = require('chai');
const assert = chai.assert;
chai.use(require('./asserters/htmlEqual'));

const babel = require('babel-core');
const vm = require('vm');
const jsdom = require('jsdom');
import { Melipona } from  '../src/index';


function getHtml(s) {
    // FIXME: Melipona's dom object thing expects document and window to be globals.
    global.document = jsdom.jsdom('<!doctype html><html><body></body></html>', {
        virtualConsole: jsdom.createVirtualConsole().sendTo(console)
    });
    global.window = document.defaultView;
    var sandbox = { Melipona };

    const transformed = babel.transform(`Melipona.render(${s});`, {
        presets: ['es2015'],
        plugins: [
            ['transform-react-jsx', { pragma: 'Melipona.build' }]
        ]
    });

    vm.createContext(sandbox);

    const script = new vm.Script(transformed.code);
    const scriptResult = script.runInContext(sandbox);

    return scriptResult.outerHTML;
}

describe('JSX transforms', () => {
    it('plain dom', () => {
        assert.htmlEqual(
            getHtml(`
                <div>
                    <h1>hey</h1>
                    <p style={{color:'black'}}>isn't this <span className="underline">something?</span></p>
                </div>`
            ),
            `<div>
                <h1>hey</h1>
                <p style="color: black;">isn't this <span class="underline">something?</span></p>
            </div>`
        );
    });
});

