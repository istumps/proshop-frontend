import json
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from bson.json_util import dumps

# MongoDB connection
client = MongoClient(os.environ.get('MONGODB_URI', 'mongodb://localhost:27017'))
db = client['proshop']
products_collection = db['products']
orders_collection = db['orders']

def build_response(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*'
        },
        'body': json.dumps(body) if not isinstance(body, str) else body
    }

def extract_oid(id_field):
    if isinstance(id_field, dict) and '$oid' in id_field:
        return id_field['$oid']
    return id_field

def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method')
    path = event.get('rawPath', '')
    body = json.loads(event.get('body', '{}'))

    if method == 'OPTIONS':
        return build_response(200, {})

    try:
        if method == 'POST' and '/orders' in path:
            order_items = body.get('orderItems', [])
            shipping_address = body.get('shippingAddress')
            payment_method = body.get('paymentMethod')

            if not order_items:
                return build_response(400, {'message': 'No order items'})

            # Get fresh prices from DB
            product_ids = [ObjectId(extract_oid(item['_id'])) for item in order_items]
            db_products = list(products_collection.find({'_id': {'$in': product_ids}}))

            db_items = []
            for item in order_items:
                db_item = next((p for p in db_products if str(p['_id']) == extract_oid(item['_id'])), None)
                if not db_item:
                    return build_response(404, {'message': f"Product {extract_oid(item['_id'])} not found"})
                db_items.append({
                    'name': item['name'],
                    'qty': item['qty'],
                    'price': db_item['price'],
                    'product': extract_oid(item['_id'])
                })

            items_price = sum(item['qty'] * item['price'] for item in db_items)
            tax_price = round(items_price * 0.15, 2)
            shipping_price = 10 if items_price < 100 else 0
            total_price = round(items_price + tax_price + shipping_price, 2)

            # Simulate user ID (in real case, parse from JWT)
            user_id = body.get('userId', 'demo-user')

            order = {
                'orderItems': db_items,
                'user': user_id,
                'shippingAddress': shipping_address,
                'paymentMethod': payment_method,
                'itemsPrice': items_price,
                'taxPrice': tax_price,
                'shippingPrice': shipping_price,
                'totalPrice': total_price,
                'isPaid': False,
                'createdAt': datetime.utcnow()
            }

            result = orders_collection.insert_one(order)
            new_order = orders_collection.find_one({'_id': result.inserted_id})
            return build_response(201, dumps(new_order))

        return build_response(404, {'message': 'Route not found'})

    except Exception as e:
        return build_response(500, {'message': str(e)}) 