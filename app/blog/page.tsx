import Link from "next/link";
import CardNav from "@/components/CardNav";
import logo from "@/public/icon.svg";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export const revalidate = 60;

type PostListItem = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  mainImage?: SanityImageSource;
  author?: { name?: string } | null;
  categories?: { title: string }[];
};

export default async function BlogIndexPage() {
  const posts = await client.fetch<PostListItem[]>(
    `*[_type == "post"]|order(publishedAt desc){
      _id,
      title,
      slug,
      publishedAt,
      mainImage,
      author->{name},
      categories[]-> { title }
    }`
  );

  return (
    <div
      className="relative min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.14)), url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <CardNav
        logo={logo}
        logoAlt="TradingAgents"
        appName="TradingAgents"
        topLinks={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Contact", href: "#contact" }
        ]}
        items={[
          {
            label: "About",
            bgColor: "#0D0716",
            textColor: "#fff",
            links: [
              { label: "Company", ariaLabel: "About Company", href: "#" },
              { label: "Careers", ariaLabel: "About Careers", href: "#" },
            ],
          },
          {
            label: "Projects",
            bgColor: "#170D27",
            textColor: "#fff",
            links: [
              { label: "Featured", ariaLabel: "Featured Projects", href: "#" },
              { label: "Case Studies", ariaLabel: "Project Case Studies", href: "#" },
            ],
          },
          {
            label: "Contact",
            bgColor: "#271E37",
            textColor: "#fff",
            links: [
              { label: "Email", ariaLabel: "Email us", href: "#" },
              { label: "Twitter", ariaLabel: "Twitter", href: "#" },
              { label: "LinkedIn", ariaLabel: "LinkedIn", href: "#" },
            ],
          },
        ]}
        baseColor="rgba(255, 255, 255, 0.08)"
        menuColor="#fff"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        align="left"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 pt-32">
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Blog</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">最新文章列表</p>

          <div className="mt-6 grid grid-cols-1 gap-6">
            {posts.map((post) => {
              const href = `/blog/${post.slug?.current ?? post._id}`;
              const imgUrl = post.mainImage ? urlFor(post.mainImage).width(960).height(480).fit("crop").url() : undefined;
              const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "未发布";
              return (
                <Link key={post._id} href={href} className="group">
                  <article className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-4 hover:bg-white/80 hover:dark:bg-gray-800/70 transition-colors">
                    {imgUrl && (
                      // 使用原生 img，避免 next/image 的远程域配置
                      <img src={imgUrl} alt={post.title} className="mb-4 w-full h-56 object-cover rounded-lg" />
                    )}
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:underline">{post.title}</h2>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{date}</span>
                      {post.author?.name && <span className="ml-2">by {post.author.name}</span>}
                    </div>
                    {post.categories?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.categories.map((c) => (
                          <span key={c.title} className="text-xs rounded-full px-2 py-1 bg-gray-100/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-gray-600/60">
                            {c.title}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}