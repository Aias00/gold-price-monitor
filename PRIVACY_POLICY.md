# Gold Price Monitor 隐私政策 / Privacy Policy

**生效日期 / Effective Date:** 2026-02-25  
**最后更新 / Last Updated:** 2026-02-25

---

## 中文版（简体）

### 1. 适用范围
本隐私政策适用于 Chrome 扩展程序 **Gold Price Monitor**（以下简称“本扩展”）。

### 2. 我们处理的数据
本扩展**不会收集、存储或上传**可识别个人身份的信息（例如姓名、邮箱、手机号、身份证号、地址、账号密码等）。

本扩展仅处理以下与功能相关的数据：
- 从公开行情源请求的金价数据（用于展示实时价格、历史价格和趋势图）。
- 保存在用户浏览器本地的缓存数据（如最近价格记录、更新时间），存储位置为 `chrome.storage.local`。

### 3. 权限说明
本扩展使用的权限及用途如下：
- `storage`：在本地缓存行情数据，减少重复请求并提升稳定性。
- `alarms`：定时刷新行情数据（例如每小时刷新）。
- 主机权限（`https://push2.eastmoney.com/*`、`https://www.sge.com.cn/*`）：仅用于请求公开行情数据接口。

### 4. 数据共享与出售
我们不会将用户数据出售、出租、交易或共享给第三方。  
本扩展不包含广告 SDK，不进行用户画像，不进行跨站追踪。

### 5. 第三方服务说明
本扩展会直接向第三方公开行情站点请求数据（如东方财富、上海黄金交易所）。这些站点可能基于其自身规则记录网络访问日志（如 IP、请求时间等）。此类处理由第三方独立负责，适用其各自隐私政策。

### 6. 远程代码
本扩展不加载或执行远程 JavaScript/Wasm 代码。扩展功能代码均随安装包发布。

### 7. 数据保留与删除
- 所有缓存数据保存在用户本地浏览器中。  
- 用户可通过清除扩展数据或卸载扩展删除相关本地数据。

### 8. 未成年人
本扩展不面向 13 岁以下儿童，也不会有意收集未成年人个人信息。

### 9. 政策更新
如本政策发生更新，我们将通过扩展商店页面或本页面发布新版本，并更新“最后更新”日期。

### 10. 联系方式
如有隐私相关问题，请联系：**[aiasdream94@gmail.com](mailto:aiasdream94@gmail.com)**

---

## English Version

### 1. Scope
This Privacy Policy applies to the Chrome extension **Gold Price Monitor** ("the Extension").

### 2. Data We Process
The Extension **does not collect, store, or transmit** personally identifiable information (such as name, email, phone number, ID number, address, account credentials, etc.).

The Extension only processes:
- Public gold market data fetched from public data sources (for real-time price, history, and trend display).
- Local cache data stored in the user's browser (such as recent price records and update timestamps) via `chrome.storage.local`.

### 3. Permissions and Purpose
The Extension uses the following permissions:
- `storage`: to locally cache market data for stability and performance.
- `alarms`: to refresh market data on a schedule (e.g., hourly).
- Host permissions (`https://push2.eastmoney.com/*`, `https://www.sge.com.cn/*`): only to request public market data.

### 4. Sharing and Selling Data
We do not sell, rent, trade, or share user data with third parties.  
The Extension does not use ad SDKs, profiling, or cross-site tracking.

### 5. Third-Party Services
The Extension directly requests market data from third-party public websites (such as Eastmoney and Shanghai Gold Exchange). These providers may process technical access logs (e.g., IP address, request time) under their own policies. Such processing is controlled by those third parties.

### 6. Remote Code
The Extension does not load or execute remote JavaScript/Wasm code. All executable code is packaged within the extension bundle.

### 7. Data Retention and Deletion
- Cached data is stored locally in the user's browser.
- Users may delete local data by clearing extension storage or uninstalling the Extension.

### 8. Children
The Extension is not directed to children under 13, and we do not knowingly collect personal data from children.

### 9. Policy Updates
If this policy changes, we will publish the updated version and revise the "Last Updated" date.

### 10. Contact
For privacy-related inquiries, contact: **[aiasdream94@gmail.com](mailto:aiasdream94@gmail.com)**
