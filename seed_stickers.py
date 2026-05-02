import csv
import sys

from dotenv import load_dotenv

from app import create_app
from app.extensions import db
from app.models import Sticker


def seed_from_csv(csv_path):
    load_dotenv()
    app = create_app()
    with app.app_context():
        with open(csv_path, newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            rows = list(reader)

        created = 0
        for row in rows:
            code = (row.get("code") or "").strip()
            team = (row.get("team") or "").strip()
            group = (row.get("group") or "").strip() or None
            name = (row.get("name") or "").strip() or None

            if not code or not team:
                continue

            if Sticker.query.filter_by(code=code).first():
                continue

            db.session.add(Sticker(code=code, team=team, group=group, name=name))
            created += 1

        db.session.commit()
        print(f"Criadas: {created}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python seed_stickers.py data/stickers_sample.csv")
        sys.exit(1)

    seed_from_csv(sys.argv[1])
