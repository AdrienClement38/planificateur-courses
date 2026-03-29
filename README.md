# 🛒 Drive Planner

Générateur de planning repas et de liste de courses optimisée, propulsé par l'IA Claude d'Anthropic.

Choisissez votre enseigne drive (Leclerc, Carrefour, Intermarché…), renseignez votre budget et vos contraintes alimentaires, et obtenez en quelques secondes un menu complet avec une liste de courses cliquable directement vers votre drive.

---

## Stack

- **Framework** : [Next.js 14](https://nextjs.org/) — App Router
- **Langage** : TypeScript (strict)
- **UI** : [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **IA** : [Anthropic Claude](https://www.anthropic.com/) via `@anthropic-ai/sdk`
- **Validation** : [Zod](https://zod.dev/)

---

## Structure du projet

\`\`\`
drive-planner/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts        # API Route — appel Anthropic sécurisé
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── drive/
│   │   ├── DriveSelector.tsx   # Sélecteur d'enseigne
│   │   └── TagInput.tsx        # Champ tags (préférences, exclusions)
│   ├── layout/
│   │   ├── PlannerForm.tsx     # Formulaire principal
│   │   └── PlanResults.tsx     # Affichage des résultats
│   ├── meal-plan/
│   │   ├── BudgetBar.tsx       # Jauge budget
│   │   └── MealPlanGrid.tsx    # Grille des repas par semaine
│   ├── shopping/
│   │   └── ShoppingList.tsx    # Liste de courses avec liens drive
│   └── ui/                     # Composants shadcn/ui (auto-générés)
├── hooks/
│   ├── useMealPlan.ts          # Fetching + état du plan généré
│   └── useTagInput.ts          # Logique du champ tags
├── lib/
│   ├── drives.ts               # Config des enseignes (URLs, couleurs…)
│   ├── prompt.ts               # Construction du prompt Anthropic
│   ├── schemas.ts              # Schémas Zod (validation I/O)
│   └── utils.ts                # Helpers (cn…)
├── types/
│   └── index.ts                # Types TypeScript partagés
├── .env.example
└── README.md
\`\`\`

---

## Installation

### 1. Cloner le dépôt

\`\`\`bash
git clone https://github.com/TON_USERNAME/drive-planner.git
cd drive-planner
\`\`\`

### 2. Installer les dépendances

\`\`\`bash
npm install
\`\`\`

### 3. Configurer les variables d'environnement

\`\`\`bash
cp .env.example .env.local
\`\`\`

Puis éditer \`.env.local\` :

\`\`\`env
ANTHROPIC_API_KEY=sk-ant-...
\`\`\`

> Obtenir une clé API sur [console.anthropic.com](https://console.anthropic.com)

### 4. Lancer en développement

\`\`\`bash
npm run dev
\`\`\`

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Déploiement

### Vercel (recommandé)

\`\`\`bash
npx vercel
\`\`\`

Ajouter la variable \`ANTHROPIC_API_KEY\` dans les paramètres du projet Vercel.

---

## Ajouter un drive

Éditer \`lib/drives.ts\` et ajouter une entrée dans \`DRIVES\` :

\`\`\`ts
monDrive: {
  key: "monDrive",
  name: "Mon Drive",
  label: "Mon Drive",
  home: "https://www.mondrive.fr",
  color: "#FF0000",
  buildSearchUrl: (q) => \`https://www.mondrive.fr/search?q=\${encodeURIComponent(q)}\`,
},
\`\`\`

Et ajouter la clé dans le type \`DriveKey\` dans \`types/index.ts\`.

---

## Licence

MIT
