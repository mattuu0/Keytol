// 暗号化インターフェース
interface ICipher {
    encrypt(plaintext: Uint8Array): Promise<Uint8Array>;
    decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;
}
