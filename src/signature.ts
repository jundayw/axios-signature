import { AxiosRequestConfig, Method } from "axios";
import { match } from "ts-pattern";
import HmacSHA1 from 'crypto-js/hmac-sha1';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import HmacSHA512 from 'crypto-js/hmac-sha512';
import HmacMD5 from 'crypto-js/hmac-md5';
import MD5 from 'crypto-js/md5';

class Signature {
    private readonly appId: string;
    private readonly appKey: string;

    constructor(appId: string, appKey: string){
        this.appId = appId || ''
        this.appKey = appKey || ''
    }

    protected build(
        basePath: string,
        urlPath: string,
        method: Method = 'POST',
        type: 'sha1' | 'sha256' | 'sha512' | 'md5' = 'sha256',
        version: '1.0.0' | string = '1.0.0'
    ): Record<string, string>{
        const trimSlashes = (str: string) => str.replace(/^\/+|\/+$/g, '')
        const path: string = trimSlashes(`${trimSlashes(basePath)}/${trimSlashes(urlPath)}`)
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
        const message: string = `${JSON.stringify(params)}${JSON.stringify(data)}`;
        console.log({ message })
        return message;
    }

    protected assign(config: AxiosRequestConfig): AxiosRequestConfig{
        config.params.signature = this.crypto(config.params?.type ?? '', this.message(config));
        config.params = new URLSearchParams(config.params).toString();
        console.log({ config })
        return config;
    }

    public signature(config: AxiosRequestConfig): AxiosRequestConfig{
        // 兼容网关地址传递 Query 参数：http://localhost?app_id=x
        const base: URL = new URL(config.baseURL || 'http://localhost');
        // 兼容接口地址传递 Query 参数：/account/login?type=password
        const url: URL = new URL(config.url as string, base.toString());
        // 兼容接口传递 params 参数：{ params: { action: 'ping', type: 'sha512', version: '2.0.0' } }
        const requestParams: URLSearchParams = new URLSearchParams(config.params || {});
        // 获取网关 params 参数
        const baseParams: Record<string, any> = Object.fromEntries(base.searchParams);
        // 获取接口地址 params 参数
        const urlParams: Record<string, any> = Object.fromEntries(url.searchParams);
        // 获取接口 params 参数
        const defaultParams: Record<string, any> = Object.fromEntries(requestParams);
        // 获取公共参数
        const commonParams: Record<string, any> = this.build(
            base.pathname,
            url.pathname,
            config.method as Method,
            config.params?.type ?? '',
            config.params?.version ?? '1.0.0'
        );
        // 参数合并
        const params: Record<string, any> = Object.assign({}, commonParams, baseParams, defaultParams, urlParams);

        config.url = url.pathname;
        config.params = params;

        return this.assign(config);
    }
}

export default Signature
