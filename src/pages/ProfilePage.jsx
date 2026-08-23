import ContactPanel from '../components/ContactPanel'

function ProfilePage() {
  return (
    <main className="profile-page">
      <section className="section profile-intro" id="intro">
        <div className="section-heading profile-heading">
          <span className="section-kicker">Profile</span>
          <h1>关于 KelAess / 柯埃斯</h1>
          <p>
            我是一个 18 岁的创作者，正在把游戏设计、美术绘画、音乐制作、3D 建模与写作慢慢整理进同一个空间。
          </p>
        </div>

        <div className="profile-intro-grid">
          <article className="card profile-detail-card profile-detail-card--wide">
            <h2>我在做什么</h2>
            <p>
              这里既是作品档案，也是一个持续生长的创作房间。我喜欢把不同媒介当成不同的语言：游戏可以承载规则与选择，绘画可以留下氛围与角色，音乐可以保存情绪，3D 建模能让想象变得可以被看见，而写作则负责把这些碎片连接起来。
            </p>
            <p>
              现在的我还在探索自己的表达方式，所以这个网站不会只展示最终成品，也会慢慢收纳过程、设定、片段和阶段性的尝试。
            </p>
          </article>

          <article className="card profile-detail-card">
            <h2>创作方向</h2>
            <ul className="profile-list">
              <li>游戏设计：世界观、玩法结构与角色体验。</li>
              <li>美术绘画：角色、场景与视觉概念。</li>
              <li>音乐制作：旋律、氛围与情绪片段。</li>
              <li>3D 建模：把设定从平面推进到空间。</li>
              <li>写作：故事、档案与更私人的文字。</li>
            </ul>
          </article>

          <article className="card profile-detail-card">
            <h2>这个网站</h2>
            <p>
              首页会更专注于作品入口；如果你想了解我本人、后续更新或联系入口，可以从这里继续往下看。
            </p>
            <a href="#contact" className="btn secondary profile-contact-link">
              联系方式
            </a>
          </article>
        </div>
      </section>

      <ContactPanel />
    </main>
  )
}

export default ProfilePage
