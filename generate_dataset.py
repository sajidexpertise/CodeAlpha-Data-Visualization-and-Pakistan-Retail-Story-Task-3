"""Create the reproducible synthetic Pakistan retail dataset used by Task 3."""

from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "pakistan_retail_2023_2024.csv"
RNG = np.random.default_rng(42)

REGIONS = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad"]
REGION_WEIGHTS = np.array([28.1, 18.6, 11.4, 7.2, 7.1]) / 72.4
CATEGORIES = ["Electronics", "Fashion", "Home & Living", "Groceries", "Beauty & Personal Care", "Sports", "Others"]
CATEGORY_WEIGHTS = np.array([28, 18, 16, 14, 12, 7, 5]) / 100
CHANNELS = ["Online", "Mobile App", "In-Store", "Wholesale"]
CHANNEL_WEIGHTS = np.array([48, 20, 22, 10]) / 100
PAYMENTS = ["Card", "Easypaisa", "JazzCash", "Cash on Delivery"]


def make_year(year: int, orders: int, customers: int, target_revenue: float, margin: float) -> pd.DataFrame:
    dates = pd.to_datetime(f"{year}-01-01") + pd.to_timedelta(
        RNG.choice(365, orders, p=np.linspace(0.55, 1.55, 365) / np.linspace(0.55, 1.55, 365).sum()), unit="D"
    )
    category = RNG.choice(CATEGORIES, orders, p=CATEGORY_WEIGHTS)
    region = RNG.choice(REGIONS, orders, p=REGION_WEIGHTS)
    channel = RNG.choice(CHANNELS, orders, p=CHANNEL_WEIGHTS)
    base_price = {
        "Electronics": 48000, "Fashion": 15500, "Home & Living": 28000,
        "Groceries": 7500, "Beauty & Personal Care": 10500, "Sports": 18500, "Others": 12000,
    }
    quantity = RNG.integers(1, 5, orders)
    raw = np.array([base_price[c] for c in category]) * quantity * RNG.lognormal(0, 0.36, orders)
    # Iterative proportional fitting keeps the headline regional, category and
    # channel shares close to the visual story while preserving record detail.
    revenue = raw.copy()
    targets = [(region, REGIONS, REGION_WEIGHTS), (category, CATEGORIES, CATEGORY_WEIGHTS), (channel, CHANNELS, CHANNEL_WEIGHTS)]
    for _ in range(14):
        for labels, names, weights in targets:
            for name, weight in zip(names, weights):
                mask = labels == name
                revenue[mask] *= (revenue.sum() * weight) / revenue[mask].sum()
    revenue *= target_revenue / revenue.sum()
    cost_factor = np.clip(1 - margin + RNG.normal(0, 0.035, orders), 0.62, 0.93)
    cost = revenue * cost_factor
    # Normalize cost so the aggregate margin exactly matches the target.
    cost *= (target_revenue * (1 - margin)) / cost.sum()
    profit = revenue - cost
    customer_numbers = np.concatenate([np.arange(1, customers + 1), RNG.integers(1, customers + 1, orders - customers)])
    RNG.shuffle(customer_numbers)
    df = pd.DataFrame({
        "order_id": [f"PK-{year}-{i:05d}" for i in range(1, orders + 1)],
        "date": dates.strftime("%Y-%m-%d"),
        "customer_id": [f"C-{x:04d}" for x in customer_numbers],
        "region": region,
        "category": category,
        "channel": channel,
        "payment_method": RNG.choice(PAYMENTS, orders, p=[0.38, 0.23, 0.17, 0.22]),
        "quantity": quantity,
        "revenue_pkr": revenue.round(2),
        "cost_pkr": cost.round(2),
        "profit_pkr": profit.round(2),
        "returned": RNG.random(orders) < 0.034,
    })
    return df.sort_values("date")


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = pd.concat([
        make_year(2023, 2000, 769, 61_350_000, 0.182),
        make_year(2024, 2480, 892, 72_400_000, 0.218),
    ], ignore_index=True)
    data.to_csv(OUT, index=False)
    print(f"Created {OUT} with {len(data):,} rows")


if __name__ == "__main__":
    main()
