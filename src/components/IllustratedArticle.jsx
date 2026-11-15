function Illustration({ figure }) {
  const [name, caption] = figure
  const src = `/article-images/kiriaina/${name}.jpg`

  return <figure className="illustrated-figure">
    <a href={src} target="_blank" rel="noreferrer" aria-label={`查看大图 · ${caption}`}>
      <img src={src} alt={caption} loading="lazy" decoding="async" />
    </a>
    <figcaption>{caption}</figcaption>
  </figure>
}

export default function IllustratedArticle({ article }) {
  return <div className="illustrated-article">
    <p className="illustrated-credit">插画 · 令时焥夏 KiriAINa</p>
    <section className="illustrated-section illustrated-intro">
      <div>{article.intro.split(/\n{2,}/).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="illustrated-gallery">
        <Illustration figure={['image6', '《游戏人生》白 · 最初看到的作品']} />
        <Illustration figure={['ref1', '补充例图 · 虹膜附近的对比色']} />
      </div>
    </section>
    {article.sections.map(section => <section className="illustrated-section" key={section.title}>
      <div>
        <h2>{section.title}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className={`illustrated-gallery${section.figures.length === 1 ? ' is-single' : ''}`}>
        {section.figures.map(figure => <Illustration key={figure[0]} figure={figure} />)}
      </div>
    </section>)}
    <section className="illustrated-references">
      <h2>延伸参考</h2>
      <div className="illustrated-gallery">
        {article.references.map(figure => <Illustration key={figure[0]} figure={figure} />)}
      </div>
    </section>
    <p className="illustrated-ending">{article.ending}</p>
    {article.attachments?.length > 0 && <section className="illustrated-references">
      <h2>附件</h2>
      {article.attachments.map(({ title, url, filename }) => (
        <a className="btn secondary" key={url} href={url} download={filename}>
          下载 PPTX · {title}
        </a>
      ))}
    </section>}
  </div>
}


