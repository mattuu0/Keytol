import { argon2id } from "hash-wasm";

/**
 * E2EE用の鍵生成と認証用ハッシュの生成を行うユーティリティ (Argon2id版)
 */

/**
 * パスワードとサーバーから取得した固定ソルトから、暗号化鍵と認証用キーを生成します。
 * @param password ユーザーの生パスワード
 * @param saltBase64 サーバーから取得したBase64形式の固定ソルト
 * @param username ユーザー名 (追加のコンテキストとして使用)
 */
export async function deriveKeys(password: string, saltBase64: string, username: string): Promise<{
  encryptionKey: Uint8Array;
  authKey: string;
}> {
  const salt = base64ToUint8Array(saltBase64);
  
  // Argon2id のパラメータ設定 (RFC 9106 の推奨値をベースに調整)
  // ブラウザ環境のため、メモリ使用量を抑えつつ安全性を確保 (16MB, 3 iterations, 1 parallelism)
  const commonParams = {
    password: password,
    salt: salt,
    iterations: 3,
    parallelism: 1,
    memorySize: 16384, // 16MB
    hashLength: 32, // 256 bits
    outputType: "binary" as const,
  };

  // 1. 暗号化用鍵の導出
  // 追加データとして username を使用して、他ユーザーとの衝突を防ぐ
  const encryptionKey = await argon2id({
    ...commonParams,
    tag: new TextEncoder().encode(username + ":encryption"),
  }) as Uint8Array;

  // 2. 認証用キーの導出 (サーバーに送るもの)
  const authKeyBinary = await argon2id({
    ...commonParams,
    tag: new TextEncoder().encode(username + ":auth"),
  }) as Uint8Array;
  
  // 認証用キーはBase64形式で文字列化してサーバーに送る
  const authKey = uint8ArrayToBase64(authKeyBinary);

  return { encryptionKey, authKey };
}

// ヘルパー関数: Base64 -> Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ヘルパー関数: Uint8Array -> Base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}