import { ITransportCommand } from '../ITransport';
import { Ed25519, ISignature } from '../../crypto';
import { TransportCryptoManager } from './TransportCryptoManager';
import * as _ from 'lodash';

export class TransportCryptoManagerEd25519 extends TransportCryptoManager {
    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static ALGORITHM = Ed25519.ALGORITHM;

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async sign<U>(command: ITransportCommand<U>, nonce: string, privateKey: string): Promise<string> {
        return Ed25519.sign(this.toString(command, nonce), privateKey);
    }

    public async verify<U>(command: ITransportCommand<U>, signature: ISignature): Promise<boolean> {
        return Ed25519.verify(this.toString(command, signature.nonce), signature.value, signature.publicKey);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected toStringRequest<U>(item: U): string {
        return item.toString();
    }

    public get algorithm(): string {
        return TransportCryptoManagerEd25519.ALGORITHM;
    }
}
