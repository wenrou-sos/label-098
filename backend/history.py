import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'history.db')

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS data_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            total_users INTEGER,
            male_pct REAL,
            female_pct REAL,
            paid_rate REAL,
            avg_spent_per_user REAL,
            avg_age REAL,
            success_matches INTEGER,
            success_rate REAL,
            anxiety_index_avg REAL,
            city_count INTEGER,
            total_revenue INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def get_next_version():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COALESCE(MAX(version), 0) FROM data_snapshots')
    max_version = cursor.fetchone()[0]
    conn.close()
    return max_version + 1

def save_snapshot(summary_data, anxiety_data, match_data):
    init_db()
    version = get_next_version()
    
    anxiety_index_values = []
    for tier_data in anxiety_data.values():
        if 'anxiety_index' in tier_data:
            anxiety_index_values.append(tier_data['anxiety_index'])
    anxiety_index_avg = sum(anxiety_index_values) / len(anxiety_index_values) if anxiety_index_values else 0
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO data_snapshots (
            version, created_at, total_users, male_pct, female_pct,
            paid_rate, avg_spent_per_user, avg_age, success_matches,
            success_rate, anxiety_index_avg, city_count, total_revenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        version,
        datetime.now().isoformat(),
        summary_data.get('total_users', 0),
        summary_data.get('male_pct', 0),
        summary_data.get('female_pct', 0),
        summary_data.get('paid_rate', 0),
        summary_data.get('avg_spent_per_user', 0),
        summary_data.get('avg_age', 0),
        summary_data.get('success_matches', 0),
        match_data.get('success_rate', 0),
        round(anxiety_index_avg, 2),
        summary_data.get('city_count', 0),
        summary_data.get('total_revenue', 0)
    ))
    conn.commit()
    conn.close()
    return version

def get_total_count():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM data_snapshots')
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_history(limit=500):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM data_snapshots 
        ORDER BY version DESC 
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        result.append({
            'version': row['version'],
            'created_at': row['created_at'],
            'total_users': row['total_users'],
            'male_pct': row['male_pct'],
            'female_pct': row['female_pct'],
            'paid_rate': row['paid_rate'],
            'avg_spent_per_user': row['avg_spent_per_user'],
            'avg_age': row['avg_age'],
            'success_matches': row['success_matches'],
            'success_rate': row['success_rate'],
            'anxiety_index_avg': row['anxiety_index_avg'],
            'city_count': row['city_count'],
            'total_revenue': row['total_revenue']
        })
    return list(reversed(result))

def get_latest_version():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COALESCE(MAX(version), 0) FROM data_snapshots')
    version = cursor.fetchone()[0]
    conn.close()
    return version
