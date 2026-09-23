<a id="readme-top"></a>

# Request Signing Interceptor for Axios

A lightweight and extensible Axios interceptor for request signing and response signature verification.

Automatically sign outgoing requests and verify response signatures using HMAC, MD5, and other supported hashing algorithms.

**English** | [简体中文](README.zh-CN.md)

[![GitHub Tag](https://img.shields.io/github/v/tag/jundayw/axios-signature)](https://github.com/jundayw/axios-signature/tags)
[![NPM Version](https://img.shields.io/npm/v/@jundayw/axios-signature.svg)](https://www.npmjs.com/package/@jundayw/axios-signature)
[![NPM Downloads](https://img.shields.io/npm/dm/@jundayw/axios-signature.svg)](https://www.npmjs.com/package/@jundayw/axios-signature)
[![NPM License](https://img.shields.io/github/license/jundayw/axios-signature)](https://github.com/jundayw/axios-signature)

## Features

* Automatic request signing with Axios interceptors
* Automatic response signature verification
* Support for HMAC-SHA1, HMAC-SHA256, HMAC-SHA512, MD5, and other algorithms
* Automatic processing of request parameters and request data
* Custom request parameters and signing configuration
* Compatible with standard Axios instances
* TypeScript support
* Lightweight and easy to integrate

<!-- TABLE OF CONTENTS -->

<details>
    <summary>Table of Contents</summary>
    <ol>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#quick-start">Quick Start</a></li>
        <li>
            <a href="#usage">Usage</a>
            <ol>
                <li><a href="#request-signing">Request Signing</a></li>
                <li><a href="#response-signature-verification">Response Signature Verification</a></li>
                <li><a href="#custom-request-signature-interceptor">Custom Request Signature Interceptor</a></li>
                <li><a href="#request">Request</a></li>
                <li><a href="#signed-request">Signed Request</a></li>
            </ol>
        </li>
        <li><a href="#configuration">Configuration</a></li>
        <li><a href="#supported-algorithms">Supported Algorithms</a></li>
        <li><a href="#contributing">Contributing</a></li>
        <li><a href="#contributors">Contributors</a></li>
        <li><a href="#license">License</a></li>
    </ol>
</details>

<!-- INSTALLATION -->

## Installation

Install the package via npm:

```bash
npm install @jundayw/axios-signature
```

Or with Yarn:

```bash
yarn add @jundayw/axios-signature
```

Or with pnpm:

```bash
pnpm add @jundayw/axios-signature
```

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- QUICK START -->

## Quick Start

The simplest way to use the package is to register the request signing and response verification interceptors on an Axios instance.

```typescript
import axios from 'axios';
import {
    SignatureInstance,
    VerifyInstance,
} from '@jundayw/axios-signature';

const axiosInstance = axios.create({
    baseURL: 'http://httpbin.org',
});

// Request Signature Interceptor
axiosInstance.interceptors.request.use(function (
    config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
    if (signature.signature(config)) {
        return config;
    }
    return Promise.reject(
        new Error('Request signature failed')
    );
}, (error) => {
    return Promise.reject(error)
});

// Response Signature Verification Interceptor
axiosInstance.interceptors.response.use(function (
    response: AxiosResponse
): AxiosResponse | Promise<AxiosResponse> {
    if (signature.verify(response)) {
        return response;
    }
    return Promise.reject(
        new Error('Response signature verification failed')
    );
}, (error) => {
    return Promise.reject(error)
});

export default axiosInstance;
```

Requests sent through the Axios instance are automatically signed, and response signatures can be verified automatically.

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- USAGE -->

## Usage

### Request Signing

Register `SignatureInstance` as an Axios request interceptor to automatically sign outgoing requests.

```typescript
import axios from 'axios';
import { SignatureInstance } from '@jundayw/axios-signature';

axios.interceptors.request.use(
    SignatureInstance(
        import.meta.env.VITE_APP_ID,
        import.meta.env.VITE_APP_KEY
    ),
    (error) => {
        return Promise.reject(error);
    }
);
```

### Response Signature Verification

Register `VerifyInstance` as an Axios response interceptor to verify signatures returned by the server.

```typescript
import axios from 'axios';
import { VerifyInstance } from '@jundayw/axios-signature';

axios.interceptors.response.use(
    VerifyInstance(
        import.meta.env.VITE_APP_ID,
        import.meta.env.VITE_APP_KEY
    ),
    (error) => {
        return Promise.reject(error);
    }
);
```

If response signature verification fails, the interceptor rejects the response with an error.

### Custom Request Signature Interceptor

For applications that require custom request parameters, you can create a `Signature` instance and override its configuration.

```typescript
import axios, {
    type InternalAxiosRequestConfig,
} from 'axios';

import Signature from '@jundayw/axios-signature';

Signature.prototype.config = function (
    config: InternalAxiosRequestConfig
): Record<string, Record<string, any>> {
    return {
        params: {},
    };
};

const signatureInstance = new Signature(
    import.meta.env.VITE_APP_ID,
    import.meta.env.VITE_APP_KEY
);

axios.interceptors.request.use(
    (config) => {
        return signatureInstance.signature(
            config
        ) as InternalAxiosRequestConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);
```

This approach allows you to customize the common request parameters used during the signing process.

### Request

The interceptor can sign regular Axios requests without requiring signature parameters to be added manually.

```typescript
axios({
    url: '/utils/ping/ping',
    method: 'post',
    data: {
        type: 'password',
        username: 'admin',
        password: '12**56',
        remember: false,
    },

    // Optional request parameters.
    // These values override the global configuration.
    //
    // params: {
    //     app_id: '202603161735',
    //     timestamp: new Date().toISOString(),
    //     type: 'md5',
    //     action: 'utils.ping.ping',
    //     charset: 'UTF-8',
    //     format: 'JSON',
    //     method: 'POST',
    //     version: '1.0.0',
    // }
});
```

### Signed Request

After the request interceptor processes the request, the signature parameters are automatically added to the request.

For example:

```http
POST /utils/ping/ping?app_id=202603161735&timestamp=2026-04-14T03:07:18.877Z&type=md5&action=febd3064e3499f401516eaaacf9575b3&charset=UTF-8&format=JSON&method=post&version=1.0.0&signature=66a9f858978a89ae192f9ee496df9c71 HTTP/1.1
Accept: application/json
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: application/json
Host: 127.0.0.1:8989
Content-Length: 75

{"type":"password","username":"admin","password":"12**56","remember":false}
```

The interceptor handles the signing process automatically, so application code does not need to manually calculate or append the signature.

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- CONFIGURATION -->

## Configuration

Create a `Signature` instance using your application ID and application key:

```typescript
const signature = new Signature(
    appId,
    appKey,
    signName = 'signature',
    headerKey = 'x'
);
```

| Parameter   | Description                                                                                                                     |
|-------------|---------------------------------------------------------------------------------------------------------------------------------|
| `appId`     | Application identifier                                                                                                          |
| `appKey`    | Application key used for signing and verification                                                                               |
| `signName`  | Field name used to store the signature. Defaults to `signature`                                                                 |
| `headerKey` | Prefix for common parameters when they are sent as request headers. Defaults to `x`, resulting in headers such as `X-Signature` |

You can further customize the request parameters used for signing according to your API requirements.

> **Security note:** In browser-based applications, values exposed through frontend environment variables such as `VITE_*` are included in the client-side application and should be considered publicly accessible after the application is built. Do not use a browser-exposed value as a confidential server-side secret.

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- SUPPORTED ALGORITHMS -->

## Supported Algorithms

The package supports multiple hashing and HMAC algorithms through its signing implementation.

Commonly used algorithms include:

| Algorithm | Type        |
|-----------|-------------|
| MD5       | Hash        |
| SHA-1     | Hash / HMAC |
| SHA-256   | Hash / HMAC |
| SHA-512   | Hash / HMAC |

For HMAC-based signing, the application key is used as the secret key.

> **Security note:** MD5 and SHA-1 are generally not recommended for new cryptographic designs. SHA-256 or stronger algorithms are recommended when supported by both the client and server.

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are welcome and appreciated.

If you have an idea, bug report, feature request, or improvement, feel free to open an issue or submit a pull request.

### Development Workflow

1. Fork the project.
2. Create your feature branch:

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes:

```bash
git commit -m "Add some AmazingFeature"
```

4. Push the branch:

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request.

Please keep pull requests focused and include relevant tests or documentation when applicable.

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- CONTRIBUTORS -->

## Contributors

Thanks to all the contributors who help make this project better.

<a href="https://github.com/jundayw/axios-signature/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jundayw/axios-signature" alt="Contributors" />
</a>

Contributions of any kind are welcome!

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- LICENSE -->

## License

Distributed under the MIT License.

See the [License File](LICENSE) for more information.

<p align="right">[<a href="#readme-top">back to top</a>]</p>

