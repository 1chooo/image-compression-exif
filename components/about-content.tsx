import Link from "next/link"

export function AboutContent() {
  return (
    <article className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Lin Hugo</h1>

      <p className="text-sm leading-relaxed text-foreground">
        {"Hi, I'm Lin Hugo, a software builder and writer studying Computer Science at "}
        <a
          href="https://www.usc.edu/academics/viterbi/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
        >
          USC Viterbi
        </a>
        .
      </p>

      <p className="text-sm leading-relaxed text-foreground">
        While my professional work focuses on high-quality, large-scale software systems,
        my photography focuses on capturing the human touch in fleeting moments, using light
        and lines to construct my perspective.
      </p>

      <p className="text-sm leading-relaxed text-foreground">The philosophy I believe:</p>

      <blockquote className="border-l-2 border-muted-foreground/30 pl-4">
        <p className="text-sm leading-relaxed italic text-foreground/80 font-serif">
          You are too focused on the future without realizing that today is exactly what you
          prayed for years ago.
        </p>
      </blockquote>

      <p className="text-sm leading-relaxed text-foreground">
        {"See the world through my lens in my "}
        <Link
          href="/episodes"
          className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
        >
          episodes
        </Link>
        .
      </p>
    </article>
  )
}
