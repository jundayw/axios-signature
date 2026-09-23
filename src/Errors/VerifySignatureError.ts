export default class VerifySignatureError extends Error {
    public readonly code: string;

    constructor(message: string = 'Signature Verification Failed', code: string = 'SIGNATURE_VERIFICATION_FAILED') {
        super(message);

        this.name = 'SignatureVerificationError';
        this.code = code;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}