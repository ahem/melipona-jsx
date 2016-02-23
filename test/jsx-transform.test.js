import chai from 'chai';
chai.use(require('./asserters/htmlEqual'));

const assert = chai.assert;

import { Melipona } from  '../src/index';
import jsxToHTML from './jsx-to-html';

describe('JSX transforms', () => {

    beforeEach(() => {
        Melipona._componentIdCounter = 0;
    });

    it('plain dom', () => {
        assert.htmlEqual(
            jsxToHTML(`Melipona.render((
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
            jsxToHTML('Melipona.render(<LabelComponent text="hey there!!" />, document.body)', { LabelComponent }),
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
            jsxToHTML(`Melipona.render(
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

    it('turn strings returned from render() into html', () => {
        const Component = () => ({
            render() { return '<div class="test"><p>test</p></div>'; }
        });
        assert.htmlEqual(
            jsxToHTML('Melipona.render(<Component />, document.body)', { Component }),
            '<div class="test"><p>test</p></div>'
        );

        // FIXME: this test acutally passes, but it causes some ugly output from JSDOM (I think) on the console
        /*
        const BrokenComponent = () => ({
            render() { return '<div class="first"></div><div>second</div>'; }
        });
        assert.throws(() => jsxToHTML('Melipona.render(<BrokenComponent />, document.body)', { BrokenComponent }));
        */
    });

    it('turn JSX tree returned from render() into html', () => {
        assert.htmlEqual(
            jsxToHTML(`
                const Component = () => ({
                    render() {
                        return (<div className="test"><p>test</p></div>); }
                });
                Melipona.render(<Component />, document.body)`
            ),
            '<div class="test"><p>test</p></div>'
        );
    });

    it('add data-melipona-id attributes', () => {
        assert.htmlEqual(
            jsxToHTML(` Melipona.render(<div className="a">
                <div className="b">
                    <div className="c"></div>
                    <div className="d"></div>
                    <div className="e"></div>
                </div>
                <div className="f"></div>
            </div>, document.body)`, {}, true),
            `<div class="a" data-melipona-id="0">
                <div class="b" data-melipona-id="0.0">
                    <div class="c" data-melipona-id="0.0.0"></div>
                    <div class="d" data-melipona-id="0.0.1"></div>
                    <div class="e" data-melipona-id="0.0.2"></div>
                </div>
                <div class="f" data-melipona-id="0.1"></div>
            </div>`
        );
    });

});


