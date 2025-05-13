
"""
Fetch model update links, published dates, and short summaries for frontier models.
Usage:
    python model_updates_scraper.py --days 7 --max 5
"""
import argparse
import feedparser
from urllib.parse import quote_plus
import datetime
import time
import re
import sys
import os
from psycopg2.extras import execute_values
import psycopg2

def clean_summary(html_text):
    # Strip HTML tags and collapse to first sentence
    text = re.sub('<[^<]+?>', '', html_text or '')
    parts = text.strip().split('. ')
    return (parts[0] + '.') if parts and parts[0] else text

def get_models_from_db(conn):
    """Fetch models from frontier_models table"""
    cur = conn.cursor()
    cur.execute("SELECT id, name, provider FROM frontier_models")
    models = cur.fetchall()
    cur.close()
    return models

def scrape_model_updates(conn, days=1, max_results=5):
    print("[DEBUG] Fetching models from database", file=sys.stderr)
    models = get_models_from_db(conn)
    print(f"[DEBUG] Found {len(models)} models", file=sys.stderr)
    
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    print(f"[DEBUG] Using cutoff: {cutoff.isoformat()}", file=sys.stderr)

    results = []
    for model_id, model_name, provider in models:
        print(f"[DEBUG] Processing model '{model_name}'...", file=sys.stderr)
        model_count = 0
        for update_type, phrase in [
            ('security', 'security incident vulnerability safety privacy'),
            ('feature', 'feature update capability release')
        ]:
            print(f"[DEBUG]  Type: {update_type}", file=sys.stderr)
            search_term = f"{model_name} {provider} AI {phrase}"
            rss_url = f"https://news.google.com/rss/search?q={quote_plus(search_term)}"
            print(f"[DEBUG]   Fetching RSS: {rss_url}", file=sys.stderr)
            feed = feedparser.parse(rss_url)
            print(f"[DEBUG]   Entries fetched: {len(feed.entries)}", file=sys.stderr)
            
            count = 0
            for e in feed.entries:
                if not getattr(e, 'published_parsed', None):
                    continue
                published = datetime.datetime.fromtimestamp(
                    time.mktime(e.published_parsed), tz=datetime.timezone.utc
                )
                if published < cutoff:
                    continue
                description = clean_summary(getattr(e, 'summary', '') or getattr(e, 'description', ''))
                results.append({
                    'frontier_model_id': model_id,
                    'title': e.title,
                    'description': description,
                    'update_type': update_type,
                    'source_url': e.link,
                    'update_date': published
                })
                count += 1
                model_count += 1
                if count >= max_results:
                    break
            print(f"[DEBUG]   Added {count} items for {model_name}/{update_type}", file=sys.stderr)
        print(f"[DEBUG] Total items for model '{model_name}': {model_count}\n", file=sys.stderr)
    return results

def insert_into_db(conn, records):
    if not records:
        return 0
        
    print(f"[DEBUG] Inserting {len(records)} records to DB", file=sys.stderr)
    cur = conn.cursor()
    
    # Convert records to list of tuples matching table columns
    values = [(
        r['frontier_model_id'],
        r['title'],
        r['description'],
        r['update_type'],
        r['source_url'],
        r['update_date']
    ) for r in records]
    
    sql = """
        INSERT INTO frontier_model_updates 
        (frontier_model_id, title, description, update_type, source_url, update_date)
        VALUES %s
        ON CONFLICT (source_url) DO UPDATE SET 
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            update_type = EXCLUDED.update_type,
            update_date = EXCLUDED.update_date
    """
    
    execute_values(cur, sql, values)
    conn.commit()
    print(f"[DEBUG] Commit successful", file=sys.stderr)
    cur.close()
    return len(records)

def main():
    p = argparse.ArgumentParser("Scrape and load frontier model updates into database")
    p.add_argument('-d','--days', type=int, default=7)
    p.add_argument('-n','--max', type=int, default=5)
    args = p.parse_args()

    # Use DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(database_url)
    try:
        records = scrape_model_updates(conn, days=args.days, max_results=args.max)
        if records:
            count = insert_into_db(conn, records)
            print(f"Inserted/Updated {count} records.")
        else:
            print("No new records to insert.")
    finally:
        conn.close()

if __name__ == '__main__':
    main()
