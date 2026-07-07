import json
import math
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    text = text.replace('Z', '+00:00')
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        pass
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def build_buckets(rows):
    dated_rows = []
    undated_rows = []
    for row in rows:
        parsed = parse_datetime(row.get('created_at'))
        if parsed:
            dated_rows.append((parsed, row))
        else:
            undated_rows.append(row)

    if dated_rows:
        grouped = defaultdict(float)
        for parsed, row in dated_rows:
            label = parsed.strftime('%b %Y')
            grouped[label] += float(row.get('amount') or 0)

        ordered = sorted(grouped.items(), key=lambda item: datetime.strptime(item[0], '%b %Y'))
        ordered = ordered[-12:]
        return [{'label': label, 'value': round(value, 3)} for label, value in ordered]

    last_rows = list(reversed(rows[:12]))
    return [
        {
            'label': f'Tx {index + 1}',
            'value': round(float(row.get('amount') or 0), 3),
        }
        for index, row in enumerate(last_rows)
    ]


def compute(payload):
    rows = [row for row in payload.get('rows', []) if (row.get('status') or '').lower() == 'success']
    rows.sort(key=lambda row: int(row.get('transaction_id') or 0), reverse=True)

    total_revenue = sum(float(row.get('amount') or 0) for row in rows)
    total_sales = len(rows)
    avg_price = total_revenue / total_sales if total_sales else 0.0
    active_buyers = len({row.get('buyer_id') for row in rows if row.get('buyer_id')})
    active_assets = len({row.get('product_id') for row in rows if row.get('product_id')})

    months = build_buckets(rows)
    top_bucket_value = max((bucket['value'] for bucket in months), default=0.0)

    recent = []
    for row in rows[:6]:
        recent.append(
            {
                'id': row.get('transaction_id') or row.get('product_id') or len(recent) + 1,
                'title': row.get('product_title') or 'Untitled Asset',
                'price': round(float(row.get('amount') or 0), 3),
                'status': row.get('status') or 'unknown',
                'buyer_name': row.get('buyer_name') or 'Unknown Buyer',
            }
        )

    return {
        'source': 'python',
        'scope': 'marketplace',
        'months': months,
        'smallStats': {
            'totalRevenue': round(total_revenue, 3),
            'totalSales': total_sales,
            'avgPrice': round(avg_price, 3),
            'topMonthValue': round(top_bucket_value, 3),
            'activeBuyers': active_buyers,
            'activeAssets': active_assets,
        },
        'recent': recent,
    }


def main():
    if len(sys.argv) < 2:
        raise SystemExit('usage: finance_analytics.py <payload.json>')

    payload_path = Path(sys.argv[1])
    payload = json.loads(payload_path.read_text(encoding='utf-8-sig'))
    result = compute(payload)
    print(json.dumps(result))


if __name__ == '__main__':
    main()
