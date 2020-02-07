// #package js/main

// #include UIObject.js

class Tabs extends UIObject {

constructor(options) {
    super(TEMPLATES.Tabs, options);

    this._handleClick = this._handleClick.bind(this);

    this._tabs = [];
    this._index = 0;
}

add(name, object) {
    let panel = document.createElement('div');
    let header = document.createElement('div');
    const index = this._tabs.length;

    header.textContent = name || ('Tab ' + (index + 1));
    this._tabs.push({
        object : object,
        header : header,
        panel  : panel
    });
    this._binds.container.appendChild(panel);
    this._binds.headers.appendChild(header);
    object.appendTo(panel);

    panel.style.order = index;
    header.style.order = index;

    header.classList.add('header');
    header.addEventListener('click', this._handleClick);

    this._updateStyle();
}

_indexOfTab(tab) {
    for (let i = 0; i < this._tabs.length; i++) {
        if (this._tabs[i].header === tab ||
            this._tabs[i].panel === tab ||
            this._tabs[i].object === tab)
        {
            return i;
        }
    }
    return -1;
}

selectTab(objectOrIndex) {
    const len = this._tabs.length;
    if (len === 0) {
        return;
    }

    let index;
    if (typeof objectOrIndex === 'number') {
        index = ((objectOrIndex % len) + len) % len;
    } else {
        index = this._indexOfTab(objectOrIndex);
    }

    if (index >= 0 && index <= len) {
        this._index = index;
        this._updateStyle();
    }
}

_updateStyle() {
    for (let i = 0; i < this._tabs.length; i++) {
        const tab = this._tabs[i];
        const offset = -this._index * 100;
        tab.panel.style.left = offset + '%';
        if (i === this._index) {
            tab.header.classList.add('selected');
            tab.panel.classList.add('selected');
        } else {
            tab.header.classList.remove('selected');
            tab.panel.classList.remove('selected');
        }
    }
}

_handleClick(e) {
    const index = this._indexOfTab(e.target);
    if (index >= 0) {
        this.selectTab(index);
    }
}

}
