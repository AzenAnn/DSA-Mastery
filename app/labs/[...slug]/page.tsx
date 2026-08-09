import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentView } from "@/components/document-view";
import { getDocument, getLabs, getSiblings } from "@/lib/content";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getLabs().map((document) => ({ slug: document.slug.split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getDocument("lab", slug.join("/"));
  if (!document) return {};
  return { title: document.title, description: document.description };
}

export default async function LabPage({ params }: PageProps) {
  const { slug } = await params;
  const document = getDocument("lab", slug.join("/"));
  if (!document) notFound();
  const siblings = getSiblings(getLabs(), document.slug);
  return <DocumentView document={document} {...siblings} />;
}
