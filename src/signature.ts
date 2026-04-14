import { AxiosRequestConfig, Method } from "axios";
import { match } from "ts-pattern";
import { HmacSHA1, HmacSHA256, HmacSHA512, HmacMD5, MD5 } from 'crypto-js';
import { URL, URLSearchParams } from './url'

class Signature {
    private readonly appId: string;
    private readonly appKey: string;

    constructor(appId: string, appKey: string){
        this.appId = appId || ''
        this.appKey = appKey || ''
    }

    protected build(
        url: string,
        method: Method = 'POST',
        type: 'sha1' | 'sha256' | 'sha512' | 'md5' = 'sha256',
        version: '1.0.0' | string = '1.0.0'
    ): Record<string, string>{
        const path: string = url.replace(/^\/+|\/+$/g, '')
        const action: string = MD5(path).toString();
        return {
            app_id: this.appId,
            timestamp: new Date().toISOString(),
            type,
            action,
            charset: 'UTF-8',
            format: 'JSON',
            method,
            version,
        }
    }

    // 对象排序算法
    protected sort<T extends Record<string, any>>(obj: T): T{
        return Object.fromEntries(
            Object.entries(obj).sort((a: [string, any], b: [string, any]) => a[0].localeCompare(b[0]))
        ) as T;
    }

    protected crypto(type: string, message: string): string{
        return match<any, string>(type)
            .with('sha1', () => HmacSHA1(message, this.appKey).toString())
            .with('sha256', () => HmacSHA256(message, this.appKey).toString())
            .with('sha512', () => HmacSHA512(message, this.appKey).toString())
            .otherwise(() => HmacMD5(message, this.appKey).toString());
    }

    protected message(config: AxiosRequestConfig): string{
        const params: Record<string, any> = this.sort(config.params || {});
        const data: Record<string, any> = this.sort(config.data || {});
        const message: string = [params, data].filter((value) => Object.entries(value).length).map((value) => JSON.stringify(value)).join('');
        // console.log({ message })
        return message;
    }

    protected assign(config: AxiosRequestConfig): AxiosRequestConfig{
        config.params.signature = this.crypto(config.params.type, this.message(config));
        // console.log({ config })
        return config;
    }

    public signature(config: AxiosRequestConfig): AxiosRequestConfig{
        // 兼容网关地址传递 Query 参数：http://localhost?app_id=x
        const base: URL = new URL(config.baseURL as string);
        // 兼容接口地址传递 Query 参数：/account/login?type=password
        const url: URL = new URL(config.url as string);
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
        const params: Record<string, any> = Object.assign({}, this.build(
            config.url = `/${pathname}`,
            config.method as Method,
            config.params?.type ?? 'md5',
            config.params?.version ?? '1.0.0'
        ), baseParams, defaultParams, urlParams);

        config.baseURL = base.origin;
        config.params = new URLSearchParams(params);

        return this.assign(config);
    }
}

export default Signature
