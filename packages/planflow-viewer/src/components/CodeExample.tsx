// Exemple d'utilisation du composant CodeBlock avec linting
import { CodeBlock } from '@/components/CodeBlock';

const exampleCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    console.log('Processing item:', items[i]);
    total = total + items[i].price;
  }
  return total;
}

// Fonction avec erreur de syntaxe
functon processData(data) {
  return data.map(item => {
    if (item.status == 'active') { // Utilisation de == au lieu de ===
      return item.value * 2;
    }
    return item.value;
  });
}`;

export function CodeExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exemple de code avec syntax highlighting</h3>

      <CodeBlock
        code={exampleCode}
        language="javascript"
        theme="dark"
        lintErrors={[]}
        showLineNumbers={true}
      />

      <div className="text-sm text-muted-foreground">
        <p>✨ Fonctionnalités ajoutées :</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Coloration syntaxique automatique</li>
          <li>Détection de langage par extension de fichier</li>
          <li>Numéros de ligne</li>
          <li>Surbrillance des erreurs de linting par ligne</li>
          <li>Résumé des problèmes en bas</li>
          <li>Thème sombre/clair</li>
        </ul>
      </div>
    </div>
  );
}
