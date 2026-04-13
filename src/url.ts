class URL {
    public href: string;
    public protocol: string;
    public origin: string;
    public host: string;
    public hostname: string;
    public port: string;
    public pathname: string;
    public search: string;
    public hash: string;
    public searchParams: URLSearchParams;

    constructor(href: string, base?: string){
        this.href = href;
        this.protocol = '';
        this.origin = '';
        this.host = '';
        this.hostname = '';
        this.port = '';
        this.pathname = '';
        this.search = '';
        this.hash = '';
        this.searchParams = new URLSearchParams();

        if (base) {
            const url = new URL(base);
            const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
            href = href.startsWith('/') ? href.slice(1) : href;
            href = pathname ? `${url.origin}/${pathname}/${href}` : `${url.origin}/${href}`;
        }

        this.parse(href);
    }

    parse(href: string): void{
        try {
            const pattern: RegExp = /^(?:(?<protocol>[a-zA-Z][a-zA-Z0-9+.-]*):\/\/)?(?<host>(?<hostname>[^\/:\?#]+)(?::(?<port>\d+))?)(?<pathname>\/[^?\#]*)?(?:\?(?<search>[^#]*))?(?:#(?<hash>.*))?$/;
            const match: RegExpMatchArray | null = href.match(pattern);

            Object.assign(this as URL, match?.groups ?? {})
            this.origin = this.protocol && this.host ? `${this.protocol}://${this.host}` : '';
            // const {
            //     protocol = '',
            //     host = '',
            //     hostname = '',
            //     port = '',
            //     pathname = '',
            //     search = '',
            //     hash = ''
            // } = match?.groups ?? {};
            //
            // const origin = protocol && host ? `${protocol}://${host}` : '';
            //
            // this.href = href;
            // this.protocol = protocol;
            // this.origin = origin;
            // this.host = host;
            // this.hostname = hostname;
            // this.port = port;
            // this.pathname = pathname;
            // this.search = search ? '?' + search : '';
            // this.hash = hash ? '#' + hash : '';
            // 解析 searchParams
            if (this.search) {
                this.searchParams = new URLSearchParams(this.search);
            }
        } catch (e) {

        }
    }

    entries(){
        return Object.entries(this);
    }

    * [Symbol.iterator](){
        for (const [key, value] of Object.entries(this)) {
            yield [key, value];
        }
    }
}

class URLSearchParams {
    private readonly params: Record<string, any>;

    constructor(init?: string){
        this.params = {};
        if (init && typeof init === 'string') {
            this.fromString(init);
        }
        if (init && typeof init === 'object') {
            this.fromObject(init);
        }
    }

    fromString(str: string): void{
        if (str.startsWith('?')) {
            str = str.slice(1);
        }
        str.split('&').forEach(p => {
            const [k, v] = p.split('=');
            if (k) {
                this.append(decodeURIComponent(k), decodeURIComponent(v || ''));
            }
        });
    }

    fromObject(obj: Record<string, any>): void{
        Object.entries(obj).forEach(([k, v]: [string, any]) => this.append(k, v));
    }

    append(key: string, value: any): void{
        this.params[key] = value;
    }

    get(key: string){
        return this.params[key] ?? null;
    }

    set(key: string, value: any): void{
        this.params[key] = value;
    }

    delete(key: string): void{
        delete this.params[key];
    }

    entries(){
        return Object.entries(this.params);
    }

    * [Symbol.iterator](){
        for (const [key, value] of Object.entries(this.params)) {
            yield [key, value];
        }
    }

    toString(): string{
        return Object.entries(this.params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
    }
}

export { URL, URLSearchParams };
