from flask import Flask, Blueprint, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import secrets

# --- App & Extensions Initialization --------------------------------------
app = Flask(__name__)
# Configure your Postgres URI here
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/smart_locker_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Enable CORS for /api/*
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Blueprint for locker APIs
lockers_bp = Blueprint('lockers', __name__, url_prefix='/api/lockers')

# --- Models ---------------------------------------------------------------
class Locker(db.Model):
    __tablename__ = 'lockers'
    id = db.Column(db.String, primary_key=True)
    status = db.Column(db.Enum('open', 'closed', name='status_enum'), default='closed')
    otp = db.Column(db.String(6), nullable=True)
    otp_expires = db.Column(db.DateTime, nullable=True)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)

class Activity(db.Model):
    __tablename__ = 'activities'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    locker_id = db.Column(db.String, db.ForeignKey('lockers.id'), nullable=False)
    type = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    detail = db.Column(db.JSON, nullable=True)

# Create tables
with app.app_context():
    db.create_all()

# --- Helpers --------------------------------------------------------------
def now_utc():
    return datetime.utcnow()

# Generate a 6-digit OTP
def generate_6_digit_otp():
    return f"{secrets.randbelow(10**6):06}"

# --- Endpoints ------------------------------------------------------------
# List all lockers (admin view)
@lockers_bp.route('/', methods=['GET'])
def list_lockers():
    lockers = Locker.query.order_by(Locker.id).all()
    result = [
        {
            'locker_id': l.id,
            'status': l.status,
            'current_password': l.otp,
            'last_activity': l.last_activity.isoformat() + 'Z',
            'expires_at': l.otp_expires.isoformat() + 'Z' if l.otp_expires else None
        }
        for l in lockers
    ]
    return jsonify(result)

# Get a single locker status
@lockers_bp.route('/<locker_id>/status', methods=['GET'])
def get_status(locker_id):
    l = Locker.query.get_or_404(locker_id)
    return jsonify({
        'locker_id': l.id,
        'status': l.status,
        'current_password': l.otp,
        'last_activity': l.last_activity.isoformat() + 'Z'
    })

# Update locker open/closed status
@lockers_bp.route('/<locker_id>/status', methods=['POST'])
def post_status(locker_id):
    data = request.get_json() or {}
    status = data.get('status')
    timestamp = data.get('timestamp')
    if status not in ('open', 'closed'):
        return jsonify({'error': 'Invalid status value'}), 400
    l = Locker.query.get_or_404(locker_id)
    l.status = status
    l.last_activity = datetime.fromisoformat(timestamp.replace('Z','')) if timestamp else now_utc()
    db.session.add(Activity(
        locker_id=locker_id,
        type='status_update',
        timestamp=l.last_activity,
        detail={'status': status}
    ))
    db.session.commit()
    return ('', 204)

# Get current OTP for locker
t@lockers_bp.route('/<locker_id>/otp', methods=['GET'])
def get_otp(locker_id):
    l = Locker.query.get_or_404(locker_id)
    return jsonify({
        'locker_id': l.id,
        'otp': l.otp,
        'expires_at': l.otp_expires.isoformat() + 'Z' if l.otp_expires else None
    })

# Generate new OTP for locker
@lockers_bp.route('/<locker_id>/otp', methods=['POST'])
def post_otp(locker_id):
    l = Locker.query.get_or_404(locker_id)
    otp = generate_6_digit_otp()
    expires = now_utc() + timedelta(minutes=15)
    l.otp = otp
    l.otp_expires = expires
    l.last_activity = now_utc()
    db.session.add(l)
    db.session.add(Activity(
        locker_id=locker_id,
        type='otp_generated',
        detail={}
    ))
    db.session.commit()
    return jsonify({
        'locker_id': l.id,
        'otp': otp,
        'expires_at': expires.isoformat() + 'Z'
    }), 201)

# Record activity
def post_activity(locker_id):
    data = request.get_json() or {}
    activity_type = data.get('type')
    timestamp = data.get('timestamp')
    detail = data.get('detail', {})
    if activity_type not in ('opened','closed','otp_used','otp_failed','status_update','otp_generated'):
        return jsonify({'error': 'Invalid activity type'}), 400
    ts = datetime.fromisoformat(timestamp.replace('Z','')) if timestamp else now_utc()
    act = Activity(locker_id=locker_id, type=activity_type, timestamp=ts, detail=detail)
    db.session.add(act)
    db.session.commit()
    return ('', 204)

# Verify OTP
def verify_otp(locker_id):
    data = request.get_json() or {}
    entered = data.get('otp')
    l = Locker.query.get_or_404(locker_id)
    now = now_utc()
    if not l.otp or not l.otp_expires:
        return jsonify({'status': 'fail', 'message': 'No OTP set'}), 400
    if entered == l.otp and now < l.otp_expires:
        db.session.add(Activity(
            locker_id=locker_id,
            type='otp_used',
            detail={'entered_otp': entered, 'success': True}
        ))
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'OTP verified, unlock allowed'})
    else:
        db.session.add(Activity(
            locker_id=locker_id,
            type='otp_failed',
            detail={'entered_otp': entered, 'success': False}
        ))
        db.session.commit()
        return jsonify({'status': 'fail', 'message': 'Invalid or expired OTP'})

# Register routes
app.register_blueprint(lockers_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)







    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///smart_locker.db'
