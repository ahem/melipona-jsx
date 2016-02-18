const chai = require('chai');
const htmlEqual = require('./htmlEqual');
chai.use(htmlEqual);

const assert = chai.assert;
const expect = chai.expect;

describe('htmlEqual chai plugin', () => {
    it('should work with expect', () => {
        expect('<div><h1>hest</h1></div>').to.htmlEqual('<div><H1>   hest </h1> </div>');
        expect('<div><h1>hest</h1></div>').to.not.htmlEqual('<p>giraf</p>');
    });
    it('should work with assert', () => {
        assert.htmlEqual('<div><h1>hest</h1></div>', '<div><H1>   hest </h1> </div>');
        assert.notHtmlEqual('<div><h1>hest</h1></div>', '<!-- hest --><div><H1>   hest </h1> </div>');
    });
});


