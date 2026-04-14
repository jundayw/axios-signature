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
            href = [
                url.origin,
                url.pathname.replace(/^\/+|\/+$/g, ''),
                href.replace(/^\/+|\/+$/g, '')
            ].filter((value) => value.length).join('/')
        }

        this.parse(href);
    }

    parse(href: string): void{
        try {
            console.log({
                href
            })
            const pattern: RegExp = /^(?:(?<protocol>[a-zA-Z][a-zA-Z0-9+.-]*):\/\/)?(?<host>(?<hostname>[^\/:\?#]+)(?::(?<port>\d+))?)(?<pathname>\/[^?\#]*)?(?:\?(?<search>[^#]*))?(?:#(?<hash>.*))?$/;
            const match: RegExpMatchArray | null = href.match(pattern);

            const {
                protocol = '',
                host = '',
                hostname = '',
                port = '',
                pathname = '',
                search = '',
                hash = ''
            } = match?.groups ?? {};

            const origin = protocol && host ? `${protocol}://${host}` : '';

            this.href = href;
            this.protocol = protocol;
            this.origin = origin;
            this.host = host;
            this.hostname = hostname;
            this.port = port;
            this.pathname = pathname;
            this.search = search ? '?' + search : '';
            this.hash = hash ? '#' + hash : '';
            // 解析 searchParams
            if (this.search) {
                this.searchParams = new URLSearchParams(this.search);
            }
            // console.log(this)
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
    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams){
        if (!init) {
            return;
        }
        if (init instanceof URLSearchParams) {
            for (const [k, v] of init) {
                this.append(k, String(v));
            }
        }
        if (typeof init === 'string') {
            this.fromString(init);
        }
        if (Array.isArray(init)) {
            for (const [k, v] of init) {
                this.append(k, String(v));
            }
        }
        if (typeof init === 'object') {
            Object.entries(init).forEach(([k, v]: [string, any]) => this.append(k, String(v)));
        }
    }

    fromString(str: string): void{
        if (str.startsWith('?')) {
            str = str.slice(1);
        }
        str.split('&').forEach(p => {
            const [k, v] = p.split('=');
            if (k) {
                this.append(this.encode(k), this.encode(v || ''));
            }
        });
    }

    append(key: string, value: any): void{
        (this as any)[key] = value;
    }

    get(key: string){
        return (this as any)[key] ?? null;
    }

    set(key: string, value: any): void{
        (this as any)[key] = value;
    }

    delete(key: string): void{
        delete (this as any)[key];
    }

    entries(){
        return Object.entries(this);
    }

    * [Symbol.iterator](){
        for (const [key, value] of Object.entries(this)) {
            yield [key, value];
        }
    }

    toString(): string{
        return Object.entries(this)
            .map(([k, v]) => `${this.encode(k)}=${this.encode(v)}`)
            .join('&');
    }

    private encode(str: string){
        return encodeURIComponent(str).replace(/%20/g, '+');
    }

    private decode(str: string){
        return decodeURIComponent(str.replace(/\+/g, ' '));
    }
}

export { URL, URLSearchParams };
