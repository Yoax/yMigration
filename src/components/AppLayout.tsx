import { Link, Outlet, useLocation } from 'react-router-dom'

function navClass(active: boolean): string {
  return `app__nav-link${active ? ' app__nav-link--active' : ''}`
}

export function AppLayout() {
  const { pathname } = useLocation()
  const isMap = pathname === '/'
  const isAdmin = pathname.startsWith('/admin')
  const isTutorial = pathname.startsWith('/tutoriel')
  const isAbout = pathname.startsWith('/a-propos')

  return (
    <div className={`app${isMap ? ' app--map' : ''}`}>
      <header className="app__header">
        <div className="app__header-inner">
          <div>
            <h1 className="app__title">yMigration</h1>
            <p className="app__subtitle">Visualisez un parcours migratoire</p>
            <p className="app__credit">
              <a
                href="https://yoanpouzet.fr"
                className="app__credit-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                yoanpouzet.fr
              </a>
            </p>
          </div>
          <nav className="app__nav" aria-label="Navigation principale">
            <Link to="/" className={navClass(isMap)}>
              Carte
            </Link>
            <Link to="/tutoriel" className={navClass(isTutorial)}>
              Tutoriel
            </Link>
            <Link to="/a-propos" className={navClass(isAbout)}>
              À propos
            </Link>
            <Link to="/admin" className={navClass(isAdmin)}>
              Mon parcours
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
