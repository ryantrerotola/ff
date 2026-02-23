import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed realistic fly fishing news articles so the news page isn't empty.
 * In production, the daily cron job at 4am scrapes live RSS feeds.
 */
async function main() {
  console.log("Seeding news articles...");

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  const articles = [
    {
      url: "https://www.hatchmag.com/articles/spring-runoff-forecast-2026",
      title: "Spring Runoff Forecast: What Western Anglers Need to Know for 2026",
      summary:
        "With a strong snowpack across the Rockies, this year's spring runoff is expected to be above average. We break down what that means for fishing conditions on key rivers from Montana to Colorado and when you can expect waters to clear.",
      sourceName: "Hatch Magazine",
      sourceUrl: "https://www.hatchmag.com",
      author: "Chris Hunt",
      imageUrl: null,
      publishedAt: daysAgo(0),
    },
    {
      url: "https://news.orvis.com/fly-fishing/guide-to-early-season-midges",
      title: "The Complete Guide to Early Season Midge Fishing",
      summary:
        "Midges are the most abundant insects in most trout streams and often the only game in town during late winter and early spring. Here's everything you need to know about matching these tiny but critical insects.",
      sourceName: "Orvis News",
      sourceUrl: "https://news.orvis.com",
      author: "Tom Rosenbauer",
      imageUrl: null,
      publishedAt: daysAgo(1),
    },
    {
      url: "https://midcurrent.com/conservation/epa-clean-water-act-trout-streams",
      title: "New EPA Ruling Strengthens Clean Water Act Protections for Trout Streams",
      summary:
        "A landmark ruling from the EPA expands Clean Water Act protections to include ephemeral streams and headwater tributaries — a major win for cold-water fisheries and the anglers who depend on them.",
      sourceName: "MidCurrent",
      sourceUrl: "https://midcurrent.com",
      author: "Marshall Cutchin",
      imageUrl: null,
      publishedAt: daysAgo(1),
    },
    {
      url: "https://www.flyfisherman.com/editorial/blue-winged-olive-hatch-guide",
      title: "Blue-Winged Olive Hatches: A Season-by-Season Guide",
      summary:
        "BWOs (Baetis) are arguably the most important mayflies for fly fishers. They hatch in spring, fall, and even winter on overcast days. Learn which patterns, presentations, and tactics work best for each season's hatch.",
      sourceName: "Fly Fisherman Magazine",
      sourceUrl: "https://www.flyfisherman.com",
      author: "Ross Purnell",
      imageUrl: null,
      publishedAt: daysAgo(2),
    },
    {
      url: "https://flylords.com/2026/02/fly-tying-renaissance-social-media",
      title: "The Fly Tying Renaissance: How Social Media Is Changing the Craft",
      summary:
        "Instagram, YouTube, and TikTok have sparked a new generation of fly tiers who are pushing creative boundaries. From hyper-realistic patterns to artistic expression, the craft is evolving faster than ever.",
      sourceName: "Fly Lords",
      sourceUrl: "https://flylords.com",
      author: "Alex Cerveniak",
      imageUrl: null,
      publishedAt: daysAgo(2),
    },
    {
      url: "https://www.ginkandgasoline.com/fly-fishing-tips/streamer-fishing-spring",
      title: "Streamer Fishing in Spring: Tactics for Pre-Runoff Trout",
      summary:
        "The weeks before spring runoff can produce some of the best streamer fishing of the year. Water temperatures are rising, trout are aggressive, and big fish are moving into feeding lies. Here's how to capitalize.",
      sourceName: "Gink & Gasoline",
      sourceUrl: "https://www.ginkandgasoline.com",
      author: "Louis Cahill",
      imageUrl: null,
      publishedAt: daysAgo(3),
    },
    {
      url: "https://www.tu.org/magazine/conservation/brook-trout-restoration-appalachians",
      title: "Brook Trout Restoration Efforts Show Promising Results in Southern Appalachians",
      summary:
        "After decades of habitat restoration work, native brook trout populations are rebounding in key watersheds across Virginia, North Carolina, and Tennessee. TU volunteers have restored over 200 miles of stream habitat.",
      sourceName: "Trout Unlimited",
      sourceUrl: "https://www.tu.org",
      author: "Trout Unlimited Staff",
      imageUrl: null,
      publishedAt: daysAgo(3),
    },
    {
      url: "https://www.hatchmag.com/articles/saltwater-fly-fishing-beginners-2026",
      title: "Getting Started in Saltwater Fly Fishing: The 2026 Beginner's Guide",
      summary:
        "Saltwater fly fishing is more accessible than ever. From redfish in Louisiana to bonefish in the Keys, we cover the gear, flies, and techniques you need to get started on the salt.",
      sourceName: "Hatch Magazine",
      sourceUrl: "https://www.hatchmag.com",
      author: "Kirk Deeter",
      imageUrl: null,
      publishedAt: daysAgo(4),
    },
    {
      url: "https://news.orvis.com/fly-fishing/euro-nymphing-gear-guide-2026",
      title: "Euro Nymphing Gear Guide: Rods, Lines, and Leaders for 2026",
      summary:
        "Euro nymphing continues to grow in popularity. We tested 12 new euro nymphing rods and break down the best leaders, tippet, and fly selections for competitive and recreational tight-line nymphing.",
      sourceName: "Orvis News",
      sourceUrl: "https://news.orvis.com",
      author: "George Daniel",
      imageUrl: null,
      publishedAt: daysAgo(4),
    },
    {
      url: "https://midcurrent.com/gear/best-fly-tying-vises-2026-review",
      title: "Best Fly Tying Vises of 2026: In-Depth Reviews and Comparisons",
      summary:
        "We spent three months testing 15 fly tying vises at every price point. From the $50 beginner options to the $600 rotary models, here are our top picks and why jaw quality matters more than you think.",
      sourceName: "MidCurrent",
      sourceUrl: "https://midcurrent.com",
      author: "MidCurrent Editors",
      imageUrl: null,
      publishedAt: daysAgo(5),
    },
    {
      url: "https://www.flyfisherman.com/editorial/tenkara-fly-fishing-growing-trend",
      title: "Tenkara: Why This Ancient Japanese Technique Is Gaining Western Devotees",
      summary:
        "Tenkara — the telescopic-rod, fixed-line Japanese fly fishing method — continues to win converts among Western anglers who value simplicity, efficiency, and a deeper connection with the stream.",
      sourceName: "Fly Fisherman Magazine",
      sourceUrl: "https://www.flyfisherman.com",
      author: "Daniel Galhardo",
      imageUrl: null,
      publishedAt: daysAgo(5),
    },
    {
      url: "https://www.hatchmag.com/articles/yellowstone-cutthroat-lake-trout-removal",
      title: "Yellowstone's Cutthroat Comeback: Lake Trout Removal Program Hits Milestone",
      summary:
        "The National Park Service's aggressive lake trout removal program in Yellowstone Lake has removed over 4.5 million invasive lake trout since 1994. Native Yellowstone cutthroat populations are responding with their strongest numbers in decades.",
      sourceName: "Hatch Magazine",
      sourceUrl: "https://www.hatchmag.com",
      author: "Todd Tanner",
      imageUrl: null,
      publishedAt: daysAgo(6),
    },
    {
      url: "https://flylords.com/2026/02/sustainable-fly-tying-materials",
      title: "Sustainable Fly Tying: Eco-Friendly Material Alternatives That Actually Work",
      summary:
        "From synthetic dubbing made from recycled plastics to ethically sourced feathers and biodegradable tippet, the fly fishing industry is embracing sustainability without sacrificing performance.",
      sourceName: "Fly Lords",
      sourceUrl: "https://flylords.com",
      author: "Maxine McCormick",
      imageUrl: null,
      publishedAt: daysAgo(7),
    },
    {
      url: "https://www.ginkandgasoline.com/fly-fishing-tips/reading-water-guide",
      title: "Reading Water Like a Guide: Where Trout Actually Hold and Why",
      summary:
        "Understanding where trout position themselves in a stream is the single biggest factor in catching more fish. We break down current seams, depth channels, structure, and how water temperature affects fish positioning.",
      sourceName: "Gink & Gasoline",
      sourceUrl: "https://www.ginkandgasoline.com",
      author: "Kent Klewein",
      imageUrl: null,
      publishedAt: daysAgo(7),
    },
    {
      url: "https://news.orvis.com/fly-fishing/women-in-fly-fishing-2026",
      title: "Women in Fly Fishing: Record Participation and a Changing Culture",
      summary:
        "Women now represent the fastest-growing demographic in fly fishing. From guiding to competitive casting to conservation leadership, women are reshaping the sport's culture and community.",
      sourceName: "Orvis News",
      sourceUrl: "https://news.orvis.com",
      author: "Hilary Hutcheson",
      imageUrl: null,
      publishedAt: daysAgo(8),
    },
    {
      url: "https://midcurrent.com/technique/sight-fishing-spring-creeks",
      title: "Sight Fishing on Spring Creeks: The Ultimate Technical Challenge",
      summary:
        "Spring creeks offer gin-clear water and ultra-selective trout that demand perfect presentations. Learn the stalking, casting, and fly selection techniques that will help you fool these educated fish.",
      sourceName: "MidCurrent",
      sourceUrl: "https://midcurrent.com",
      author: "John Juracek",
      imageUrl: null,
      publishedAt: daysAgo(9),
    },
    {
      url: "https://www.flyfisherman.com/editorial/fly-fishing-public-lands-access",
      title: "Public Lands and Water Access: The Ongoing Battle for Angler Rights",
      summary:
        "Access to public waterways remains one of the most contentious issues in fly fishing. We examine recent legal victories, ongoing battles, and what you can do to protect your right to fish.",
      sourceName: "Fly Fisherman Magazine",
      sourceUrl: "https://www.flyfisherman.com",
      author: "Charlie Meyers",
      imageUrl: null,
      publishedAt: daysAgo(10),
    },
    {
      url: "https://www.tu.org/magazine/fly-fishing/native-fish-conservation-2026",
      title: "Native Fish Conservation: Protecting Wild Trout in a Changing Climate",
      summary:
        "As water temperatures rise and habitats shift, protecting native trout species is more critical than ever. Learn about cold-water refuge projects, genetic conservation, and how anglers can help.",
      sourceName: "Trout Unlimited",
      sourceUrl: "https://www.tu.org",
      author: "Helen Neville",
      imageUrl: null,
      publishedAt: daysAgo(11),
    },
    {
      url: "https://www.hatchmag.com/articles/fly-fishing-film-tour-2026-review",
      title: "Fly Fishing Film Tour 2026: Reviews of This Year's Best Films",
      summary:
        "The F3T returns with its strongest lineup yet. From backcountry brook trout in Labrador to permit on the flats of Belize, this year's films celebrate the diversity and beauty of fly fishing worldwide.",
      sourceName: "Hatch Magazine",
      sourceUrl: "https://www.hatchmag.com",
      author: "Hatch Magazine Staff",
      imageUrl: null,
      publishedAt: daysAgo(12),
    },
    {
      url: "https://flylords.com/2026/02/top-spring-fly-patterns-2026",
      title: "Top 10 Spring Fly Patterns for 2026: What Guides Are Tying Now",
      summary:
        "We polled 50 guides across the West to find out which patterns they're stocking for spring. From Perdigons to Pat's Rubber Legs, here are the flies you need in your box right now.",
      sourceName: "Fly Lords",
      sourceUrl: "https://flylords.com",
      author: "Fly Lords Staff",
      imageUrl: null,
      publishedAt: daysAgo(13),
    },
  ];

  let created = 0;
  for (const article of articles) {
    try {
      await prisma.newsArticle.upsert({
        where: { url: article.url },
        update: {},
        create: article,
      });
      created++;
    } catch {
      // skip
    }
  }

  console.log(`Seeded ${created} news articles!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
