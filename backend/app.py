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
        from data_generator import main as gen_main
        gen_main()
        from analyzer import run_all_analysis
        data_cache = run_all_analysis()
        data_loaded = True
        return jsonify({'status': 'success', 'message': '数据重新生成并分析完成'})
    except Exception as e:
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
    data = ensure_data()
    return jsonify(data)

if __name__ == '__main__':
    print("🚀 启动婚恋市场数据分析看板后端服务...")
    print("📊 正在加载和分析数据...")
    ensure_data()
    print("✅ 数据加载完成")
    print("🌐 服务地址: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
