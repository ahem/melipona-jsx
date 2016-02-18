//Returns true if it is a DOM node
function isNode(o){
    return typeof Node === 'object' ?
        o instanceof Node : 
        o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName==='string';
}

function renderResultToNode(result) {
    if (typeof result === 'string') {
        const div = document.createElement('div');
        div.innerHTML = result;
        if (div.childNodes.length !== 1) {
            throw new Error(`HTML string returned from render has multiple roots: ${result}`);
        }
        return div.firstChild;
    }

    if (isNode(result)) {
        return result;
    }

    if (typeof result === 'object' && typeof result.render === 'function') {
        return result.render();
    }

    throw new Error(`Unsupported object returned from render: ${result}`);
}

function renderChildren(children) {
    const fragment = document.createDocumentFragment();
    children.forEach(c => {
        const node = typeof c === 'string' ? document.createTextNode(c) : renderResultToNode(c.render());
        fragment.appendChild(node);
    });
    return fragment;
}

function createDomElement(tagname, props, children) {
    return {
        render() {
            const el = document.createElement(tagname);
            if (props) {
                Object.keys(props).forEach(k => {
                    if (typeof props[k] === 'object') {
                        Object.keys(props[k]).forEach(kk => el[k][kk] = props[k][kk]);
                    } else {
                        el[k] = props[k];
                    }
                });
            }
            el.appendChild(renderChildren(children));
            return el;
        }
    };
}

export const Melipona = {
    build(type, props, ...children) {
        if (typeof type === 'string') {
            return createDomElement(type, props, children);
        }
        if (typeof type === 'function') {
            return type(props, children);
        }
        throw new Error(`Unsupported type: ${typeof type}`);
    },

    render(tree, container) {
        const result = renderResultToNode(tree.render());
        container.appendChild(result);
    },

    renderChildren
};

