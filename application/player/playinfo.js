class playinfo {
    constructor(aid, item, mode, interaction) {
        this.aid = parseInt(aid);
        this.cid = item.cid;
        this.duration = item.duration;
        this.mode = mode;
        if (interaction == undefined)
            interaction = false;
        this.interaction = interaction;
        this.title = 'P' + item.page + " " + item.part;
    }
}