
// WebCrypto API を使用した AES-GCM 実装
export class AESGCMCipher implements ICipher {
    private cryptoKey: CryptoKey | null = null;

    /**
     * コンストラクタ
     * @param key - 暗号化鍵 (バイナリ: 16, 24, または 32 バイト)
     */
    constructor(private key: Uint8Array) {
        if (![16, 24, 32].includes(key.length)) {
            throw new Error('鍵長は 16, 24, または 32 バイトである必要があります');
        }
    }

    /**
     * CryptoKey オブジェクトを初期化
     */
    private async initKey(): Promise<void> {
        if (this.cryptoKey) return;

        this.cryptoKey = await crypto.subtle.importKey(
            'raw',
            this.key.buffer as ArrayBuffer,
            { name: 'AES-GCM', length: this.key.length * 8 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * データを暗号化
     * @param plaintext - 平文データ (バイナリ)
     * @returns 暗号化されたデータ (IV + 暗号文)
     */
    async encrypt(plaintext: Uint8Array): Promise<Uint8Array> {
        await this.initKey();

        // 12バイトのランダムIVを生成
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // 暗号化
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
            this.cryptoKey!,
            plaintext.buffer as ArrayBuffer
        );

        // IV + 暗号文 を結合して返す
        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), iv.length);

        return result;
    }

    /**
     * データを復号
     * @param ciphertext - 暗号化されたデータ (IV + 暗号文)
     * @returns 復号された平文データ
     */
    async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
        await this.initKey();

        if (ciphertext.length < 12) {
            throw new Error('暗号文が短すぎます');
        }

        // IV と暗号文を分離
        const iv = ciphertext.slice(0, 12);
        const encrypted = ciphertext.slice(12);

        // 復号
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
            this.cryptoKey!,
            encrypted.buffer as ArrayBuffer
        );

        return new Uint8Array(decrypted);
    }
}

// 使用例
async function example() {
    // 32バイト (256ビット) の鍵を生成
    const key = crypto.getRandomValues(new Uint8Array(32));

    // 暗号化インスタンスを作成
    const cipher = new AESGCMCipher(key);

    // テストデータ
    const originalText = 'Hello, World! これは暗号化テストです。';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // 文字列をバイナリに変換
    const plaintext = encoder.encode(originalText);
    console.log('元のデータ:', originalText);
    console.log('元のバイナリ:', plaintext);

    // 暗号化
    const encrypted = await cipher.encrypt(plaintext);
    console.log('暗号化データ:', encrypted);

    // 復号
    const decrypted = await cipher.decrypt(encrypted);
    console.log('復号バイナリ:', decrypted);
    console.log('復号データ:', decoder.decode(decrypted));

    // 検証
    const isMatch = originalText === decoder.decode(decrypted);
    console.log('復号成功:', isMatch);
}