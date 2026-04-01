import os
import subprocess
from pathlib import Path

# --- CONFIG ---
PROJECT_NAME = "frontend"
FRAMEWORK = "react-ts"

# --- STEP 1: Create project using Vite ---
def create_vite_app():
    print(f"🚀 Creating Vite project {PROJECT_NAME}...")
    subprocess.run(
        f"npm create vite@latest {PROJECT_NAME} -- --template {FRAMEWORK}",
        shell=True,
        check=True
    )


# --- STEP 2: Install TailwindCSS ---
def install_tailwind():
    print("🎨 Installing TailwindCSS...")
    subprocess.run(
        "npm install -D tailwindcss postcss autoprefixer",
        shell=True,
        check=True,
        cwd=PROJECT_NAME
    )

    # Manually create tailwind.config.js
    with open(os.path.join(PROJECT_NAME, "tailwind.config.js"), "w") as f:
        f.write("""\
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
""")

    # Manually create postcss.config.cjs
    with open(os.path.join(PROJECT_NAME, "postcss.config.cjs"), "w") as f:
        f.write("""\
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""")

    # Update index.css
    with open(os.path.join(PROJECT_NAME, "src/index.css"), "w") as f:
        f.write("""\
@tailwind base;
@tailwind components;
@tailwind utilities;
""")


# --- STEP 3: Create folder structure ---
def create_structure():
    print("📂 Creating folder structure...")
    base = Path("src")

    # Pages
    pages = [
        "homepage.tsx", "events.tsx", "events-detail.tsx",
        "gallery.tsx", "executives.tsx",
        "contact.tsx", "sponsorship.tsx",
        "register.tsx", "login.tsx",
        "dashboard.tsx", "profile.tsx",
        "projects.tsx", "project-detail.tsx",
        "resources.tsx"
    ]
    admin_pages = ["metrics.tsx", "events.tsx", "gallery.tsx", "execs.tsx", "students.tsx", "sponsorship.tsx", "audit.tsx"]

    for page in pages:
        (base / "pages" / page).parent.mkdir(parents=True, exist_ok=True)
        (base / "pages" / page).touch()

    for page in admin_pages:
        (base / "pages" / "admin" / page).parent.mkdir(parents=True, exist_ok=True)
        (base / "pages" / "admin" / page).touch()

    # Components
    components = [
        "Navbar.tsx", "Footer.tsx", "Card.tsx", "EventCard.tsx",
        "ProfileCard.tsx", "ProjectCard.tsx", "GalleryGrid.tsx",
        "FiltersBar.tsx", "QRScanner.tsx"
    ]
    for comp in components:
        (base / "components" / comp).parent.mkdir(parents=True, exist_ok=True)
        (base / "components" / comp).touch()

    # Lib
    libs = ["api.ts", "auth.ts"]
    for lib in libs:
        (base / "lib" / lib).parent.mkdir(parents=True, exist_ok=True)
        (base / "lib" / lib).touch()

    (base / "lib" / "hooks").mkdir(parents=True, exist_ok=True)
    (base / "lib" / "guards").mkdir(parents=True, exist_ok=True)

# --- MAIN ---
if __name__ == "__main__":
    create_vite_app()
    install_tailwind()
    create_structure()
    print("✅ Project setup complete! cd into", PROJECT_NAME)
