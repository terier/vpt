// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/IsoLayersGroup.json

class IsoLayersDialog extends AbstractDialog {

    constructor(options) {
        super(UISPECS.IsoLayersDialog, options);

        this.groups = [];
        // this.attributes = [];

        this._registerEventListeners();
        this._addEventListeners();

        console.log("ISO Layers Init");
    }

    _registerEventListeners() {
        this._handleAddGroupClick = this._handleAddGroupClick.bind(this);
        this._handleGroupChange = this._handleGroupChange.bind(this);
    }

    _addEventListeners() {
        this._binds.addGroupButton.addEventListener('click', this._handleAddGroupClick);
    }

    _setInitialData() {
        const group = this._addGroup();
        group.binds.enabled.setChecked(true);
        group.binds.alpha.setValue(1);
        group.binds.isovalue.setValue(0.5);
        group.binds.color.setValue('#ddeeff');
        group.binds.p.setValue(10);
        group.binds.metalic.setValue(0);
        group.binds.f90.setValue('#ffffff');
        group.binds.specularWeight.setValue(1.0);
        group.binds.alphaRoughness.setValue(0.08);
        this._handleGroupChange();
    }

    reset() {
        for (const group of this.groups) {
            group.object.destroy();
        }
        this.groups = [];
    }

    // setAttributes(attributes) {
    //     this.attributes = attributes;
    // }

    getGroups() {
        return this.groups.map(group => ({
            enabled: group.binds.enabled.isChecked(),
            alpha: group.binds.alpha.getValue(),
            isovalue: group.binds.isovalue.getValue(),
            color: group.binds.color.getValue(),
            p: group.binds.p.getValue(),
            metalic: group.binds.metalic.getValue(),
            f90: group.binds.f90.getValue(),
            specularWeight: group.binds.specularWeight.getValue(),
            alphaRoughness: group.binds.alphaRoughness.getValue()
        }));
    }

    _handleAddGroupClick() {
        this._addGroup();
    }

    _handleGroupChange() {
        this.trigger('change');
    }

    _addGroup() {
        const group = UI.create(UISPECS.IsoLayersGroup);
        const {object, binds} = group;

        this.groups.push(group);

        this._binds.group_container.add(object);
        binds.spacer._element.classList.add('visibility-group');

        const controlPanel = DOMUtils.instantiate(TEMPLATES.LightsGroupControlPanel);
        const controlPanelButtons = DOMUtils.bind(controlPanel);
        binds.controlPanel._element.appendChild(controlPanel);

        // for (const attribute of this.attributes) {
        //     binds.attribute.addOption(attribute, attribute);
        // }
        // binds.attribute.setValue(this.attributes[0]);

        binds.enabled.setChecked(true);
        binds.alpha.setValue(1);
        binds.isovalue.setValue(0.5);
        binds.color.setValue('#000000');
        binds.p.setValue(10);
        binds.metalic.setValue(0);
        binds.f90.setValue('#ffffff');
        binds.specularWeight.setValue(1.0);
        binds.alphaRoughness.setValue(0.08);
        // controlPanelButtons.up.addEventListener('click', e => this._moveUp(group));
        // controlPanelButtons.down.addEventListener('click', e => this._moveDown(group));
        controlPanelButtons.delete.addEventListener('click', e => this._delete(group));

        binds.enabled.addEventListener('change', this._handleGroupChange);
        binds.alpha.addEventListener('input', this._handleGroupChange);
        binds.isovalue.addEventListener('input', this._handleGroupChange);
        binds.color.addEventListener('change', this._handleGroupChange);
        binds.p.addEventListener('input', this._handleGroupChange);
        binds.metalic.addEventListener('change', this._handleGroupChange);
        binds.f90.addEventListener('change', this._handleGroupChange);
        binds.specularWeight.addEventListener('change', this._handleGroupChange);
        binds.alphaRoughness.addEventListener('change', this._handleGroupChange);

        return group;
    }

    // _moveUp(group) {
    //     const index = this.groups.indexOf(group);
    //     if (index === 0) {
    //         return;
    //     }
    //
    //     const temp = this.groups[index];
    //     this.groups[index] = this.groups[index - 1];
    //     this.groups[index - 1] = temp;
    //
    //     this._binds.group_container._element.insertBefore(
    //         group.object._element, group.object._element.previousSibling);
    //
    //     // this.trigger('retopo');
    // }
    //
    // _moveDown(group) {
    //     const index = this.groups.indexOf(group);
    //     if (index === this.groups.length - 1) {
    //         return;
    //     }
    //
    //     const temp = this.groups[index];
    //     this.groups[index] = this.groups[index + 1];
    //     this.groups[index + 1] = temp;
    //
    //     this._binds.group_container._element.insertBefore(
    //         group.object._element.nextSibling, group.object._element);
    //
    //     // this.trigger('retopo');
    // }

    _delete(group) {
        const index = this.groups.indexOf(group);
        this.groups.splice(index, 1);
        group.object.destroy();

        this.trigger('change');
    }

}
