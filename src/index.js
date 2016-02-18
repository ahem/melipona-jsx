
function renderChildren(children) {
    const fragment = document.createDocumentFragment();
    children.forEach(c => {
        const node = typeof c === 'string' ? document.createTextNode(c) : c.render();
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
        container.appendChild(tree.render());
    },

    renderChildren
};

