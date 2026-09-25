type InfoTipProps = {
  text: string;
};

/** Kółeczko „?” z chmurką po najechaniu / focusie. */
export default function InfoTip({text}: InfoTipProps) {
  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-tip-btn"
        aria-label="Wyjaśnienie"
        title={text}
      >
        ?
      </button>
      <span className="info-tip-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

type MetricLabelProps = {
  children: string;
  tip: string;
};

export function MetricLabel({children, tip}: MetricLabelProps) {
  return (
    <span className="metric-label">
      <span>{children}</span>
      <InfoTip text={tip} />
    </span>
  );
}
