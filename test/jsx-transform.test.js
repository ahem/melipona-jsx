const chai = require('chai');
const assert = chai.assert;
chai.use(require('./asserters/htmlEqual'));

const babel = require('babel-core');
const vm = require('vm');
const jsdom = require('jsdom');
import { Melipona } from  '../src/index';


function getHtml(s, context) {
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

    return global.document.body.innerHTML;
}

describe('JSX transforms', () => {
    it('plain dom', () => {
        assert.htmlEqual(
            getHtml(`Melipona.render((
                <div>
                    <h1>hey</h1>
                    <p style={{color:'black'}}>isn't this <span className="underline">something?</span></p>
                </div>
            ), document.body)`),
            `<div>
                <h1>hey</h1>
                <p style="color: black;">isn't this <span class="underline">something?</span></p>
            </div>`
        );
    });

    it('simple component', () => {
        const LabelComponent = function (props) {
            return {
                render: function () {
                    const div = document.createElement('div');
                    div.innerHTML = `<label>${props.text}</label>`;
                    div.className = 'labelWrapper';
                    return div;
                }
            };
        };

        assert.htmlEqual(
            getHtml('Melipona.render(<LabelComponent text="hey there!!" />, document.body)', { LabelComponent }),
            `<div class="labelWrapper">
                <label>hey there!!</label>
            </div>`
        );
    });

    it('component with children', () => {
        const ListComponent = function (props, children) {
            return {
                render: function () {
                    const ul = document.createElement('ul');
                    ul.className = props.className;
                    const renderedChildren = Array.from(Melipona.renderChildren(children).childNodes);
                    renderedChildren.forEach(c => {
                        const li = document.createElement('li');
                        li.appendChild(c);
                        ul.appendChild(li);
                    });

                    return ul;
                }
            };
        };
        assert.htmlEqual(
            getHtml(`Melipona.render(
                    <ListComponent className="list">
                        <div>some item</div>
                        some item that is text
                        <p>some <span className="italic">other</span> item</p>
                    </ListComponent>, document.body)`, { ListComponent }),
            `<ul class="list">
                <li><div>some item</item></li>
                <li>some item that is text</li>
                <li><p>some <span class="italic">other</span> item</p></li>
            </ul>`
        );
    });
});


