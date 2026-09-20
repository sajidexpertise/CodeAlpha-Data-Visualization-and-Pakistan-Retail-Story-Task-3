"""Generate portfolio-ready static charts with Pandas, Matplotlib and Seaborn."""

from pathlib import Path
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

ROOT = Path(__file__).resolve().parent
CSV = ROOT / "data" / "pakistan_retail_2023_2024.csv"
OUT = ROOT / "output"
COLORS = ["#087cf0", "#04ad83", "#f7b916", "#ff5c65", "#7b4de2", "#25b9d7", "#94a3b8"]


def main() -> None:
    OUT.mkdir(exist_ok=True)
    df = pd.read_csv(CSV, parse_dates=["date"])
    df = df[df.date.dt.year == 2024].copy()
    df["month"] = df.date.dt.month_name().str[:3]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    sns.set_theme(style="whitegrid", font_scale=1.05)

    monthly = df.groupby("month").revenue_pkr.sum().reindex(months) / 1e6
    fig, ax = plt.subplots(figsize=(12, 5.5))
    ax.plot(months, monthly, color=COLORS[0], marker="o", linewidth=3)
    ax.fill_between(months, monthly, color=COLORS[0], alpha=.16)
    ax.set(title="How Sales Moved Through 2024", ylabel="Revenue (PKR millions)", xlabel="")
    sns.despine()
    fig.tight_layout(); fig.savefig(OUT / "monthly_revenue.png", dpi=180); plt.close(fig)

    category = df.groupby("category").revenue_pkr.sum().sort_values() / 1e6
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(category.index, category.values, color=COLORS[:len(category)])
    ax.set(title="What Pakistan Bought", xlabel="Revenue (PKR millions)", ylabel="")
    sns.despine()
    fig.tight_layout(); fig.savefig(OUT / "category_revenue.png", dpi=180); plt.close(fig)

    region = df.groupby("region").revenue_pkr.sum().sort_values(ascending=False) / 1e6
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.barplot(x=region.index, y=region.values, palette=COLORS[:len(region)], ax=ax, hue=region.index, legend=False)
    ax.set(title="Where Growth Happened", ylabel="Revenue (PKR millions)", xlabel="")
    sns.despine()
    fig.tight_layout(); fig.savefig(OUT / "regional_revenue.png", dpi=180); plt.close(fig)

    fig, axes = plt.subplots(1, 3, figsize=(16, 5))
    axes[0].plot(months, monthly, color=COLORS[0], linewidth=3); axes[0].fill_between(months, monthly, color=COLORS[0], alpha=.18)
    axes[0].set_title("Monthly Revenue"); axes[0].tick_params(axis="x", rotation=45)
    axes[1].barh(category.index, category.values, color=COLORS[:len(category)]); axes[1].set_title("Category Revenue")
    axes[2].bar(region.index, region.values, color=COLORS[:len(region)]); axes[2].set_title("Regional Revenue"); axes[2].tick_params(axis="x", rotation=30)
    fig.suptitle("PRISM — Pakistan Retail Story | CodeAlpha Task 3", fontsize=17, fontweight="bold")
    fig.tight_layout(); fig.savefig(OUT / "visualization_report.png", dpi=180, bbox_inches="tight"); plt.close(fig)
    print(f"Saved visualizations to {OUT}")


if __name__ == "__main__":
    main()
