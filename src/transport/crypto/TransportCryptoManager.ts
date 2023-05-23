import { IKeyAsymmetric, ISignature } from "../../crypto";
import { ObjectUtil, TransformUtil } from "../../util";
import { ITransportCommand } from "../ITransport";
import { ITransportCryptoManager } from "./ITransportCryptoManager";
import * as _ from 'lodash';

export abstract class TransportCryptoManager implements ITransportCryptoManager {
    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static async sign<U>(command: ITransportCommand<U>, manager: ITransportCryptoManager, key: IKeyAsymmetric, nonce?: string): Promise<ISignature> {
        if (_.isNil(nonce)) {
            nonce = Date.now().toString();
        }
        return {
            value: await manager.sign(command, nonce, key.privateKey),
            publicKey: key.publicKey,
            algorithm: manager.algorithm,
            nonce
        }
    }

    public static async verify<U>(command: ITransportCommand<U>, manager: ITransportCryptoManager, signature: ISignature): Promise<boolean> {
        return manager.verify(command, signature);
    }

    // --------------------------------------------------------------------------
    //
    //  Abstract  Methods
    //
    // --------------------------------------------------------------------------

    abstract sign<U>(command: ITransportCommand<U>, nonce: string, privateKey: string): Promise<string>;

    abstract verify<U>(command: ITransportCommand<U>, signature: ISignature): Promise<boolean>;

    abstract readonly algorithm: string;

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected toString<U>(command: ITransportCommand<U>, nonce: string): string {
        let request = !_.isNil(command.request) ? this.toStringRequest(command.request) : '';
        return `${command.name}${request}${nonce}`;
    }

    protected toStringRequest<U>(item: U): string {
        return _.isObject(item) ? TransformUtil.fromJSON(ObjectUtil.sortKeys(item, true)) : item.toString();
    }
}