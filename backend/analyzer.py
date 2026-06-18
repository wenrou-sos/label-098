import pandas as pd
import numpy as np
import jieba
import re
from collections import Counter
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')

EDUCATION_RANK = {'高中': 0, '大专': 1, '本科': 2, '硕士': 3, '博士': 4}
INCOME_RANK = {'5k以下': 0, '5k-10k': 1, '10k-20k': 2, '20k-50k': 3, '50k以上': 4}

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
        all_text = ' '.join(texts)
        
        words = jieba.lcut(all_text)
        words = [w.strip() for w in words if len(w.strip()) >= 2 and w.strip() not in STOPWORDS]
        
        counter = Counter(words)
        top_words = counter.most_common(top_n)
        
        focus_counts = {}
        for kw in KEYWORDS_FOCUS:
            count = all_text.count(kw)
            focus_counts[kw] = round(count / len(texts) * 100, 1)
        
        result[gender] = {
            'top_keywords': [{'word': w, 'count': c} for w, c in top_words],
            'focus_rates': focus_counts,
            'sample_count': len(texts)
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

def run_all_analysis():
    users, preferences, payments, matches = load_data()
    return {
        'summary': get_summary(users, payments, matches),
        'city_demographics': analyze_city_demographics(users),
        'preference_differences': analyze_preference_differences(users, preferences),
        'self_intro_analysis': analyze_self_intros(users),
        'anxiety_index': analyze_anxiety_index(users, payments),
        'match_success': analyze_match_success(matches)
    }
