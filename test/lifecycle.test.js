import chai from 'chai';
chai.use(require('./asserters/htmlEqual'));

const assert = chai.assert;

import { Melipona } from  '../src/index';
import jsxToHTML from './jsx-to-html';

describe('lifecycle events', () => {
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

        assert.htmlEqual(
            jsxToHTML(`Melipona.render(
                <Component className="a">
                    <Component className="b">
                        <Component className="c" />
                    </Component>
                    <Component className="d" />
                </Component>, document.body)`, { Component }),
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

