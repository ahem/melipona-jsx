// Compiled from this: https://github.com/metalshark/grunt-html5compare/blob/master/tasks/lib/html5compare.litcoffee
// Note that this code is presumably under the LGPL license.

'use strict';

const jsdom = require('jsdom').jsdom;

function compare(orig, comp) {
    var compDOM, origDOM;
    origDOM = jsdom(orig);
    compDOM = jsdom(comp);
    trimWhitespace(origDOM);
    trimWhitespace(compDOM);
    return compareElements(origDOM, compDOM);
}

function trimWhitespace(dom) {
    var childNode, i, j, k, len, len1, len2, ref, ref1, results, whitespaceChildren;
    if (dom.innerHTML) {
        dom.innerHTML = dom.innerHTML.replace(/^[\n\r\s\t]+|[\n\r\s\t]+$/gm, '');
    }
    whitespaceChildren = [];
    if (dom.hasChildNodes()) {
        ref = dom.childNodes;
        for (i = 0, len = ref.length; i < len; i++) {
            childNode = ref[i];
            if (childNode.nodeName === '#text') {
                if (childNode.textContent.match(/^[\n\r\s\t]+$/gm)) {
                    whitespaceChildren.push(childNode);
                }
            }
        }
    }
    for (j = 0, len1 = whitespaceChildren.length; j < len1; j++) {
        childNode = whitespaceChildren[j];
        dom.removeChild(childNode);
    }
    if (dom.hasChildNodes()) {
        ref1 = dom.childNodes;
        results = [];
        for (k = 0, len2 = ref1.length; k < len2; k++) {
            childNode = ref1[k];
            results.push(trimWhitespace(childNode));
        }
        return results;
    }
}

function trimTextWhitespace(text) {
    text = text.replace(/[\n\r\s\t]/gm, ' ');
    text = text.replace(/[\s][\s]+/g, ' ');
    text = text.replace(/^[\s]+|[\s]+$/g, '');
    return text;
}

function drawTreeView(parent, node, state, indent) {
    var childNode, classes, i, len, ref;
    if (state == null) {
        state = {
            text: ''
        };
    }
    if (indent == null) {
        indent = '';
    }
    if (parent.nodeName === '#text') {
        state.text += indent + trimTextWhitespace(parent.nodeValue);
    } else {
        state.text += indent + parent.nodeName;
        if (parent != null) {
            if (parent.id != null) {
                state.text += '#' + parent.id;
            }
            if (parent.className != null) {
                classes = parent.className.split(/[\s,]+/).sort().join('.');
                if (classes) {
                    state.text += '.' + classes;
                }
            }
        }
    }
    state.text += '\n';
    if (parent === node) {
        return state.text;
    }
    indent += '-';
    ref = parent.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
        childNode = ref[i];
        if (drawTreeView(childNode, node, state, indent)) {
            return state.text;
        }
    }
    return false;
}

function throwError(parent, node, text) {
    var treeview;
    treeview = drawTreeView(parent, node);
    throw new Error(text + '\n' + treeview);
}

function compareElements(orig, comp, parent) {
    var attr, compAttrNames, compChildrenNames, compNames, compText, compValue, i, index, j, k, l, len,
        len1, len2, len3, len4, len5, m, n, node, origAttrNames, origChildNode, origChildrenNames,
        origNames, origText, ref, ref1, ref2, ref3, ref4, ref5;
    if (parent == null) {
        parent = orig;
    }
    if (orig.nodeName !== comp.nodeName) {
        throwError(parent, orig, 'nodeNames do not match: ' + orig.nodeName + ' != ' + comp.nodeName);
    }
    if (orig.attributes) {
        if (orig.attributes.length !== comp.attributes.length) {
            origAttrNames = [];
            compAttrNames = [];
            ref = orig.attributes;
            for (i = 0, len = ref.length; i < len; i++) {
                attr = ref[i];
                origAttrNames.push(attr.name);
                origNames = origAttrNames.join(', ');
            }
            ref1 = comp.attributes;
            for (j = 0, len1 = ref1.length; j < len1; j++) {
                attr = ref1[j];
                compAttrNames.push(attr.name);
                compNames = compAttrNames.join(', ');
            }
            throwError(parent, orig, 'attribute lengths do not match: (' + origNames + ') != (' +
                compNames + ')');
        }
        ref2 = orig.attributes;
        for (k = 0, len2 = ref2.length; k < len2; k++) {
            attr = ref2[k];
            compValue = comp.getAttribute(attr.name);
            if (attr.name === attr.value) {
                attr.value = '';
            }
            if (attr.name === compValue) {
                compValue = '';
            }
            if (attr.name === 'class') {
                attr.value = attr.value.split(/[\s,]+/).sort().join(' ');
                if (compValue) {
                    compValue = compValue.split(/[\s,]+/).sort().join(' ');
                } else {
                    compValue = [];
                }
            }
            if (attr.value !== compValue) {
                throwError(parent, orig, 'attribute values do not match: "' + attr.value + '" != "' +
                    compValue + '"');
            }
        }
    }
    if (orig.hasChildNodes()) {
        if (orig.childNodes.length !== comp.childNodes.length) {
            origChildrenNames = [];
            compChildrenNames = [];
            ref3 = orig.childNodes;
            for (l = 0, len3 = ref3.length; l < len3; l++) {
                node = ref3[l];
                origChildrenNames.push(node.nodeName);
                origNames = origChildrenNames.join(', ');
            }
            ref4 = comp.childNodes;
            for (m = 0, len4 = ref4.length; m < len4; m++) {
                node = ref4[m];
                compChildrenNames.push(node.nodeName);
                compNames = compChildrenNames.join(', ');
            }
            throwError(parent, orig, 'child lengths do not match: (' + origNames + ') != (' + compNames +
                ')');
        }
        ref5 = orig.childNodes;
        for (index = n = 0, len5 = ref5.length; n < len5; index = ++n) {
            origChildNode = ref5[index];
            compareElements(origChildNode, comp.childNodes[index], parent);
        }
    }
    if (orig.nodeName === '#text') {
        origText = trimTextWhitespace(orig.textContent);
        compText = trimTextWhitespace(comp.textContent);
        if (origText !== compText) {
            return throwError(parent, orig, 'content differs "' + origText + '" != "' + compText + '"');
        }
    }
}

module.exports = function (chai, utils) {
    utils.addMethod(chai.Assertion.prototype, 'htmlEqual', function (expected) {
        const obj = this._obj;
        let error = '';

        try {
            compare(obj, expected);
        } catch (e) {
            error = e.message;
        }

        this.assert(obj && !error,
            'expected HTML of #{act} to equal #{exp}: ' + error,
            'expected HTML of #{act} to not equal #{exp}.',
            expected,
            obj);
    });

    const assert = chai.assert;
    assert.htmlEqual = function (val, exp, msg) {
        new chai.Assertion(val, msg).to.be.htmlEqual(exp);
    };
    assert.notHtmlEqual = function (val, exp, msg) {
        new chai.Assertion(val, msg).to.not.be.htmlEqual(exp);
    };
};



