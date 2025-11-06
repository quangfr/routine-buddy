const TZ = 'Europe/Paris'
const fmtDate = (d)=> new Date(d).toLocaleDateString('en-CA',{timeZone:TZ})
const todayISO = ()=> fmtDate(Date.now())
const uid = ()=> Math.random().toString(36).slice(2,9)
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const supportsNotifications = typeof window!=='undefined' && typeof navigator!=='undefined' && 'Notification' in window && 'serviceWorker' in navigator
const reminderTimers = new Map()
const DEFAULT_REMINDER_TIME={hour:9, minute:0}

function pad2(value){
  const num = Number.isFinite(value) ? Math.trunc(value) : 0
  return num.toString().padStart(2,'0')
}
const WEEKDAY_SHORT = ['Mo','Tu','We','Th','Fr','Sa','Su']
const WEEKDAY_SHORT_LABELS = {
  en: WEEKDAY_SHORT,
  fr: ['Lu','Ma','Me','Je','Ve','Sa','Di'],
}
const WEEKDAY_ORDER = [1,2,3,4,5,6,0]
const MOOD_CHOICES = [
  {value:'😄', label:'Upbeat'},
  {value:'😌', label:'Calm'},
  {value:'😤', label:'Driven'},
  {value:'😥', label:'Tired'},
  {value:'😴', label:'Sleepy'},
]
const STORE_KEY='ROUTINES_V1'
const LEGACY_STORE_KEYS=['ROUTINE_BUDDY_V3']
const currentWeekStart = weekStart(todayISO())
const EMOJIS=[
  {char:'🍎', tags:['apple','fruit','nutrition','vitamin']},
  {char:'🍳', tags:['egg','breakfast','protein','cooking']},
  {char:'🥗', tags:['salad','meal','veggies','nutrition']},
  {char:'🥛', tags:['milk','drink','calcium']},
  {char:'💧', tags:['water','hydration']},
  {char:'🫖', tags:['tea','drink']},
  {char:'☕', tags:['coffee','drink','break']},
  {char:'🚿', tags:['shower','hygiene']},
  {char:'🪥', tags:['brush','teeth','hygiene']},
  {char:'🧴', tags:['skincare','face','hygiene']},
  {char:'🧼', tags:['soap','hygiene']},
  {char:'🤸', tags:['warmup','fitness','mobility']},
  {char:'🏃', tags:['run','fitness','exercise']},
  {char:'🚶', tags:['walk','stroll']},
  {char:'💪', tags:['strength','workout','fitness']},
  {char:'🧘', tags:['yoga','relax','breathing']},
  {char:'🧘‍♂️', tags:['meditation','calm']},
  {char:'🧘‍♀️', tags:['yoga','calm']},
  {char:'🚲', tags:['bike','fitness','outdoor']},
  {char:'💃', tags:['dance','evening']},
  {char:'🛏️', tags:['sleep','bed','night']},
  {char:'📵', tags:['digital detox','screen']},
  {char:'😴', tags:['nap','sleep']},
  {char:'🪟', tags:['airing','window']},
  {char:'🕯️', tags:['ritual','calm']},
  {char:'💬', tags:['message','social']},
  {char:'🤝', tags:['friend','social','support']},
  {char:'📞', tags:['call','family']},
  {char:'🕺', tags:['dance','night out']},
  {char:'📚', tags:['reading','book']},
  {char:'📝', tags:['journal','writing']},
  {char:'🗂️', tags:['admin','paperwork']},
  {char:'🌳', tags:['nature','walk']},
  {char:'🌬️', tags:['breathing','calm','rest']},
  {char:'🍽️', tags:['meal','connection','lunch']},
  {char:'💻', tags:['course','learning','education']},
  {char:'🗣️', tags:['language','speaking','education']},
  {char:'🎨', tags:['drawing','hobby','creativity']},
  {char:'🎸', tags:['music','instrument','hobby']},
  {char:'🎲', tags:['game','hobby','night']},
  {char:'📺', tags:['series','relax','hobby']},
  {char:'🎯', tags:['goal','focus']},
  {char:'🧺', tags:['laundry','chores']},
  {char:'🐟', tags:['fish','meal']},
  {char:'🫘', tags:['beans','meal']},
  {char:'🕯', tags:['calm']},
  {char:'🍊', tags:['orange','fruit','vitamin']},
  {char:'🍋', tags:['lemon','fruit','citrus']},
  {char:'🍌', tags:['banana','fruit','potassium']},
  {char:'🍉', tags:['watermelon','fruit','refresh']},
  {char:'🍇', tags:['grapes','fruit','snack']},
  {char:'🍓', tags:['strawberry','fruit','dessert']},
  {char:'🫐', tags:['blueberry','fruit','antioxidant']},
  {char:'🍒', tags:['cherry','fruit','dessert']},
  {char:'🍑', tags:['peach','fruit','snack']},
  {char:'🥝', tags:['kiwi','fruit','vitamin']},
  {char:'🍍', tags:['pineapple','fruit','tropical']},
  {char:'🥭', tags:['mango','fruit','tropical']},
  {char:'🥥', tags:['coconut','fruit','hydration']},
  {char:'🥑', tags:['avocado','fruit','healthy']},
  {char:'🥦', tags:['broccoli','veggie','greens']},
  {char:'🥕', tags:['carrot','veggie','beta']},
  {char:'🧅', tags:['onion','veggie','cooking']},
  {char:'🥔', tags:['potato','veggie','starch']},
  {char:'🌽', tags:['corn','veggie','grains']},
  {char:'🍠', tags:['yam','veggie','roast']},
  {char:'🥬', tags:['lettuce','veggie','salad']},
  {char:'🍆', tags:['eggplant','veggie','grill']},
  {char:'🍅', tags:['tomato','veggie','garden']},
  {char:'🧄', tags:['garlic','veggie','seasoning']},
  {char:'🫛', tags:['peas','veggie','fiber']},
  {char:'🥜', tags:['peanut','snack','protein']},
  {char:'🍞', tags:['bread','carb','bakery']},
  {char:'🥐', tags:['croissant','bakery','breakfast']},
  {char:'🥖', tags:['baguette','bread','bakery']},
  {char:'🫓', tags:['flatbread','bread','wrap']},
  {char:'🥨', tags:['pretzel','snack','bakery']},
  {char:'🧀', tags:['cheese','dairy','protein']},
  {char:'🥚', tags:['egg','protein','breakfast']},
  {char:'🥞', tags:['pancake','breakfast','brunch']},
  {char:'🧇', tags:['waffle','breakfast','brunch']},
  {char:'🍗', tags:['drumstick','meal','protein']},
  {char:'🍖', tags:['ribs','meal','bbq']},
  {char:'🥩', tags:['steak','meal','protein']},
  {char:'🥓', tags:['bacon','breakfast','protein']},
  {char:'🍔', tags:['burger','meal','fastfood']},
  {char:'🍟', tags:['fries','snack','fastfood']},
  {char:'🌭', tags:['hotdog','meal','fastfood']},
  {char:'🍕', tags:['pizza','meal','slice']},
  {char:'🥪', tags:['sandwich','meal','lunch']},
  {char:'🌮', tags:['taco','meal','fiesta']},
  {char:'🌯', tags:['burrito','meal','wrap']},
  {char:'🥙', tags:['gyro','meal','mediterranean']},
  {char:'🧆', tags:['falafel','meal','veggie']},
  {char:'🍝', tags:['pasta','meal','comfort']},
  {char:'🍜', tags:['noodles','meal','broth']},
  {char:'🍲', tags:['stew','meal','comfort']},
  {char:'🍛', tags:['curry','meal','spicy']},
  {char:'🍣', tags:['sushi','meal','fresh']},
  {char:'🍤', tags:['shrimp','meal','seafood']},
  {char:'🍱', tags:['bento','meal','lunch']},
  {char:'🥡', tags:['takeout','meal','box']},
  {char:'🍚', tags:['rice','staple','grain']},
  {char:'🍙', tags:['riceball','snack','bento']},
  {char:'🍘', tags:['cracker','snack','rice']},
  {char:'🍥', tags:['naruto','soup','ramen']},
  {char:'🥟', tags:['dumpling','meal','comfort']},
  {char:'🧁', tags:['cupcake','dessert','treat']},
  {char:'🍰', tags:['cake','dessert','celebration']},
  {char:'🎂', tags:['birthday','cake','party']},
  {char:'🍮', tags:['flan','dessert','custard']},
  {char:'🍩', tags:['donut','dessert','snack']},
  {char:'🍪', tags:['cookie','dessert','bake']},
  {char:'🍫', tags:['chocolate','dessert','treat']},
  {char:'🍬', tags:['candy','dessert','sweet']},
  {char:'🍭', tags:['lollipop','dessert','sweet']},
  {char:'🍯', tags:['honey','sweet','tea']},
  {char:'🍼', tags:['babybottle','feeding','infant']},
  {char:'🥤', tags:['soda','drink','refresh']},
  {char:'🧋', tags:['bubbletea','drink','tapioca']},
  {char:'🍹', tags:['cocktail','drink','party']},
  {char:'🍸', tags:['martini','drink','evening']},
  {char:'🍷', tags:['wine','drink','dinner']},
  {char:'🍻', tags:['beer','drink','cheers']},
  {char:'🥂', tags:['cheers','drink','celebrate']},
  {char:'🍺', tags:['lager','drink','pub']},
  {char:'🥃', tags:['whiskey','drink','nightcap']},
  {char:'🍶', tags:['sake','drink','japanese']},
  {char:'🍾', tags:['champagne','drink','celebration']},
  {char:'🥢', tags:['chopsticks','utensil','eat']},
  {char:'🍴', tags:['forkknife','utensil','dining']},
  {char:'🥄', tags:['spoon','utensil','stir']},
  {char:'🔪', tags:['knife','kitchen','prep']},
  {char:'🧊', tags:['ice','chill','drink']},
  {char:'🧃', tags:['juice','drink','box']},
  {char:'🫗', tags:['pour','drink','kitchen']},
  {char:'🍵', tags:['greentea','drink','calm']},
  {char:'🧉', tags:['mate','drink','energy']},
  {char:'🫕', tags:['fondue','meal','share']},
  {char:'🍧', tags:['shaveice','dessert','cool']},
  {char:'🍨', tags:['icecream','dessert','cold']},
  {char:'🍦', tags:['softserve','dessert','treat']},
  {char:'🍡', tags:['dango','dessert','sweet']},
  {char:'🍢', tags:['oden','meal','winter']},
  {char:'🍿', tags:['popcorn','snack','movie']},
  {char:'🥫', tags:['canned','pantry','prep']},
  {char:'🧂', tags:['salt','seasoning','kitchen']},
  {char:'🧹', tags:['cleaning','broom','chores']},
  {char:'🧽', tags:['cleaning','sponge','scrub']},
  {char:'🧻', tags:['paper','restroom','supplies']},
  {char:'🪠', tags:['plunger','bathroom','repair']},
  {char:'🪣', tags:['bucket','cleaning','water']},
  {char:'🧯', tags:['extinguisher','safety','home']},
  {char:'🧷', tags:['pin','sewing','kit']},
  {char:'🧖', tags:['sauna','relax','spa']},
  {char:'🧖‍♂️', tags:['sauna','relax','steam']},
  {char:'🧖‍♀️', tags:['sauna','relax','spa']},
  {char:'💆', tags:['massage','relax','selfcare']},
  {char:'💆‍♂️', tags:['massage','calm','selfcare']},
  {char:'💆‍♀️', tags:['massage','pamper','relax']},
  {char:'💇', tags:['haircut','style','salon']},
  {char:'💇‍♂️', tags:['barber','hair','grooming']},
  {char:'💇‍♀️', tags:['hair','salon','trim']},
  {char:'💅', tags:['nails','beauty','selfcare']},
  {char:'💄', tags:['makeup','lipstick','beauty']},
  {char:'💈', tags:['barber','pole','shop']},
  {char:'🗓️', tags:['calendar','plan','schedule']},
  {char:'📆', tags:['calendar','monthly','plan']},
  {char:'📅', tags:['calendar','daily','organize']},
  {char:'🗒️', tags:['notepad','notes','plan']},
  {char:'📋', tags:['clipboard','checklist','tasks']},
  {char:'📌', tags:['pin','reminder','board']},
  {char:'📎', tags:['paperclip','organize','desk']},
  {char:'📐', tags:['draft','geometry','measure']},
  {char:'📏', tags:['measure','length','craft']},
  {char:'🧮', tags:['abacus','math','count']},
  {char:'🖊️', tags:['pen','write','notes']},
  {char:'✏️', tags:['pencil','sketch','notes']},
  {char:'🖇️', tags:['paperclip','stack','desk']},
  {char:'🖥️', tags:['computer','work','desk']},
  {char:'⌨️', tags:['keyboard','type','office']},
  {char:'🖱️', tags:['mouse','computer','navigate']},
  {char:'🗃️', tags:['files','archive','storage']},
  {char:'🗄️', tags:['cabinet','files','office']},
  {char:'📊', tags:['chart','analytics','report']},
  {char:'📈', tags:['chart','growth','stats']},
  {char:'📉', tags:['chart','decline','analysis']},
  {char:'🧾', tags:['receipt','budget','finance']},
  {char:'🏋️', tags:['weights','gym','strength']},
  {char:'🏋️‍♂️', tags:['weights','training','gym']},
  {char:'🏋️‍♀️', tags:['weights','strength','fitness']},
  {char:'🏊', tags:['swim','pool','cardio']},
  {char:'🏊‍♂️', tags:['swim','exercise','pool']},
  {char:'🏊‍♀️', tags:['swim','fitness','pool']},
  {char:'🚴', tags:['cycle','outdoor','cardio']},
  {char:'🚴‍♂️', tags:['cycling','fitness','ride']},
  {char:'🚴‍♀️', tags:['cycling','fitness','ride']},
  {char:'⛹️', tags:['dribble','sport','play']},
  {char:'⛹️‍♂️', tags:['basketball','sport','play']},
  {char:'⛹️‍♀️', tags:['fitness','basketball','sport']},
  {char:'🤾', tags:['handball','sport','active']},
  {char:'🤾‍♂️', tags:['sport','active','team']},
  {char:'🤾‍♀️', tags:['sport','active','team']},
  {char:'🏌️', tags:['golf','outdoor','focus']},
  {char:'🏌️‍♂️', tags:['golf','practice','swing']},
  {char:'🏌️‍♀️', tags:['golf','outdoor','sport']},
]

const LANGUAGE_STRINGS={
  en:{
    label:'English',
    weekPrefix:'W',
    locale:'en-US',
    summary:{green:'🟩 Done',yellow:'🟨 Should do',red:'🟥 Must do'},
    summaryDistribution:counts=>`🟩 Done: ${counts.green}, 🟨 Should do: ${counts.yellow}, 🟥 Must do: ${counts.red}`,
    summaryScore:'Score',
    summaryScoreAria:score=>`Weekly score: ${score} out of 100`,
    progressLabel:(done,total)=>`${done} of ${total} completed`,
    emptyProgress:'No activities yet',
    noCategories:'Add a category to get started.',
    noActivities:'No activities in this category yet.',
    weekNow:'Now',
    weekNowAria:'Go to current week',
    weeklyTimes:'Times per week',
    languageTitle:'Choose your language',
    languageIntro:'Select your preferred language to personalize the experience.',
    languageConfirm:"I'm ready!",
    configTitle:'Configuration',
    configAddCategory:'Add category',
    configAddActivity:'Add activity',
    configImport:'Import backup (replace)',
    configExport:'Export backup',
    configNote:'Importing a backup will replace your current routines and progress.',
    reminderLabel:'Daily reminder',
    reminderNote:'Send a notification every day at your chosen time to stay on track.',
    reminderPermission:'Enable notifications in your browser to receive reminders.',
    reminderUnsupported:'Daily reminders are not supported in this browser.',
    reminderTimeLabel:'Reminder time',
    reminderHour:'Hour',
    reminderMinute:'Minute',
    reminderNotificationTitle:name=>`Daily reminder: ${name}`,
    reminderNotificationBody:name=>`Take a moment for "${name}" today.`,
    dialogNewActivity:'New activity',
    dialogEditActivity:'Edit activity',
    dialogNewCategory:'New category',
    dialogEditCategory:'Edit category',
    cancel:'Cancel',
    delete:'Delete',
    save:'Save',
    goBack:'Go back',
    homeTitle:'Return to home',
    openConfig:'Open configuration',
    closeConfig:'Close configuration',
    moodPicker:'Select mood',
    editCategory:'Edit category',
    addActivity:'Add activity',
    deleteCategoryConfirm:'Delete this category and its activities?',
  },
  fr:{
    label:'Français',
    weekPrefix:'S',
    locale:'fr-FR',
    summary:{green:'🟩 Fait',yellow:'🟨 Recommandé',red:'🟥 À faire'},
    summaryDistribution:counts=>`🟩 Fait : ${counts.green}, 🟨 Recommandé : ${counts.yellow}, 🟥 Obligatoire : ${counts.red}`,
    summaryScore:'Score',
    summaryScoreAria:score=>`Score hebdomadaire : ${score} sur 100`,
    progressLabel:(done,total)=>`${done} sur ${total} réalisés`,
    emptyProgress:'Aucune activité',
    noCategories:'Ajoutez une catégorie pour commencer.',
    noActivities:'Aucune activité dans cette catégorie pour le moment.',
    weekNow:'Ajd',
    weekNowAria:"Revenir à aujourd'hui",
    weeklyTimes:'Nombre de fois par semaine',
    languageTitle:'Choisissez votre langue',
    languageIntro:"Sélectionnez votre langue préférée pour personnaliser l'expérience.",
    languageConfirm:'Je suis prêt !',
    configTitle:'Configuration',
    configAddCategory:'Ajouter une catégorie',
    configAddActivity:'Ajouter une activité',
    configImport:'Importer une sauvegarde (remplace)',
    configExport:'Exporter une sauvegarde',
    configNote:'Importer une sauvegarde remplacera vos routines et progrès actuels.',
    reminderLabel:'Rappel quotidien',
    reminderNote:'Recevez une notification chaque jour à l’heure de votre choix pour rester motivé.',
    reminderPermission:'Activez les notifications du navigateur pour recevoir les rappels.',
    reminderUnsupported:'Les rappels quotidiens ne sont pas disponibles sur ce navigateur.',
    reminderTimeLabel:"Heure du rappel",
    reminderHour:'Heure',
    reminderMinute:'Minute',
    reminderNotificationTitle:name=>`Rappel quotidien : ${name}`,
    reminderNotificationBody:name=>`Prenez un instant pour « ${name} » aujourd'hui.`,
    dialogNewActivity:'Nouvelle activité',
    dialogEditActivity:"Modifier l'activité",
    dialogNewCategory:'Nouvelle catégorie',
    dialogEditCategory:'Modifier la catégorie',
    cancel:'Annuler',
    delete:'Supprimer',
    save:'Enregistrer',
    goBack:'Retour',
    homeTitle:"Revenir à l'accueil",
    openConfig:'Ouvrir la configuration',
    closeConfig:'Fermer la configuration',
    moodPicker:'Choisir une ambiance',
    editCategory:'Modifier la catégorie',
    addActivity:'Ajouter une activité',
    deleteCategoryConfirm:'Supprimer cette catégorie et ses activités ?',
  }
}

const LANGUAGE_DESCRIPTIONS={
  en:`
    <p><strong>🌱 Routines — Your week, simplified.</strong></p>
    <p>A playful, minimalist app to stay consistent with what truly matters — your daily and weekly habits.<br />🕊️ 100% free, open source, offline &amp; private — no signup, no internet, just you.</p>
    <ul>
      <li>📅 <strong>Weekly dashboard</strong> — see your score and routines 🟥🟨🟩 at a glance.</li>
      <li>💪 <strong>Easy to use</strong> — with emojis, mood and samples.</li>
      <li>🎯 <strong>Practical tracking</strong> — tap days to mark done, get notifications.</li>
      <li>📲 <strong>Install as an app</strong> — Chrome → ⋮ → “Add to Home screen”.</li>
      <li>⚙️ <strong>Fully yours</strong> — customize and get your data anytime.</li>
    </ul>
    <p><em>✨ See your progress, one week at a time.</em></p>
  `,
  fr:`
    <p><strong>🌱 Routines — Ta semaine, simplifiée.</strong></p>
    <p>Une appli ludique et minimaliste pour rester régulier dans ce qui compte vraiment — tes habitudes du quotidien et de la semaine.<br />🕊️ 100&nbsp;% gratuit, open source, hors ligne et privée — aucun compte, aucun cloud, juste toi.</p>
    <ul>
      <li>📅 <strong>Vue hebdo claire</strong> — vois ton score et tes routines 🟥🟨🟩 d’un clin d’œil.</li>
      <li>💪 <strong>Facile à utiliser</strong> — avec émojis, état d'humeur et exemples.</li>
      <li>🎯 <strong>Suivi pratique</strong> — clique sur les jours réalisés, reçois des rappels.</li>
      <li>📲 <strong>Installe-la comme une appli</strong> — Chrome → ⋮ → « Ajouter à l’écran d’accueil ».</li>
      <li>⚙️ <strong>Entièrement personnalisable</strong> — personnalise et récupère tes données à tout moment.</li>
    </ul>
    <p><em>✨ Vois tes progrès, une semaine après l’autre.</em></p>
  `,
}

const CATEGORY_DEFS = [
  { id: 'Body', name: { en: 'Body', fr: 'Corps' } },
  { id: 'Home', name: { en: 'Home', fr: 'Vie' } },
  { id: 'Care', name: { en: 'Care', fr: 'Soi' } },
  { id: 'Connect', name: { en: 'Connect', fr: 'Social' } },
  { id: 'Work', name: { en: 'Work', fr: 'Travail' } },
  { id: 'Relax', name: { en: 'Relax', fr: 'Détente' } },
];

const SAMPLE_TASKS = [
  // 🏋️ Body
  { cat: 'Body', emoji: '🏃', importance: 'must', recur: { type: 'specific', days: [1, 3, 5] }, title: { en: '20 min cardio', fr: 'Cardio 20 min' } },
  { cat: 'Body', emoji: '🤸', importance: 'should', recur: { type: 'daily' }, title: { en: '5 min warm-up', fr: 'Échauffement 5 min' } },
  { cat: 'Body', emoji: '💪', importance: 'must', recur: { type: 'specific', days: [2, 4] }, title: { en: '15 min strength', fr: 'Renforcement 15 min' } },
  { cat: 'Body', emoji: '🧘', importance: 'should', recur: { type: 'daily' }, title: { en: 'Stretching routine', fr: 'Étirements' } },
  { cat: 'Body', emoji: '🚲', importance: 'should', recur: { type: 'specific', days: [6] }, title: { en: 'Bike ride', fr: 'Sortie vélo' } },

  // 🏠 Home
  { cat: 'Home', emoji: '🧺', importance: 'should', recur: { type: 'specific', days: [6] }, title: { en: 'Do laundry', fr: 'Faire une lessive' } },
  { cat: 'Home', emoji: '🧹', importance: 'must', recur: { type: 'specific', days: [0] }, title: { en: 'Clean apartment', fr: 'Nettoyer l’appartement' } },
  { cat: 'Home', emoji: '🪴', importance: 'should', recur: { type: 'specific', days: [3] }, title: { en: 'Water plants', fr: 'Arroser les plantes' } },
  { cat: 'Home', emoji: '🍳', importance: 'must', recur: { type: 'daily' }, title: { en: 'Cook a balanced meal', fr: 'Préparer un repas équilibré' } },
  { cat: 'Home', emoji: '🧾', importance: 'should', recur: { type: 'weekly', times: 1 }, title: { en: 'Sort recycling', fr: 'Trier les déchets' } },

  // 💆 Care
  { cat: 'Care', emoji: '🛏️', importance: 'must', recur: { type: 'daily' }, title: { en: 'In bed before 11pm', fr: 'Au lit avant 23h' } },
  { cat: 'Care', emoji: '💧', importance: 'must', recur: { type: 'daily' }, title: { en: 'Drink 1.5L water', fr: "Boire 1,5 L d’eau" } },
  { cat: 'Care', emoji: '🌬️', importance: 'should', recur: { type: 'specific', days: [2, 5] }, title: { en: 'Breathing session', fr: 'Respiration calme' } },
  { cat: 'Care', emoji: '🧴', importance: 'should', recur: { type: 'specific', days: [3] }, title: { en: 'Skin care', fr: 'Soin du visage' } },
  { cat: 'Care', emoji: '😴', importance: 'should', recur: { type: 'specific', days: [1, 4] }, title: { en: '20 min nap', fr: 'Sieste 20 min' } },

  // 🤝 Connect
  { cat: 'Connect', emoji: '💬', importance: 'should', recur: { type: 'specific', days: [2, 4] }, title: { en: 'Message a loved one', fr: 'Message à un proche' } },
  { cat: 'Connect', emoji: '📞', importance: 'must', recur: { type: 'weekly', times: 1 }, title: { en: 'Call family', fr: 'Appeler la famille' } },
  { cat: 'Connect', emoji: '🍽️', importance: 'should', recur: { type: 'specific', days: [3] }, title: { en: 'Shared meal', fr: 'Repas partagé' } },
  { cat: 'Connect', emoji: '🤗', importance: 'should', recur: { type: 'daily' }, title: { en: 'Give a hug', fr: 'Faire un câlin' } },
  { cat: 'Connect', emoji: '🕺', importance: 'must', recur: { type: 'specific', days: [5] }, title: { en: 'Social outing', fr: 'Sortie sociale' } },

  // 💼 Work
  { cat: 'Work', emoji: '🗓️', importance: 'must', recur: { type: 'daily' }, title: { en: 'Plan your day', fr: 'Planifier la journée' } },
  { cat: 'Work', emoji: '📧', importance: 'should', recur: { type: 'specific', days: [1, 3, 5] }, title: { en: 'Inbox zero check', fr: 'Tri des mails' } },
  { cat: 'Work', emoji: '🧠', importance: 'should', recur: { type: 'specific', days: [2, 4] }, title: { en: 'Learn something new', fr: 'Apprendre quelque chose de nouveau' } },
  { cat: 'Work', emoji: '📊', importance: 'must', recur: { type: 'weekly', times: 1 }, title: { en: 'Review progress', fr: 'Faire le point sur les objectifs' } },
  { cat: 'Work', emoji: '☕', importance: 'should', recur: { type: 'daily' }, title: { en: 'Take mindful break', fr: 'Pause consciente' } },

  // 🌿 Relax
  { cat: 'Relax', emoji: '🎧', importance: 'should', recur: { type: 'specific', days: [2, 5] }, title: { en: 'Listen to music', fr: 'Écouter de la musique' } },
  { cat: 'Relax', emoji: '📺', importance: 'should', recur: { type: 'daily' }, title: { en: 'Watch a show', fr: 'Regarder une série' } },
  { cat: 'Relax', emoji: '🕯️', importance: 'should', recur: { type: 'specific', days: [4] }, title: { en: 'Candle evening', fr: 'Soirée bougie' } },
  { cat: 'Relax', emoji: '🛁', importance: 'should', recur: { type: 'specific', days: [6] }, title: { en: 'Take a relaxing bath', fr: 'Bain relaxant' } },
  { cat: 'Relax', emoji: '🌳', importance: 'must', recur: { type: 'specific', days: [0] }, title: { en: 'Walk in nature', fr: 'Balade en nature' } },
];


function sanitizeLanguage(lang){ return lang==='fr' ? 'fr' : 'en' }
function getStrings(lang){ return LANGUAGE_STRINGS[sanitizeLanguage(lang)] || LANGUAGE_STRINGS.en }
function cloneRecur(recur){
  if(!recur || typeof recur!=='object'){ return {type:'daily'} }
  if(recur.type==='weekly'){ return {type:'weekly', times:recur.times} }
  if(recur.type==='specific'){ return {type:'specific', days:Array.isArray(recur.days) ? [...recur.days] : []} }
  return {...recur}
}
function defaultCategories(lang){
  const safe = sanitizeLanguage(lang)
  return CATEGORY_DEFS.map(def=>({id:def.id, name:def.name[safe] || def.name.en}))
}
function sampleTasks(lang){
  const safe = sanitizeLanguage(lang)
  return SAMPLE_TASKS.map(task=>({
    cat:task.cat,
    emoji:task.emoji,
    importance:task.importance,
    recur:cloneRecur(task.recur),
    title:task.title[safe] || task.title.en,
  }))
}

function cloneDoneMap(source){
  const out={}
  if(source && typeof source==='object'){
    for(const [day, entries] of Object.entries(source)){
      if(entries && typeof entries==='object'){
        out[day]={...entries}
      }
    }
  }
  return out
}

function sanitizeDateString(value){
  if(typeof value!=='string') return null
  return ISO_DATE_RE.test(value) ? value : null
}

function safeWeekStart(value){
  const clean = sanitizeDateString(value)
  return clean ? weekStart(clean) : null
}

function reminderEligible(recur){
  const type = recur && recur.type
  return type==='daily' || type==='weekly'
}

function normalizeReminderTime(value){
  const base = value && typeof value==='object' ? value : {}
  let hour = Number(base.hour)
  if(!Number.isInteger(hour)){ hour = DEFAULT_REMINDER_TIME.hour }
  hour = Math.min(23, Math.max(0, hour))
  let minute = Number(base.minute)
  if(!Number.isInteger(minute)){ minute = DEFAULT_REMINDER_TIME.minute }
  minute = Math.round(minute / 5) * 5
  minute = Math.min(55, Math.max(0, minute))
  return {hour, minute}
}

function normalizeState(raw){
  const base = raw && typeof raw==='object' ? raw : {}
  const allowedViews=new Set(['home','category','config'])
  const next={
    tasks:Array.isArray(base.tasks) ? base.tasks.map(task=>({...task})) : [],
    done:cloneDoneMap(base.done),
    categories:Array.isArray(base.categories) ? base.categories.map(cat=>({...cat})) : [],
    ui: base.ui && typeof base.ui==='object' ? {...base.ui} : {},
  }
  const lang = sanitizeLanguage(next.ui.language || base.language)
  const selectedWeek = safeWeekStart(next.ui.selectedWeekStart) || safeWeekStart(next.ui.historyWeekStart) || safeWeekStart(base.ui && base.ui.selectedWeekStart) || currentWeekStart
  next.ui.selectedWeekStart = selectedWeek
  next.ui.currentView = allowedViews.has(next.ui.currentView) ? next.ui.currentView : 'home'
  next.ui.currentCat = next.ui.currentCat || null
  next.ui.categoryWeekStart = safeWeekStart(next.ui.categoryWeekStart) || selectedWeek
  next.ui.editTaskId = null
  next.ui.editCategoryId = null
  next.ui.language = lang
  delete next.ui.historyWeekStart
  delete next.ui.categorySource

  const startCandidates=[]
  const addCandidate=value=>{ const week = safeWeekStart(value); if(week){ startCandidates.push(week) } }
  addCandidate(next.ui.appStartWeek)
  addCandidate(base.ui && base.ui.appStartWeek)
  addCandidate(base.ui && base.ui.appStart)
  addCandidate(base.appStartWeek)
  addCandidate(base.appStart)
  addCandidate(base.startedAt)
  addCandidate(next.ui.selectedWeekStart)
  addCandidate(next.ui.categoryWeekStart)
  next.tasks.forEach(task=> addCandidate(task.createdAt))
  for(const day of Object.keys(next.done)){ addCandidate(day) }
  const earliest = startCandidates.length>0 ? startCandidates.reduce((min, week)=> compareDate(week, min)<0 ? week : min, startCandidates[0]) : selectedWeek
  const startWeek = earliest || currentWeekStart
  next.ui.appStartWeek = startWeek
  if(compareDate(next.ui.selectedWeekStart, startWeek)<0){ next.ui.selectedWeekStart = startWeek }
  if(compareDate(next.ui.categoryWeekStart, startWeek)<0){ next.ui.categoryWeekStart = startWeek }

  const defaultsList = defaultCategories(lang)
  if(next.categories.length===0){
    next.categories = defaultsList.map(c=>({...c}))
  }else{
    const defaults = Object.fromEntries(defaultsList.map(c=>[c.id,c]))
    next.categories = next.categories.map(cat=>{
      const baseCat = defaults[cat.id] || {}
      const id = cat.id || ('cat-'+uid())
      const name = cat.name || cat.label || baseCat.name || id
      const normalized={id, name}
      const emoji = typeof cat.emoji==='string' && cat.emoji.trim() ? cat.emoji.trim() : (typeof baseCat.emoji==='string' && baseCat.emoji.trim() ? baseCat.emoji.trim() : '')
      const color = typeof cat.color==='string' && cat.color.trim() ? cat.color.trim() : (typeof baseCat.color==='string' && baseCat.color.trim() ? baseCat.color.trim() : '')
      const mood = typeof cat.mood==='string' && cat.mood.trim() ? cat.mood.trim() : ''
      if(emoji){ normalized.emoji = emoji }
      if(color){ normalized.color = color }
      if(mood){ normalized.mood = mood }
      return normalized
    })
    for(const def of defaultsList){
      if(!next.categories.some(c=>c.id===def.id)){
        next.categories.push({...def})
      }
    }
  }

  next.tasks = next.tasks.map(task=>{
    const copy={...task}
    copy.id = copy.id || uid()
    if(copy.importance==='nice'){ copy.importance='should' }
    if(copy.importance!=='must' && copy.importance!=='should'){ copy.importance='should' }
    if(!copy.recur || typeof copy.recur!=='object'){ copy.recur={type:'daily'} }
    if(copy?.recur?.type==='weekly' && Object.prototype.hasOwnProperty.call(copy.recur,'weekday')){
      delete copy.recur.weekday
    }
    if(copy?.recur?.type==='weekly'){
      if(typeof copy.recur.times!=='number' || copy.recur.times<1){ copy.recur.times=1 }
      copy.recur.times = Math.min(6, Math.max(1, Math.round(copy.recur.times)))
    }
    if(copy?.recur?.type==='specific' && Array.isArray(copy.recur.days)){
      copy.recur.days = copy.recur.days.map(d=> Number(d)).filter(d=> Number.isInteger(d))
    }
    if(!copy.cat){
      copy.cat = next.categories[0]?.id || defaultsList[0]?.id || 'General'
    }
    copy.notifyDaily = !!copy.notifyDaily && reminderEligible(copy.recur) && supportsNotifications
    copy.reminderTime = normalizeReminderTime(copy.reminderTime)
    return copy
  })

  for(const task of next.tasks){
    if(!next.categories.some(c=>c.id===task.cat)){
      const name = task.cat || 'Category'
      next.categories.push({id:task.cat, name})
    }
  }

  return next
}

let state = null
let eventsBound = false
let languageEventsBound = false
let pendingLanguage = 'fr'

function currentLanguage(){ return state ? sanitizeLanguage(state.ui?.language) : 'en' }

const els={
  summary: document.getElementById('summary'),
  summaryProgress: document.querySelector('.summary-progress'),
  summaryScore: document.getElementById('summaryScore'),
  summaryScoreValue: document.getElementById('summaryScoreValue'),
  summaryScoreLabel: document.getElementById('summaryScoreLabel'),
  pillGreen: document.getElementById('pillGreen'),
  pillYellow: document.getElementById('pillYellow'),
  pillRed: document.getElementById('pillRed'),
  summaryBarGreen: document.getElementById('summaryBarGreen'),
  summaryBarYellow: document.getElementById('summaryBarYellow'),
  summaryBarRed: document.getElementById('summaryBarRed'),
  labelGreen: document.getElementById('labelGreen'),
  labelYellow: document.getElementById('labelYellow'),
  labelRed: document.getElementById('labelRed'),
  catGrid: document.getElementById('catGrid'),
  home: document.getElementById('home'),
  category: document.getElementById('category'),
  config: document.getElementById('config'),
  weekControls: document.getElementById('weekControls'),
  weekLabel: document.getElementById('weekLabel'),
  weekPrev: document.getElementById('weekPrev'),
  weekNext: document.getElementById('weekNext'),
  weekNow: document.getElementById('weekNow'),
  configBtn: document.getElementById('configBtn'),
  homeBtn: document.getElementById('homeBtn'),
  backBtn: document.getElementById('backBtn'),
  catTitle: document.getElementById('catTitle'),
  catAddActivityBtn: document.getElementById('catAddActivityBtn'),
  editCategoryBtn: document.getElementById('editCategoryBtn'),
  catMood: document.getElementById('catMood'),
  taskList: document.getElementById('taskList'),
  taskDialog: document.getElementById('taskDialog'),
  closeDialog: document.getElementById('closeDialog'),
  dialogTitle: document.getElementById('dialogTitle'),
  f_title: document.getElementById('f_title'),
  f_emoji: document.getElementById('f_emoji'),
  f_cat: document.getElementById('f_cat'),
  f_importance: document.getElementById('f_importance'),
  f_recur: document.getElementById('f_recur'),
  weeklyWrap: document.getElementById('weeklyWrap'),
  f_weeklyTimes: document.getElementById('f_weeklyTimes'),
  specificWrap: document.getElementById('specificWrap'),
  specificDays: document.getElementById('specificDays'),
  reminderField: document.getElementById('reminderField'),
  reminderLabel: document.getElementById('reminderLabel'),
  reminderNote: document.getElementById('reminderNote'),
  reminderTimeWrap: document.getElementById('reminderTimeWrap'),
  reminderTimeLabel: document.getElementById('reminderTimeLabel'),
  reminderHourLabel: document.getElementById('reminderHourLabel'),
  reminderMinuteLabel: document.getElementById('reminderMinuteLabel'),
  f_notifyDaily: document.getElementById('f_notifyDaily'),
  f_reminderHour: document.getElementById('f_reminderHour'),
  f_reminderMinute: document.getElementById('f_reminderMinute'),
  emojiSearch: document.getElementById('emojiSearch'),
  emojiResults: document.getElementById('emojiResults'),
  saveTask: document.getElementById('saveTask'),
  deleteTask: document.getElementById('deleteTask'),
  categoryDialog: document.getElementById('categoryDialog'),
  categoryForm: document.getElementById('categoryForm'),
  catDialogTitle: document.getElementById('catDialogTitle'),
  closeCategoryDialog: document.getElementById('closeCategoryDialog'),
  c_name: document.getElementById('c_name'),
  saveCategory: document.getElementById('saveCategory'),
  deleteCategory: document.getElementById('deleteCategory'),
  configAddActivity: document.getElementById('configAddActivity'),
  configAddCategory: document.getElementById('configAddCategory'),
  configImport: document.getElementById('configImport'),
  configExport: document.getElementById('configExport'),
  configImportInput: document.getElementById('configImportInput'),
  configTitle: document.querySelector('.config-head h2'),
  configNote: document.querySelector('.config-note'),
  languageDialog: document.getElementById('languageDialog'),
  languageDialogTitle: document.getElementById('languageDialogTitle'),
  languageDialogIntro: document.getElementById('languageDialogIntro'),
  languageOptionsWrap: document.querySelector('#languageDialog .language-options'),
  languageDescription: document.getElementById('languageDescription'),
  languageConfirm: document.getElementById('languageConfirm'),
  weeklyTimesLabel: document.getElementById('weeklyTimesLabel'),
}

els.languageOptions = els.languageDialog ? els.languageDialog.querySelectorAll('[data-lang]') : []

function bindEvents(){
  if(eventsBound) return
  eventsBound = true
  if(els.backBtn){
    els.backBtn.addEventListener('click', ()=>{
      if(!state) return
      state.ui.currentCat=null
      updateView('home')
    })
  }
  if(els.catAddActivityBtn){
    els.catAddActivityBtn.addEventListener('click', ()=>{
      if(!state) return
      if(!state.ui.currentCat) return
      openTaskDialog('create')
    })
  }
  if(els.configBtn){
    els.configBtn.addEventListener('click', ()=>{
      if(!state) return
      if(state.ui.currentView==='config'){
        updateView('home')
      }else{
        state.ui.currentCat=null
        updateView('config')
      }
    })
  }
  if(els.homeBtn){
    els.homeBtn.addEventListener('click', ()=>{
      if(!state) return
      state.ui.currentCat=null
      updateView('home')
    })
  }
  if(els.configAddActivity){ els.configAddActivity.addEventListener('click', ()=> openTaskDialog('create')) }
  if(els.configAddCategory){ els.configAddCategory.addEventListener('click', ()=> openCategoryDialog('create')) }
  if(els.configExport){ els.configExport.addEventListener('click', exportBackup) }
  if(els.configImport){ els.configImport.addEventListener('click', ()=>{ if(els.configImportInput) els.configImportInput.click() }) }
  if(els.configImportInput){ els.configImportInput.addEventListener('change', handleImportFile) }
  if(els.editCategoryBtn){
    els.editCategoryBtn.addEventListener('click', ()=>{
      if(!state || !state.ui.currentCat) return
      openCategoryDialog('edit', state.ui.currentCat)
    })
  }
  if(els.closeDialog){ els.closeDialog.addEventListener('click', ()=> els.taskDialog.close()) }
  if(els.closeCategoryDialog){ els.closeCategoryDialog.addEventListener('click', ()=> els.categoryDialog.close()) }
  if(els.f_recur){ els.f_recur.addEventListener('change', onRecurChange) }
  if(els.f_notifyDaily){ els.f_notifyDaily.addEventListener('change', handleReminderToggle) }
  if(els.weekPrev){ els.weekPrev.addEventListener('click', ()=>{ changeSelectedWeek(-1) }) }
  if(els.weekNext){ els.weekNext.addEventListener('click', ()=>{ changeSelectedWeek(1) }) }
  if(els.weekNow){ els.weekNow.addEventListener('click', goToCurrentWeek) }
  if(els.emojiSearch){ els.emojiSearch.addEventListener('input', updateEmojiResults) }
  if(els.saveTask){ els.saveTask.addEventListener('click', submitTask) }
  if(els.deleteTask){ els.deleteTask.addEventListener('click', deleteCurrentTask) }
  if(els.saveCategory){ els.saveCategory.addEventListener('click', submitCategory) }
  if(els.deleteCategory){ els.deleteCategory.addEventListener('click', deleteCurrentCategory) }
  if(els.categoryForm){ els.categoryForm.addEventListener('submit', e=>{ e.preventDefault(); submitCategory() }) }
  if(els.categoryDialog){ els.categoryDialog.addEventListener('close', ()=>{ if(state){ state.ui.editCategoryId=null } }) }
}

updateEmojiResults()
initSpecificDayPicker()
onRecurChange()
updateReminderVisibility()

function initializeApp(){
  if(!state) return
  bindEvents()
  applyLanguage()
  refreshAll()
  updateView(state.ui.currentView || 'home')
}

function applyLanguage(){
  if(!state) return
  const lang = currentLanguage()
  const strings = getStrings(lang)
  document.documentElement.lang = lang
  if(els.weekNow){
    els.weekNow.textContent = strings.weekNow
    els.weekNow.setAttribute('aria-label', strings.weekNowAria || strings.weekNow)
  }
  if(els.labelGreen){ els.labelGreen.textContent = strings.summary?.green || 'Done' }
  if(els.labelYellow){ els.labelYellow.textContent = strings.summary?.yellow || 'Should do' }
  if(els.labelRed){ els.labelRed.textContent = strings.summary?.red || 'Must do' }
  if(els.summaryScoreLabel){ els.summaryScoreLabel.textContent = strings.summaryScore || 'Score' }
  if(els.configAddCategory){ els.configAddCategory.textContent = strings.configAddCategory }
  if(els.configAddActivity){ els.configAddActivity.textContent = strings.configAddActivity }
  if(els.configImport){ els.configImport.textContent = strings.configImport }
  if(els.configExport){ els.configExport.textContent = strings.configExport }
  if(els.configTitle){ els.configTitle.textContent = strings.configTitle }
  if(els.configNote){ els.configNote.textContent = strings.configNote }
  if(els.weeklyTimesLabel){ els.weeklyTimesLabel.textContent = strings.weeklyTimes }
  if(els.languageDialogTitle){ els.languageDialogTitle.textContent = strings.languageTitle }
  if(els.languageDialogIntro){ els.languageDialogIntro.textContent = strings.languageIntro }
  if(els.reminderLabel){ els.reminderLabel.textContent = strings.reminderLabel || 'Daily reminder' }
  if(els.reminderTimeLabel){ els.reminderTimeLabel.textContent = strings.reminderTimeLabel || 'Reminder time' }
  if(els.reminderHourLabel){ els.reminderHourLabel.textContent = strings.reminderHour || 'Hour' }
  if(els.reminderMinuteLabel){ els.reminderMinuteLabel.textContent = strings.reminderMinute || 'Minute' }
  if(els.reminderNote){
    const note = supportsNotifications ? strings.reminderNote : strings.reminderUnsupported
    els.reminderNote.textContent = note || ''
  }
  const taskCancel = els.taskDialog ? els.taskDialog.querySelector('button[value="cancel"]') : null
  if(taskCancel){ taskCancel.textContent = strings.cancel }
  if(els.saveTask){ els.saveTask.textContent = strings.save }
  if(els.deleteTask){ els.deleteTask.textContent = strings.delete }
  const categoryCancel = els.categoryDialog ? els.categoryDialog.querySelector('button[value="cancel"]') : null
  if(categoryCancel){ categoryCancel.textContent = strings.cancel }
  if(els.saveCategory){ els.saveCategory.textContent = strings.save }
  if(els.deleteCategory){ els.deleteCategory.textContent = strings.delete }
  if(els.editCategoryBtn){
    els.editCategoryBtn.setAttribute('aria-label', strings.editCategory || 'Edit category')
    els.editCategoryBtn.title = strings.editCategory || 'Edit category'
  }
  if(els.catAddActivityBtn){
    const addLabel = strings.addActivity || strings.configAddActivity || 'Add activity'
    els.catAddActivityBtn.setAttribute('aria-label', addLabel)
    els.catAddActivityBtn.title = addLabel
  }
  if(els.homeBtn){ els.homeBtn.setAttribute('aria-label', strings.homeTitle || strings.weekNow) }
  if(els.backBtn){ els.backBtn.setAttribute('aria-label', strings.goBack || 'Go back') }
  if(els.languageConfirm){ els.languageConfirm.textContent = strings.languageConfirm || strings.save }
  pendingLanguage = currentLanguage()
  refreshLanguageDialog()
  updateConfigButton(state.ui.currentView || 'home')
  updateWeekLabel()
  updateReminderVisibility()
}

function refreshLanguageDialog(){
  const lang = sanitizeLanguage(pendingLanguage)
  const strings = getStrings(lang)
  if(els.languageDialogTitle){ els.languageDialogTitle.textContent = strings.languageTitle }
  if(els.languageDialogIntro){ els.languageDialogIntro.textContent = strings.languageIntro }
  if(els.languageOptionsWrap){ els.languageOptionsWrap.setAttribute('aria-label', strings.languageTitle) }
  if(els.languageDescription){
    const markup = LANGUAGE_DESCRIPTIONS[lang] || ''
    els.languageDescription.innerHTML = markup.trim()
  }
  if(els.languageConfirm){ els.languageConfirm.textContent = strings.languageConfirm || strings.save || 'OK' }
  if(els.languageOptions){
    Array.from(els.languageOptions).forEach(btn=>{
      const btnLang = sanitizeLanguage(btn.dataset.lang)
      const isActive = btnLang===lang
      btn.classList.toggle('active', isActive)
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    })
  }
}

function setPendingLanguage(lang){
  pendingLanguage = sanitizeLanguage(lang)
  refreshLanguageDialog()
}

function bindLanguageOptions(){
  if(languageEventsBound || !els.languageOptions) return
  Array.from(els.languageOptions).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const choice = sanitizeLanguage(btn.dataset.lang)
      setPendingLanguage(choice)
    })
  })
  if(els.languageConfirm){
    els.languageConfirm.addEventListener('click', ()=>{
      chooseLanguage(pendingLanguage)
    })
  }
  languageEventsBound = true
  refreshLanguageDialog()
}

function showLanguageDialog(prefLang){
  const lang = sanitizeLanguage(prefLang || 'fr')
  setPendingLanguage(lang)
  if(els.languageDialog){
    els.languageDialog.showModal()
  }else{
    chooseLanguage(lang)
  }
}

function chooseLanguage(lang){
  const selected = sanitizeLanguage(lang)
  pendingLanguage = selected
  state = normalizeState(seed(selected))
  save()
  if(els.languageDialog && typeof els.languageDialog.close==='function'){
    try{ els.languageDialog.close() }catch(e){ /* dialog might not be open */ }
  }
  initializeApp()
}

function startApp(){
  bindLanguageOptions()
  const stored = load()
  if(stored){
    state = normalizeState(stored)
    save()
    initializeApp()
  }else{
    showLanguageDialog()
  }
}

function updateView(view){
  state.ui.currentView=view
  if(view==='category' && !state.ui.currentCat){
    state.ui.currentView='home'
    view='home'
  }
  const isCategory = view==='category'
  const isHome = view==='home'
  const isConfig = view==='config'
  if(!isCategory){
    state.ui.currentCat=null
  }
  els.home.classList.toggle('active', isHome)
  els.category.classList.toggle('active', isCategory)
  if(els.config){ els.config.classList.toggle('active', isConfig) }
  const showWeekControls = isHome
  if(els.weekControls){ els.weekControls.style.display = showWeekControls ? '' : 'none' }
  if(els.summary){ els.summary.style.display = isHome ? '' : 'none' }
  if(isCategory && state.ui.currentCat){
    renderCategory(state.ui.currentCat, state.ui.categoryWeekStart)
  }else if(isHome){
    renderHome()
  }
  updateConfigButton(view)
  save()
}

function updateConfigButton(view){
  if(!els.configBtn) return
  const isConfig = view==='config'
  const strings = getStrings(currentLanguage())
  els.configBtn.setAttribute('aria-label', isConfig ? strings.closeConfig : strings.openConfig)
  els.configBtn.setAttribute('aria-pressed', isConfig ? 'true' : 'false')
  els.configBtn.classList.toggle('active', isConfig)
}

function weekStart(ymd){
  const d = new Date(ymd+'T00:00:00')
  const day = (d.getDay()+6)%7
  d.setDate(d.getDate()-day)
  return fmtDate(d)
}
function addDays(ymd, days){
  const d = new Date(ymd+'T00:00:00')
  d.setDate(d.getDate()+days)
  return fmtDate(d)
}
function weekDays(weekStart){
  return Array.from({length:7}, (_,i)=> addDays(weekStart,i))
}
function formatWeekRange(weekStart, lang){
  const start = new Date(weekStart+'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate()+6)
  const strings = getStrings(lang)
  const locale = strings.locale || (lang==='fr' ? 'fr-FR' : 'en-US')
  const monthFmt = new Intl.DateTimeFormat(locale,{month:'short'})
  const dayFmt = new Intl.DateTimeFormat(locale,{day:'numeric'})
  const startMonth = monthFmt.format(start)
  const endMonth = monthFmt.format(end)
  const startDay = dayFmt.format(start)
  const endDay = dayFmt.format(end)
  if(lang==='fr'){
    if(startMonth===endMonth){
      return `${startDay} - ${endDay} ${endMonth}`
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`
  }
  if(startMonth===endMonth){
    return `${startMonth} ${startDay} - ${endDay}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
}

function weekIndexFor(weekStart){
  const current = new Date(currentWeekStart+'T00:00:00')
  const target = new Date(weekStart+'T00:00:00')
  const diff = Math.floor((current - target)/604800000)
  return (diff>=0 ? diff : 0) + 1
}
function compareDate(a,b){ return a.localeCompare(b) }
function limitDateForWeek(weekStart){
  if(weekStart===currentWeekStart){
    return todayISO()
  }
  return addDays(weekStart,6)
}
function isFuture(day, limit){ return compareDate(day, limit)>0 }

function renderSummary(){
  if(!state) return
  const week = state.ui.selectedWeekStart
  const days = weekDays(week)
  const limit = limitDateForWeek(week)
  const counts={green:0,yellow:0,red:0}
  let mustDue=0
  let mustDone=0
  let shouldDue=0
  let shouldDone=0
  for(const task of state.tasks){
    const status = taskWeeklyStatus(task, days, limit)
    if(status && Object.prototype.hasOwnProperty.call(counts, status)){
      counts[status]++
    }
    if(status!==null){
      if(task.importance==='must'){
        mustDue++
        if(status==='green'){ mustDone++ }
      }else{
        shouldDue++
        if(status==='green'){ shouldDone++ }
      }
    }
  }
  els.pillGreen.textContent=counts.green
  els.pillYellow.textContent=counts.yellow
  els.pillRed.textContent=counts.red
  updateSummarySegments(counts)
  const strings = getStrings(currentLanguage())
  updateSummaryScore({mustDone, mustDue, shouldDone, shouldDue}, strings)
  if(els.summaryProgress){ els.summaryProgress.setAttribute('aria-label', strings.summaryDistribution(counts)) }
}

function updateSummarySegments(counts){
  const total = counts.green + counts.yellow + counts.red
  const segments=[
    {el:els.summaryBarGreen, count:counts.green},
    {el:els.summaryBarYellow, count:counts.yellow},
    {el:els.summaryBarRed, count:counts.red},
  ]
  segments.forEach(({el,count})=>{
    if(!el) return
    el.style.flexBasis='0%'
    el.style.flexGrow = total===0 ? 0 : count
    el.style.opacity = total===0 ? 0 : (count>0 ? 1 : 0)
  })
  if(els.summaryProgress){ els.summaryProgress.classList.toggle('is-empty', total===0) }
}

function calculateSummaryScore(mustDone, mustDue, shouldDone, shouldDue){
  const MUST_WEIGHT = 0.7
  const SHOULD_WEIGHT = 0.3
  const clamp = value=> Math.max(0, Math.min(1, value))
  const mustRatio = mustDue===0 ? 1 : clamp(mustDone / mustDue)
  const shouldRatio = shouldDue===0 ? 1 : clamp(shouldDone / shouldDue)
  const combined = clamp(MUST_WEIGHT * mustRatio + SHOULD_WEIGHT * shouldRatio)
  return Math.round(combined * 100)
}

function updateSummaryScore(stats, strings){
  if(!els.summaryScoreValue) return
  const score = calculateSummaryScore(stats.mustDone, stats.mustDue, stats.shouldDone, stats.shouldDue)
  els.summaryScoreValue.textContent = String(score)
  if(els.summaryScoreLabel && strings.summaryScore){
    els.summaryScoreLabel.textContent = strings.summaryScore
  }
  if(els.summaryScore){
    const redLabel = strings.summary?.red || 'Must do'
    const yellowLabel = strings.summary?.yellow || 'Should do'
    const detail = `${redLabel}: ${stats.mustDone}/${stats.mustDue || 0}, ${yellowLabel}: ${stats.shouldDone}/${stats.shouldDue || 0}`
    const aria = typeof strings.summaryScoreAria==='function'
      ? strings.summaryScoreAria(score)
      : `Score ${score} out of 100`
    els.summaryScore.setAttribute('aria-label', `${aria} (${detail})`)
    els.summaryScore.title = `${score}/100 • ${detail}`
  }
}

function renderHome(){
  if(!state) return
  const week = state.ui.selectedWeekStart
  state.ui.categoryWeekStart = week
  const days = weekDays(week)
  const limit = limitDateForWeek(week)
  const strings = getStrings(currentLanguage())
  els.catGrid.innerHTML=''
  const categories = CATS()
  if(categories.length===0){
    els.catGrid.innerHTML=`<p class="count">${escapeHtml(strings.noCategories)}</p>`
    return
  }
  for(const c of categories){
    const tasks = state.tasks.filter(t=>t.cat===c.id)
    const statuses = tasks.length>0 ? days.map(day=> dayStatus(day, tasks, limit)) : days.map(()=> 'off')
    const progress = tasks.length>0 ? categoryProgress(tasks, days, limit) : null
    const progressHtml = renderCategoryProgress(progress)
    const catchup = tasks.length>0 ? catchupEmojis(tasks, days, limit) : []
    const catchupAttr = catchup.length ? '' : ' aria-hidden="true"'
    const catchupHtml = catchup.map(em=> escapeHtml(em||'❗')).join(' ')
    const mood = typeof c.mood==='string' && c.mood.trim() ? c.mood.trim() : ''
    const titleHtml = `${mood ? `<span class="card-mood">${escapeHtml(mood)}</span>` : ''}<span>${escapeHtml(categoryLabel(c.id))}</span>`
    const card=document.createElement('div')
    card.className='card'
    card.dataset.cat=c.id
    card.innerHTML=`
      <div class="card-head">
        <div class="card-title">${titleHtml}</div>
        ${progressHtml}
      </div>
      <div class="cell-row">${statuses.map((s,idx)=>`<div class="week-cell status-${s}"><span>${WEEKDAY_SHORT[idx]}</span></div>`).join('')}</div>
        <div class="catchup-line"${catchupAttr}>${catchupHtml}</div>
    `
    card.addEventListener('click', ()=> openCategory(c.id, week))
    els.catGrid.appendChild(card)
  }
}

function catchupEmojis(tasks, days, limit){
  const set=new Set()
  for(const task of tasks){
    if(task.importance!=='must') continue
    if(taskWeeklyStatus(task, days, limit)==='red'){
      set.add(task.emoji || '❗')
    }
  }
  return [...set]
}

function categoryProgress(tasks, days, limit){
  const relevantDays = days.filter(day=> !isFuture(day, limit))
  let totalOcc=0
  let doneOcc=0
  for(const task of tasks){
    if(task.recur.type==='weekly'){
      if(relevantDays.length===0) continue
      const times = task.recur.times || 1
      const doneCount = relevantDays.filter(day=> isDone(task, day)).length
      totalOcc+=times
      doneOcc+=Math.min(doneCount, times)
    }else{
      for(const day of relevantDays){
        if(isDue(task, day)){
          totalOcc+=1
          if(isDone(task, day)){ doneOcc+=1 }
        }
      }
    }
  }
  return {done:doneOcc,total:totalOcc}
}

function renderCategoryProgress(progress){
  const strings = getStrings(currentLanguage())
  if(!progress || !progress.total){
    const aria = strings.emptyProgress
    return `<div class="circle-progress" data-empty="true" role="img" aria-label="${escapeHtml(aria)}" title="${escapeHtml(aria)}"><span>—</span></div>`
  }
  const safeTotal = Math.max(0, progress.total)
  const safeDone = Math.max(0, Math.min(progress.done, safeTotal))
  const ratio = safeTotal===0 ? 0 : Math.min(1, safeDone/safeTotal)
  const aria = categoryProgressLabel(safeDone, safeTotal)
  return `<div class="circle-progress" style="--progress:${ratio}" role="img" aria-label="${escapeHtml(aria)}" title="${escapeHtml(aria)}"><span><span class="summary-count">${safeDone}</span><small>${safeTotal}</small></span></div>`
}

function categoryProgressLabel(done,total){
  const strings = getStrings(currentLanguage())
  return strings.progressLabel ? strings.progressLabel(done,total) : `${done}/${total}`
}

function renderCategory(cat, week){
  if(!state) return
  state.ui.currentCat = cat
  const targetWeek = week || state.ui.selectedWeekStart
  state.ui.categoryWeekStart = targetWeek
  save()
  const strings = getStrings(currentLanguage())
  const catEntry = categoryById(cat)
  if(els.catTitle){ els.catTitle.textContent = catEntry ? catEntry.name : categoryLabel(cat) }
  if(els.editCategoryBtn){
    const canEdit = !!catEntry
    els.editCategoryBtn.disabled = !canEdit
    els.editCategoryBtn.style.visibility = canEdit ? 'visible' : 'hidden'
  }
  if(els.catAddActivityBtn){
    const canAdd = !!catEntry
    els.catAddActivityBtn.disabled = !canAdd
    els.catAddActivityBtn.style.visibility = canAdd ? 'visible' : 'hidden'
  }
  renderMoodSelector(catEntry)
  const tasks = state.tasks.filter(t=>t.cat===cat)
  const days = weekDays(targetWeek)
  const limit = limitDateForWeek(targetWeek)
  els.taskList.innerHTML=''
  if(tasks.length===0){
    els.taskList.innerHTML=`<p class="count">${escapeHtml(strings.noActivities)}</p>`
    return
  }
  tasks.sort((a,b)=> (a.importance>b.importance?1:-1) || a.title.localeCompare(b.title))
  for(const task of tasks){
    const row=document.createElement('div')
    row.className='task'
    row.dataset.importance = task.importance
    const freqMark = frequencyLabel(task.recur, currentLanguage())
    const freqHtml = freqMark?` <span class="freq"><span class="freq-value">${escapeHtml(freqMark)}</span></span>`:''
    const reminderBadge = task.notifyDaily && reminderEligible(task.recur) ? ` <span class="reminder" title="${escapeHtml(strings.reminderLabel)}" aria-label="${escapeHtml(strings.reminderLabel)}">🔔</span>` : ''
    row.innerHTML=`
      <div class="task-header">
        <span class="em">${escapeHtml(task.emoji||'🎯')}</span>
        <div class="task-info">
          <div class="title">${escapeHtml(task.title)}${freqHtml}${reminderBadge}</div>
        </div>
        <div class="task-actions">
          <button type="button" data-act="edit" aria-label="Edit activity">✏️</button>
        </div>
      </div>
      <div class="task-week"></div>
    `
    const weekRow = row.querySelector('.task-week')
    days.forEach((day,idx)=>{
      const status = dayStatusForTask(task, day, limit)
      const cell=document.createElement('button')
      cell.type='button'
      cell.className='week-cell status-'+status
      cell.dataset.day=day
      cell.dataset.task=task.id
      cell.textContent=WEEKDAY_SHORT[idx]
      const clickable = (status==='green' || status==='yellow' || status==='red')
      if(clickable){
        cell.classList.add('clickable')
        cell.addEventListener('click', ()=>{ toggleDone(task, day); refreshAll() })
      }else{
        cell.classList.add('disabled')
      }
      weekRow.appendChild(cell)
    })
    row.querySelector('[data-act=edit]').addEventListener('click', ()=> openTaskDialog('edit', task))
    els.taskList.appendChild(row)
  }
}

function renderMoodSelector(cat){
  if(!els.catMood) return
  els.catMood.innerHTML=''
  if(!cat || !cat.id){
    els.catMood.hidden = true
    els.catMood.removeAttribute('aria-label')
    return
  }
  els.catMood.hidden = false
  const strings = getStrings(currentLanguage())
  els.catMood.setAttribute('aria-label', strings.moodPicker)
  const options=document.createElement('div')
  options.className='cat-mood-options'
  const current = typeof cat.mood==='string' ? cat.mood : ''
  MOOD_CHOICES.forEach(choice=>{
    const btn=document.createElement('button')
    btn.type='button'
    btn.textContent=choice.value
    btn.title=choice.label
    btn.setAttribute('aria-label', choice.label)
    const isActive = current===choice.value
    btn.classList.toggle('active', isActive)
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    btn.addEventListener('click', ()=> setCategoryMood(cat.id, choice.value))
    options.appendChild(btn)
  })
  els.catMood.appendChild(options)
}

function setCategoryMood(catId, mood){
  const cat = categoryById(catId)
  if(!cat) return
  const nextMood = cat.mood===mood ? '' : mood
  if(nextMood){
    cat.mood = nextMood
  }else{
    delete cat.mood
  }
  save()
  renderHome()
  if(state.ui.currentView==='category' && state.ui.currentCat===catId){
    renderCategory(catId, state.ui.categoryWeekStart)
  }
}

function refreshAll(){
  if(!state) return
  renderSummary()
  renderHome()
  if(state.ui.currentView==='category' && state.ui.currentCat){ renderCategory(state.ui.currentCat, state.ui.categoryWeekStart) }
  updateWeekLabel()
  updateReminders()
}

function updateWeekLabel(){
  if(!els.weekLabel || !state) return
  const week = state.ui.selectedWeekStart
  const lang = currentLanguage()
  const strings = getStrings(lang)
  const prefix = strings.weekPrefix || (lang==='fr' ? 'S' : 'W')
  const label = `${prefix}${weekIndexFor(week)} • ${formatWeekRange(week, lang)}`
  els.weekLabel.textContent = label
  if(els.weekNext){
    const canGoNext = compareDate(week, currentWeekStart)<0
    els.weekNext.disabled = !canGoNext
  }
  if(els.weekNow){
    els.weekNow.disabled = week===currentWeekStart
  }
  if(els.weekPrev){
    const minWeek = state.ui.appStartWeek || currentWeekStart
    els.weekPrev.disabled = compareDate(week, minWeek)<=0
  }
}

function changeSelectedWeek(delta){
  if(!state) return
  const current = state.ui.selectedWeekStart
  let target = addDays(current, delta*7)
  const minWeek = state.ui.appStartWeek || currentWeekStart
  if(compareDate(target, currentWeekStart)>0){
    target = currentWeekStart
  }
  if(compareDate(target, minWeek)<0){
    target = minWeek
  }
  if(target===current){ return }
  state.ui.selectedWeekStart = target
  state.ui.categoryWeekStart = target
  save()
  refreshAll()
}

function goToCurrentWeek(){
  if(!state) return
  if(state.ui.selectedWeekStart===currentWeekStart) return
  state.ui.selectedWeekStart = currentWeekStart
  state.ui.categoryWeekStart = currentWeekStart
  save()
  refreshAll()
}

function onRecurChange(){
  const v = els.f_recur.value
  els.specificWrap.style.display = v==='specific' ? 'block' : 'none'
  els.weeklyWrap.style.display = v==='weekly' ? 'block' : 'none'
  updateReminderVisibility()
}

function initSpecificDayPicker(){
  els.specificDays.innerHTML=''
  WEEKDAY_ORDER.forEach(day=>{
    const label=WEEKDAY_SHORT[(day+6)%7]
    const wrapper=document.createElement('label')
    wrapper.innerHTML=`<input type="checkbox" value="${day}">${label}`
    els.specificDays.appendChild(wrapper)
  })
}

function updateReminderVisibility(){
  if(!els.reminderField){ return }
  if(!supportsNotifications){
    els.reminderField.style.display='none'
    if(els.reminderTimeWrap){ els.reminderTimeWrap.style.display='none' }
    if(els.f_notifyDaily){ els.f_notifyDaily.checked=false }
    return
  }
  const type = els.f_recur ? els.f_recur.value : ''
  const eligible = type==='daily' || type==='weekly'
  els.reminderField.style.display = eligible ? 'grid' : 'none'
  if(els.reminderTimeWrap){
    els.reminderTimeWrap.style.display = eligible ? 'grid' : 'none'
  }
  if(els.f_notifyDaily){
    els.f_notifyDaily.disabled = !eligible
    if(!eligible){ els.f_notifyDaily.checked=false }
  }
  if(els.reminderNote){
    const strings = getStrings(currentLanguage())
    if(Notification.permission==='denied'){
      els.reminderNote.textContent = strings.reminderPermission || ''
    }else{
      els.reminderNote.textContent = strings.reminderNote || ''
    }
  }
  const deny = Notification.permission==='denied'
  const disableTime = !eligible || deny
  if(els.f_reminderHour){ els.f_reminderHour.disabled = disableTime }
  if(els.f_reminderMinute){ els.f_reminderMinute.disabled = disableTime }
}

async function ensureNotificationPermission(){
  if(!supportsNotifications) return false
  if(Notification.permission==='granted') return true
  if(Notification.permission==='denied') return false
  try{
    const result = await Notification.requestPermission()
    return result==='granted'
  }catch(err){
    return false
  }
}

function handleReminderToggle(){
  if(!supportsNotifications || !els.f_notifyDaily) return
  if(!els.f_notifyDaily.checked){
    return
  }
  ensureNotificationPermission().then(granted=>{
    if(!granted){
      els.f_notifyDaily.checked=false
      const strings = getStrings(currentLanguage())
      alert(strings.reminderPermission || 'Enable notifications in your browser to receive reminders.')
    }else{
      updateReminders()
    }
    updateReminderVisibility()
  })
}

function clearAllReminders(){
  for(const handle of reminderTimers.values()){
    clearTimeout(handle)
  }
  reminderTimers.clear()
}

function nextReminderDelay(time){
  const now = new Date()
  const target = new Date()
  const reminderTime = normalizeReminderTime(time)
  target.setHours(reminderTime.hour, reminderTime.minute, 0, 0)
  if(target<=now){
    target.setDate(target.getDate()+1)
  }
  return target.getTime() - now.getTime()
}

function scheduleReminder(taskId, time){
  if(!supportsNotifications || Notification.permission!=='granted') return
  const delay = nextReminderDelay(time)
  if(!(delay>0)) return
  const handle = setTimeout(()=> triggerReminder(taskId), delay)
  reminderTimers.set(taskId, handle)
}

function triggerReminder(taskId){
  reminderTimers.delete(taskId)
  if(!state) return
  const task = state.tasks.find(t=> t.id===taskId)
  if(!task || !task.notifyDaily || !reminderEligible(task.recur)){
    updateReminders()
    return
  }
  const strings = getStrings(currentLanguage())
  const title = typeof strings.reminderNotificationTitle==='function' ? strings.reminderNotificationTitle(task.title) : "Routines reminder"
  const body = typeof strings.reminderNotificationBody==='function' ? strings.reminderNotificationBody(task.title) : task.title
  const tag = `task-${taskId}-daily-reminder`
  const finalize = ()=> scheduleReminder(taskId, task.reminderTime)
  navigator.serviceWorker.ready.then(reg=> reg.showNotification(title,{body, icon:'icon-192.png', tag})).catch(()=>{
    if('Notification' in window && Notification.permission==='granted'){
      try{ new Notification(title,{body, icon:'icon-192.png', tag}) }catch(err){ /* ignore */ }
    }
  }).then(finalize, finalize)
}

function updateReminders(){
  if(!supportsNotifications){
    clearAllReminders()
    return
  }
  if(!state || Notification.permission!=='granted'){
    clearAllReminders()
    return
  }
  clearAllReminders()
  state.tasks.forEach(task=>{
    if(task.notifyDaily && reminderEligible(task.recur)){
      scheduleReminder(task.id, task.reminderTime)
    }
  })
}

function updateEmojiResults(){
  const q = els.emojiSearch.value.trim().toLowerCase()
  const list = q? EMOJIS.filter(e=> e.tags.some(t=>t.includes(q))): EMOJIS
  els.emojiResults.innerHTML=''
  list.forEach(e=>{
    const btn=document.createElement('button')
    btn.type='button'
    btn.textContent=e.char
    btn.addEventListener('click', ()=>{ els.f_emoji.value=e.char; els.f_emoji.focus() })
    els.emojiResults.appendChild(btn)
  })
}

function populateCategorySelect(selected){
  if(!els.f_cat) return
  const cats = CATS()
  els.f_cat.innerHTML = cats.map(c=>`<option value="${c.id}">${escapeHtml(categoryLabel(c.id))}</option>`).join('')
  if(selected && !cats.some(c=>c.id===selected)){
    const opt=document.createElement('option')
    opt.value=selected
    opt.textContent=categoryLabel(selected)
    els.f_cat.appendChild(opt)
  }
  if(selected){ els.f_cat.value=selected }
  if(!els.f_cat.value && els.f_cat.options.length>0){ els.f_cat.value = els.f_cat.options[0].value }
}

function openCategory(cat, week){
  if(!state) return
  const baseWeek = week || state.ui.selectedWeekStart
  const minWeek = state.ui.appStartWeek || state.ui.selectedWeekStart || currentWeekStart
  let targetWeek = baseWeek
  if(compareDate(targetWeek, currentWeekStart)>0){
    targetWeek = currentWeekStart
  }
  if(compareDate(targetWeek, minWeek)<0){
    targetWeek = minWeek
  }
  state.ui.categoryWeekStart = targetWeek
  state.ui.currentCat = cat
  save()
  updateView('category')
}

function openCategoryDialog(mode, catId){
  if(!els.categoryDialog) return
  const isEdit = mode==='edit'
  const cat = isEdit ? state.categories.find(c=>c.id===catId) : null
  if(isEdit && !cat) return
  const editing = !!cat
  state.ui.editCategoryId = editing ? cat.id : null
  const strings = getStrings(currentLanguage())
  els.catDialogTitle.textContent = editing ? strings.dialogEditCategory : strings.dialogNewCategory
  if(els.deleteCategory){
    els.deleteCategory.style.display = editing ? 'inline-flex' : 'none'
  }
  if(editing){
    els.c_name.value = cat.name
  }else{
    els.c_name.value=''
  }
  els.categoryDialog.showModal()
  const focusField = ()=> els.c_name.focus()
  ;(window.requestAnimationFrame || window.setTimeout)(focusField, 0)
}

function getFormReminderTime(){
  const hour = els.f_reminderHour ? parseInt(els.f_reminderHour.value, 10) : DEFAULT_REMINDER_TIME.hour
  const minute = els.f_reminderMinute ? parseInt(els.f_reminderMinute.value, 10) : DEFAULT_REMINDER_TIME.minute
  return normalizeReminderTime({hour, minute})
}

function openTaskDialog(mode, task){
  els.taskDialog.returnValue=''
  els.taskDialog.showModal()
  els.deleteTask.style.display = mode==='edit' ? 'inline-flex' : 'none'
  const strings = getStrings(currentLanguage())
  els.dialogTitle.textContent = mode==='edit' ? strings.dialogEditActivity : strings.dialogNewActivity
  state.ui.editTaskId = mode==='edit' ? task.id : null
  const cats = CATS()
  let selectedCat = mode==='edit' && task ? task.cat : state.ui.currentCat
  if(!selectedCat || !cats.some(c=>c.id===selectedCat)){
    selectedCat = cats[0]?.id || ''
  }
  populateCategorySelect(selectedCat)
  if(mode==='edit' && task){
    els.f_title.value = task.title
    els.f_emoji.value = task.emoji || ''
    els.f_cat.value = task.cat
    els.f_importance.value = task.importance
    if(task.recur.type==='daily'){ els.f_recur.value='daily' }
    else if(task.recur.type==='specific'){ els.f_recur.value='specific' }
    else { els.f_recur.value='weekly' }
    els.f_weeklyTimes.value = task.recur.type==='weekly' ? task.recur.times || 1 : 1
    onRecurChange()
    if(els.f_notifyDaily){ els.f_notifyDaily.checked = !!task.notifyDaily }
    const reminderTime = normalizeReminderTime(task.reminderTime)
    if(els.f_reminderHour){ els.f_reminderHour.value = pad2(reminderTime.hour) }
    if(els.f_reminderMinute){ els.f_reminderMinute.value = pad2(reminderTime.minute) }
    const boxes=[...els.specificDays.querySelectorAll('input')]
    boxes.forEach(box=>{ box.checked = task.recur.type==='specific' ? task.recur.days.includes(+box.value) : false })
  }else{
    els.f_title.value=''
    els.f_emoji.value=''
    els.f_cat.value = selectedCat || ''
    els.f_importance.value='must'
    els.f_recur.value='daily'
    els.f_weeklyTimes.value=1
    onRecurChange()
    if(els.f_notifyDaily){ els.f_notifyDaily.checked=false }
    if(els.f_reminderHour){ els.f_reminderHour.value = pad2(DEFAULT_REMINDER_TIME.hour) }
    if(els.f_reminderMinute){ els.f_reminderMinute.value = pad2(DEFAULT_REMINDER_TIME.minute) }
    els.specificDays.querySelectorAll('input').forEach(input=> input.checked=false)
  }
  updateEmojiResults()
}

function submitTask(e){
  e.preventDefault()
  const title = els.f_title.value.trim()
  if(!title) return
  const emoji = els.f_emoji.value.trim() || '🎯'
  const cat = els.f_cat.value
  const importance = els.f_importance.value
  const freq = els.f_recur.value
  if(!cat){ alert('Pick a category'); return }
  let recur = {type:'daily'}
  if(freq==='daily') recur = {type:'daily'}
  if(freq==='specific'){
    const days = [...els.specificDays.querySelectorAll('input:checked')].map(i=> +i.value)
    if(days.length===0){ alert('Select at least one day'); return }
    recur = {type:'specific', days}
  }
  if(freq==='weekly'){
    let times = parseInt(els.f_weeklyTimes.value,10)
    if(Number.isNaN(times)){ times = 1 }
    times = Math.min(6, Math.max(1, times))
    els.f_weeklyTimes.value = times
    recur = {type:'weekly', times}
  }
  const reminderTime = getFormReminderTime()
  const nowWeek = todayISO()
  const canRemind = reminderEligible(recur)
  const wantsReminder = !!(els.f_notifyDaily && els.f_notifyDaily.checked)
  const notifyDaily = canRemind && wantsReminder && supportsNotifications && Notification.permission==='granted'
  if(state.ui.editTaskId){
    const task = state.tasks.find(t=>t.id===state.ui.editTaskId)
    if(task){
      task.title=title
      task.emoji=emoji
      task.cat=cat
      task.importance=importance
      task.recur=recur
      task.notifyDaily = notifyDaily
      task.reminderTime = reminderTime
    }
  }else{
    state.tasks.push({id:uid(), cat, title, emoji, importance, recur, createdAt:nowWeek, notifyDaily, reminderTime})
  }
  save()
  els.taskDialog.close()
  refreshAll()
}

function submitCategory(e){
  if(e){ e.preventDefault() }
  if(!els.categoryDialog) return
  const name = els.c_name.value.trim()
  if(!name){ els.c_name.focus(); return }
  if(state.ui.editCategoryId){
    const cat = state.categories.find(c=>c.id===state.ui.editCategoryId)
    if(cat){
      cat.name = name
    }
  }else{
    const id = 'cat-'+uid()
    state.categories.push({id, name})
    state.ui.currentCat = id
  }
  state.ui.editCategoryId = null
  save()
  els.categoryDialog.close()
  populateCategorySelect(state.ui.currentCat)
  refreshAll()
}

function deleteCurrentTask(){
  if(!state.ui.editTaskId) return
  const idx = state.tasks.findIndex(t=>t.id===state.ui.editTaskId)
  if(idx>=0){ state.tasks.splice(idx,1) }
  for(const day in state.done){ if(state.done[day]) delete state.done[day][state.ui.editTaskId] }
  state.ui.editTaskId=null
  save()
  els.taskDialog.close()
  refreshAll()
}

function deleteCurrentCategory(){
  if(!state || !state.ui.editCategoryId) return
  const catId = state.ui.editCategoryId
  const strings = getStrings(currentLanguage())
  const confirmMessage = strings.deleteCategoryConfirm || 'Delete this category?'
  if(!confirm(confirmMessage)) return
  const catIndex = state.categories.findIndex(c=>c.id===catId)
  if(catIndex<0) return
  const removedTaskIds = new Set(state.tasks.filter(t=>t.cat===catId).map(t=>t.id))
  if(removedTaskIds.size>0){
    state.tasks = state.tasks.filter(t=>t.cat!==catId)
    for(const day of Object.keys(state.done)){
      if(!state.done[day]) continue
      for(const taskId of Object.keys(state.done[day])){
        if(removedTaskIds.has(taskId)){
          delete state.done[day][taskId]
        }
      }
      if(Object.keys(state.done[day]).length===0){
        delete state.done[day]
      }
    }
  }
  state.categories.splice(catIndex,1)
  const wasCurrentCategory = state.ui.currentCat===catId
  const wasCategoryView = state.ui.currentView==='category'
  state.ui.editCategoryId = null
  if(wasCurrentCategory){
    state.ui.currentCat = null
    if(wasCategoryView){
      state.ui.currentView='home'
    }
  }
  save()
  if(els.categoryDialog && typeof els.categoryDialog.close==='function'){
    try{ els.categoryDialog.close() }catch(err){ /* dialog may not be open */ }
  }
  populateCategorySelect(state.ui.currentCat)
  refreshAll()
  updateView(state.ui.currentView || 'home')
}

function taskWeeklyStatus(task, days, limit){
  if(task.recur.type==='weekly'){
    const relevantDays = days.filter(day=> !isFuture(day, limit))
    if(relevantDays.length===0) return null
    const doneCount = relevantDays.filter(day=> isDone(task, day)).length
    const weekEnd = addDays(days[0],6)
    const isOngoing = compareDate(limit, weekEnd)<0
    if(isOngoing){
      if(doneCount>0) return 'green'
      return task.importance==='must' ? 'red' : 'yellow'
    }
    const target = task.recur.times || 1
    if(doneCount>=target) return 'green'
    return task.importance==='must' ? 'red' : 'yellow'
  }
  const dueDays = days.filter(day=> !isFuture(day, limit) && isDue(task, day))
  if(dueDays.length===0) return null
  const missing = dueDays.filter(day=> !isDone(task, day))
  if(missing.length===0) return 'green'
  return task.importance==='must' ? 'red' : 'yellow'
}

function dayStatus(day, tasks, limit){
  if(isFuture(day, limit)) return 'future'
  const due = tasks.filter(t=>isDue(t, day))
  if(due.length===0) return 'off'
  const missing = due.filter(t=>!isDone(t, day))
  if(missing.length===0) return 'green'
  const hasMust = missing.some(t=>{
    if(t.importance!=='must') return false
    if(t.recur.type==='weekly'){
      const weekEnd = addDays(weekStart(day),6)
      if(compareDate(limit, weekEnd)<0) return false
    }
    return true
  })
  return hasMust ? 'red' : 'yellow'
}

function dayStatusForTask(task, day, limit){
  if(isFuture(day, limit)) return 'future'
  if(!isDue(task, day)) return 'off'
  if(isDone(task, day)) return 'green'
  if(task.recur.type==='weekly'){
    const start = weekStart(day)
    const weekEnd = addDays(start,6)
    const span = weekDays(start)
    const doneSoFar = span.filter(d=> !isFuture(d, limit) && isDone(task, d)).length
    const target = task.recur.times || 1
    const isOngoing = compareDate(limit, weekEnd)<0
    if(isOngoing){
      if(doneSoFar>0) return 'yellow'
      return task.importance==='must' ? 'red' : 'yellow'
    }
    if(doneSoFar<target){
      return task.importance==='must' ? 'red' : 'yellow'
    }
    return 'off'
  }
  return task.importance==='must' ? 'red':'yellow'
}

function frequencyLabel(recur, lang){
  if(!recur) return ''
  const safe = sanitizeLanguage(lang)
  if(recur.type==='daily'){
    return safe==='fr' ? 'Quotidien' : 'Daily'
  }
  if(recur.type==='weekly'){
    const times = Math.min(7, Math.max(1, Math.round(recur.times||1)))
    if(times<=1){
      return safe==='fr' ? 'Hebdo' : 'Weekly'
    }
    const template = safe==='fr' ? '%dx / Sem' : '%dx / Week'
    return template.replace('%d', times)
  }
  if(recur.type==='specific'){
    if(!Array.isArray(recur.days) || recur.days.length===0) return ''
    const labels = WEEKDAY_SHORT_LABELS[safe] || WEEKDAY_SHORT_LABELS.en
    const ordered = [...new Set(recur.days
      .map(d=> Number(d))
      .filter(d=> Number.isInteger(d) && d>=0 && d<=6))]
      .sort((a,b)=> WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b))
    if(ordered.length===0) return ''
    return ordered.map(day=> labels[(day+6)%7]).join(', ')
  }
  return ''
}

function statusFromDays(days){
  if(days.every(s=>s==='off' || s==='future' || s==='green')){
    if(days.some(s=>s==='green')) return 'green'
    return 'future'
  }
  if(days.some(s=>s==='red')) return 'red'
  if(days.some(s=>s==='yellow')) return 'yellow'
  return 'green'
}

function isDue(task, ymd){
  const d = new Date(ymd+'T00:00:00')
  const w = d.getDay()
  if(task.recur.type==='daily') return true
  if(task.recur.type==='weekly'){
    const start = weekStart(ymd)
    const span = weekDays(start)
    const idx = span.indexOf(ymd)
    if(idx<0) return false
    const times = task.recur.times || 1
    const doneBefore = span.slice(0, idx).filter(day=> isDone(task, day)).length
    return doneBefore < times
  }
  if(task.recur.type==='specific') return task.recur.days.includes(w)
  if(task.recur.type==='everyX'){ // fallback legacy
    const anchor = new Date((task.recur.anchor||task.createdAt)+'T00:00:00')
    const diff = Math.floor((d-anchor)/86400000)
    return diff>=0 && diff % (task.recur.interval||3)===0
  }
  return false
}

function isDone(task, ymd){ return !!(state.done[ymd] && state.done[ymd][task.id]) }
function toggleDone(task, ymd){
  state.done[ymd] = state.done[ymd] || {}
  if(isDone(task, ymd)){
    delete state.done[ymd][task.id]
    if(Object.keys(state.done[ymd]).length===0){ delete state.done[ymd] }
  }else{
    state.done[ymd][task.id] = true
  }
  save()
}

function categoryById(id){ return state && Array.isArray(state.categories) ? state.categories.find(c=>c.id===id) || null : null }
function categoryLabel(id){
  const cat = categoryById(id)
  return cat ? cat.name : id
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])) }

function CATS(){
  return state && Array.isArray(state.categories) ? state.categories.slice() : []
}

function save(){ if(!state) return; localStorage.setItem(STORE_KEY, JSON.stringify(state)) }
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY)
    if(raw){
      return JSON.parse(raw)
    }
  }catch(e){
    return null
  }
  for(const key of LEGACY_STORE_KEYS){
    try{
      const legacy = localStorage.getItem(key)
      if(legacy){
        const parsed = JSON.parse(legacy)
        localStorage.setItem(STORE_KEY, legacy)
        return parsed
      }
    }catch(err){ /* ignore legacy parse errors */ }
  }
  return null
}

function exportBackup(){
  if(!state) return
  try{
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `routine-buddy-backup-${todayISO()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }catch(err){
    console.error('Export failed', err)
  }
}

function handleImportFile(event){
  const input = event.target
  const file = input && input.files ? input.files[0] : null
  if(!file) return
  const reader = new FileReader()
  reader.onload = e=>{
    try{
      const text = typeof e.target?.result==='string' ? e.target.result : ''
      const parsed = JSON.parse(text)
      if(!confirm('Importing this backup will replace your current data. Continue?')) return
      const previousView = state?.ui?.currentView || 'home'
      state = normalizeState(parsed)
      if(previousView==='config'){ state.ui.currentView='config' }
      save()
      initializeApp()
    }catch(err){
      console.error('Import failed', err)
      alert('Could not import backup. Make sure the file is a valid Routines export.')
    }finally{
      input.value=''
    }
  }
  reader.onerror = ()=>{
    alert('Could not read the selected file.')
    input.value=''
  }
  reader.readAsText(file)
}

function seed(lang){
  const today = todayISO()
  const language = sanitizeLanguage(lang)
  const tasks = sampleTasks(language).map(task=>({
    id:uid(),
    cat:task.cat,
    title:task.title,
    emoji:task.emoji,
    importance:task.importance,
    recur:cloneRecur(task.recur),
    createdAt:today,
    notifyDaily:false,
  }))
  return {
    tasks,
    done:{},
    categories: defaultCategories(language).map(c=>({...c})),
    ui:{currentView:'home', selectedWeekStart:currentWeekStart, categoryWeekStart:currentWeekStart, currentCat:null, language, appStartWeek:currentWeekStart}
  }
}

startApp()

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(err=> console.error('SW registration failed', err))
  })
}
