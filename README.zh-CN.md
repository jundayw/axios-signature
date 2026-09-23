<a id="readme-top"></a>

# Axios 请求签名拦截器

一个轻量、可扩展的 Axios 请求签名与响应签名验证拦截器。

支持使用 HMAC、MD5 以及其他签名算法，对 Axios 请求进行自动签名，并对服务端返回的响应进行签名验证。

[English](README.md) | **简体中文**

[![GitHub Tag](https://img.shields.io/github/v/tag/jundayw/axios-signature)](https://github.com/jundayw/axios-signature/tags)
[![NPM Version](https://img.shields.io/npm/v/@jundayw/axios-signature.svg)](https://www.npmjs.com/package/@jundayw/axios-signature)
[![NPM Downloads](https://img.shields.io/npm/dm/@jundayw/axios-signature.svg)](https://www.npmjs.com/package/@jundayw/axios-signature)
[![NPM License](https://img.shields.io/github/license/jundayw/axios-signature)](https://github.com/jundayw/axios-signature)

## 特性

* 基于 Axios Interceptor 自动进行请求签名
* 自动验证服务端响应签名
* 支持 HMAC-SHA1、HMAC-SHA256、HMAC-SHA512、MD5 等算法
* 自动处理请求参数和请求数据
* 支持自定义请求参数和签名配置
* 兼容标准 Axios 实例
* 完整支持 TypeScript
* 轻量、易于集成

<!-- TABLE OF CONTENTS -->

<details>
    <summary>目录</summary>
    <ol>
        <li><a href="#安装">安装</a></li>
        <li><a href="#快速开始">快速开始</a></li>
        <li>
            <a href="#使用">使用</a>
            <ol>
                <li><a href="#请求签名">请求签名</a></li>
                <li><a href="#响应签名验证">响应签名验证</a></li>
                <li><a href="#自定义请求签名拦截器">自定义请求签名拦截器</a></li>
                <li><a href="#请求">请求</a></li>
                <li><a href="#签名后的请求">签名后的请求</a></li>
            </ol>
        </li>
        <li><a href="#配置">配置</a></li>
        <li><a href="#支持的算法">支持的算法</a></li>
        <li><a href="#参与贡献">参与贡献</a></li>
        <li><a href="#贡献者">贡献者</a></li>
        <li><a href="#许可证">许可证</a></li>
    </ol>
</details>

<!-- INSTALLATION -->

## 安装

使用 npm 安装：

```bash
npm install @jundayw/axios-signature
```

或者使用 Yarn：

```bash
yarn add @jundayw/axios-signature
```

或者使用 pnpm：

```bash
pnpm add @jundayw/axios-signature
```

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- QUICK START -->

## 快速开始

最简单的使用方式是在 Axios 实例上注册请求签名和响应签名验证拦截器。

```typescript
import axios from 'axios';
import {
    SignatureInstance,
    VerifyInstance,
} from '@jundayw/axios-signature';

const axiosInstance = axios.create({
    baseURL: 'http://httpbin.org',
});

// 请求签名拦截器
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
// 响应签名验证拦截器
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

通过该 Axios 实例发送的请求会自动进行签名，同时可以自动验证服务端返回的响应签名。

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- USAGE -->

## 使用

### 请求签名

将 `SignatureInstance` 注册为 Axios 请求拦截器，即可自动对发送的请求进行签名。

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

### 响应签名验证

将 `VerifyInstance` 注册为 Axios 响应拦截器，可以自动验证服务端返回的响应签名。

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

如果响应签名验证失败，拦截器会通过 `Promise.reject()` 返回错误。

### 自定义请求签名拦截器

如果项目需要自定义公共请求参数，可以创建 `Signature` 实例并重写配置。

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

这种方式可以根据实际 API 要求，自定义参与签名的公共请求参数。

### 请求

请求签名拦截器会自动处理普通 Axios 请求，无需手动添加签名参数。

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

    // 可选请求参数。
    // 这些参数会覆盖全局配置。
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

### 签名后的请求

请求经过签名拦截器处理后，签名相关参数会自动添加到请求中。

例如：

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

整个签名过程由拦截器自动完成，业务代码无需手动计算或添加签名。

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- CONFIGURATION -->

## 配置

使用应用 ID 和应用密钥创建 `Signature` 实例：

```typescript
const signature = new Signature(
    appId,
    appKey,
    signName = 'signature',
    headerKey = 'x'
);
```

| 参数          | 说明                                           |
|-------------|----------------------------------------------|
| `appId`     | 应用标识                                         |
| `appKey`    | 用于签名和验证的应用密钥                                 |
| `signName`  | 存储签名结果的字段名称，默认值：`signature`                  |
| `headerKey` | 如果使用请求头发送公共参数，公共参数前缀，默认值：`x`，即 `X-Signature` |

可以根据 API 的实际要求进一步自定义参与签名的请求参数。

> **安全提示：** 在基于浏览器的应用中，通过 `VITE_*` 等前端环境变量暴露的值会被包含在客户端应用中。应用构建完成后，这些值都应视为公开信息。不要将浏览器端可获取的值当作真正的服务端私密密钥。

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- SUPPORTED ALGORITHMS -->

## 支持的算法

本项目通过签名实现支持多种 Hash 和 HMAC 算法。

常见算法包括：

| 算法      | 类型          |
|---------|-------------|
| MD5     | Hash        |
| SHA-1   | Hash / HMAC |
| SHA-256 | Hash / HMAC |
| SHA-512 | Hash / HMAC |

对于 HMAC 签名，应用密钥会作为 HMAC 的密钥参与签名。

> **安全提示：** 对于新的加密设计，一般不建议使用 MD5 和 SHA-1。客户端和服务端均支持的情况下，建议优先使用 SHA-256 或更强的算法。

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- CONTRIBUTING -->

## 参与贡献

欢迎并感谢所有形式的贡献。

如果你有功能建议、Bug、改进意见或新的特性想法，可以提交 Issue 或 Pull Request。

### 开发流程

1. Fork 项目。
2. 创建功能分支：

```bash
git checkout -b feature/AmazingFeature
```

3. 提交修改：

```bash
git commit -m "Add some AmazingFeature"
```

4. 推送分支：

```bash
git push origin feature/AmazingFeature
```

5. 创建 Pull Request。

提交 Pull Request 时，请尽量保持修改范围明确，并在适当情况下补充测试和文档。

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- CONTRIBUTORS -->

## 贡献者

感谢所有为这个项目做出贡献的人。

<a href="https://github.com/jundayw/axios-signature/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jundayw/axios-signature" alt="贡献者" />
</a>

欢迎任何形式的贡献！

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>

<!-- LICENSE -->

## 许可证

本项目基于 MIT License 开源。

详情请参阅 [License File](LICENSE)。

<p align="right">[<a href="#readme-top">返回顶部</a>]</p>
