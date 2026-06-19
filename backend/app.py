from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

app = Flask(__name__)
CORS(app)

data_cache = None
data_loaded = False

def ensure_data():
    global data_cache, data_loaded
    if not data_loaded:
        data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'users.csv')
        if not os.path.exists(data_path):
            from data_generator import main as gen_main
            gen_main()
        from analyzer import run_all_analysis
        data_cache = run_all_analysis()
        data_loaded = True
    return data_cache

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': '婚恋市场数据分析看板后端服务运行正常'})

@app.route('/api/regenerate', methods=['POST'])
def regenerate_data():
    global data_cache, data_loaded
    try:
        data_loaded = False
        import importlib
        import data_generator
        importlib.reload(data_generator)
        data_generator.main()
        import analyzer
        importlib.reload(analyzer)
        data_cache = analyzer.run_all_analysis()
        data_loaded = True
        return jsonify({'status': 'success', 'message': '数据重新生成并分析完成'})
    except Exception as e:
        data_loaded = False
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/summary')
def get_summary():
    data = ensure_data()
    return jsonify(data['summary'])

@app.route('/api/city-demographics')
def get_city_demographics():
    data = ensure_data()
    city = request.args.get('city')
    if city and city in data['city_demographics']:
        return jsonify({city: data['city_demographics'][city]})
    return jsonify(data['city_demographics'])

@app.route('/api/preference-differences')
def get_preference_differences():
    data = ensure_data()
    return jsonify(data['preference_differences'])

@app.route('/api/self-intro-analysis')
def get_self_intro_analysis():
    data = ensure_data()
    return jsonify(data['self_intro_analysis'])

@app.route('/api/anxiety-index')
def get_anxiety_index():
    data = ensure_data()
    return jsonify(data['anxiety_index'])

@app.route('/api/match-success')
def get_match_success():
    data = ensure_data()
    return jsonify(data['match_success'])

@app.route('/api/all-data')
def get_all_data():
    tier = request.args.get('tier')
    age_group = request.args.get('age_group')
    gender = request.args.get('gender')
    
    has_filter = tier or age_group or gender
    
    if has_filter:
        from analyzer import run_all_analysis
        data = run_all_analysis(
            tier=tier if tier else None,
            age_group=age_group if age_group else None,
            gender=gender if gender else None
        )
        return jsonify(data)
    else:
        data = ensure_data()
        return jsonify(data)

@app.route('/api/cities')
def get_cities():
    from analyzer import get_city_list
    cities = get_city_list()
    return jsonify({'cities': cities})

@app.route('/api/match-recommendations')
def get_match_recs():
    from analyzer import get_match_recommendations
    city = request.args.get('city')
    target_gender = request.args.get('gender', '男')
    min_age = int(request.args.get('min_age', 20))
    max_age = int(request.args.get('max_age', 35))
    min_education = request.args.get('education')
    top_n = int(request.args.get('top_n', 20))
    
    if not city:
        return jsonify({'error': '缺少城市参数'}), 400
    
    from analyzer import sanitize_for_json
    result = get_match_recommendations(
        city=city,
        target_gender=target_gender,
        min_age=min_age,
        max_age=max_age,
        min_education=min_education if min_education else None,
        top_n=top_n
    )
    return jsonify(sanitize_for_json(result))

if __name__ == '__main__':
    print("🚀 启动婚恋市场数据分析看板后端服务...")
    print("📊 正在加载和分析数据...")
    ensure_data()
    print("✅ 数据加载完成")
    print("🌐 服务地址: http://localhost:5000")
    app.run(debug=False, host='0.0.0.0', port=5000)
