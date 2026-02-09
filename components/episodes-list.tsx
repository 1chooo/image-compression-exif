import Link from "next/link"

const episodes = [
  { slug: "los-angeles-lakers", title: "Los Angeles Lakers", date: "2025.12.19" },
  { slug: "disneyland-70th-anniversary", title: "Disneyland's 70th Anniversary", date: "2025.12.17" },
  { slug: "usc", title: "USC", date: "2025.12.16" },
  { slug: "downtown-la", title: "Downtown LA", date: "2025.12.13" },
  { slug: "jioufen", title: "Jioufen", date: "2025.07.12" },
]

export function EpisodesList() {
  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <Link
          key={episode.slug}
          href={`/episodes/${episode.slug}`}
          className="group flex items-baseline gap-0 hover:opacity-70 transition-opacity duration-200"
        >
          <span className="text-foreground text-sm shrink-0">
            {episode.title}
          </span>
          <span className="dotted-leader" />
          <span className="text-foreground text-sm shrink-0 tabular-nums">
            {episode.date}
          </span>
        </Link>
      ))}
    </div>
  )
}
