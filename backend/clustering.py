import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os
import math

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')

EDUCATION_RANK = {'高中': 0, '大专': 1, '本科': 2, '硕士': 3, '博士': 4}
INCOME_RANK = {'5k以下': 0, '5k-10k': 1, '10k-20k': 2, '20k-50k': 3, '50k以上': 4}
INCOME_MID = {'5k以下': 3000, '5k-10k': 7500, '10k-20k': 15000, '20k-50k': 35000, '50k以上': 75000}
PROPERTY_SCORE = {'有房无贷': 3, '有房有贷': 2, '无房': 0, '与父母同住': 1}

CLUSTER_NAMES = [
    '优质精英',
    '务实刚需',
    '躺平佛系',
    '焦虑追赶',
    '潜力新秀'
]

CLUSTER_COLORS = [
    '#fa8c16',
    '#1890ff',
    '#52c41a',
    '#eb2f96',
    '#722ed1'
]

CLUSTER_DESCRIPTIONS = {
    '优质精英': '高收入、高学历、有房有车，付费能力强，择偶要求高',
    '务实刚需': '中等条件，付费意愿强，以结婚为目的的刚需人群',
    '躺平佛系': '条件一般，付费意愿低，择偶要求也低',
    '焦虑追赶': '年龄偏大，条件一般但付费高，迫切希望脱单',
    '潜力新秀': '年轻有潜力，学历不错但收入一般，处于起步阶段'
}


def load_data():
    users = pd.read_csv(os.path.join(DATA_PATH, 'users.csv'), encoding='utf-8-sig')
    preferences = pd.read_csv(os.path.join(DATA_PATH, 'preferences.csv'), encoding='utf-8-sig')
    payments = pd.read_csv(os.path.join(DATA_PATH, 'payments.csv'), encoding='utf-8-sig')
    return users, preferences, payments


def calculate_pickiness_score(pref_row):
    score = 0
    if pd.notna(pref_row['req_education']):
        score += EDUCATION_RANK.get(pref_row['req_education'], 2) + 1
    if pd.notna(pref_row['req_income']):
        score += INCOME_RANK.get(pref_row['req_income'], 2) + 1
    if pd.notna(pref_row['req_property']) and pref_row['req_property'] != '不限':
        score += 2
    if pd.notna(pref_row['req_height']):
        score += 1
    age_range = pref_row['pref_max_age'] - pref_row['pref_min_age']
    if age_range <= 5:
        score += 2
    elif age_range <= 8:
        score += 1
    return score


def build_feature_matrix(users_df, pref_df, pay_df):
    merged = users_df.merge(pref_df, on='user_id').merge(pay_df, on='user_id')
    
    features = pd.DataFrame()
    features['age'] = merged['age']
    features['education'] = merged['education'].map(EDUCATION_RANK)
    features['income'] = merged['income'].map(INCOME_RANK)
    features['property'] = merged['property'].map(PROPERTY_SCORE)
    features['total_spent'] = merged['total_spent']
    features['pickiness'] = merged.apply(calculate_pickiness_score, axis=1)
    features['is_paid'] = merged['is_paid'].astype(int)
    
    features = features.fillna(0)
    features = features.replace([np.inf, -np.inf], 0)
    
    return features, merged


def assign_cluster_names(cluster_centers, feature_names, n_clusters):
    center_df = pd.DataFrame(cluster_centers, columns=feature_names)
    
    name_map = {}
    used_names = set()
    
    feature_means = center_df.mean()
    feature_stds = center_df.std()
    
    z_scores = (center_df - feature_means) / feature_stds.replace(0, 1)
    
    def get_cluster_score(idx, rules):
        score = 0
        for feature, condition in rules.items():
            if feature in z_scores.columns:
                val = z_scores.loc[idx, feature]
                if condition == 'high' and val > 0.3:
                    score += 1
                elif condition == 'very_high' and val > 0.7:
                    score += 1.5
                elif condition == 'low' and val < -0.3:
                    score += 1
                elif condition == 'very_low' and val < -0.7:
                    score += 1.5
                elif condition == 'medium' and abs(val) < 0.5:
                    score += 0.5
        return score
    
    name_candidates = ['优质精英', '务实刚需', '躺平佛系', '焦虑追赶', '潜力新秀']
    
    for idx in range(n_clusters):
        scores = {}
        
        scores['优质精英'] = get_cluster_score(idx, {
            'income': 'very_high',
            'education': 'high',
            'property': 'high',
            'total_spent': 'high',
            'pickiness': 'high'
        })
        
        scores['务实刚需'] = get_cluster_score(idx, {
            'income': 'medium',
            'education': 'medium',
            'property': 'medium',
            'total_spent': 'high',
            'pickiness': 'medium'
        })
        
        scores['躺平佛系'] = get_cluster_score(idx, {
            'income': 'low',
            'education': 'low',
            'property': 'low',
            'total_spent': 'very_low',
            'pickiness': 'very_low'
        })
        
        scores['焦虑追赶'] = get_cluster_score(idx, {
            'age': 'very_high',
            'income': 'low',
            'education': 'medium',
            'property': 'low',
            'total_spent': 'very_high',
            'pickiness': 'high'
        })
        
        scores['潜力新秀'] = get_cluster_score(idx, {
            'age': 'very_low',
            'income': 'low',
            'education': 'high',
            'property': 'medium',
            'total_spent': 'low',
            'pickiness': 'medium'
        })
        
        available_scores = {k: v for k, v in scores.items() if k not in used_names}
        if available_scores:
            best_name = max(available_scores, key=available_scores.get)
            name_map[idx] = best_name
            used_names.add(best_name)
        else:
            remaining = [n for n in name_candidates if n not in used_names]
            if remaining:
                name_map[idx] = remaining[0]
                used_names.add(remaining[0])
            else:
                name_map[idx] = f'群体{idx+1}'
    
    return name_map


def analyze_clusters(n_clusters=5, sample_size=None):
    users, preferences, payments = load_data()
    
    total_user_count = len(users)
    
    all_users = users.copy()
    is_sampled = False
    
    if sample_size and len(all_users) > sample_size:
        all_users = all_users.sample(n=sample_size, random_state=42)
        is_sampled = True
        sampled_count = len(all_users)
    else:
        sampled_count = len(all_users)
    
    user_ids = set(all_users['user_id'].tolist())
    sampled_prefs = preferences[preferences['user_id'].isin(user_ids)]
    sampled_payments = payments[payments['user_id'].isin(user_ids)]
    
    features, merged = build_feature_matrix(all_users, sampled_prefs, sampled_payments)
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(scaled_features)
    
    feature_names = features.columns.tolist()
    name_map = assign_cluster_names(kmeans.cluster_centers_, feature_names, n_clusters)
    
    merged['cluster'] = [name_map[label] for label in cluster_labels]
    
    clusters = []
    for cluster_name in sorted(name_map.values()):
        cluster_data = merged[merged['cluster'] == cluster_name]
        count = len(cluster_data)
        pct = round(count / len(merged) * 100, 1)
        
        avg_age = round(cluster_data['age'].mean(), 1)
        avg_edu = cluster_data['education'].map(EDUCATION_RANK).mean()
        avg_income_rank = cluster_data['income'].map(INCOME_RANK).mean()
        avg_spent = round(cluster_data['total_spent'].mean(), 0)
        paid_rate = round(cluster_data['is_paid'].mean() * 100, 1)
        
        property_dist = cluster_data['property'].value_counts().to_dict()
        property_pct = {k: round(v / count * 100, 1) for k, v in property_dist.items()}
        
        edu_dist = cluster_data['education'].value_counts().to_dict()
        edu_pct = {k: round(v / count * 100, 1) for k, v in edu_dist.items()}
        
        income_dist = cluster_data['income'].value_counts().to_dict()
        income_pct = {k: round(v / count * 100, 1) for k, v in income_dist.items()}
        
        avg_pickiness = round(features.loc[cluster_data.index, 'pickiness'].mean(), 1)
        
        top_education = max(edu_pct, key=edu_pct.get)
        top_income = max(income_pct, key=income_pct.get)
        top_property = max(property_pct, key=property_pct.get)
        
        radar_data = {
            '年龄': round(avg_age / 50 * 100, 1),
            '学历': round(avg_edu / 4 * 100, 1),
            '收入': round(avg_income_rank / 4 * 100, 1),
            '房产': round(cluster_data['property'].map(PROPERTY_SCORE).mean() / 3 * 100, 1),
            '消费力': round(min(avg_spent / 2000 * 100, 100), 1),
            '择偶要求': round(min(avg_pickiness / 12 * 100, 100), 1)
        }
        
        cluster_info = {
            'name': cluster_name,
            'color': CLUSTER_COLORS[sorted(name_map.values()).index(cluster_name)] if cluster_name in CLUSTER_NAMES else '#999',
            'description': CLUSTER_DESCRIPTIONS.get(cluster_name, ''),
            'count': int(count),
            'percentage': pct,
            'statistics': {
                'avg_age': avg_age,
                'avg_education': top_education,
                'avg_income': top_income,
                'top_property': top_property,
                'avg_spent': float(avg_spent),
                'paid_rate': paid_rate,
                'avg_pickiness': avg_pickiness
            },
            'distributions': {
                'education': edu_pct,
                'income': income_pct,
                'property': property_pct
            },
            'radar_data': radar_data
        }
        clusters.append(cluster_info)
    
    clusters.sort(key=lambda x: x['count'], reverse=True)
    
    scatter_data = []
    sample_for_scatter = merged.sample(n=min(200, len(merged)), random_state=42)
    for _, row in sample_for_scatter.iterrows():
        scatter_data.append({
            'x': INCOME_RANK.get(row['income'], 2),
            'y': row['total_spent'],
            'cluster': row['cluster'],
            'age': int(row['age']),
            'education': row['education']
        })
    
    feature_importance = {
        'age': round(kmeans.cluster_centers_[:, 0].std(), 3),
        'education': round(kmeans.cluster_centers_[:, 1].std(), 3),
        'income': round(kmeans.cluster_centers_[:, 2].std(), 3),
        'property': round(kmeans.cluster_centers_[:, 3].std(), 3),
        'total_spent': round(kmeans.cluster_centers_[:, 4].std(), 3),
        'pickiness': round(kmeans.cluster_centers_[:, 5].std(), 3)
    }
    
    result = {
        'total_users': int(total_user_count),
        'analyzed_users': int(len(merged)),
        'is_sampled': is_sampled,
        'sampled_count': int(sampled_count) if is_sampled else None,
        'n_clusters': n_clusters,
        'clusters': clusters,
        'scatter_data': scatter_data,
        'feature_importance': feature_importance,
        'radar_keys': ['年龄', '学历', '收入', '房产', '消费力', '择偶要求']
    }
    
    return sanitize_for_json(result)


def sanitize_for_json(obj):
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, (float, np.floating)):
        if math.isnan(obj) or math.isinf(obj):
            return 0
        return float(obj)
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    else:
        return obj


if __name__ == '__main__':
    result = analyze_clusters(n_clusters=5, sample_size=5000)
    print(f"聚类分析完成，共 {result['total_users']} 个用户，分为 {result['n_clusters']} 类")
    for cluster in result['clusters']:
        print(f"  - {cluster['name']}: {cluster['count']} 人 ({cluster['percentage']}%)")
        print(f"    {cluster['description']}")
