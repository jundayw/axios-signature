<a id="readme-top"></a>

# Request Signing Interceptor for Axios

A lightweight Axios interceptor that automatically adds signature authentication (HMAC-SHA1/SHA256/SHA512, MD5, etc.) to outgoing requests. Protect your API with data integrity and anti‑tampering mechanisms.

[![GitHub Tag](https://img.shields.io/github/v/tag/jundayw/axios-signature)](https://github.com/jundayw/axios-signature/tags)
[![NPM Version](https://img.shields.io/npm/v/@jundayw/axios-signature.svg)](https://www.npmjs.com/package/@jundayw/axios-signature)
[![NPM Downloads](https://img.shields.io/npm/dm/@jundayw/axios-signature.svg)](https://www.npmjs.com/package/@jundayw/axios-signature)
[![NPM License](https://img.shields.io/github/license/jundayw/axios-signature)](https://github.com/jundayw/axios-signature)

<!-- TABLE OF CONTENTS -->
<details>
    <summary>Table of Contents</summary>
    <ol>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#usage">Usage</a></li>
        <li><a href="#contributing">Contributing</a></li>
        <li><a href="#contributors">Contributors</a></li>
        <li><a href="#license">License</a></li>
    </ol>
</details>

<!-- INSTALLATION -->

## Installation

You can install the package via [npm](https://www.npmjs.org/package/@jundayw/axios-signature):

```bash
npm install @jundayw/axios-signature
```

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- USAGE EXAMPLES -->

## Usage

```javascript
import Signature from '@jundayw/axios-signature';

instance.interceptors.request.use(
    new Signature(
        import.meta.env.VITE_APP_ID,
        import.meta.env.VITE_APP_KEY
    ).signature(config),
    (error) => {
        return Promise.reject(error);
    }
);
```

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- CONTRIBUTORS -->

## Contributors

Thanks goes to these wonderful people:

<a href="https://github.com/jundayw/axios-signature/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jundayw/axios-signature" alt="contrib.rocks image" />
</a>

Contributions of any kind are welcome!

<p align="right">[<a href="#readme-top">back to top</a>]</p>

<!-- LICENSE -->

## License

Distributed under the MIT License (MIT). Please see [License File] for more information.

<p align="right">[<a href="#readme-top">back to top</a>]</p>
