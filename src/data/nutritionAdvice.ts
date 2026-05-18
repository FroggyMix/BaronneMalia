import type { NutritionAdvice } from "@/types";

export const NUTRITION_ADVICE: NutritionAdvice[] = [
  // ===== CROISSANCE =====
  {
    id: "growth-1",
    title: "Phase de croissance rapide (8-16 semaines)",
    content: `Votre chiot est en phase de croissance exponentielle. Cette période est critique pour le développement squelettique. Le calcium et le phosphore doivent être parfaitement équilibrés : un ratio Ca/P entre 1,1:1 et 1,3:1 est idéal pour les grandes races comme le Golden Retriever. Un excès de calcium (plus de 1,6% de matière sèche) augmente significativement le risque de dysplasie de hanche et d'ostéochondrite. Ne supplémentez JAMAIS en calcium sans avis vétérinaire.`,
    priority: "high",
    category: "growth",
    source: "FEDIAF Nutritional Guidelines 2024 ; Hazewinkel et al. 1985",
    minAgeWeeks: 8,
    maxAgeWeeks: 16,
  },
  {
    id: "growth-2",
    title: "Contrôler la vitesse de croissance",
    content: `Le Golden Retriever est une race sujette à la dysplasie de hanche. Une croissance trop rapide, souvent causée par une suralimentation, est le principal facteur de risque évitable. Votre chiot ne doit pas dépasser la fourchette supérieure de la courbe de poids idéale. Un chiot légèrement maigre (BCS 4/9) est préférable à un chiot trop rond (BCS 6/9) pendant la croissance. La courbe de poids doit être suivie hebdomadairement jusqu'à 6 mois, puis toutes les 2 semaines.`,
    priority: "high",
    category: "growth",
    source: "NRC 2006 ; Waltham Centre for Pet Nutrition",
    minAgeWeeks: 8,
    maxAgeWeeks: 52,
  },
  {
    id: "growth-3",
    title: "Transition vers 2 repas par jour",
    content: `Entre 6 et 9 mois, réduisez progressivement la fréquence des repas de 3 à 2 par jour. Cette transition doit se faire sur 2-3 semaines pour éviter les troubles digestifs. Un chiot de 6 mois peut déjà tolérer 2 repas, mais certains chiens plus sensibles peuvent nécessiter une transition plus lente. Maintenez la même quantité totale quotidienne, divisez simplement différemment.`,
    priority: "medium",
    category: "growth",
    source: "FEDIAF 2024",
    minAgeWeeks: 24,
    maxAgeWeeks: 40,
  },
  {
    id: "growth-4",
    title: "Croissance terminée ? Les signes",
    content: `Le Golden Retriever femelle atteint généralement sa taille adulte vers 12 mois, mais peut continuer à se "remplir" jusqu'à 18-24 mois. Votre chien est mature quand : son poids se stabilise sur 2-3 mois consécutifs, sa cage thoracique est bien développée, et son comportement est plus calme. À 18 mois, vous pouvez considérer la transition vers une alimentation adulte si le poids est stable.`,
    priority: "medium",
    category: "growth",
    source: "AKC Breed Standards ; Hawthorne et al. 2004",
    minAgeWeeks: 48,
    maxAgeWeeks: 104,
  },
  {
    id: "growth-5",
    title: "Stérilisation et impact sur la croissance",
    content: `Si vous envisagez la stérilisation, attendez idéalement que votre chienne ait atteint sa maturité sexuelle (12-18 mois pour les Goldens). Une stérilisation précoce peut affecter la fermeture des plaques de croissance et modifier la morphologie. Après stérilisation, les besoins énergétiques diminuent d'environ 15-20% : ajustez les rations en conséquence pour éviter la prise de poids.`,
    priority: "high",
    category: "growth",
    source: "Morris Animal Foundation Golden Retriever Lifetime Study 2025",
    minAgeWeeks: 24,
    maxAgeWeeks: 78,
  },

  // ===== ALIMENTATION =====
  {
    id: "nutrition-1",
    title: "Calcul des besoins énergétiques (RER/MER)",
    content: `Les besoins énergétiques se calculent en deux étapes selon la méthode FEDIAF/NRC :\n\n1. RER (Repos) = 70 × (poids en kg)^0,75\n2. MER (Total) = RER × facteur selon l'âge\n\n• Chiot < 4 mois : facteur 3,0\n• Chiot 4-6 mois : facteur 2,5\n• Chiot 6-12 mois : facteur 2,0\n• Adulte modéré : facteur 1,6\n• Adulte actif : facteur 2,0\n\nCes valeurs sont des estimations. Ajustez toujours en fonction du BCS (Body Condition Score) et de la courbe de poids.`,
    priority: "high",
    category: "nutrition",
    source: "FEDIAF 2024 ; NRC Nutrient Requirements of Dogs and Cats 2006",
  },
  {
    id: "nutrition-2",
    title: "Les Golden Retrievers et l'obésité",
    content: `Le Golden Retriever est génétiquement prédisposé à l'obésité. Une étude de 2025 (publiée dans Science) a identifié le gène DENND1B, associé à l'obésité chez le Labrador et le Golden Retriever — le même gène est lié à l'obésité humaine. Les Goldens sont également extrêmement gourmands et ne régulent pas leur intake alimentaire. N'utilisez JAMAIS les signaux de "faim" de votre chien pour ajuster les rations : basez-vous uniquement sur le BCS et la courbe de poids. Un Golden adulte stérilisé a des besoins réduits de 15-20%.`,
    priority: "high",
    category: "nutrition",
    source: "Raffan et al. 2025, Science ; Morris Animal Foundation",
  },
  {
    id: "nutrition-3",
    title: "Protéines : qualité avant quantité",
    content: `Pendant la croissance, les protéines doivent représenter au minimum 22,5% de la matière sèche (FEDIAF). Cependant, la qualité des protéines compte plus que la quantité. Privilégiez les aliments avec des protéines animales de haute qualité en premières positions (poulet, dinde, poisson, œuf). Les protéines végétales (maïs, blé, soja) ont une digestibilité inférieure. Un taux de protéines trop élevé (>35%) n'est pas nécessaire et peut être contre-productif.`,
    priority: "medium",
    category: "nutrition",
    source: "FEDIAF 2024 ; AAFCO Nutrient Profiles",
  },
  {
    id: "nutrition-4",
    title: "Oméga-3 pour la santé articulaire",
    content: `Les acides gras oméga-3 (EPA et DHA) ont démontré des bénéfices anti-inflammatoires pour la santé articulaire — particulièrement important pour une race prédisposée à la dysplasie de hanche. Les sources optimales sont l'huile de poisson sauvage (anchois, sardines) et les algues. Une supplémentation en oméga-3 peut être bénéfique dès le plus jeune âge, en complément d'une alimentation équilibrée. Consultez votre vétérinaire pour le dosage adapté.`,
    priority: "medium",
    category: "nutrition",
    source: "Roush et al. 2010 ; Cornelia et al. 2019",
  },

  // ===== HEALTH =====
  {
    id: "health-1",
    title: "Score Corporel (BCS) : comment évaluer",
    content: `Le Body Condition Score (BCS) sur 9 points est la méthode standard recommandée par les vétérinaires :\n\n• 1-3 : Maigre — côtes visibles, taille et abdomen excessivement creux\n• 4-5 : IDÉAL — côtes palpables sous une fine couche de graisse, taille visible, abdomen remonté\n• 6-7 : Surpoids — côtes difficiles à sentir, taille peu visible\n• 8-9 : Obèse — côtes impalpables, pas de taille, abdomen tombant\n\nPour un chiot Golden Retriever en croissance, un BCS de 4 est préférable à 5. Évaluez le BCS toutes les 2 semaines.`,
    priority: "high",
    category: "health",
    source: "AAHA Nutrition and Weight Management Guidelines 2021 ; Laflamme 1997",
  },
  {
    id: "health-2",
    title: "Dysplasie de hanche : prévention",
    content: `Le Golden Retriever est prédisposé à la dysplasie de hanche (DH). Les facteurs de risque modifiables sont :\n\n1. CROISSEMENT CONTRÔLÉ : évitez la suralimentation et la croissance trop rapide\n2. POIS OPTIMAL : maintenez un BCS 4/9 pendant toute la croissance\n3. EXERCICE ADAPTÉ : évitez les sauts, les escaliers répétés et le footing avant 12 mois. Privilégiez la nage et les courses libres sur sol meuble\n4. ALIMENTATION SPÉCIFIQUE : utilisez une alimentation formulée pour grandes races avec le ratio Ca/P correct\n\nUn dépistage radiographique (PennHIP ou OFA) est recommandé vers 4-6 mois.`,
    priority: "high",
    category: "health",
    source: "Orthopedic Foundation for Animals ; PennHIP ; FEDIAF 2024",
    minAgeWeeks: 8,
    maxAgeWeeks: 52,
  },
  {
    id: "health-3",
    title: "Aliments toxiques pour les chiens",
    content: `Les aliments suivants sont toxiques pour les chiens et doivent être strictement évités :\n\n• CHOCOLAT : contient de la théobromine, toxique même à faible dose (le chocolat noir est le plus dangereux)\n• RAISINS ET RAISINS SECS : peuvent causer une insuffisance rénale aiguë\n• XYLTOL : édulcorant artificiel extrêmement toxique, provoque une hypoglycémie sévère\n• OIGNONS, AIL, ÉCHALOTES : hemolyse (destruction des globules rouges)\n• AVOCAT : la persine cause des troubles digestifs\n• MACADAMIA : troubles neurologiques temporaires\n• OS Cuits : risque d'obstruction ou de perforation digestive\n\nEn cas d'ingestion accidentelle, contactez immédiatement votre vétérinaire ou un centre antipoison vétérinaire.`,
    priority: "high",
    category: "health",
    source: "ASPCA Animal Poison Control Center",
  },

  // ===== FEEDING =====
  {
    id: "feeding-1",
    title: "Fréquence des repas selon l'âge",
    content: `La fréquence des repas doit évoluer avec l'âge :\n\n• 8-12 semaines : 4 repas/jour (stabilise la glycémie)\n• 3-6 mois : 3 repas/jour\n• 6-12 mois : 2-3 repas/jour (transition progressive)\n• 12+ mois : 2 repas/jour\n\nÉvitez le "free-feeding" (nourriture laissée à disposition) : le Golden Retriever est incapable d'auto-régulation. Des repas structurés permettent un meilleur contrôle du poids et réduisent le risque de dilatation-torsion de l'estomac (bloat), particulièrement important chez les grandes races.`,
    priority: "medium",
    category: "feeding",
    source: "FEDIAF 2024 ; American College of Veterinary Internal Medicine",
  },
  {
    id: "feeding-2",
    title: "Croquettes vs Pâtée vs BARF",
    content: `Chaque type d'alimentation a ses avantages :\n\nCROQUETTES : pratiques, économiques, bon pour les dents. Choisissez une formule pour GRANDES RACES avec le bon ratio Ca/P. Vérifiez la densité énergétique (350-380 kcal/100g standard).\n\nPÂTÉE : plus appétente, plus hydratante. Utile pour les chiots difficiles mais attention à la densité énergétique souvent plus faible (80-120 kcal/100g).\n\nBARF (cru) : nécessite une expertise nutritionnelle. Le ratio Ca/P doit être parfaitement respecté (70-80% viande, 10-15% os, 10-20% légumes). Consultez obligatoirement un nutritionniste vétérinaire.\n\nMAISON-CUITE : possible mais exige un équilibre précis. La plupart des recettes trouvées en ligne sont déséquilibrées.`,
    priority: "medium",
    category: "feeding",
    source: "FEDIAF 2024 ; WSAVA Global Nutrition Committee",
  },
  {
    id: "feeding-3",
    title: "Gestion des friandises",
    content: `Les friandises ne doivent pas dépasser 10% des apports caloriques quotidiens. Cela représente environ 85 kcal si votre chiot a besoin de 850 kcal/jour. Utilisez les friandises de façon stratégique :\n\n• Privilégiez les légumes crus (carotte, concombre, courgette)\n• Découpez les friandises en très petits morceaux pour l'entraînement\n• Soustrayez les calories des friandises de la ration principale\n• Évitez les os à macher contenant beaucoup de calories\n\nUn Golden Retriever est extrêmement motivé par la nourriture : utilisez une portion de ses croquettes quotidiennes comme "friandises" d'entraînement.`,
    priority: "medium",
    category: "feeding",
    source: "Association for Pet Obesity Prevention",
  },
  {
    id: "feeding-4",
    title: "Eau : l'élément oublié",
    content: `L'hydratation est essentielle, particulièrement pour un chiot en croissance. Un chien doit boire environ 50-70 ml d'eau par kg de poids corporel par jour. Pour un chiot de 12 kg, cela représente 600-840 ml/jour.\n\nSignes de déshydratation :\n• Gencives collantes au lieu de humides\n• Peau qui revient lentement en position lorsqu'on la pince\n• Urine foncée et peu abondante\n• Lethargie\n\nChangez l'eau fraîche au moins 2 fois par jour. Si votre chiot mange des croquettes (seulement 6-10% d'eau), il aura besoin de plus d'eau que s'il mange de la pâtée (75-85% d'eau).`,
    priority: "low",
    category: "feeding",
    source: "NRC 2006",
  },
];

export function getAdviceForAge(ageWeeks: number, weightKg: number, weightStatus: "underweight" | "ideal" | "overweight"): NutritionAdvice[] {
  let advice = [...NUTRITION_ADVICE];

  // Filter by age range if specified
  advice = advice.filter(a => {
    if (a.minAgeWeeks !== undefined && ageWeeks < a.minAgeWeeks) return false;
    if (a.maxAgeWeeks !== undefined && ageWeeks > a.maxAgeWeeks) return false;
    return true;
  });

  // Add weight-specific advice
  if (weightStatus === "overweight") {
    advice.unshift({
      id: "weight-alert",
      title: "⚠️ Surpoids détecté",
      content: `Le poids actuel de ${weightKg} kg est au-dessus de la fourchette idéale pour l'âge. Réduisez les rations de 10% et augmentez l'activité physique. Évitez absolument les friandises. Consultez votre vétérinaire si la situation persiste au prochain pesage.`,
      priority: "high",
      category: "health",
      source: "FEDIAF 2024",
    });
  } else if (weightStatus === "underweight") {
    advice.unshift({
      id: "weight-alert",
      title: "⚠️ Sous-poids détecté",
      content: `Le poids actuel de ${weightKg} kg est en-dessous de la fourchette idéale pour l'âge. Augmentez les rations de 10% et vérifiez la qualité de l'alimentation. Si votre chiot a des vers ou des problèmes digestifs, consultez votre vétérinaire.`,
      priority: "high",
      category: "health",
      source: "FEDIAF 2024",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  advice.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return advice;
}

export function getAdviceByCategory(): Record<string, NutritionAdvice[]> {
  const categories: Record<string, NutritionAdvice[]> = {
    growth: NUTRITION_ADVICE.filter(a => a.category === "growth"),
    nutrition: NUTRITION_ADVICE.filter(a => a.category === "nutrition"),
    health: NUTRITION_ADVICE.filter(a => a.category === "health"),
    feeding: NUTRITION_ADVICE.filter(a => a.category === "feeding"),
  };
  return categories;
}
