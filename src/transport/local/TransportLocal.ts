
import * as _ from 'lodash';
import { TransportImpl } from '../TransportImpl';
import { ITransportSettings } from '../ITransportSettings';
import { ITransportCommand, ITransportCommandAsync, ITransportCommandOptions, ITransportEvent } from '../ITransport';
import { TransportLogType } from '../TransportLogUtil';
import { ITransportCommandRequest } from '../Transport';

export class TransportLocal extends TransportImpl<ITransportSettings> {

    // --------------------------------------------------------------------------
    //
    //  Private Methods
    //
    // --------------------------------------------------------------------------

    protected async commandRequestExecute<U>(command: ITransportCommand<U>, options: ITransportCommandOptions, isNeedReply: boolean): Promise<void> {
        this.logCommand(command, TransportLogType.REQUEST_RECEIVED);
        this.requests.set(command.id, { waited: 0, isNeedReply });
        return this.commandResponseDispatch(command, options, isNeedReply);
    }

    protected async commandResponseExecute<U, V>(command: ITransportCommandAsync<U, V>, request: ITransportCommandRequest): Promise<void> {
        let promise = this.promises.get(command.id);
        if (_.isNil(promise)) {
            this.warn(`Unable to find command promise: probably command was already completed`);
            return;
        }
        this.commandRequestResponseReceived(promise, _.isNil(command.error) ? command.data : command.error);
    }

    protected async eventRequestExecute<U>(event: ITransportEvent<U>): Promise<void> {
        return this.eventRequestReceived(event);
    }
}
