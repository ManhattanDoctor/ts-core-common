import { ILogger, LoggerWrapper } from '../logger';
import { ITransport, ITransportCommand } from './ITransport';
import { TransportWaitError } from './error';
import { ExtendedError } from '../error';
import { takeUntil } from 'rxjs';
import * as _ from 'lodash';

export abstract class TransportCommandHandler<U, C extends ITransportCommand<U>, V = void, T extends ITransport = ITransport> extends LoggerWrapper {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected transport: T;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    protected constructor(logger: ILogger, transport: T, name: string) {
        super(logger);

        this.transport = transport;
        this.transport.listen<C>(name).pipe(takeUntil(this.destroyed)).subscribe(async command => {
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
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        this.transport = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async handleCommand(command: C): Promise<V> {
        let request = this.checkRequest(command.request);
        let response = await this.execute(request, command);
        return this.checkResponse(response)
    }

    protected handleError(command: C, error: Error): void {
        if (TransportWaitError.instanceOf(error)) {
            this.transport.wait(command);
            return;
        }
        if (_.isNil(error)) {
            error = new ExtendedError(`Undefined error`);
        }
        else if (_.isString(error)) {
            error = new ExtendedError(error);
        }
        this.transport.complete(command, error);
        this.error(error, error.stack);
    }

    protected checkRequest(params: U): U {
        return params;
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
