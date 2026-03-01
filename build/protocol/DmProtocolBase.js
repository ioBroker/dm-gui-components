export class DmProtocolBase {
    selectedInstance;
    socket;
    constructor(selectedInstance, socket) {
        this.selectedInstance = selectedInstance;
        this.socket = socket;
    }
    send(command, data) {
        return this.socket.sendTo(this.selectedInstance, command, data);
    }
}
//# sourceMappingURL=DmProtocolBase.js.map