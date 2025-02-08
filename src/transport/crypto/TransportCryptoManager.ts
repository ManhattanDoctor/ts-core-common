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
        let { publicKey, privateKey } = key;
        return { value: await manager.sign(command, nonce, privateKey), algorithm: manager.algorithm, publicKey, nonce };
    }

    public static async verify<U>(command: ITransportCommand<U>, manager: ITransportCryptoManager, signature: ISignature): Promise<boolean> {
        return manager.verify(command, signature);
    }

    public static toSign<U>(command: ITransportCommand<U>, nonce: string): string {
        let { name, request } = command;
        if (_.isNil(request)) {
            return `${name}_${nonce}`;
        }
        let value = _.isObject(request) ? TransformUtil.fromJSON(ObjectUtil.sortKeys(request, true)) : request.toString();
        return `${name}_${value}_${nonce}`;
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

    protected toSign<U>(command: ITransportCommand<U>, nonce: string): string {
        return TransportCryptoManager.toSign(command, nonce);
    }
}