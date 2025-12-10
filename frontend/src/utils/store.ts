// エクスポート用のデータ型
interface ExportedData {
    version: string;
    data: Record<string, string>; // Base64エンコードされた暗号化データ
}

// 暗号化キーバリューストア
export class EncryptedKeyValueStore {
    private store: Map<string, Uint8Array> = new Map();
    private encoder = new TextEncoder();
    private decoder = new TextDecoder();

    /**
     * コンストラクタ
     * @param cipher - 暗号化インターフェースの実装
     */
    constructor(private cipher: ICipher) { }

    /**
     * 値を保存 (暗号化して保存)
     * @param key - キー
     * @param value - 保存する値 (文字列またはオブジェクト)
     */
    async set(key: string, value: any): Promise<void> {
        // 値をJSON文字列化してバイナリに変換
        const jsonString = JSON.stringify(value);
        const plaintext = this.encoder.encode(jsonString);

        // 暗号化して保存
        const encrypted = await this.cipher.encrypt(plaintext);
        this.store.set(key, encrypted);

        // TODO: デバッグ用にすべて出しているため後で消去
        this.DebugPrintAllValues();
    }

    /**
     * 値を取得 (復号化して取得)
     * @param key - キー
     * @returns 復号化された値、存在しない場合はundefined
     */
    async get<T = any>(key: string): Promise<T | undefined> {
        const encrypted = this.store.get(key);
        if (!encrypted) {
            return undefined;
        }

        // 復号化
        const decrypted = await this.cipher.decrypt(encrypted);
        const jsonString = this.decoder.decode(decrypted);

        // JSONをパース
        return JSON.parse(jsonString) as T;
    }

    /**
     * キーが存在するか確認
     * @param key - キー
     */
    has(key: string): boolean {
        return this.store.has(key);
    }

    /**
     * 値を削除
     * @param key - キー
     */
    delete(key: string): boolean {
        return this.store.delete(key);
    }

    /**
     * すべてのキーを取得
     */
    keys(): string[] {
        return Array.from(this.store.keys());
    }

    /**
     * ストア内のエントリ数を取得
     */
    size(): number {
        return this.store.size;
    }

    /**
     * ストアをクリア
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * データをJSONとしてエクスポート
     * @returns エクスポートされたJSON文字列
     */
    public exportToJSON(): string {
        const data: Record<string, string> = {};

        // 各エントリをBase64に変換
        for (const [key, encrypted] of this.store.entries()) {
            data[key] = this.arrayBufferToBase64(encrypted);
        }

        const exportData: ExportedData = {
            version: '1.0',
            data,
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * JSONからデータをインポート
     * @param jsonString - インポートするJSON文字列
     */
    public importFromJSON(jsonString: string): void {
        const importData: ExportedData = JSON.parse(jsonString);

        if (importData.version !== '1.0') {
            throw new Error(`サポートされていないバージョン: ${importData.version}`);
        }

        // ストアをクリアしてからインポート
        this.store.clear();

        // Base64からUint8Arrayに変換して保存
        for (const [key, base64] of Object.entries(importData.data)) {
            const encrypted = this.base64ToArrayBuffer(base64);
            this.store.set(key, encrypted);
        }
    }

    /**
     * Uint8ArrayをBase64文字列に変換
     */
    private arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64文字列をUint8Arrayに変換
     */
    private base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const len = binary.length;
        const buffer = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            buffer[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    // public でデバッグ用のメソッドを公開
    public DebugPrintAllValues() {
        // json を出力
        console.debug("DebugPrintAllValues", this.exportToJSON());
    }
}