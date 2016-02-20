//Returns true if it is a DOM node
function isNode(o){
    return typeof Node === 'object' ?
        o instanceof Node : 
        o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName==='string';
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

function renderComponent(component) {
    const result = component.render();
    let node;

    if (typeof result === 'string') {
        const div = document.createElement('div');
        div.innerHTML = result;
        if (div.childNodes.length !== 1) {
            throw new Error(`HTML string returned from render has multiple roots: ${result}`);
        }
        node = div.firstChild;
    } else if (isNode(result)) {
        node = result;
    } else if (typeof result === 'object' && typeof result.render === 'function') {
        node = result.render();
    }

    if (!node) {
        throw new Error(`Unsupported object returned from render: ${result}`);
    }

    component.__mp.node = node;
    return node;
}

function renderChildren(children) {
    const fragment = document.createDocumentFragment();
    children.forEach(c => {
        const node = typeof c === 'string' ? document.createTextNode(c) : renderComponent(c);
        fragment.appendChild(node);
    });
    return fragment;
}

function *walk(root) {
    yield root;
    if (root.__mp.children) {
        for (const child of root.__mp.children) {
            // exclude text nodes
            if (typeof child !== 'string') {
                yield *walk(child);
            }
        }
    }
}

function attach(tree, idString = '') {
    let id = 0;
    for (const component of walk(tree)) {
        if (!component.__mp.id) {
            component.__mp.id = idString + (id++);
        }
        component.__mp.node.setAttribute('data-melipona-id', component.__mp.id);

        if (component.attach && typeof component.attach === 'function') {
            component.attach(component.__mp.node, `${component.__mp.id}.`);
        }
    }
}

function find(tree, delegate) {
    if (typeof delegate === 'string') {
        const s = delegate;
        delegate = c => c.__mp.ref === s;
    }
    for (const component of walk(tree)) {
        if (delegate(component)) {
            return component;
        }
    }
    return null;
}

export const Melipona = {
    build(type, props, ...children) {
        const t = typeof type;

        let component;
        switch (t) {
        case 'string':
            component = createDomElement(type, props, children);
            break;
        case 'function':
            component = type(props, children);
            break;
        default:
            throw new Error(`Unsupported type: ${typeof type}`);
        }
        component.__mp = {
            children,
            ref: props && props.ref,
            node: null
        };
        return component;
    },

    render(tree, container) {
        const result = renderComponent(tree);
        container.appendChild(result);
        attach(tree);
        return tree;
    },

    renderChildren,
    find
};

