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
        media=dict(video="covers/reel/yap-feature.mp4", poster="covers/reel/yap-feature.jpg"),
        icon="project-app-icons/icon-yap.png",
    ),
    dict(
        slug="notate", name="Notate", url="notate", year="2026",
        tags=["Chrome extension", "In review"], filters=["shipped"],
        line="Notes pinned to the part of the page you noticed",
        featured_h2="Notes pinned to the exact part of the page you noticed.",
        proof="Built solo · In Chrome Web Store review",
        media=dict(video="notate-assets/notate-portfolio-motion/annotate.mp4",
                   poster="notate-assets/notate-portfolio-motion/annotate-poster.png"),
        icon="project-app-icons/icon-notate.png",
    ),
    dict(
        slug="instagram", name="Instagram Lists", url="instagram-lists", year="2025",
        tags=["Full process", "Platform"], filters=["social", "strategy"],
        line="Choosing whose posts you see first",
        featured_h2="Letting people choose whose posts their feed shows first.",
        proof="Solo · 7 weeks · 3 directions tested",
        media=dict(video="covers/reel/instagram.mp4", poster="covers/reel/instagram.jpg"),
        icon="project-app-icons/icon-instagram.png",
    ),
    dict(
        slug="smart-bundles", name="Smart Bundles", url="smart-bundles", year="2026",
        tags=["Strategy", "Amazon Fresh"], filters=["strategy"],
        line="Grocery bundles sized to what actually gets eaten",
        media=dict(video="covers/reel/smart-bundles.mp4", poster="covers/reel/smart-bundles.jpg"),
        icon="project-app-icons/icon-amazon.png",
    ),
    dict(
        slug="neuk", name="neuk", url="neuk", year="2025",
        tags=["Service design", "Brand"], filters=["social", "brand"],
        line="Making streaming social again",
        media=dict(video="covers/reel/neuk.mp4", poster="covers/reel/neuk.jpg"),
        icon="project-app-icons/icon-neuk.png",
    ),
    dict(
        slug="acuity", name="Acuity", url="acuity", year="2026",
        tags=["Health AI", "Wearable", "24-hr hackathon"], filters=["ai", "strategy"],
        line="An ecosystem for clarity before crisis",
        media=dict(video="covers/reel/acuity.mp4", poster="covers/reel/acuity.jpg"),
        icon="project-app-icons/icon-acuity.png",
    ),
    dict(
        slug="forage", name="Forage", url="forage", year="2026",
        tags=["Wearable", "Brand", "Paused"], filters=["ai", "brand"],
        line="Catching inspiration before it's gone",
        media=dict(image="covers/forage-cover.png"),
        icon="project-app-icons/icon-forage.png",
    ),
]

FEATURED = ["yap", "notate", "instagram"]

REEL = [  # home showreel segments, in order
    ("yap", "YAP", "covers/reel/yap.mp4", "covers/reel/yap.jpg"),
    ("notate", "NOTATE", "notate-assets/notate-portfolio-motion/annotate.mp4", "notate-assets/notate-portfolio-motion/annotate-poster.png"),
    ("instagram", "INSTAGRAM", "covers/reel/instagram.mp4", "covers/reel/instagram.jpg"),
    ("smart-bundles", "SMART BUNDLES", "covers/reel/smart-bundles.mp4", "covers/reel/smart-bundles.jpg"),
    ("neuk", "NEUK", "covers/reel/neuk.mp4", "covers/reel/neuk.jpg"),
    ("acuity", "ACUITY", "covers/reel/acuity.mp4", "covers/reel/acuity.jpg"),
]

FILTERS = [("all", "All"), ("ai", "AI"), ("shipped", "Shipped"), ("social", "Social"),
           ("strategy", "Strategy"), ("brand", "Brand + motion")]
