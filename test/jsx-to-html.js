const babel = require('babel-core');
const vm = require('vm');
const jsdom = require('jsdom');
import { Melipona } from  '../src/index';

export default function(s, context, preserveDataIds = false) {
    // FIXME: Melipona's dom object thing expects document and window to be globals.
    global.document = jsdom.jsdom('<!doctype html><html><body></body></html>', {
        virtualConsole: jsdom.createVirtualConsole().sendTo(console)
    });
    global.window = document.defaultView;

    var sandbox = Object.assign({ Melipona, document: global.document, window: global.window }, context || {});

    const transformed = babel.transform(s, {
        presets: ['es2015'],
        plugins: [
            ['transform-react-jsx', { pragma: 'Melipona.build' }]
        ]
    });

    vm.createContext(sandbox);

    const script = new vm.Script(transformed.code);
    script.runInContext(sandbox);

    if (!preserveDataIds) {
        const list = Array.from(document.querySelectorAll('[data-melipona-id]'));
        for (const node of list) {
            node.removeAttribute('data-melipona-id');
        }
    }
    return global.document.body.innerHTML;
}

