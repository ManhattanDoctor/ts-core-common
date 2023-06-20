import * as _ from 'lodash';
import { Ed25519 } from './Ed25519';
import { Sha512 } from './hash';
import { IKeyAsymmetric } from './IKeyAsymmetric';
import { Ed25519Box, IEd25519Box } from './Ed25519Box';

export class TweetNaCl {
    
    // --------------------------------------------------------------------------
    //
    //  Crypto Box Methods
    //
    // --------------------------------------------------------------------------

    public static keyPairBox(): IKeyAsymmetric {
        return Ed25519Box.keys();
    }

    public static encryptBox(message: string, publicKey: string, nonce?: string, keys?: IKeyAsymmetric): IEd25519Box {
        return Ed25519Box.encrypt(message, publicKey, nonce, keys);
    }

    public static decryptBox(item: IEd25519Box, privateKey: string): string {
        return Ed25519Box.decrypt(item, privateKey);
    }

    // --------------------------------------------------------------------------
    //
    //  Crypto Secret Box Methods
    //
    // --------------------------------------------------------------------------

    public static keyPair(): IKeyAsymmetric {
        return Ed25519.keys();
    }

    public static encrypt(message: string, key: string, nonce: string): string {
        return Ed25519.encrypt(message, key, nonce);
    }

    public static decrypt(message: string, key: string, nonce: string): string {
        return Ed25519.decrypt(message, key, nonce);
    }

    // --------------------------------------------------------------------------
    //
    //  Sing Methods
    //
    // --------------------------------------------------------------------------

    public static sign(message: string, privateKey: string): string {
        return Ed25519.sign(message, privateKey);
    }

    public static verify(message: string, signature: string, publicKey: string): boolean {
        return Ed25519.verify(message, signature, publicKey);
    }

    // --------------------------------------------------------------------------
    //
    //  Help Methods
    //
    // --------------------------------------------------------------------------

    public static sha512(message: string): Buffer {
        return Sha512.hash(Buffer.from(message));
    }

    public static hash(message: string, nonce?: string): string {
        if (!_.isNil(nonce)) {
            message += nonce;
        }
        return Sha512.hex(message);
    }
}
