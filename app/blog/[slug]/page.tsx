import { notFound } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export const revalidate = 60;

type PortableTextChild = { text?: string };
type PortableTextBlock = { children?: PortableTextChild[] };

type PostDetail = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  mainImage?: SanityImageSource;
  author?: { name?: string } | null;
  categories?: { title: string }[];
  body?: PortableTextBlock[];
};

export default async function BlogDetailPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const data = await client.fetch<PostDetail>(
    `*[_type == "post" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      publishedAt,
      mainImage,
      author->{name},
      categories[]-> { title },
      body
    }`,
    { slug: params.slug }
  );

  if (!data?._id) return notFound();

  const date = data.publishedAt ? new Date(data.publishedAt).toLocaleDateString() : "未发布";
  const imgUrl = data.mainImage ? urlFor(data.mainImage).width(1200).height(600).fit("crop").url() : undefined;
  const bodyText = Array.isArray(data.body)
    ? data.body
        .map((b: PortableTextBlock) => (Array.isArray(b?.children) ? b.children.map((c: PortableTextChild) => c.text ?? "").join("") : ""))
        .join("\n\n")
    : "";

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
      <SiteNav />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10 pt-32">
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm p-6 md:p-8">
          <Link href="/blog" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">← 返回列表</Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.title}</h1>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{date}</span>
            {data.author?.name && <span className="ml-2">by {data.author.name}</span>}
          </div>
          {data.categories?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.categories.map((c) => (
                <span key={c.title} className="text-xs rounded-full px-2 py-1 bg-gray-100/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-gray-600/60">
                  {c.title}
                </span>
              ))}
            </div>
          ) : null}

          {imgUrl && <img src={imgUrl} alt={data.title} className="mt-6 w-full h-72 object-cover rounded-lg" />}

          <article className="mt-6 prose dark:prose-invert max-w-none">
            {/* 将 Portable Text 简单转换为纯文本进行展示 */}
            <p className="whitespace-pre-line text-gray-800 dark:text-gray-100 leading-7">{bodyText}</p>
          </article>
        </div>
      </div>
    </div>
  );
}