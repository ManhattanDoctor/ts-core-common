import * as _ from 'lodash';
import * as nacl from 'tweetnacl';
import { IKeyAsymmetric } from './IKeyAsymmetric';

export class Ed25519Box {
    
    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public static keys(): IKeyAsymmetric {
        let keys = nacl.box.keyPair();
        return { publicKey: Buffer.from(keys.publicKey).toString('hex'), privateKey: Buffer.from(keys.secretKey).toString('hex') };
    }

    public static nonce(): string {
        return Buffer.from(nacl.randomBytes(nacl.box.nonceLength)).toString('hex')
    }

    public static from(privateKey: string): IKeyAsymmetric {
        let keys = nacl.box.keyPair.fromSecretKey(Buffer.from(privateKey, 'hex'));
        return { publicKey: Buffer.from(keys.publicKey).toString('hex'), privateKey: Buffer.from(keys.secretKey).toString('hex') };
    }

    public static encrypt(message: string, publicKey: string, nonce?: string, keys?: IKeyAsymmetric): IEd25519Box {
        if (_.isNil(nonce)) {
            nonce = Ed25519Box.nonce();
        }
        if (_.isNil(keys)) {
            keys = Ed25519Box.keys();
        }
        return { message: Buffer.from(nacl.box(Buffer.from(message), Buffer.from(nonce, 'hex'), Buffer.from(publicKey, 'hex'), Buffer.from(keys.privateKey, 'hex'))).toString('hex'), publicKey: keys.publicKey, nonce }
    }

    public static decrypt(item: IEd25519Box, privateKey: string): string {
        return Buffer.from(nacl.box.open(Buffer.from(item.message, 'hex'), Buffer.from(item.nonce, 'hex'), Buffer.from(item.publicKey, 'hex'), Buffer.from(privateKey, 'hex'))).toString();
    }
}

export interface IEd25519Box {
    nonce: string;
    message: string;
    publicKey: string;
}
