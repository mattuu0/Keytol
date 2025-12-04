import secrets
import os
import sys

def generate_random_key(length=64):
    """
    暗号学的に安全なランダムキーを、指定された長さ（デフォルト64文字）で生成します。
    """
    return secrets.token_urlsafe(length)

def confirm_overwrite_all(files_to_check):
    """
    主要な設定ファイルが存在するかを確認し、上書きするかを尋ねます。
    上書きが許可されない場合はFalseを返します。
    """
    existing_files = [f for f in files_to_check if os.path.exists(f)]

    if existing_files:
        print("\n--- ファイルの上書き確認 ---")
        print(f"以下のファイルが既に存在します: {', '.join(existing_files)}")
        response = input("これらのファイルをすべて上書きしますか？ (y/n): ")
        if response.lower() != 'y':
            print("ファイルの生成を中止しました。")
            return False
    return True

def create_env_file(file_path, content):
    """
    指定されたファイルパスに、指定された内容で設定ファイルを生成します。
    """
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content.strip())
    print(f"✅ ファイル '{file_path}' を生成しました。")

def create_database_env():
    """
    database.env を自動生成する
    """

    # データベースのパスワードを自動生成（長さ64文字）
    db_password = generate_random_key()

    # auth.env のテンプレート
    auth_env_template = f"""
MYSQL_DATABASE = root
MYSQL_USER = app
MYSQL_ROOT_PASSWORD = {db_password}
"""
    create_env_file("database.env", auth_env_template)

    return db_password

def main():
    """
    メイン処理：複数の設定ファイル生成関数を呼び出します。
    """
    # 作業ディレクトリを./dataに移動し、存在しなければ作成
    data_dir = "./data"
    os.makedirs(data_dir, exist_ok=True)
    os.chdir(data_dir)

    print("--- OAuth およびアプリケーション設定の開始 ---")

    # ファイルの上書き確認を行い、許可されない場合は終了
    files_to_check = ["database.env", "app.env"]
    if not confirm_overwrite_all(files_to_check):
        return

    # database.env ファイルを生成
    db_password = create_database_env()

    # app.env のテンプレート
    app_env_template = f"""
DATABASE_URI="app:{db_password}@tcp(db:3306)/app?charset=utf8mb4&parseTime=True&loc=Local"
"""

    # app.env ファイルを生成
    create_env_file("app.env", app_env_template)

    print(f"\n--- 設定完了！ ---")
    print(f"設定ファイルがすべて './data' ディレクトリに生成されました。")

if __name__ == "__main__":
    main()
