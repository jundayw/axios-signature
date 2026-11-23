import Signature from "./signature";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import VerifySignatureError from "./Errors/VerifySignatureError";

export type SignatureInterceptor = (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
export type SignatureFactory = (
    appId: string,
    appSecretKey: string,
    signatureKey?: string,
    prefix?: string
) => SignatureInterceptor;

export const SignatureInstance: SignatureFactory = (
    appId: string, appSecretKey: string, signatureKey: string = 'signature', prefix: string = 'x'
): SignatureInterceptor => {
    const signature = new Signature(appId, appSecretKey, signatureKey, prefix)
    return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> => {
        return signature.signature(config)
    };
};

export type VerifyInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
export type VerifyFactory = (
    appId: string,
    appSecretKey: string,
    signatureKey?: string,
    algorithm?: string,
) => VerifyInterceptor;

export const VerifyInstance: VerifyFactory = (
    appId: string, appSecretKey: string, signatureKey: string = 'signature', algorithm: string = 'SHA512'
): VerifyInterceptor => {
    const signature = new Signature(appId, appSecretKey, signatureKey)
    return (response: AxiosResponse): AxiosResponse | Promise<AxiosResponse> => {
        if (signature.verify(response, algorithm)) {
            return response;
        }

        return Promise.reject(
            new VerifySignatureError('Response signature verification failed')
        );
    };
};

export default Signature