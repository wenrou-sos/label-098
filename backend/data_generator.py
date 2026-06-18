import pandas as pd
import numpy as np
import random
import os
from datetime import datetime, timedelta

random.seed(42)
np.random.seed(42)

CITIES = {
    '一线': ['北京', '上海', '广州', '深圳'],
    '新一线': ['成都', '杭州', '重庆', '武汉', '西安', '苏州', '南京', '天津', '长沙', '郑州'],
    '二线': ['昆明', '大连', '厦门', '合肥', '佛山', '福州', '哈尔滨', '济南', '温州', '长春'],
    '三线': ['扬州', '洛阳', '临沂', '唐山', '镇江', '盐城', '湖州', '赣州', '泰州', '济宁']
}

EDUCATIONS = ['高中', '大专', '本科', '硕士', '博士']
INCOME_LEVELS = ['5k以下', '5k-10k', '10k-20k', '20k-50k', '50k以上']
HEIGHT_RANGES_MALE = [(160, 170), (165, 175), (170, 180), (175, 185), (180, 195)]
HEIGHT_RANGES_FEMALE = [(150, 160), (155, 165), (160, 170), (165, 175), (170, 180)]

MALE_INTROS = [
    '性格开朗阳光，喜欢运动健身，周末常去打篮球。希望找一个经济独立、性格好的伴侣，一起享受生活。工作稳定，有房有车，希望能早日成家。',
    '本人性格沉稳内敛，从事互联网行业，年收入可观。爱好摄影和旅行，希望遇到一个温柔贤惠、懂得生活的另一半。性格好、三观合最重要。',
    '外向型人格，朋友众多，热爱生活。希望对方经济独立、有自己的事业和追求。相信两个人在一起是互相成就，而不是单方面依附。',
    '工程师一枚，理性思维但也有浪漫情怀。喜欢阅读、看电影、做饭。希望找一个性格好、善解人意的女生，外貌不是最重要的，内涵才是。',
    '自主创业中，事业小有成就。工作之余喜欢健身、游泳、自驾游。希望另一半性格好、通情达理，支持我的事业，一起规划美好未来。',
    '普通上班族，生活简单规律。喜欢打游戏、看球赛、偶尔和朋友小聚。希望找一个性格好、能聊得来的人，经济上互相扶持就好。',
    '海归硕士，在金融行业工作。平时喜欢听古典音乐、品红酒、打高尔夫。希望对方经济独立、有良好的教育背景和生活品味。',
    '身高180，体型匀称，颜值中等偏上吧。做销售工作，收入还不错。希望另一半性格开朗、经济独立，两个人一起努力，生活会越来越好。',
    '热爱生活的文艺青年，喜欢写作、绘画、音乐。有自己的独立工作室。希望找一个性格好、有共同语言、能互相欣赏的伴侣。',
    '外科医生，工作比较忙但收入稳定。希望对方理解我的工作，性格温柔、家庭观念重。经济上我可以承担，但希望你有自己的追求。'
]

FEMALE_INTROS = [
    '性格温柔善良，喜欢烹饪和烘焙。希望找一个有上进心、顾家的男生，不需要你多有钱，但一定要有责任感和担当。',
    '硕士学历，大学教师，工作稳定。喜欢看书、练瑜伽、插花。希望对方有上进心、学历相当、人品好，一起经营温馨的小家。',
    '独立自强的女生，有自己的事业和朋友圈。希望男生有上进心、有能力、性格成熟稳重。不接受妈宝男和大男子主义。',
    '长相清秀，性格偏内向慢热。做财务工作，细心踏实。希望对方顾家、体贴、有稳定的工作和收入，对未来有规划。',
    '性格活泼开朗，爱笑爱闹。喜欢旅行、美食、拍照。希望另一半有上进心、幽默风趣，能陪我一起探索世界，享受生活。',
    '离异不带娃，经历过一次失败的婚姻更懂得珍惜。希望找一个顾家、有责任心、懂得疼人的成熟男性，真心换真心。',
    '设计师工作，审美在线，热爱生活的仪式感。希望男生有上进心、有品味、身高175以上。两个人一起把日子过成诗。',
    '独生子女，父母都是体制内，家庭条件尚可。希望对方家庭和睦、有上进心、人品端正。性格好、聊得来比什么都重要。',
    '热爱运动的女生，坚持跑步和健身多年。希望你也有健康的生活习惯，有上进心、不抽烟酗酒。一起健身、一起变更好。',
    '文艺女青年，喜欢音乐、电影、话剧。希望找一个顾家、有内涵、能懂我的另一半。三观契合、灵魂有趣比物质更重要。'
]

CITY_FLATTENED = []
for tier, city_list in CITIES.items():
    for city in city_list:
        CITY_FLATTENED.append((city, tier))

def generate_user(user_id):
    gender = np.random.choice(['男', '女'], p=[0.48, 0.52])
    
    city, city_tier = random.choice(CITY_FLATTENED)
    
    if gender == '男':
        age = int(np.random.normal(30, 5))
        age = max(22, min(50, age))
        height_idx = np.random.choice(len(HEIGHT_RANGES_MALE), p=[0.15, 0.3, 0.35, 0.15, 0.05])
        h_low, h_high = HEIGHT_RANGES_MALE[height_idx]
        height = random.randint(h_low, h_high)
        income_idx = np.random.choice(len(INCOME_LEVELS), p=[0.1, 0.25, 0.35, 0.2, 0.1])
    else:
        age = int(np.random.normal(28, 4.5))
        age = max(20, min(48, age))
        height_idx = np.random.choice(len(HEIGHT_RANGES_FEMALE), p=[0.15, 0.35, 0.35, 0.1, 0.05])
        h_low, h_high = HEIGHT_RANGES_FEMALE[height_idx]
        height = random.randint(h_low, h_high)
        income_idx = np.random.choice(len(INCOME_LEVELS), p=[0.15, 0.3, 0.35, 0.15, 0.05])
    
    education_idx = np.random.choice(len(EDUCATIONS), p=[0.1, 0.2, 0.45, 0.2, 0.05])
    education = EDUCATIONS[education_idx]
    income = INCOME_LEVELS[income_idx]
    
    property_choices = ['有房无贷', '有房有贷', '无房', '与父母同住']
    if city_tier == '一线':
        has_property = np.random.choice(property_choices, p=[0.1, 0.25, 0.5, 0.15])
    elif city_tier == '新一线':
        has_property = np.random.choice(property_choices, p=[0.2, 0.35, 0.3, 0.15])
    elif city_tier == '二线':
        has_property = np.random.choice(property_choices, p=[0.3, 0.35, 0.2, 0.15])
    else:
        has_property = np.random.choice(property_choices, p=[0.4, 0.3, 0.15, 0.15])
    
    intro = random.choice(MALE_INTROS if gender == '男' else FEMALE_INTROS)
    
    return {
        'user_id': f'U{user_id:06d}',
        'city': city,
        'city_tier': city_tier,
        'gender': gender,
        'age': age,
        'education': education,
        'income': income,
        'property': has_property,
        'height': height,
        'self_intro': intro
    }

def generate_preference(user):
    age_diff = np.random.normal(2 if user['gender'] == '女' else -2, 2)
    min_age = max(18, int(user['age'] + age_diff - 5))
    max_age = min(60, int(user['age'] + age_diff + 5))
    
    req_education = None
    req_income = None
    req_property = None
    req_height = None
    
    age_group = get_age_group(user['age'])
    age_factor = {'20-25': 0.3, '26-30': 0.5, '31-35': 0.65, '36-40': 0.55, '40+': 0.45}
    factor = age_factor.get(age_group, 0.5)
    
    gender_factor = 1.3 if user['gender'] == '女' else 0.7
    
    if random.random() < 0.75 * factor * gender_factor:
        edu_ranks = {e: i for i, e in enumerate(EDUCATIONS)}
        user_edu_rank = edu_ranks[user['education']]
        if user['gender'] == '女':
            min_edu_rank = max(0, user_edu_rank - 1)
        else:
            min_edu_rank = max(0, user_edu_rank - 2)
        req_education = EDUCATIONS[min_edu_rank]
    
    if random.random() < 0.7 * factor * gender_factor:
        income_ranks = {e: i for i, e in enumerate(INCOME_LEVELS)}
        user_income_rank = income_ranks[user['income']]
        if user['gender'] == '女':
            min_income_rank = min(len(INCOME_LEVELS)-1, max(0, user_income_rank))
        else:
            min_income_rank = max(0, user_income_rank - 1)
        req_income = INCOME_LEVELS[min_income_rank]
    
    if random.random() < 0.6 * factor * gender_factor:
        req_property = np.random.choice(['有房(含贷款)', '不限'], p=[0.7, 0.3])
    
    if random.random() < 0.65 * factor:
        if user['gender'] == '女':
            req_height = random.randint(170, 180)
        else:
            req_height = random.randint(155, 165)
    
    return {
        'user_id': user['user_id'],
        'pref_min_age': min_age,
        'pref_max_age': max_age,
        'req_education': req_education,
        'req_income': req_income,
        'req_property': req_property,
        'req_height': req_height
    }

def generate_payment(user):
    base_prob = {'一线': 0.6, '新一线': 0.5, '二线': 0.4, '三线': 0.3}
    gender_p = {'男': 1.5, '女': 0.6}
    age_p = get_age_payment_factor(user['age'])
    
    paid = random.random() < base_prob.get(user['city_tier'], 0.4) * gender_p[user['gender']] * age_p
    
    if not paid:
        return {
            'user_id': user['user_id'],
            'is_paid': False,
            'vip_level': '免费',
            'total_spent': 0,
            'purchase_times': 0
        }
    
    vip_levels = ['月度会员', '季度会员', '年度会员', '钻石会员', '定制服务']
    level_weights = [0.4, 0.3, 0.18, 0.08, 0.04]
    vip = np.random.choice(vip_levels, p=level_weights)
    
    prices = {'月度会员': 99, '季度会员': 268, '年度会员': 888, '钻石会员': 2999, '定制服务': 9999}
    base_price = prices[vip]
    purchase_times = np.random.geometric(0.6) if vip in ['月度会员', '季度会员'] else 1
    total = int(base_price * purchase_times * (0.9 + random.random() * 0.3))
    
    return {
        'user_id': user['user_id'],
        'is_paid': True,
        'vip_level': vip,
        'total_spent': total,
        'purchase_times': purchase_times
    }

def get_age_group(age):
    if 20 <= age <= 25: return '20-25'
    elif 26 <= age <= 30: return '26-30'
    elif 31 <= age <= 35: return '31-35'
    elif 36 <= age <= 40: return '36-40'
    else: return '40+'

def get_age_payment_factor(age):
    if 20 <= age <= 25: return 0.7
    elif 26 <= age <= 30: return 1.2
    elif 31 <= age <= 35: return 1.4
    elif 36 <= age <= 40: return 1.1
    else: return 0.8

def generate_matches(users_df, count=3000):
    matches = []
    users_male = users_df[users_df['gender'] == '男'].copy()
    users_female = users_df[users_df['gender'] == '女'].copy()
    
    for i in range(count):
        m = users_male.sample(n=1).iloc[0]
        f = users_female.sample(n=1).iloc[0]
        
        age_diff = abs(m['age'] - f['age'])
        edu_ranks = {e: i for i, e in enumerate(EDUCATIONS)}
        edu_diff = abs(edu_ranks[m['education']] - edu_ranks[f['education']])
        income_ranks = {e: i for i, e in enumerate(INCOME_LEVELS)}
        income_diff = abs(income_ranks[m['income']] - income_ranks[f['income']])
        
        score = 1.0
        if age_diff <= 3: score *= 2.0
        elif age_diff <= 5: score *= 1.5
        if edu_diff <= 1: score *= 1.8
        if income_diff <= 1: score *= 1.5
        
        if random.random() < 0.3 * score:
            match_days = np.random.randint(1, 365)
            match_date = (datetime.now() - timedelta(days=match_days)).strftime('%Y-%m-%d')
            success = random.random() < 0.35
            
            matches.append({
                'match_id': f'M{i:06d}',
                'male_id': m['user_id'],
                'female_id': f['user_id'],
                'male_age': m['age'],
                'female_age': f['age'],
                'age_diff': m['age'] - f['age'],
                'male_education': m['education'],
                'female_education': f['education'],
                'education_diff': edu_ranks[m['education']] - edu_ranks[f['education']],
                'male_income': m['income'],
                'female_income': f['income'],
                'income_diff': income_ranks[m['income']] - income_ranks[f['income']],
                'match_date': match_date,
                'is_success': success
            })
    
    return pd.DataFrame(matches)

def main():
    print("正在生成模拟数据...")
    os.makedirs('../data', exist_ok=True)
    
    n_users = 50000
    print(f"生成 {n_users} 条用户数据...")
    users = [generate_user(i+1) for i in range(n_users)]
    users_df = pd.DataFrame(users)
    users_df.to_csv('../data/users.csv', index=False, encoding='utf-8-sig')
    print(f"✅ 用户数据已保存: {len(users_df)} 条")
    
    print("生成择偶偏好数据...")
    preferences = [generate_preference(u) for u in users]
    pref_df = pd.DataFrame(preferences)
    pref_df.to_csv('../data/preferences.csv', index=False, encoding='utf-8-sig')
    print(f"✅ 择偶偏好数据已保存: {len(pref_df)} 条")
    
    print("生成付费行为数据...")
    payments = [generate_payment(u) for u in users]
    pay_df = pd.DataFrame(payments)
    pay_df.to_csv('../data/payments.csv', index=False, encoding='utf-8-sig')
    print(f"✅ 付费数据已保存: {len(pay_df)} 条")
    
    print("生成匹配记录数据...")
    matches_df = generate_matches(users_df, count=15000)
    matches_df.to_csv('../data/matches.csv', index=False, encoding='utf-8-sig')
    print(f"✅ 匹配记录已保存: {len(matches_df)} 条")
    
    print("\n📊 数据概览:")
    print(f"  - 用户总数: {len(users_df)}")
    print(f"  - 男性: {len(users_df[users_df['gender']=='男'])}, 女性: {len(users_df[users_df['gender']=='女'])}")
    print(f"  - 城市数: {users_df['city'].nunique()}")
    print(f"  - 付费用户数: {len(pay_df[pay_df['is_paid']])}")
    print(f"  - 成功匹配数: {len(matches_df[matches_df['is_success']])}")

if __name__ == '__main__':
    main()
