import { module } from 'modujs';

export default class extends module {
    constructor(m) {
        super(m);

        this.events = {
            click: 'openPlayer'
        }
    }

    openPlayer(e) {
        const el = e.curTarget
        const id = this.getData('id', el)
        const host = this.getData('host', el)

        this.call('open', { host, id }, 'VideoModal')
    }
}