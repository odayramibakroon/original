import Image from "next/image";

type FactorySectionProps = {
  factory: {
    label: string;
    title: string;
    description?: string;
    overlayTitle: string;
    imageAlt: string;
    imageUrl: string;
    stats: Array<{
      value: string;
      label: string;
    }>;
  };
};

export function FactorySection({ factory }: FactorySectionProps) {
  return (
    <section className="section factory" id="factory">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-label">{factory.label}</div>
            <h2 className="section-title">{factory.title}</h2>
            {factory.description && <p className="section-description">{factory.description}</p>}
          </div>
        </div>

        <div className="factory-image reveal">
          <Image
            src={factory.imageUrl}
            alt={factory.imageAlt}
            fill
            sizes="(max-width: 760px) 100vw, 1250px"
          />

          <div className="factory-overlay">
            <h2>{factory.overlayTitle}</h2>

            <div className="factory-info">
              {factory.stats.map((stat, index) => (
                <div className="factory-box" key={`${index}-${stat.label}`}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
