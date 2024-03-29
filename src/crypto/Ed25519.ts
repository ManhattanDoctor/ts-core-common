import * as _ from 'lodash';
import * as nacl from 'tweetnacl';
import { IKeyAsymmetric } from './IKeyAsymmetric';

export class Ed25519 {

    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static ALGORITHM = 'Ed25519';

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public static keys(): IKeyAsymmetric {
        let keys = nacl.sign.keyPair();
        return {
            publicKey: Buffer.from(keys.publicKey).toString('hex'),
            privateKey: Buffer.from(keys.secretKey).toString('hex')
        };
    }

    public static nonce(): string {
        return Buffer.from(nacl.randomBytes(24)).toString('hex')
    }

    public static from(privateKey: string): IKeyAsymmetric {
        let keys = nacl.sign.keyPair.fromSecretKey(Buffer.from(privateKey, 'hex'));
        return {
            publicKey: Buffer.from(keys.publicKey).toString('hex'),
            privateKey: Buffer.from(keys.secretKey).toString('hex')
        };
    }

    public static sign(message: string, privateKey: string): string {
        return Buffer.from(nacl.sign.detached(Buffer.from(message), Buffer.from(privateKey, 'hex'))).toString('hex');
    }

    public static verify(message: string, signature: string, publicKey: string): boolean {
        return nacl.sign.detached.verify(Buffer.from(message), Buffer.from(signature, 'hex'), Buffer.from(publicKey, 'hex'));
    }

    public static encrypt(message: string, publicKey: string, nonce: string): string {
        return Buffer.from(nacl.secretbox(Buffer.from(message), Buffer.from(nonce, 'hex'), Buffer.from(publicKey, 'hex'))).toString('hex');
    }

    public static decrypt(message: string, publicKey: string, nonce: string): string {
        return Buffer.from(nacl.secretbox.open(Buffer.from(message, 'hex'), Buffer.from(nonce, 'hex'), Buffer.from(publicKey, 'hex'))).toString('utf8');
    }
}
