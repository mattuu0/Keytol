/**
 * E2EE用の鍵生成と認証用ハッシュの生成を行うユーティリティ
 */

/**
 * パスワードとユーザー名から、暗号化鍵と認証用キーを生成します。
 */
export async function deriveKeys(password: string, username: string): Promise<{
  encryptionKey: Uint8Array;
  authKey: string;
}> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const salt = encoder.encode(username.toLowerCase()); // ソルトにユーザー名を使用

  // 基本となる鍵を生成
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // 1. 暗号化用鍵の導出 (32バイト = 256bit)
  const encryptionKeyBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  const encryptionKey = new Uint8Array(encryptionKeyBits);

  // 2. 認証用キーの導出 (サーバーに送るもの)
  // 暗号化鍵とは別のキーを導出するため、ソルトを少し変える
  const authSalt = encoder.encode(username.toLowerCase() + ":auth");
  const authKeyBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: authSalt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  
  // 認証用キーはBase64形式で文字列化してサーバーに送る
  const authKey = btoa(String.fromCharCode(...new Uint8Array(authKeyBits)));

  return { encryptionKey, authKey };
}
