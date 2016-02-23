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

function appendChild(parentComponent, childComponent, insertBefore) {
    if (insertBefore) {
        const idx = parentComponent.__mp.children.indexOf(insertBefore);
        parentComponent.__mp.children.splice(idx, 0, childComponent);
    } else {
        parentComponent.__mp.children.push(childComponent);
    }

    if (parentComponent.__mp.node) {
        const childNode = childComponent.__mp.node || renderComponent(childComponent);
        parentComponent.__mp.node.insertBefore(childNode, insertBefore ? insertBefore.__mp.node : null);
        if (childComponent.attach) {
            childComponent.attach(childComponent.__mp.node);
        }
    }
}

function removeChild(parentComponent, childComponent) {
    const idx = parentComponent.__mp.children.indexOf(childComponent);
    if (idx >= 0 && parentComponent.__mp.node) {
        if (childComponent.dettach) {
            childComponent.dettach(childComponent.__mp.node);
        }
        parentComponent.__mp.node.removeChild(childComponent.__mp.node);
        childComponent.node = null;
        parentComponent.__mp.children.splice(idx, 1);
    }
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

        function walk(root, cb, id = '0') {
            cb(root, id);
            if (root.__mp.children) {
                let idx = 0;
                for (const child of root.__mp.children) {
                    // exclude text nodes
                    if (typeof child !== 'string') {
                        walk(child, cb, `${id}.${idx++}`);
                    }
                }
            }
        }

        Melipona._componentIdCounter = Melipona._componentIdCounter || 0;

        walk(tree, (component, id) => {
            component.__mp.id = id;
            component.__mp.node.setAttribute('data-melipona-id', id);
            if (component.attach && typeof component.attach === 'function') {
                component.attach(component.__mp.node);
            }
        }, Melipona._componentIdCounter++);

        container.appendChild(result);
        return tree;
    },

    find,
    removeChild,
    renderChildren,
    appendChild
};

