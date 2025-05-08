import os
import json
import bcrypt
import jwt
import datetime
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

# Environment variables
MONGO_URI = os.environ.get('MONGO_URI')
JWT_SECRET = os.environ.get('JWT_SECRET', 'changeme')

# Lazy MongoDB client (reused across invocations)
client = None
users = None
token_blacklist = None

def connect_to_mongo():
    global client, users, token_blacklist
    if not client:
        client = MongoClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=False)
        db = client['authDB']
        users = db['users']
        token_blacklist = db['token_blacklist']
        users.create_index('email', unique=True)
        token_blacklist.create_index('token', unique=True)
        # Add expiration index for automatic cleanup
        token_blacklist.create_index('expiry', expireAfterSeconds=0)

def response(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*'
        },
        'body': json.dumps(body)
    }

def generate_jwt(payload):
    expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    return jwt.encode(
        {**payload, 'exp': expiry},
        JWT_SECRET,
        algorithm='HS256'
    ), expiry

def login(event):
    connect_to_mongo()
    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        password = body.get('password')
        if not email or not password:
            return response(400, {'message': 'Missing email or password'})

        user = users.find_one({'email': email})
        if not user or not bcrypt.checkpw(password.encode(), user['password']):
            return response(401, {'message': 'Invalid credentials'})

        token, expiry = generate_jwt({'email': email})
        return response(200, {'token': token})

    except Exception as e:
        return response(500, {'error': str(e)})

def register(event):
    connect_to_mongo()
    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        password = body.get('password')
        if not email or not password:
            return response(400, {'message': 'Email and password required'})

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        users.insert_one({'email': email, 'password': hashed})
        return response(201, {'message': 'User registered'})
    except DuplicateKeyError:
        return response(400, {'message': 'User already exists'})
    except Exception as e:
        return response(500, {'error': str(e)})

def logout(event):
    connect_to_mongo()
    try:
        # First try to get token from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        token = None
        
        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
        else:
            # Try to get token from request body if not in header
            try:
                body = json.loads(event.get('body', '{}'))
                token = body.get('token')
            except:
                pass
        
        # If still no token, try to get it from query parameters
        if not token:
            query_params = event.get('queryStringParameters', {}) or {}
            token = query_params.get('token')
            
        if not token:
            # No token provided in any form
            return response(200, {'message': 'No token provided, nothing to invalidate'})
        
        try:
            # Verify the token is valid before blacklisting
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            
            # Add token to blacklist with expiration
            expiry = datetime.datetime.fromtimestamp(payload['exp'])
            token_blacklist.insert_one({
                'token': token,
                'email': payload['email'],
                'expiry': expiry
            })
            
            return response(200, {'message': 'Logged out successfully'})
        except jwt.PyJWTError:
            # Token is invalid, no need to blacklist
            return response(200, {'message': 'Token already invalid or expired'})
            
    except DuplicateKeyError:
        # Token already blacklisted
        return response(200, {'message': 'Already logged out'})
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return response(200, {'message': 'Logout processed'})

def health(_event):
    return response(200, {'status': 'Auth OK'})

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method')
    path = event.get('rawPath')
    
    if method == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            }
        }

    if method == 'GET' and path == '/api/health':
        return health(event)
    if method == 'POST' and path in ['/api/users', '/api/users/register']:
        return register(event)
    elif method == 'POST' and path in ['/api/users/login', '/api/users/auth']:
        return login(event)
    elif method == 'POST' and path == '/api/users/logout':
        return logout(event)
    else:
        return response(404, {'message': f'Not Found: {path}'}) 