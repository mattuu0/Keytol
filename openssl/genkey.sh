#!/bin/sh

# ディレクトリとファイルパスの定義
jwtKeysDir="/jwtkeys"
sslKeysDir="/sslkeys"
privatePath="$jwtKeysDir/private.key"
publicPath="$jwtKeysDir/public.key"
privateEnvPath="$jwtKeysDir/private.env"
publicEnvPath="$jwtKeysDir/public.env"
serverKey="$sslKeysDir/server.key"
serverCsr="$sslKeysDir/server.csr"
serverCrt="$sslKeysDir/server.crt"

# ディレクトリが存在しない場合は作成
mkdir -p "$jwtKeysDir"
mkdir -p "$sslKeysDir"

echo "JWT鍵は $jwtKeysDir に、SSL鍵は $sslKeysDir に保存します"

# Ed25519鍵の処理
privateKeyCreated=0

if [ ! -f "$privatePath" ]; then
    echo "Ed25519秘密鍵が存在しないため、新しい鍵を生成します..."
    openssl genpkey -algorithm ED25519 -out "$privatePath"
    privateKeyCreated=1
    echo "Ed25519秘密鍵の生成が完了しました"
else
    echo "既存のEd25519秘密鍵を使用します"
fi

# 秘密鍵が新しく作られたか、公開鍵が存在しない場合に公開鍵を生成
if [ $privateKeyCreated -eq 1 ] || [ ! -f "$publicPath" ]; then
    echo "Ed25519公開鍵を生成します..."
    openssl pkey -in "$privatePath" -pubout -out "$publicPath"
    echo "Ed25519公開鍵の生成が完了しました"
fi

# Ed25519鍵の内容を.envファイルとして出力（末尾のバックスラッシュを削除）
# sed 's/\\$//' を使用して末尾のバックスラッシュを削除
key_content=$(cat "$privatePath" | tr '\n' '\\' | sed 's/\\$//' | sed 's/\\/\\n/g')
echo "JWT_PRIVATE_KEY=\"$key_content\"" > "$privateEnvPath"

key_content=$(cat "$publicPath" | tr '\n' '\\' | sed 's/\\$//' | sed 's/\\/\\n/g')
echo "JWT_PUBLIC_KEY=\"$key_content\"" > "$publicEnvPath"

echo "鍵情報を $privateEnvPath と $publicEnvPath に .env 形式で出力しました"

# Ed25519鍵の内容を表示
echo "\n===== Ed25519秘密鍵の内容 ====="
cat "$privatePath"

echo "\n===== Ed25519公開鍵の内容 ====="
cat "$publicPath"

echo "\n===== Ed25519鍵の情報 ====="
openssl pkey -in "$privatePath" -text -noout

echo "\n===== .env ファイルの内容 ====="
echo "private.env:"
cat "$privateEnvPath"
echo "\npublic.env:"
cat "$publicEnvPath"

# RSA鍵とX.509証明書の処理
if [ ! -f "$serverKey" ] || [ ! -f "$serverCsr" ] || [ ! -f "$serverCrt" ]; then
    echo "\nRSA鍵と証明書が存在しないため、新しく生成します..."
    
    # RSA鍵とCSR、証明書を生成
    openssl genrsa -out "$serverKey" 4096 && \
    openssl req -subj "/C=JP/ST=Tokyo/O=APP_CA/CN=APP_CA" -out "$serverCsr" -key "$serverKey" -new && \
    openssl x509 -req -days 3650 -signkey "$serverKey" -in "$serverCsr" -out "$serverCrt"
    
    echo "RSA鍵と証明書の生成が完了しました"
else
    echo "\n既存のRSA鍵と証明書を使用します"
fi

# RSA鍵と証明書の情報を表示（内容はファイルにのみ保存）
echo "\n===== RSA鍵と証明書の情報 ====="
echo "サーバー秘密鍵: $serverKey"
echo "証明書署名要求: $serverCsr"
echo "サーバー証明書: $serverCrt"

# RSA鍵の情報のみ表示
echo "\n===== RSA鍵の情報 ====="
openssl rsa -in "$serverKey" -text -noout | head -n 10
echo "..."