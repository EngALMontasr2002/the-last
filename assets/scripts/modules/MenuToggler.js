import { module } from 'modujs';

export default class extends module {
    constructor(m) {
        super(m);

        this.events = {
            click: 'openMenu'
        }
    }

    openMenu() {
        this.call('open', null, 'MenuModal')
    }
}