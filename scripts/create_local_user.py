"""로컬 SQLite DB에 테스트 유저 생성"""
import sqlite3
import subprocess
import sys

try:
    import bcrypt
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "bcrypt", "-q"])
    import bcrypt

db_path = r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\prisma\dev.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Tenant 테이블 구조 확인
cur.execute("PRAGMA table_info(Tenant)")
tenant_cols = [c[1] for c in cur.fetchall()]
print("Tenant cols:", tenant_cols)

cur.execute("PRAGMA table_info(User)")
user_cols = [c[1] for c in cur.fetchall()]
print("User cols:", user_cols)

email = "localtest@test.com"
password = "Test1234!"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# Tenant 생성 (있는 컬럼만)
cur.execute("SELECT id FROM Tenant WHERE id='local-tenant-1'")
if not cur.fetchone():
    tenant_insert = f"INSERT INTO Tenant (id, name, createdAt) VALUES ('local-tenant-1', 'Local Test', datetime('now'))"
    cur.execute(tenant_insert)
    print("Tenant created")

# User 생성
cur.execute("SELECT id FROM User WHERE email=?", (email,))
if cur.fetchone():
    print("User already exists")
else:
    cur.execute(
        "INSERT INTO User (id, tenantId, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
        ("local-user-1", "local-tenant-1", "테스트유저", email, hashed, "member")
    )
    print(f"User created: {email} / {password}")

conn.commit()
conn.close()
print("Done!")
