type BenefitsSectionProps = {
  benefits: {
    kicker: string;
    title: string;
    text: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
};

export function BenefitsSection({ benefits }: BenefitsSectionProps) {
  return (
    <section className="benefits" id="benefits">
      <div className="benefits-inner">
        <div className="section-head reveal">
          <div>
            <div className="section-kicker">{benefits.kicker}</div>
            <h2 className="section-title">{benefits.title}</h2>
            <p className="section-text">{benefits.text}</p>
          </div>
        </div>

        <div className="benefits-grid">
          {benefits.items.map((benefit, index) => (
            <article className="benefit-card reveal" key={`${index}-${benefit.title}`}>
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
