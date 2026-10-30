import type { Guide } from './types';

export const balancedRation: Guide = {
  slug: 'balanced-dairy-ration',
  title: 'Balanced Ration for Dairy Cows and Buffaloes: Roughage, Wanda and Minerals',
  description:
    'How to build a balanced dairy ration from green fodder, dry fodder, silage and concentrate (wanda), and how to feed concentrate according to milk yield.',
  category: 'Nutrition',
  urdu: 'دودھ دینے والے جانوروں کی متوازن خوراک',
  published: '2026-10-30',
  updated: '2026-10-30',
  readingMinutes: 7,
  keywords: [
    'balanced ration dairy cow',
    'wanda for buffalo',
    'concentrate feeding per litre milk',
    'TMR Pakistan',
  ],
  body: `
Feed is usually the largest cost on a dairy farm — often well over half of all spending. A balanced ration does not have to be expensive; it has to match what the animal needs. Underfeeding wastes the animal's potential, and overfeeding concentrate wastes money and can make animals sick.

## The building blocks

### Roughage (the base of every ration)

- **Green fodder**: berseem, lucerne, maize, sorghum, oats.
- **Silage**: preserved green fodder for the lean months.
- **Dry fodder**: wheat straw (bhoosa), rice straw.

Roughage keeps the rumen healthy and supports milk fat. Dairy animals need a good share of long fibre every day.

### Concentrate ("wanda")

Commercial or home-mixed concentrate supplies extra **energy and protein** that roughage alone cannot provide for good milk yields. Common ingredients include cotton seed cake (khal), maize, wheat bran, and oilseed meals.

### Minerals, salt and water

Mineral mixture and salt are cheap but essential for milk, fertility and immunity. Clean water must be available at all times.

## Feeding concentrate to milk yield

Feeding every animal the same amount of wanda is one of the most common mistakes. High producers are held back and low producers waste feed. A practical approach:

1. Give all animals a basic amount for body maintenance (mostly from roughage).
2. Add concentrate in proportion to **actual milk yield** — many advisers use a rule of roughly a fixed amount of concentrate per litre above what the roughage supports.
3. Adjust based on body condition and milk response every few weeks.

> Rules of thumb are a starting point. Ask a livestock nutritionist to balance the ration for your fodder and your animals' yields — the result usually pays for the advice many times over.

## Total mixed ration (TMR)

On larger farms, chopping and mixing roughage, concentrate and minerals together into a **TMR** stops animals picking out the concentrate and keeps the rumen stable. Even on small farms, mixing chopped fodder with concentrate helps.

## Signs the ration is wrong

- **Low milk fat**: too little long fibre or too much concentrate.
- **Loose dung, reduced cud chewing**: too much concentrate or sudden diet changes.
- **Thin animals that do not come into heat**: energy shortage.
- **Very fat dry animals**: overfeeding in late lactation or the dry period.

## Make changes slowly

The rumen's microbes need about **two weeks** to adjust to a new diet. Change ingredients gradually to avoid digestive upsets.

Recording milk per animal alongside feed costs lets you calculate **feed cost per litre** — the clearest measure of whether your ration is working.
`,
  faqs: [
    {
      q: 'How much wanda should I give per litre of milk?',
      a: 'It depends on fodder quality and the concentrate. Many advisers feed concentrate in proportion to yield above what roughage supports; a nutritionist can set the exact amount for your farm.',
    },
  ],
  furtherReading: [
    'University of Veterinary and Animal Sciences (UVAS), Lahore — Department of Animal Nutrition',
    'FAO — Feed and nutrition for dairy animals',
  ],
  related: ['fodder-silage-planning', 'mineral-mixture-dairy', 'milk-fat-snf-explained'],
};

export const minerals: Guide = {
  slug: 'mineral-mixture-dairy',
  title: 'Mineral Mixture and Salt for Dairy Animals: Small Cost, Big Returns',
  description:
    'Why dairy cows and buffaloes need mineral mixture and salt every day, signs of deficiency such as poor fertility, and how to feed minerals correctly.',
  category: 'Nutrition',
  urdu: 'منرل مکسچر اور نمک',
  published: '2026-10-30',
  updated: '2026-10-30',
  readingMinutes: 5,
  keywords: [
    'mineral mixture for cows',
    'buffalo repeat breeding minerals',
    'salt lick cattle',
    'mineral deficiency dairy',
  ],
  body: `
Minerals make up a tiny part of a dairy animal's diet, yet shortages cause some of the most expensive problems on a farm: animals that do not come into heat, repeat breeding, weak calves, retained placenta and lower milk. Most Pakistani fodders and straws do not supply enough of several key minerals, so supplementation is usually needed.

## What minerals do

- **Calcium and phosphorus** — bones, milk production and muscle function (including around calving).
- **Trace minerals** such as copper, zinc, manganese and selenium — fertility, immunity and hoof health.
- **Salt (sodium chloride)** — appetite, digestion and water balance.

## Signs of mineral deficiency

- Animals not showing heat or repeat breeding.
- Licking walls, soil or eating unusual objects (pica).
- Rough coat and poor growth in young stock.
- More retained placenta and weak calves.
- Weak hooves and lameness.

These signs have other causes too, so ask a veterinarian before blaming minerals alone.

## How to feed minerals

1. Use a **good-quality mineral mixture** formulated for dairy animals. Check the label for calcium, phosphorus and trace minerals.
2. Mix the recommended daily amount into the concentrate, or follow the product instructions. More is not better — excess can cause problems.
3. Provide **salt** separately or as a salt lick so animals can take what they need.
4. Continue during the **dry period** with a dry-cow mineral as your vet or nutritionist advises — this is important for preventing milk fever.

> Mineral mixture costs very little per animal per day compared with the cost of one missed heat — roughly three weeks of feed with no return.

## Mineral blocks vs mixture

Mineral or salt **blocks** let animals help themselves, which is convenient, but intake varies a lot between animals — some lick too much and some too little. Mixing a measured amount of mineral mixture into each animal's concentrate gives more reliable intake, with a salt lick available as well. For high-yielding animals and dry cows, measured feeding is usually the better choice.

## Water quality matters too

In some areas groundwater is very salty or contains high levels of certain minerals. If animals drink poorly or show unusual problems, have the water tested.

Track breeding outcomes after starting a mineral programme: fewer repeat breedings and shorter calving intervals are the clearest sign it is working.
`,
  furtherReading: [
    'University of Veterinary and Animal Sciences (UVAS), Lahore — Department of Animal Nutrition',
    'FAO — Mineral nutrition of livestock',
  ],
  related: [
    'balanced-dairy-ration',
    'heat-detection-cows-buffaloes',
    'milk-fever-ketosis-transition-cow',
  ],
};
