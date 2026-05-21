import sqlite3
conn = sqlite3.connect(r'C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\prisma\dev.db')
cur = conn.cursor()
cur.execute("SELECT id, email, name, tenantId, password IS NOT NULL as has_pw FROM User LIMIT 10")
rows = cur.fetchall()
for r in rows:
    print(r)
conn.close()
