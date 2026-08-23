import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { allCategories, icons } from '@/lib/public';
import { categorySkills } from '@/lib/category-details';

export function generateStaticParams() {
  return allCategories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = allCategories.find((item) => item.slug === slug);
  const skills = categorySkills[slug];

  if (!category || !skills) notFound();

  const iconPath = icons[category.icon as keyof typeof icons];

  return (
    <div className="bg-mist">
      <section className="border-b border-hairline bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to categories
          </Link>
          <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={iconPath} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">{category.type} services</p>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight text-primary! md:text-5xl">{category.name}</h1>
              <p className="mt-3 text-lg text-slate">Explore verified providers offering these services.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24" aria-labelledby="skills-heading">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-end justify-between gap-4 border-b border-hairline pb-5">
            <div>
              <h2 id="skills-heading" className="text-2xl font-extrabold text-primary! md:text-3xl">Services & skills</h2>
              <p className="mt-2 text-slate">{skills.length} services available in this category.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {skills.map((skill) => (
              <article key={skill} className="flex items-start gap-3 rounded-2xl border border-hairline bg-white p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <h3 className="font-semibold leading-relaxed text-primary!">{skill}</h3>
              </article>
            ))}
          </div>
          <div className="mt-12 rounded-2xl bg-primary p-8 text-center text-white">
            <h2 className="text-2xl font-extrabold">Need help with {category.name.toLowerCase()}?</h2>
            <p className="mt-3 text-white/80">Post your job and connect with a verified provider.</p>
            <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary hover:bg-white/90">
              Post a Job
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
