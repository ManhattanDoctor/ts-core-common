import { ILogger } from '../logger';
import { TransportCommandHandlerAbstract } from './TransportCommandHandlerAbstract';
import { ITransport, ITransportCommand } from './ITransport';

export abstract class TransportCommandHandler<U, T extends ITransportCommand<U>, V = void> extends TransportCommandHandlerAbstract<U, T> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    protected constructor(logger: ILogger, transport: ITransport, name: string) {
        super(logger, transport);

        this.transport.listen<T>(name).subscribe(async command => {
            try {
                let response = await this.handleCommand(command);
                this.transport.complete(command, response);
            } catch (error) {
                this.handleError(command, error);
            }
        });
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async handleCommand(command: T): Promise<V> {
        let request = this.checkRequest(command.request);
        let response = await this.execute(request, command);
        return this.checkResponse(response)
    }

    protected checkResponse(response: V): V {
        return response;
    }

    // --------------------------------------------------------------------------
    //
    //  Abstract Methods
    //
    // --------------------------------------------------------------------------

    protected abstract execute(request: U, ...params): Promise<V>;
}
