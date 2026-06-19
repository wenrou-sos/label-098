import pandas as pd
import numpy as np
import jieba
import re
import math
from collections import Counter
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')

EDUCATION_RANK = {'高中': 0, '大专': 1, '本科': 2, '硕士': 3, '博士': 4}
INCOME_RANK = {'5k以下': 0, '5k-10k': 1, '10k-20k': 2, '20k-50k': 3, '50k以上': 4}

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

def load_data():
    users = pd.read_csv(os.path.join(DATA_PATH, 'users.csv'), encoding='utf-8-sig')
    preferences = pd.read_csv(os.path.join(DATA_PATH, 'preferences.csv'), encoding='utf-8-sig')
    payments = pd.read_csv(os.path.join(DATA_PATH, 'payments.csv'), encoding='utf-8-sig')
    matches = pd.read_csv(os.path.join(DATA_PATH, 'matches.csv'), encoding='utf-8-sig')
    return users, preferences, payments, matches

def get_age_group(age):
    if 20 <= age <= 25: return '20-25'
    elif 26 <= age <= 30: return '26-30'
    elif 31 <= age <= 35: return '31-35'
    elif 36 <= age <= 40: return '36-40'
    else: return '40+'

def analyze_city_demographics(users_df):
    result = {}
    city_stats = users_df.groupby(['city', 'city_tier', 'gender']).agg(
        count=('user_id', 'count'),
        avg_age=('age', 'mean')
    ).reset_index()
    
    cities = users_df['city'].unique()
    for city in cities:
        city_data = users_df[users_df['city'] == city]
        tier = city_data['city_tier'].iloc[0]
        total = len(city_data)
        males = len(city_data[city_data['gender'] == '男'])
        females = len(city_data[city_data['gender'] == '女'])
        ratio = males / females if females > 0 else 0
        
        male_ages = city_data[city_data['gender'] == '男']['age'].describe().to_dict()
        female_ages = city_data[city_data['gender'] == '女']['age'].describe().to_dict()
        
        age_dist = {}
        for g in ['男', '女']:
            g_data = city_data[city_data['gender'] == g].copy()
            g_data['age_group'] = g_data['age'].apply(get_age_group)
            age_dist[g] = g_data['age_group'].value_counts().reindex(
                ['20-25', '26-30', '31-35', '36-40', '40+'], fill_value=0
            ).to_dict()
        
        if ratio > 1.1:
            status = '男多女少'
        elif ratio < 0.9:
            status = '女多男少'
        else:
            status = '基本均衡'
        
        result[city] = {
            'tier': tier,
            'total': total,
            'males': males,
            'females': females,
            'male_ratio': round(males / total * 100, 1) if total > 0 else 0,
            'female_ratio': round(females / total * 100, 1) if total > 0 else 0,
            'ratio': round(ratio, 3),
            'status': status,
            'male_age_dist': age_dist.get('男', {}),
            'female_age_dist': age_dist.get('女', {}),
            'male_avg_age': round(city_data[city_data['gender'] == '男']['age'].mean(), 1),
            'female_avg_age': round(city_data[city_data['gender'] == '女']['age'].mean(), 1)
        }
    
    return result

def analyze_preference_differences(users_df, pref_df):
    merged = users_df.merge(pref_df, on='user_id')
    merged['age_group'] = merged['age'].apply(get_age_group)
    
    age_groups = ['20-25', '26-30', '31-35', '36-40', '40+']
    result = {}
    
    for gender in ['男', '女']:
        g_data = merged[merged['gender'] == gender]
        result[gender] = {}
        for ag in age_groups:
            ag_data = g_data[g_data['age_group'] == ag]
            total = len(ag_data)
            if total == 0:
                continue
            edu_req_pct = round(ag_data['req_education'].notna().sum() / total * 100, 1)
            income_req_pct = round(ag_data['req_income'].notna().sum() / total * 100, 1)
            prop_req_pct = round(
                (ag_data['req_property'].notna() & (ag_data['req_property'] != '不限')).sum() / total * 100, 1
            )
            height_req_pct = round(ag_data['req_height'].notna().sum() / total * 100, 1)
            
            result[gender][ag] = {
                'total': total,
                'education_req': edu_req_pct,
                'income_req': income_req_pct,
                'property_req': prop_req_pct,
                'height_req': height_req_pct
            }
    
    return result

STOPWORDS = {
    '的', '了', '和', '是', '在', '我', '有', '也', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '那', '他', '她', '们', '能', '可以', '想', '对', '就', '但',
    '还', '又', '与', '或', '及', '等', '啊', '吧', '呢', '吗', '哦', '哈',
    '找', '希望', '喜欢', '一起', '生活', '性格', '工作', '稳定', '女生', '男生',
    '对方', '伴侣', '另一半', '结婚', '对象'
}

KEYWORDS_FOCUS = [
    '经济独立', '性格好', '有上进心', '顾家', '温柔', '贤惠', '善良', '孝顺',
    '体贴', '成熟', '稳重', '幽默', '风趣', '阳光', '开朗', '帅气', '漂亮',
    '颜值', '身高', '学历', '收入', '有房', '有车', '稳定', '事业', '家庭',
    '三观', '共同语言', '聊得来', '孝顺', '责任心', '担当', '独立', '自主',
    '健身', '旅行', '美食', '读书', '音乐', '电影', '运动', '摄影', '烹饪',
    '孝顺父母', '以结婚为目的', '真诚', '专一', '靠谱'
]

def analyze_self_intros(users_df, top_n=20):
    result = {}
    for gender in ['男', '女']:
        g_data = users_df[users_df['gender'] == gender]
        texts = g_data['self_intro'].dropna().tolist()
        sample_count = len(texts)
        
        if sample_count == 0:
            result[gender] = {
                'top_keywords': [],
                'focus_rates': {kw: 0 for kw in KEYWORDS_FOCUS},
                'sample_count': 0
            }
            continue
        
        all_text = ' '.join(texts)
        
        words = jieba.lcut(all_text)
        words = [w.strip() for w in words if len(w.strip()) >= 2 and w.strip() not in STOPWORDS]
        
        counter = Counter(words)
        top_words = counter.most_common(top_n)
        
        focus_counts = {}
        for kw in KEYWORDS_FOCUS:
            count = all_text.count(kw)
            focus_counts[kw] = round(count / sample_count * 100, 1)
        
        result[gender] = {
            'top_keywords': [{'word': w, 'count': c} for w, c in top_words],
            'focus_rates': focus_counts,
            'sample_count': sample_count
        }
    
    return result

def analyze_anxiety_index(users_df, payments_df):
    merged = users_df.merge(payments_df, on='user_id')
    
    tiers = ['一线', '新一线', '二线', '三线']
    result = {}
    
    for tier in tiers:
        t_data = merged[merged['city_tier'] == tier]
        total_users = len(t_data)
        if total_users == 0:
            continue
        
        paid_users = t_data[t_data['is_paid']]
        paid_count = len(paid_users)
        paid_rate = round(paid_count / total_users * 100, 1)
        avg_spent = round(paid_users['total_spent'].mean(), 2) if paid_count > 0 else 0
        median_spent = round(paid_users['total_spent'].median(), 2) if paid_count > 0 else 0
        
        avg_age = round(t_data['age'].mean(), 1)
        age_30_plus = round(len(t_data[t_data['age'] >= 30]) / total_users * 100, 1)
        
        no_property = round(
            len(t_data[t_data['property'].isin(['无房', '与父母同住'])]) / total_users * 100, 1
        )
        
        low_income = round(
            len(t_data[t_data['income'].isin(['5k以下', '5k-10k'])]) / total_users * 100, 1
        )
        
        anxiety_score = round(
            (paid_rate * 0.35) + 
            (avg_spent / 50) + 
            (age_30_plus * 0.25) + 
            (no_property * 0.2) + 
            (low_income * 0.15),
            2
        )
        
        max_anxiety = 35 + 100 + 25 + 20 + 15
        anxiety_level = min(100, round(anxiety_score / max_anxiety * 100, 1))
        
        level_label = ''
        if anxiety_level >= 75:
            level_label = '极度焦虑'
        elif anxiety_level >= 55:
            level_label = '高度焦虑'
        elif anxiety_level >= 35:
            level_label = '中度焦虑'
        else:
            level_label = '轻度焦虑'
        
        vip_dist = paid_users['vip_level'].value_counts().to_dict() if paid_count > 0 else {}
        
        city_details = {}
        for city in t_data['city'].unique():
            c_data = t_data[t_data['city'] == city]
            c_total = len(c_data)
            c_paid = c_data[c_data['is_paid']]
            c_paid_count = len(c_paid)
            city_details[city] = {
                'total': c_total,
                'paid_count': c_paid_count,
                'paid_rate': round(c_paid_count / c_total * 100, 1) if c_total > 0 else 0,
                'avg_spent': round(c_paid['total_spent'].mean(), 2) if c_paid_count > 0 else 0
            }
        
        result[tier] = {
            'total_users': total_users,
            'paid_count': paid_count,
            'paid_rate': paid_rate,
            'avg_spent': avg_spent,
            'median_spent': median_spent,
            'avg_age': avg_age,
            'age_30_plus_pct': age_30_plus,
            'no_property_pct': no_property,
            'low_income_pct': low_income,
            'anxiety_index': anxiety_level,
            'anxiety_label': level_label,
            'vip_distribution': vip_dist,
            'city_details': city_details
        }
    
    return result

def analyze_match_success(matches_df):
    success = matches_df[matches_df['is_success'] == True].copy()
    failed = matches_df[matches_df['is_success'] == False].copy()
    
    total_success = len(success)
    total_failed = len(failed)
    success_rate = round(total_success / len(matches_df) * 100, 1) if len(matches_df) > 0 else 0
    
    def get_distribution(series, bins, labels):
        counts = pd.cut(series, bins=bins, labels=labels, include_lowest=True).value_counts()
        result = {}
        for label in labels:
            result[label] = {
                'count': int(counts.get(label, 0)),
                'pct': round(int(counts.get(label, 0)) / len(series) * 100, 1) if len(series) > 0 else 0
            }
        return result
    
    age_diff_dist = get_distribution(
        success['age_diff'],
        bins=[-15, -6, -4, -2, 0, 2, 4, 6, 15],
        labels=['女大6岁以上', '女大4-6岁', '女大2-4岁', '女大0-2岁', '男大0-2岁', '男大2-4岁', '男大4-6岁', '男大6岁以上']
    )
    
    edu_diff_labels = ['男方低2级以上', '男方低1级', '同级', '男方高1级', '男方高2级以上']
    edu_diff_dist = get_distribution(
        success['education_diff'],
        bins=[-5, -1.5, -0.5, 0.5, 1.5, 5],
        labels=edu_diff_labels
    )
    
    income_diff_labels = ['女方高2级以上', '女方高1级', '同级', '男方高1级', '男方高2级以上']
    income_diff_dist = get_distribution(
        success['income_diff'],
        bins=[-5, -1.5, -0.5, 0.5, 1.5, 5],
        labels=income_diff_labels
    )
    
    edu_combinations = success.groupby(['male_education', 'female_education']).size().reset_index(name='count')
    edu_matrix = {}
    for _, row in edu_combinations.iterrows():
        key = f"{row['male_education']}_{row['female_education']}"
        edu_matrix[key] = int(row['count'])
    
    income_combinations = success.groupby(['male_income', 'female_income']).size().reset_index(name='count')
    income_matrix = {}
    for _, row in income_combinations.iterrows():
        key = f"{row['male_income']}_{row['female_income']}"
        income_matrix[key] = int(row['count'])
    
    stats = {
        'avg_age_diff': round(success['age_diff'].mean(), 2),
        'avg_education_diff': round(success['education_diff'].mean(), 2),
        'avg_income_diff': round(success['income_diff'].mean(), 2),
        'male_older_pct': round((success['age_diff'] > 0).sum() / total_success * 100, 1),
        'age_diff_within_3_pct': round((success['age_diff'].abs() <= 3).sum() / total_success * 100, 1),
        'edu_same_pct': round((success['education_diff'] == 0).sum() / total_success * 100, 1),
        'income_same_pct': round((success['income_diff'] == 0).sum() / total_success * 100, 1),
        'male_higher_edu_pct': round((success['education_diff'] > 0).sum() / total_success * 100, 1),
        'male_higher_income_pct': round((success['income_diff'] > 0).sum() / total_success * 100, 1)
    }
    
    return {
        'total_matches': len(matches_df),
        'success_count': total_success,
        'failed_count': total_failed,
        'success_rate': success_rate,
        'age_diff_distribution': age_diff_dist,
        'education_diff_distribution': edu_diff_dist,
        'income_diff_distribution': income_diff_dist,
        'education_combination': edu_matrix,
        'income_combination': income_matrix,
        'key_statistics': stats
    }

def get_summary(users_df, payments_df, matches_df):
    total_users = len(users_df)
    males = len(users_df[users_df['gender'] == '男'])
    females = len(users_df[users_df['gender'] == '女'])
    paid_count = len(payments_df[payments_df['is_paid']])
    total_revenue = payments_df['total_spent'].sum()
    success_matches = len(matches_df[matches_df['is_success']])
    
    return {
        'total_users': total_users,
        'male_count': males,
        'female_count': females,
        'male_pct': round(males / total_users * 100, 1),
        'female_pct': round(females / total_users * 100, 1),
        'paid_count': paid_count,
        'paid_rate': round(paid_count / total_users * 100, 1),
        'total_revenue': int(total_revenue),
        'avg_spent_per_user': round(total_revenue / paid_count, 2) if paid_count > 0 else 0,
        'success_matches': success_matches,
        'city_count': users_df['city'].nunique(),
        'avg_age': round(users_df['age'].mean(), 1)
    }

def filter_users(users_df, tier=None, age_group=None, gender=None):
    filtered = users_df.copy()
    if tier:
        filtered = filtered[filtered['city_tier'] == tier]
    if age_group:
        filtered['_age_group'] = filtered['age'].apply(get_age_group)
        filtered = filtered[filtered['_age_group'] == age_group]
        filtered = filtered.drop(columns=['_age_group'])
    if gender:
        filtered = filtered[filtered['gender'] == gender]
    return filtered

def filter_matches(matches_df, users_df, tier=None, age_group=None, gender=None):
    if not tier and not age_group and not gender:
        return matches_df
    
    user_info = users_df[['user_id', 'city_tier', 'gender', 'age']].copy()
    user_info['age_group'] = user_info['age'].apply(get_age_group)
    
    male_info = user_info.rename(columns={
        'user_id': 'male_id', 'city_tier': 'male_city_tier',
        'gender': 'male_gender', 'age': 'male_age_col', 'age_group': 'male_age_group'
    })
    female_info = user_info.rename(columns={
        'user_id': 'female_id', 'city_tier': 'female_city_tier',
        'gender': 'female_gender', 'age': 'female_age_col', 'age_group': 'female_age_group'
    })
    
    merged = matches_df.merge(male_info, on='male_id', how='left')
    merged = merged.merge(female_info, on='female_id', how='left')
    
    if gender:
        if gender == '男':
            merged = merged[merged['male_gender'] == '男']
            if tier:
                merged = merged[merged['male_city_tier'] == tier]
            if age_group:
                merged = merged[merged['male_age_group'] == age_group]
        elif gender == '女':
            merged = merged[merged['female_gender'] == '女']
            if tier:
                merged = merged[merged['female_city_tier'] == tier]
            if age_group:
                merged = merged[merged['female_age_group'] == age_group]
    else:
        if tier:
            merged = merged[
                (merged['male_city_tier'] == tier) & (merged['female_city_tier'] == tier)
            ]
        if age_group:
            merged = merged[
                (merged['male_age_group'] == age_group) & (merged['female_age_group'] == age_group)
            ]
    
    result = merged[matches_df.columns]
    return result

def run_all_analysis(tier=None, age_group=None, gender=None):
    users, preferences, payments, matches = load_data()
    
    filtered_users = filter_users(users, tier=tier, age_group=age_group, gender=gender)
    user_ids = set(filtered_users['user_id'].tolist())
    
    filtered_prefs = preferences[preferences['user_id'].isin(user_ids)]
    filtered_payments = payments[payments['user_id'].isin(user_ids)]
    filtered_matches = filter_matches(matches, users, tier=tier, age_group=age_group, gender=gender)
    
    result = {
        'summary': get_summary(filtered_users, filtered_payments, filtered_matches),
        'city_demographics': analyze_city_demographics(filtered_users),
        'preference_differences': analyze_preference_differences(filtered_users, filtered_prefs),
        'self_intro_analysis': analyze_self_intros(filtered_users),
        'anxiety_index': analyze_anxiety_index(filtered_users, filtered_payments),
        'match_success': analyze_match_success(filtered_matches),
        'filter_applied': {
            'tier': tier,
            'age_group': age_group,
            'gender': gender
        }
    }
    return sanitize_for_json(result)

def get_city_list():
    users, _, _, _ = load_data()
    cities = sorted(users['city'].unique().tolist())
    tier_map = users.groupby('city')['city_tier'].first().to_dict()
    result = []
    for city in cities:
        result.append({
            'name': city,
            'tier': tier_map[city],
            'male_count': int(len(users[(users['city'] == city) & (users['gender'] == '男')])),
            'female_count': int(len(users[(users['city'] == city) & (users['gender'] == '女')]))
        })
    return result

def calculate_match_score(user_a, user_b):
    score = 0
    details = {}
    
    age_diff = abs(user_a['age'] - user_b['age'])
    if age_diff <= 3:
        age_score = 30
    elif age_diff <= 5:
        age_score = 20
    elif age_diff <= 7:
        age_score = 10
    else:
        age_score = 0
    score += age_score
    details['age_diff'] = int(age_diff)
    details['age_score'] = age_score
    
    edu_diff = abs(EDUCATION_RANK.get(user_a['education'], 0) - EDUCATION_RANK.get(user_b['education'], 0))
    if edu_diff == 0:
        edu_score = 25
    elif abs(edu_diff) == 1:
        edu_score = 15
    elif abs(edu_diff) == 2:
        edu_score = 5
    else:
        edu_score = 0
    score += edu_score
    details['education_diff'] = int(edu_diff)
    details['education_score'] = edu_score
    
    income_diff = abs(INCOME_RANK.get(user_a['income'], 0) - INCOME_RANK.get(user_b['income'], 0))
    if income_diff == 0:
        income_score = 20
    elif abs(income_diff) == 1:
        income_score = 15
    elif abs(income_diff) == 2:
        income_score = 8
    else:
        income_score = 0
    score += income_score
    details['income_diff'] = int(income_diff)
    details['income_score'] = income_score
    
    if user_a['city'] == user_b['city']:
        city_score = 15
    else:
        city_score = 0
    score += city_score
    details['same_city'] = user_a['city'] == user_b['city']
    details['city_score'] = city_score
    
    property_score = 0
    if user_a.get('property', '') == user_b.get('property', ''):
        property_score = 5
    elif user_a.get('property', '').startswith('有房') and user_b.get('property', '').startswith('有房'):
        property_score = 3
    score += property_score
    details['property_score'] = property_score
    
    details['total_score'] = score
    return score, details

def get_match_recommendations(city, target_gender, min_age, max_age, min_education=None, top_n=20):
    users, preferences, _, _ = load_data()
    
    candidates = users[users['city'] == city].copy()
    target_gender_opposite = '女' if target_gender == '男' else '男'
    candidates = candidates[candidates['gender'] == target_gender_opposite]
    candidates = candidates[(candidates['age'] >= min_age) & (candidates['age'] <= max_age)]
    
    if min_education:
        min_rank = EDUCATION_RANK.get(min_education, 0)
        candidates = candidates[candidates['education'].map(lambda x: EDUCATION_RANK.get(x, 0) >= min_rank)]
    
    target_prefs = preferences[preferences['user_id'].isin(candidates['user_id'])]
    
    all_candidates = candidates.to_dict('records')
    
    results = []
    for cand in all_candidates:
        score, details = calculate_match_score(
            {'age': (min_age + max_age) // 2, 'education': min_education or '本科', 'income': '10k-20k', 'city': city},
            cand
        )
        cand_pref = preferences[preferences['user_id'] == cand['user_id']].iloc[0] if len(preferences[preferences['user_id'] == cand['user_id']]) > 0 else None
        
        intro_text = cand.get('self_intro', '')
        intro_summary = intro_text[:60] + '...' if len(intro_text) > 60 else intro_text
        
        results.append({
            'user_id': cand['user_id'],
            'age': int(cand['age']),
            'gender': cand['gender'],
            'education': cand['education'],
            'income': cand['income'],
            'property': cand['property'],
            'height': int(cand['height']),
            'self_intro': intro_summary,
            'self_intro_full': intro_text,
            'city': cand['city'],
            'city_tier': cand['city_tier'],
            'match_score': int(score),
            'match_details': details,
            'pref_min_age': int(cand_pref['pref_min_age']) if cand_pref is not None else None,
            'pref_max_age': int(cand_pref['pref_max_age']) if cand_pref is not None else None,
            'req_education': cand_pref['req_education'] if cand_pref is not None else None
        })
    
    results.sort(key=lambda x: x['match_score'], reverse=True)
    results = results[:top_n]
    
    return {
        'city': city,
        'target_gender': target_gender,
        'criteria': {
            'min_age': min_age,
            'max_age': max_age,
            'min_education': min_education
        },
        'total_candidates': len(results),
        'total_available': len(candidates),
        'recommendations': results
    }
