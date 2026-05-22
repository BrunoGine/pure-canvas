import ReactMarkdown from "react-markdown";
import { LegalKind, useCurrentLegalDocument } from "@/hooks/useLegalDocuments";

interface Props {
  kind: LegalKind;
}

const LegalDocumentView = ({ kind }: Props) => {
  const { data, isLoading, error } = useCurrentLegalDocument(kind);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Não foi possível carregar o documento.</p>;
  }

  return (
    <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-h1:text-2xl prose-h2:text-base prose-h2:mt-6 prose-p:text-sm prose-li:text-sm">
      <ReactMarkdown>{data.content_md}</ReactMarkdown>
      <p className="text-xs text-muted-foreground mt-8">Versão {data.version}</p>
    </article>
  );
};

export default LegalDocumentView;
