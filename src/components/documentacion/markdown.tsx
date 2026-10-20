import { isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ShieldAlert } from "lucide-react";

import { remarkEnlaces, type MapaAnclas } from "@/lib/documentacion/enlaces";
import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";
import { Mermaid } from "./mermaid";

const ANCLA_CLASS = "heading-anchor";

function textoDe(nodo: ReactNode): string {
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(textoDe).join("");
  if (isValidElement<{ children?: ReactNode }>(nodo)) return textoDe(nodo.props.children);
  return "";
}

function MarcaSoloAdmin() {
  return (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-md border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 align-middle text-[11px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
      <ShieldAlert className="size-3" aria-hidden />
      Solo administradores
    </span>
  );
}

function componentes(restringidas: Set<string>): Components {
  return {
    h2: ({ id, children }) => (
      <h2
        id={id}
        className="group mt-10 scroll-mt-20 border-t border-border pt-6 text-base font-semibold tracking-tight text-foreground first:mt-0 first:border-t-0 first:pt-0"
      >
        {children}
        {id && restringidas.has(id) && <MarcaSoloAdmin />}
      </h2>
    ),
    h3: ({ id, children }) => (
      <h3 id={id} className="group mt-7 scroll-mt-20 text-sm font-semibold text-foreground">
        {children}
      </h3>
    ),
    h4: ({ id, children }) => (
      <h4 id={id} className="group mt-5 scroll-mt-20 text-sm font-medium text-foreground">
        {children}
      </h4>
    ),
    p: ({ children }) => <p className="my-3 text-sm leading-7 text-foreground/90">{children}</p>,
    a: ({ href = "", className, children }) => {
      if (className?.includes(ANCLA_CLASS)) {
        return (
          <a
            href={href}
            aria-hidden
            tabIndex={-1}
            className="ml-1.5 text-muted-foreground no-underline opacity-0 transition-opacity group-hover:opacity-100"
          >
            {children}
          </a>
        );
      }
      const clases =
        "font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary";
      if (href.startsWith("/")) {
        return (
          <Link href={href} className={clases}>
            {children}
          </Link>
        );
      }
      if (href.startsWith("#")) {
        return (
          <a href={href} className={clases}>
            {children}
          </a>
        );
      }
      return (
        <a href={href} className={clases} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    ul: ({ children }) => (
      <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-7 text-foreground/90 marker:text-muted-foreground">
        {children}
      </ul>
    ),
    ol: ({ children, start }) => (
      <ol
        start={start}
        className="my-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-7 text-foreground/90 marker:font-mono marker:text-muted-foreground"
      >
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1 [&>ol]:my-1.5 [&>ul]:my-1.5">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l border-border pl-4 text-muted-foreground [&>p]:text-muted-foreground">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-border" />,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    table: ({ children }) => (
      // Las tablas anchas se desplazan dentro de su borde, nunca la página.
      <div className="my-4 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[36rem] border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    th: ({ children, style }) => (
      <th
        style={style}
        className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
      >
        {children}
      </th>
    ),
    td: ({ children, style }) => (
      <td style={style} className="border-t border-border px-3 py-2 align-top leading-6 text-foreground/90">
        {children}
      </td>
    ),
    code: ({ children, className }) => (
      <code
        className={cn(
          "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground [overflow-wrap:anywhere]",
          className,
        )}
      >
        {children}
      </code>
    ),
    // Los bloques se reemplazan completos: el `pre` decide entre diagrama y código.
    pre: ({ children }) => {
      const hijo = (Array.isArray(children) ? children[0] : children) as ReactElement<
        ComponentProps<"code">
      >;
      const lang = /language-([\w-]+)/.exec(hijo?.props?.className ?? "")?.[1];
      const codigo = textoDe(hijo?.props?.children).replace(/\n$/, "");
      if (lang === "mermaid") return <Mermaid code={codigo} />;
      return <CodeBlock code={codigo} lang={lang} />;
    },
  };
}

export function DocumentoMarkdown({
  cuerpo,
  archivo,
  mapa,
  restringidas,
}: {
  cuerpo: string;
  archivo: string;
  mapa: MapaAnclas;
  restringidas: Set<string>;
}) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, [remarkEnlaces, { archivoActual: archivo, mapa }]]}
      rehypePlugins={[
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: { className: [ANCLA_CLASS] },
            content: { type: "text", value: "#" },
          },
        ],
      ]}
      components={componentes(restringidas)}
    >
      {cuerpo}
    </Markdown>
  );
}
