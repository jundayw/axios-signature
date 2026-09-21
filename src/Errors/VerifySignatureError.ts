export default class VerifySignatureError extends Error {
    public readonly code: string;

    constructor(message: string = 'Response signature verification failed', code: string = 'SIGNATURE_VERIFICATION_FAILED') {
        super(message);

        this.name = 'VerifySignatureError';
        this.code = code;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}