import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentView } from "@/components/document-view";
import { getDocument, getLessons, getSiblings } from "@/lib/content";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getLessons().map((document) => ({ slug: document.slug.split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getDocument("lesson", slug.join("/"));
  if (!document) return {};
  return { title: document.title, description: document.description };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params;
  const document = getDocument("lesson", slug.join("/"));
  if (!document) notFound();
  const siblings = getSiblings(getLessons(), document.slug);
  return <DocumentView document={document} {...siblings} />;
}
