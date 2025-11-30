import React, { useMemo } from 'react';

// diff_match_patch is loaded from a script tag in index.html, so it's on the window object.
declare const diff_match_patch: any;
declare const DIFF_EQUAL: number;
declare const DIFF_DELETE: number;
declare const DIFF_INSERT: number;

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  const dmp = useMemo(() => new diff_match_patch(), []);

  const diff = useMemo(() => {
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);
    return diffs;
  }, [oldText, newText, dmp]);

  return (
    <div className="whitespace-pre-wrap text-sm font-mono leading-6">
      {diff.map(([op, text], index) => {
        switch (op) {
          case DIFF_INSERT:
            return <ins key={index}>{text}</ins>;
          case DIFF_DELETE:
            return <del key={index}>{text}</del>;
          case DIFF_EQUAL:
            return <span key={index}>{text}</span>;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default DiffViewer;
