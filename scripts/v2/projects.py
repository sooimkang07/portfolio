"""One projects list for Home and Work, so card copy can't drift.

Edit copy here, then run:  python3 scripts/v2/build.py
"""

PROJECTS = [
    dict(
        slug="yap", name="yap", url="yap", year="2026",
        tags=["AI", "PWA", "Live beta"], filters=["ai", "shipped", "social"],
        line="Voice memos, split into topics you can reply to",
        featured_h2="Voice notes, split into topics friends can reply to one by one.",
        proof="Live beta · Designed and built end to end",
        media=dict(video="assets/covers/reel/yap-feature.mp4", poster="assets/covers/reel/yap-feature.jpg"),
        icon="assets/app-icons/icon-yap.png",
    ),
    dict(
        slug="notate", name="Notate", url="notate", year="2026",
        tags=["Chrome extension", "In review"], filters=["shipped"],
        line="Notes pinned to the part of the page you noticed",
        featured_h2="Notes pinned to the exact part of the page you noticed.",
        proof="Built solo · In Chrome Web Store review",
        media=dict(video="assets/notate/core-flows/unused/annotate.mp4",
                   poster="assets/notate/core-flows/unused/annotate-poster.png"),
        icon="assets/app-icons/icon-notate.png",
    ),
    dict(
        slug="instagram", name="Instagram Lists", url="instagram-lists", year="2025",
        tags=["Full process", "Platform"], filters=["social", "strategy"],
        line="Choosing whose posts you see first",
        featured_h2="Letting people choose whose posts their feed shows first.",
        proof="Solo · 7 weeks · 3 directions tested",
        media=dict(video="assets/covers/reel/instagram.mp4", poster="assets/covers/reel/instagram.jpg"),
        icon="assets/app-icons/icon-instagram.png",
    ),
    dict(
        slug="smart-bundles", name="Smart Bundles", url="smart-bundles", year="2026",
        tags=["Strategy", "Amazon Fresh"], filters=["strategy"],
        line="Grocery bundles sized to what actually gets eaten",
        media=dict(video="assets/covers/reel/smart-bundles.mp4", poster="assets/covers/reel/smart-bundles.jpg"),
        icon="assets/app-icons/icon-amazon.png",
    ),
    dict(
        slug="neuk", name="neuk", url="neuk", year="2025",
        tags=["Service design", "Brand"], filters=["social", "brand"],
        line="Making streaming social again",
        media=dict(video="assets/covers/reel/neuk.mp4", poster="assets/covers/reel/neuk.jpg"),
        icon="assets/app-icons/icon-neuk.png",
    ),
    dict(
        slug="acuity", name="Acuity", url="acuity", year="2026",
        tags=["Health AI", "Wearable", "24-hr hackathon"], filters=["ai", "strategy"],
        line="An ecosystem for clarity before crisis",
        media=dict(video="assets/covers/reel/acuity.mp4", poster="assets/covers/reel/acuity.jpg"),
        icon="assets/app-icons/icon-acuity.png",
    ),
    dict(
        slug="forage", name="Forage", url="forage", year="2026",
        tags=["Wearable", "Brand", "Paused"], filters=["ai", "brand"],
        line="Catching inspiration before it's gone",
        media=dict(image="assets/covers/forage-cover.png"),
        icon="assets/app-icons/icon-forage.png",
    ),
]

FEATURED = ["yap", "notate", "instagram"]

REEL = [  # home showreel segments, in order
    ("yap", "YAP", "assets/covers/reel/yap.mp4", "assets/covers/reel/yap.jpg"),
    ("notate", "NOTATE", "assets/notate/core-flows/unused/annotate.mp4", "assets/notate/core-flows/unused/annotate-poster.png"),
    ("instagram", "INSTAGRAM", "assets/covers/reel/instagram.mp4", "assets/covers/reel/instagram.jpg"),
    ("smart-bundles", "SMART BUNDLES", "assets/covers/reel/smart-bundles.mp4", "assets/covers/reel/smart-bundles.jpg"),
    ("neuk", "NEUK", "assets/covers/reel/neuk.mp4", "assets/covers/reel/neuk.jpg"),
    ("acuity", "ACUITY", "assets/covers/reel/acuity.mp4", "assets/covers/reel/acuity.jpg"),
]

FILTERS = [("all", "All"), ("ai", "AI"), ("shipped", "Shipped"), ("social", "Social"),
           ("strategy", "Strategy"), ("brand", "Brand + motion")]
