import { type AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { match } from "ts-pattern";
import { HmacSHA1, HmacSHA256, HmacSHA512, HmacMD5 } from 'crypto-js';
import { URL, URLSearchParams } from './url'
import VerifySignatureError from "./Errors/VerifySignatureError";

class Signature {
    private readonly appId: string;
    private readonly appSecretKey: string;
    private readonly signatureKey: string;
    private readonly prefix: string;

    constructor(appId: string, appSecretKey: string, signatureKey: string = 'signature', prefix: string = 'x') {
        this.appId = appId
        this.appSecretKey = appSecretKey
        this.signatureKey = signatureKey
        this.prefix = prefix
    }

    public nonce(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
            (c === 'x' ? Math.random() * 16 | 0 : (Math.random() * 16 | 0) & 0x3 | 0x8).toString(16)
        );
    }

    public parameters(config: InternalAxiosRequestConfig): Record<string, Record<string, any>> {
        return {
            headers: {
                app_id: (config.headers['app_id'] as string) || this.appId,
                action: config.headers['action'] as string || config.url,
                type: ((config.headers['type'] as 'SHA1' | 'SHA256' | 'SHA512' | 'MD5') || 'SHA512').toUpperCase(),
                charset: (config.headers['charset'] as string || 'UTF-8').toUpperCase(),
                format: (config.headers['format'] as string || 'JSON').toUpperCase(),
                method: (config.headers['method'] as string || config.method as string || 'POST').toUpperCase(),
                version: (config.headers['version'] as string) || '1.0.0',
                timestamp: new Date().toISOString(),
                nonce: this.nonce().toUpperCase(),
            }
        };
    }

    public getParameterByKey(configuration: Record<string, Record<string, any>>, key: string, defaultValue: any = null): any {
        if (Object.prototype.hasOwnProperty.call(configuration, key)) {
            return configuration[key];
        }
        for (const value of Object.values(configuration)) {
            for (const [k, v] of Object.entries(value)) {
                if (key === k) {
                    return v;
                }
            }
        }
        return defaultValue;
    }

    public toHeaderKeyUpperCase(value: string): string {
        return (this.prefix ? `${this.prefix}_${value}` : value)
            .split('_')
            .filter(Boolean)
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            // .map((word: string) => word.toLowerCase())
            .join('-');
    }

    public build(config: Record<string, any>, hasHeader: boolean = false): Record<string, any> {
        return Object.fromEntries(Object.entries(config).map(([key, value]) => [
            hasHeader ? this.toHeaderKeyUpperCase(key) : key,
            key === 'headers' ? this.build(value, true) : value,
        ] as [string, any]));
    }

    public merge(source: Record<string, Record<string, any>>, target: Record<string, Record<string, any>>): Record<string, Record<string, any>> {
        return Object.entries(target).reduce((previousValue: Record<string, Record<string, any>>, [key, value]: [string, Record<string, any>]) => ({
            ...previousValue,
            [key]: {
                ...(previousValue[key] ?? {}),
                ...value,
            }
        }), source);
    }

    // 对象排序算法
    public sort<T extends Record<string, any>>(obj: T): T {
        return Object.fromEntries(
            Object.entries(obj).sort((a: [string, any], b: [string, any]) => {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            })
        ) as T;
    }

    public crypto(type: string, message: string): string {
        return match<any, string>(type?.toLowerCase())
            .with('sha1', () => HmacSHA1(message, this.appSecretKey).toString().toUpperCase())
            .with('sha256', () => HmacSHA256(message, this.appSecretKey).toString().toUpperCase())
            .with('sha512', () => HmacSHA512(message, this.appSecretKey).toString().toUpperCase())
            .otherwise(() => HmacMD5(message, this.appSecretKey).toString().toUpperCase());
    }

    protected encode(value: any): string {
        return encodeURIComponent(String(value))
            .replace(/\*/g, '%2A')
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29');
    }

    public value(value: any): string {
        if (value instanceof Object) {
            if (Array.isArray(value)) {
                value = Object.fromEntries(Object.entries(value));
            } else {
                value = Object.fromEntries(Object.entries(value).filter(([key, value]) => value !== undefined));
            }
        }
        return Object.entries(this.sort(value))
            // // 是否启用需要和服务端保持一致 https://github.com/jundayw/laravel-passport
            // .filter(([key, value]) => !(value === null || value === undefined || value === ''))
            // .filter(([key, value]) => Array.isArray(value) ? value.length : true)
            .map(([key, value]) => {
                if (value === null || value === undefined) {
                    value = '';
                }
                if (typeof value === 'object') {
                    value = this.value(value);
                }
                return [key, this.encode(value)].join('=');
            }).join('&')
    }

    public message(message: Record<string, any>): string {
        return Object.values(this.sort(message))
            .filter((value: Record<string, any>) => value !== undefined)
            .filter((value: Record<string, any>) => value !== null)
            .map((value: Record<string, any>) => this.value(value))
            .filter((value: string) => value.length)
            .join('&');
    }

    public assign(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
        const parameters: Record<string, Record<string, any>> = this.parameters(config) || {};
        const message: Record<string, Record<string, any>> = this.build(parameters);
        const params: Record<string, any> = config.params || {};
        const data: Record<string, any> = config.data || {};
        const request: Record<string, any> = this.merge({ data, params }, message);

        Object.entries(message).forEach(([key, value]) => {
            const signatureName: string = key.toLowerCase() === 'headers' ? this.toHeaderKeyUpperCase(this.signatureKey) : this.signatureKey;
            const signatureValue: string = this.crypto(this.getParameterByKey(parameters, 'type'), this.message(request));
            Object.assign(value, {
                [signatureName]: signatureValue
            })
        });

        Object.entries(message).forEach(([key, value]) => {
            Object.entries(value).forEach(([k, v]) => {
                config[key as 'params' | 'data' | 'headers'][k] = v;
            })
        })

        return config;
    }

    public signature(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
        // 兼容网关地址传递 Query 参数：http://localhost?app_id=x
        const base: URL = new URL(config.baseURL as string);
        // 兼容接口地址传递 Query 参数：/account/login?type=password
        const url: URL = new URL(config.url as string, base.origin as string);
        // 兼容接口传递 params 参数：{ params: { action: 'ping', type: 'sha512', version: '2.0.0' } }
        const requestParams: URLSearchParams = new URLSearchParams(config.params || {});
        // 获取网关 params 参数
        const baseParams: Record<string, any> = Object.fromEntries(base.searchParams);
        // 获取接口地址 params 参数
        const urlParams: Record<string, any> = Object.fromEntries(url.searchParams);
        // 获取接口 params 参数
        const defaultParams: Record<string, any> = Object.fromEntries(requestParams);
        // 获取公共参数
        let pathname: string = [base.pathname, url.pathname].filter((value) => value.length).map((value) => value.replace(/^\/+|\/+$/g, '')).join('/');
        // 参数合并
        const params: Record<string, any> = Object.assign({}, baseParams, defaultParams, urlParams);

        config.baseURL = url.origin;
        config.url = pathname;
        config.params = new URLSearchParams(params);

        return this.assign(config);
    }

    public verify(response: AxiosResponse, type: string = 'SHA512'): boolean {
        const {
            [this.signatureKey]: signature,
            ...message
        } = response.data;

        if (signature) {
            return signature.toUpperCase() === this.crypto(type, this.value(message)).toUpperCase();
        }

        return false;
    }
}

export interface SignatureFactory {
    (
        appId: string,
        appSecretKey: string,
        signatureKey?: string,
        prefix?: string
    ): SignatureInterceptor;
}

export type SignatureInterceptor = (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
export const SignatureInstance: SignatureFactory = function (appId: string, appSecretKey: string, signatureKey: string = 'signature', prefix: string = 'x'): SignatureInterceptor {
    return function (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
        return new Signature(appId, appSecretKey, signatureKey, prefix).signature(config);
    };
};

export interface VerifyFactory {
    (
        appId: string,
        appSecretKey: string,
        signatureKey?: string,
        type?: string,
    ): VerifyInterceptor;
}

export type VerifyInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
export const VerifyInstance: VerifyFactory = function (appId: string, appSecretKey: string, signatureKey: string = 'signature', type: string = 'SHA512'): VerifyInterceptor {
    return function (response: AxiosResponse): AxiosResponse | Promise<AxiosResponse> {
        return new Signature(appId, appSecretKey, signatureKey).verify(response, type) ? response : Promise.reject(
            new VerifySignatureError('Response signature verification failed')
        );
    };
};

export default Signature;
