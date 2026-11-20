export interface BudgetPlanItem {
    id: string;
    name: string;
    cost: number;
    type: 'NEED' | 'WANT';
    hint: string;
}

export interface SuddenExpenseEvent {
    title: string;
    cost: number;
    description: string;
    is_essential: boolean;
}

export interface BudgetScenario {
    id: number;
    title: string;
    category: string;
    emoji: string;
    starting_budget: number;
    purpose: string;
    sudden_expense: SuddenExpenseEvent;
    items: BudgetPlanItem[];
    ideal_tip: string;
}

export const BUDGET_SCENARIOS: BudgetScenario[] = [
    {
        id: 1,
        title: 'The Science Fair & Flat Bike Tire',
        category: 'School & Studies',
        emoji: '🔬',
        starting_budget: 500,
        purpose: 'You received ₹500 to buy materials for tomorrow’s school science volcano project.',
        sudden_expense: {
            title: 'Punctured Bicycle Tire',
            cost: 120,
            description: 'On the way to the stationery shop, your bicycle tire goes flat and needs an urgent puncture fix so you can ride to school.',
            is_essential: true,
        },
        items: [
            { id: '1-a', name: 'Cardboard & Clay Base', cost: 160, type: 'NEED', hint: 'Main structure for your volcano model' },
            { id: '1-b', name: 'Baking Soda, Vinegar & Paint', cost: 130, type: 'NEED', hint: 'Required for the volcano eruption demo' },
            { id: '1-c', name: 'Glow-in-the-Dark Dinosaur Stickers', cost: 110, type: 'WANT', hint: 'Fun decoration, not needed for grading' },
            { id: '1-d', name: 'Chocolate Milkshake & Fries', cost: 120, type: 'WANT', hint: 'Tasty snack break on the way home' },
        ],
        ideal_tip: 'Cover the ₹120 flat tire repair and both ₹160 + ₹130 science supplies (₹410 total), skip the stickers and milkshake, and save ₹90!',
    },
    {
        id: 2,
        title: 'Cricket Match & Torn Sports Shoes',
        category: 'Sports & Hobbies',
        emoji: '🏏',
        starting_budget: 600,
        purpose: 'Your parents gave you ₹600 for your weekend school cricket tournament kit and refreshments.',
        sudden_expense: {
            title: 'Emergency Shoe Sole Stitching',
            cost: 140,
            description: 'Your left cricket shoe sole splits open during warm-up and the cobbler charges ₹140 to stitch it safely.',
            is_essential: true,
        },
        items: [
            { id: '2-a', name: 'Match Batting Gloves', cost: 240, type: 'NEED', hint: 'Protects your hands during the tournament' },
            { id: '2-b', name: 'Reusable Water Bottle & ORS Pack', cost: 110, type: 'NEED', hint: 'Keeps you hydrated on the sunny field' },
            { id: '2-c', name: 'Fancy Team Wristbands (Pack of 3)', cost: 150, type: 'WANT', hint: 'Cool accessory, optional for playing' },
            { id: '2-d', name: 'Match-Day Ice Cream Sundae', cost: 130, type: 'WANT', hint: 'Sweet treat after the game' },
        ],
        ideal_tip: 'Pay ₹140 for safe shoes plus ₹240 gloves and ₹110 water/hydration (₹490), skipping wristbands and sundae so ₹110 stays saved!',
    },
    {
        id: 3,
        title: 'Mom’s Birthday Gift & Broken Umbrella',
        category: 'Family & Celebrations',
        emoji: '🎁',
        starting_budget: 450,
        purpose: 'You saved ₹450 in your piggy bank to get a thoughtful birthday surprise for your mom.',
        sudden_expense: {
            title: 'Sudden Monsoon Umbrella Replacement',
            cost: 150,
            description: 'Heavy rain snaps your school umbrella right before your afternoon tuition walk.',
            is_essential: true,
        },
        items: [
            { id: '3-a', name: 'Handmade Card Paper & Craft Pens', cost: 90, type: 'NEED', hint: 'To write a heartfelt birthday card' },
            { id: '3-b', name: 'Mom’s Favorite Jasmine Tea Tin', cost: 180, type: 'NEED', hint: 'Main birthday gift you planned for Mom' },
            { id: '3-c', name: 'Giant Helium Balloon Bouquet', cost: 160, type: 'WANT', hint: 'Pops in a day and stretches your budget' },
            { id: '3-d', name: 'Sparkly Party Sunglasses for Yourself', cost: 100, type: 'WANT', hint: 'Fun prop, not needed for Mom’s gift' },
        ],
        ideal_tip: 'Replace the umbrella (₹150) and keep the ₹90 handmade card + ₹180 tea tin (₹420 total), leaving ₹30 left over!',
    },
    {
        id: 4,
        title: 'Book Fair Budget & Lost Geometry Box',
        category: 'School & Studies',
        emoji: '📚',
        starting_budget: 550,
        purpose: 'You have ₹550 for the annual school book fair and upcoming math test supplies.',
        sudden_expense: {
            title: 'Replacement Geometry Box',
            cost: 160,
            description: 'You discover your compass and protractor fell out of your bag right before tomorrow’s geometry exam.',
            is_essential: true,
        },
        items: [
            { id: '4-a', name: 'Science Encyclopedia (School Recommended)', cost: 220, type: 'NEED', hint: 'Helps with this term’s science essays' },
            { id: '4-b', name: 'Pack of 3 Exam Gel Pens', cost: 60, type: 'NEED', hint: 'Required for writing tomorrow’s test' },
            { id: '4-c', name: 'Limited-Edition Comic Poster', cost: 140, type: 'WANT', hint: 'Wall poster, nice to have later' },
            { id: '4-d', name: 'Scented Eraser & Keychain Set', cost: 110, type: 'WANT', hint: 'Cute desk extras you don’t urgently need' },
        ],
        ideal_tip: 'Get the ₹160 geometry box, ₹220 encyclopedia, and ₹60 pens (₹440), skipping the poster and keychain to save ₹110!',
    },
    {
        id: 5,
        title: 'Picnic Lunch & Forgotten Bus Pass',
        category: 'Weekend Fun',
        emoji: '🚌',
        starting_budget: 400,
        purpose: 'You were given ₹400 for a Saturday class picnic at the botanical garden.',
        sudden_expense: {
            title: 'Round-Trip Bus Ticket',
            cost: 100,
            description: 'You forgot your student pass at home and must buy a ₹100 round-trip ticket to join the trip safely.',
            is_essential: true,
        },
        items: [
            { id: '5-a', name: 'Healthy Sandwich & Fruit Lunch Box', cost: 130, type: 'NEED', hint: 'Keeps you energized all afternoon' },
            { id: '5-b', name: 'Sunscreen & Cap for Outdoor Walk', cost: 90, type: 'NEED', hint: 'Protects against heatstroke on the trail' },
            { id: '5-c', name: 'Souvenir Magnet & Plastic Toy', cost: 120, type: 'WANT', hint: 'Gift-shop impulse item' },
            { id: '5-d', name: 'Carnival Cotton Candy & Soda', cost: 100, type: 'WANT', hint: 'Sugary extra treat' },
        ],
        ideal_tip: 'Pay ₹100 for the bus ticket plus ₹130 lunch and ₹90 cap/sunscreen (₹320), keeping ₹80 saved instead of buying gift-shop souvenirs.',
    },
    {
        id: 6,
        title: 'Art Competition & Spilled Ink Bottle',
        category: 'Sports & Hobbies',
        emoji: '🎨',
        starting_budget: 500,
        purpose: 'You have ₹500 to buy supplies for Saturday’s inter-school painting contest.',
        sudden_expense: {
            title: 'Wet Backpack Laundry & Waterproof Cover',
            cost: 130,
            description: 'A bottle of ink leaked inside your school bag—you need a ₹130 waterproof liner and cleaner before Monday.',
            is_essential: true,
        },
        items: [
            { id: '6-a', name: 'A3 Watercolor Paper Pad', cost: 150, type: 'NEED', hint: 'Mandatory paper size for the contest' },
            { id: '6-b', name: '12-Color Acrylic Paint & Brush Set', cost: 170, type: 'NEED', hint: 'Core paints needed to complete your entry' },
            { id: '6-c', name: 'Glitter Gel Pen Pack (24 Shades)', cost: 140, type: 'WANT', hint: 'Extra sparkle pens not allowed in watercolor round' },
            { id: '6-d', name: 'Cafe Donut Box', cost: 110, type: 'WANT', hint: 'Tasty snack, not required for the contest' },
        ],
        ideal_tip: 'Handle the ₹130 bag fix and buy the ₹150 paper + ₹170 paints (₹450 total), saving ₹50 and skipping the glitter pens and donuts.',
    },
    {
        id: 7,
        title: 'Pet Puppy Care & Broken Leash',
        category: 'Health & Pets',
        emoji: '🐶',
        starting_budget: 700,
        purpose: 'Your family put you in charge of ₹700 for your puppy Bruno’s monthly supplies.',
        sudden_expense: {
            title: 'Emergency Leash & Collar Clip',
            cost: 180,
            description: 'Bruno’s leash clip snapped during his morning walk—a sturdy replacement costs ₹180 right away.',
            is_essential: true,
        },
        items: [
            { id: '7-a', name: 'Nutritious Puppy Kibble Bag', cost: 320, type: 'NEED', hint: 'Bruno’s main healthy meals for two weeks' },
            { id: '7-b', name: 'Flea & Tick Gentle Shampoo', cost: 140, type: 'NEED', hint: 'Keeps Bruno healthy and itch-free' },
            { id: '7-c', name: 'Squeaky Bowtie Costume', cost: 190, type: 'WANT', hint: 'Cute dress-up outfit, optional for Bruno' },
            { id: '7-d', name: 'Fancy Bacon-Flavored Cupcakes', cost: 130, type: 'WANT', hint: 'Extra treats that Bruno doesn’t need today' },
        ],
        ideal_tip: 'Put Bruno’s safety and health first: ₹180 leash + ₹320 food + ₹140 shampoo = ₹640, leaving ₹60 saved!',
    },
    {
        id: 8,
        title: 'Winter Camp & Chilly Windbreaker',
        category: 'Weekend Fun',
        emoji: '⛺',
        starting_budget: 800,
        purpose: 'You earned ₹800 from chores to prepare for your 2-day school nature camp.',
        sudden_expense: {
            title: 'Camp Flashlight & Battery Pack',
            cost: 160,
            description: 'Your old torch stopped working during packing check—a camp-safe flashlight costs ₹160.',
            is_essential: true,
        },
        items: [
            { id: '8-a', name: 'Warm Thermal Socks & Wool Cap', cost: 240, type: 'NEED', hint: 'Keeps you warm during chilly camp nights' },
            { id: '8-b', name: 'First-Aid Bandages & Mosquito Cream', cost: 150, type: 'NEED', hint: 'Required safety items on the camp checklist' },
            { id: '8-c', name: 'Neon Light-Up Camping Glasses', cost: 180, type: 'WANT', hint: 'Fun novelty toy, not useful in the woods' },
            { id: '8-d', name: 'Extra Bag of Marshmallows & Candy', cost: 160, type: 'WANT', hint: 'Extra sugar snacks beyond camp meals' },
        ],
        ideal_tip: 'Cover the ₹160 flashlight, ₹240 warm gear, and ₹150 first-aid pack (₹550) so you stay safe and keep ₹250 in savings!',
    },
    {
        id: 9,
        title: 'Gaming Weekend & Controller Cable',
        category: 'Tech & Gaming',
        emoji: '🎮',
        starting_budget: 500,
        purpose: 'You saved ₹500 of birthday money for a fun weekend gaming hangout with cousins.',
        sudden_expense: {
            title: 'Pop-Up "10,000 Ultra Skins" Deal',
            cost: 350,
            description: 'A flashy timer pops up in your game offering "Ultra Skins for ₹350 — expires in 3 minutes!" (Wait: is this a real NEED or a sudden WANT trap?)',
            is_essential: false,
        },
        items: [
            { id: '9-a', name: 'Replacement USB-C Charging Cable', cost: 180, type: 'NEED', hint: 'Your tablet won’t charge without a safe cable' },
            { id: '9-b', name: 'Homemade Popcorn & Juice Ingredients', cost: 120, type: 'NEED', hint: 'Snacks you promised for family movie & game night' },
            { id: '9-c', name: 'Co-op Puzzle Game Expansion Pack', cost: 160, type: 'WANT', hint: 'Fun extra level pack, optional when free games work' },
            { id: '9-d', name: 'Glowing Mousepad Mat', cost: 190, type: 'WANT', hint: 'Cool desk look, not needed to play' },
        ],
        ideal_tip: 'Spot the trap! The ₹350 "limited-time skins" pop-up is a WANT, not an urgent need. Skip it, buy the ₹180 charger + ₹120 family snacks (₹300), and save ₹200!',
    },
    {
        id: 10,
        title: 'Music Recital & Broken Guitar String',
        category: 'Sports & Hobbies',
        emoji: '🎸',
        starting_budget: 450,
        purpose: 'You have ₹450 for this Friday’s school music club showcase.',
        sudden_expense: {
            title: 'Snapped Guitar String Set',
            cost: 150,
            description: 'During practice, your top guitar string snaps! A replacement set costs ₹150 so you can perform.',
            is_essential: true,
        },
        items: [
            { id: '10-a', name: 'Sheet Music Binder & Pencil', cost: 110, type: 'NEED', hint: 'Keeps your recital notes organized on stage' },
            { id: '10-b', name: 'Guitar Picks (2-Pack)', cost: 40, type: 'NEED', hint: 'Needed to strum cleanly during the solo' },
            { id: '10-c', name: 'Rockstar Metallic Hair Gel', cost: 130, type: 'WANT', hint: 'Just for styling, not needed to play music' },
            { id: '10-d', name: 'Band Logo Hoodie Keychain', cost: 120, type: 'WANT', hint: 'Collectible merch item' },
        ],
        ideal_tip: 'Spend ₹150 on the snapped string, ₹110 on the sheet binder, and ₹40 on picks (₹300 total), saving ₹150!',
    },
    {
        id: 11,
        title: 'Grandpa’s Garden Surprise & Torn Gloves',
        category: 'Family & Celebrations',
        emoji: '🌻',
        starting_budget: 400,
        purpose: 'You saved ₹400 to plant flowers with Grandpa on Sunday morning.',
        sudden_expense: {
            title: 'Rusty Watering Can Leak Repair / Replacement',
            cost: 120,
            description: 'The old watering can leaks everywhere—a sturdy small watering can costs ₹120.',
            is_essential: true,
        },
        items: [
            { id: '11-a', name: 'Sunflower & Marigold Seed Packets', cost: 100, type: 'NEED', hint: 'You can’t plant flowers without seeds!' },
            { id: '11-b', name: 'Organic Potting Soil Bag', cost: 110, type: 'NEED', hint: 'Helps the new seedlings grow healthy' },
            { id: '11-c', name: 'Ceramic Garden Gnome Statue', cost: 160, type: 'WANT', hint: 'Cute decoration, optional for planting' },
            { id: '11-d', name: 'Fancy Lemon Fizz Bottles', cost: 90, type: 'WANT', hint: 'Optional cold drinks when water at home is free' },
        ],
        ideal_tip: 'Buy the ₹120 watering can, ₹100 seeds, and ₹110 soil (₹330) so the garden blooms, and save ₹70!',
    },
    {
        id: 12,
        title: 'Coding Club & Keyboard Spill',
        category: 'Tech & Gaming',
        emoji: '💻',
        starting_budget: 650,
        purpose: 'You received ₹650 to prepare supplies for your weekend kids coding hackathon.',
        sudden_expense: {
            title: 'Screen Cleaning Kit & Protective Sleeve',
            cost: 170,
            description: 'Your tablet slipped off the desk—no crack, but you urgently need a padded sleeve (₹170) to carry it safely.',
            is_essential: true,
        },
        items: [
            { id: '12-a', name: 'Wire-Bound Idea & Sketch Notebook', cost: 120, type: 'NEED', hint: 'Used to plan your app screens before coding' },
            { id: '12-b', name: 'Simple Wired Earphones (for Audio Tests)', cost: 190, type: 'NEED', hint: 'Needed to test sound effects in your project' },
            { id: '12-c', name: 'Holographic Laptop Stickers (50 Pack)', cost: 150, type: 'WANT', hint: 'Cool stickers, zero impact on your project' },
            { id: '12-d', name: 'Energy Candy & Fizzy Drink Combo', cost: 130, type: 'WANT', hint: 'Sugary snacks when home fruit is healthier' },
        ],
        ideal_tip: 'Protect your tablet (₹170) and pick up the ₹120 notebook + ₹190 earphones (₹480 total), saving ₹170!',
    },
    {
        id: 13,
        title: 'Swimming Gala & Broken Goggles',
        category: 'Sports & Hobbies',
        emoji: '🏊',
        starting_budget: 500,
        purpose: 'You have ₹500 for Saturday’s neighborhood junior swimming meet.',
        sudden_expense: {
            title: 'Snapped Swim Goggles Strap',
            cost: 160,
            description: 'The elastic strap on your swim goggles breaks right at pool check-in—new basic goggles cost ₹160.',
            is_essential: true,
        },
        items: [
            { id: '13-a', name: 'Quick-Dry Swim Towel', cost: 180, type: 'NEED', hint: 'Keeps you warm and dry after your race' },
            { id: '13-b', name: 'Banana & Peanut Trail Mix Pack', cost: 70, type: 'NEED', hint: 'Healthy post-swim energy snack' },
            { id: '13-c', name: 'Giant Flamingo Pool Floatie', cost: 220, type: 'WANT', hint: 'Fun pool toy, not allowed in race lanes' },
            { id: '13-d', name: 'Slushie Cup at Pool Stand', cost: 90, type: 'WANT', hint: 'Sugary treat you can skip' },
        ],
        ideal_tip: 'Replace the goggles (₹160) and pack the ₹180 towel + ₹70 healthy snack (₹410 total), saving ₹90!',
    },
    {
        id: 14,
        title: 'Bake Sale Fundraiser & Missing Tray',
        category: 'Family & Celebrations',
        emoji: '🧁',
        starting_budget: 550,
        purpose: 'You and your friend pooled ₹550 to bake cupcakes for the school animal-shelter fundraiser.',
        sudden_expense: {
            title: 'Broken Measuring Cup & Oven Mitts',
            cost: 130,
            description: 'Your measuring jug cracks while washing—safe baking needs a ₹130 measuring cup.',
            is_essential: true,
        },
        items: [
            { id: '14-a', name: 'Flour, Cocoa, Sugar & Butter', cost: 220, type: 'NEED', hint: 'Core ingredients for 24 cupcakes' },
            { id: '14-b', name: 'Paper Cupcake Liners & Storage Box', cost: 90, type: 'NEED', hint: 'Keeps cupcakes clean on the way to school' },
            { id: '14-c', name: 'Edible Gold Glitter Spray', cost: 150, type: 'WANT', hint: 'Expensive topping—regular icing works great!' },
            { id: '14-d', name: 'Matching Chef Hat Set', cost: 140, type: 'WANT', hint: 'Fun photo prop, not needed to bake well' },
        ],
        ideal_tip: 'Get the ₹130 measuring cup, ₹220 ingredients, and ₹90 liners/box (₹440), saving ₹110 and still raising shelter funds!',
    },
    {
        id: 15,
        title: 'Library Reading Week & Rain Damage',
        category: 'School & Studies',
        emoji: '📖',
        starting_budget: 350,
        purpose: 'You have ₹350 pocket money saved for Reading Week at school.',
        sudden_expense: {
            title: 'School Library Fine & Book Jacket',
            cost: 90,
            description: 'Rain splashed the edge of a borrowed library book—replacing its protective plastic cover costs ₹90.',
            is_essential: true,
        },
        items: [
            { id: '15-a', name: 'Required Class Novel (Used Copy)', cost: 140, type: 'NEED', hint: 'Needed for next week’s English book report' },
            { id: '15-b', name: 'Highlighters & Sticky Notes', cost: 60, type: 'NEED', hint: 'Helps mark important book report quotes' },
            { id: '15-c', name: 'Plush Bookworm Backpack Clip', cost: 120, type: 'WANT', hint: 'Cute bag charm, optional' },
            { id: '15-d', name: 'Caramel Popcorn Tub', cost: 100, type: 'WANT', hint: 'Movie-style snack you don’t need' },
        ],
        ideal_tip: 'Pay the ₹90 library cover, ₹140 class novel, and ₹60 sticky notes (₹290 total), saving ₹60!',
    },
    {
        id: 16,
        title: 'Sibling’s Sick Day & Care Basket',
        category: 'Health & Pets',
        emoji: '🩺',
        starting_budget: 500,
        purpose: 'Your parents trusted you with ₹500 at the neighborhood shop to pick up comforting items for your younger brother who has a cold.',
        sudden_expense: {
            title: 'Digital Thermometer Battery & Tissues',
            cost: 110,
            description: 'The pharmacy reminds you that the home thermometer battery died—new battery + soft tissues cost ₹110.',
            is_essential: true,
        },
        items: [
            { id: '16-a', name: 'Hot Soup Packets & Fresh Oranges', cost: 170, type: 'NEED', hint: 'Warm, vitamin-C rich comfort food' },
            { id: '16-b', name: 'Coloring Book to Keep Him Cheerful', cost: 90, type: 'NEED', hint: 'Quiet, screen-free rest activity while recovering' },
            { id: '16-c', name: 'Giant Plastic Robot Toy for Yourself', cost: 180, type: 'WANT', hint: 'This money was meant to help your brother!' },
            { id: '16-d', name: 'Ice-Cold Fizzy Cola Bottles', cost: 110, type: 'WANT', hint: 'Not good for someone with a sore throat' },
        ],
        ideal_tip: 'Cover the ₹110 thermometer battery/tissues, ₹170 soup/oranges, and ₹90 coloring book (₹370), returning ₹130 to your parents!',
    },
    {
        id: 17,
        title: 'Roller Skating Practice & Loose Wheel',
        category: 'Sports & Hobbies',
        emoji: '🛼',
        starting_budget: 600,
        purpose: 'You saved ₹600 for your monthly roller-skating rink session and gear check.',
        sudden_expense: {
            title: 'Skate Wheel Nut & Bearing Fix',
            cost: 150,
            description: 'A skate wheel wobbles dangerously! The rink mechanic charges ₹150 to tighten and replace the bearing safely.',
            is_essential: true,
        },
        items: [
            { id: '17-a', name: 'Rink Entry Pass', cost: 150, type: 'NEED', hint: 'Required for your coaching session' },
            { id: '17-b', name: 'Wrist Guard & Knee Pad Straps', cost: 180, type: 'NEED', hint: 'Prevents scrapes and wrist sprains' },
            { id: '17-c', name: 'LED Light-Up Shoelaces', cost: 140, type: 'WANT', hint: 'Flashy look, does not improve safety' },
            { id: '17-d', name: 'Arcade Claw Machine Tokens', cost: 160, type: 'WANT', hint: 'High chance of losing coins quickly!' },
        ],
        ideal_tip: 'Safety first! Pay ₹150 bearing fix + ₹150 rink pass + ₹180 pads (₹480 total), saving ₹120 and skipping the claw machine.',
    },
    {
        id: 18,
        title: 'Festival Lantern Craft & Missing Glue',
        category: 'Family & Celebrations',
        emoji: '🏮',
        starting_budget: 400,
        purpose: 'You have ₹400 to make eco-friendly paper lanterns with your family for the festival.',
        sudden_expense: {
            title: 'Replacement Craft Scissors',
            cost: 90,
            description: 'Your blunt scissors jam on thick craft paper—safe kid-friendly craft scissors cost ₹90.',
            is_essential: true,
        },
        items: [
            { id: '18-a', name: 'Recycled Colored Paper & Bamboo Sticks', cost: 140, type: 'NEED', hint: 'Main materials for the lantern frames' },
            { id: '18-b', name: 'Safe Battery-Powered Fairy Light', cost: 110, type: 'NEED', hint: 'Flames are unsafe—battery LED keeps lanterns safe' },
            { id: '18-c', name: 'Plastic Confetti Popper Pack', cost: 120, type: 'WANT', hint: 'Single-use mess that isn’t eco-friendly' },
            { id: '18-d', name: 'Packaged Sugary Lollipops', cost: 90, type: 'WANT', hint: 'Impulse candy near the checkout counter' },
        ],
        ideal_tip: 'Pick the ₹90 scissors, ₹140 paper/bamboo, and ₹110 safe LED light (₹340 total), keeping ₹60 in your savings jar!',
    },
    {
        id: 19,
        title: 'Museum Field Trip & Forgotten Lunch',
        category: 'School & Studies',
        emoji: '🏛️',
        starting_budget: 450,
        purpose: 'You brought ₹450 for a school day trip to the Planetarium & Dinosaur Museum.',
        sudden_expense: {
            title: 'Museum Cafeteria Lunch Box',
            cost: 160,
            description: 'You accidentally left your home lunch box on the kitchen counter! You must buy a ₹160 meal so you don’t go hungry.',
            is_essential: true,
        },
        items: [
            { id: '19-a', name: '3D Space Dome Show Ticket', cost: 120, type: 'NEED', hint: 'Educational show your teacher asked everyone to take notes on' },
            { id: '19-b', name: 'Small Field-Notes Pocket Pad', cost: 40, type: 'NEED', hint: 'For your museum assignment questions' },
            { id: '19-c', name: 'Plastic T-Rex Keychain', cost: 150, type: 'WANT', hint: 'Overpriced gift-shop souvenir' },
            { id: '19-d', name: 'Freeze-Dried "Astronaut" Ice Cream', cost: 140, type: 'WANT', hint: 'Novelty snack costing 4x normal ice cream' },
        ],
        ideal_tip: 'Cover your ₹160 lunch, ₹120 Space Dome ticket, and ₹40 notepad (₹320), skipping overpriced gift-shop trinkets to save ₹130!',
    },
    {
        id: 20,
        title: 'Cycle Club Ride & Spare Tube',
        category: 'Sports & Hobbies',
        emoji: '🚲',
        starting_budget: 550,
        purpose: 'You saved ₹550 for your Sunday morning neighborhood bicycle club ride.',
        sudden_expense: {
            title: 'Loose Brake Cable Tightening',
            cost: 130,
            description: 'Before setting off, you notice the front brake feels weak—a bike shop adjustment costs ₹130.',
            is_essential: true,
        },
        items: [
            { id: '20-a', name: 'Reflective Helmet Safety Stickers & Bell', cost: 140, type: 'NEED', hint: 'Helps cars and walkers hear and see you clearly' },
            { id: '20-b', name: 'Electrolyte Water & Granola Bar', cost: 90, type: 'NEED', hint: 'Keeps stamina up on a 6 km ride' },
            { id: '20-c', name: 'Loud Electric Horn Toy', cost: 180, type: 'WANT', hint: 'Noisy gadget when a regular bell works fine' },
            { id: '20-d', name: 'Spoke Neon Wheel Beads', cost: 130, type: 'WANT', hint: 'Pure decoration for your spokes' },
        ],
        ideal_tip: 'Fix the brakes (₹130) and get the ₹140 bell/reflectors + ₹90 hydration snack (₹360 total), saving ₹190 toward your main goal!',
    },
    {
        id: 21,
        title: 'Rainy Day Board Game Night',
        category: 'Weekend Fun',
        emoji: '🎲',
        starting_budget: 500,
        purpose: 'You have ₹500 to host a cozy Saturday board-game afternoon with two school friends.',
        sudden_expense: {
            title: 'Broken Glass Juice Pitcher Replacement',
            cost: 150,
            description: 'While setting the table, a pitcher slips—replacing a simple plastic pitcher costs ₹150.',
            is_essential: true,
        },
        items: [
            { id: '21-a', name: 'Homemade Sandwiches & Fruit Slices', cost: 160, type: 'NEED', hint: 'Real food for three hungry friends' },
            { id: '21-b', name: 'Replacement Dice & Scorepad', cost: 80, type: 'NEED', hint: 'Your old game set was missing two dice!' },
            { id: '21-c', name: 'Brand-New ₹220 Mystery Blind Box Toy', cost: 220, type: 'WANT', hint: 'Random collectible toy you don’t need' },
            { id: '21-d', name: 'Imported Chocolate Bar', cost: 120, type: 'WANT', hint: 'Extra candy when fruit and sandwiches are enough' },
        ],
        ideal_tip: 'Replace the pitcher (₹150) plus ₹160 food + ₹80 dice/scorepad (₹390 total), skipping the blind box and saving ₹110!',
    },
    {
        id: 22,
        title: 'Best Friend’s Farewell Gift & Photo Print',
        category: 'Family & Celebrations',
        emoji: '📸',
        starting_budget: 450,
        purpose: 'Your best friend is moving to another city, and you saved ₹450 for a memorable goodbye gift.',
        sudden_expense: {
            title: 'Auto-Rickshaw Fare in Sudden Downpour',
            cost: 90,
            description: 'Heavy rain floods the street near the print shop, so your parent tells you to take an auto safely for ₹90.',
            is_essential: true,
        },
        items: [
            { id: '22-a', name: 'Printed Framed Photo of Your Class Team', cost: 190, type: 'NEED', hint: 'Thoughtful memory gift from the heart' },
            { id: '22-b', name: 'Blank Friendship Memory Journal', cost: 110, type: 'NEED', hint: 'Friends can sign goodbye notes inside' },
            { id: '22-c', name: 'Oversized Glitter Gift Bag & Wrapping', cost: 120, type: 'WANT', hint: 'Simple home-decorated paper saves money!' },
            { id: '22-d', name: 'Matching Slap Bracelets (Pack of 4)', cost: 100, type: 'WANT', hint: 'Extra plastic novelty items' },
        ],
        ideal_tip: 'Stay safe in the rain (₹90) and give the meaningful ₹190 photo frame + ₹110 memory journal (₹390 total), saving ₹60!',
    },
    {
        id: 23,
        title: 'School Choir & Sore Throat',
        category: 'Health & Pets',
        emoji: '🎤',
        starting_budget: 350,
        purpose: 'You received ₹350 for your school choir concert day essentials.',
        sudden_expense: {
            title: 'Warm Honey Lozenges & Throat Syrup',
            cost: 100,
            description: 'You wake up with a scratchy voice! Pharmacy lozenges cost ₹100 so you can sing comfortably.',
            is_essential: true,
        },
        items: [
            { id: '23-a', name: 'White Uniform Shirt Press / Collar Pin', cost: 90, type: 'NEED', hint: 'Required choir dress code item' },
            { id: '23-b', name: 'Warm Water Thermos Refill & Lunch', cost: 100, type: 'NEED', hint: 'Keeps your throat warm and belly full' },
            { id: '23-c', name: 'Chilled Ice-Pop After Rehearsal', cost: 70, type: 'WANT', hint: 'Actually bad for a scratchy throat!' },
            { id: '23-d', name: 'Metallic Microphone Toy', cost: 130, type: 'WANT', hint: 'Plastic toy prop not used on stage' },
        ],
        ideal_tip: 'Take care of your voice (₹100 lozenges), wear the ₹90 uniform pin, and eat your ₹100 warm lunch (₹290 total), saving ₹60!',
    },
    {
        id: 24,
        title: 'Robotics Workshop & Dead Batteries',
        category: 'Tech & Gaming',
        emoji: '🤖',
        starting_budget: 750,
        purpose: 'You saved ₹750 to build a mini solar-car kit at Saturday’s STEM robotics workshop.',
        sudden_expense: {
            title: 'AA Rechargeable Battery Pack',
            cost: 190,
            description: 'When indoor clouds block sunlight, your bot needs backup batteries (₹190) to pass the test track.',
            is_essential: true,
        },
        items: [
            { id: '24-a', name: 'Mini DC Motor & Wheel Chassis Kit', cost: 340, type: 'NEED', hint: 'Core robotics parts for your car' },
            { id: '24-b', name: 'Insulating Electrical Tape & Mini Screwdriver', cost: 110, type: 'NEED', hint: 'Essential tools to wire and secure your bot' },
            { id: '24-c', name: 'LED Flame Exhaust Sticker Kit', cost: 150, type: 'WANT', hint: 'Cosmetic stickers, doesn’t make it faster' },
            { id: '24-d', name: 'Robot Keychain Blind Bag', cost: 140, type: 'WANT', hint: 'Souvenir toy from the lobby vending machine' },
        ],
        ideal_tip: 'Spend ₹190 on batteries, ₹340 on the core kit, and ₹110 on tools (₹640 total) so your robot finishes the track with ₹110 left!',
    },
    {
        id: 25,
        title: 'Beach Clean-Up Volunteer Morning',
        category: 'Weekend Fun',
        emoji: '🌊',
        starting_budget: 400,
        purpose: 'You got ₹400 to join your school eco-club’s morning beach clean-up.',
        sudden_expense: {
            title: 'Thick Protective Garden Gloves',
            cost: 110,
            description: 'Your cloth gloves ripped—thick gloves (₹110) protect your hands from sharp shells and plastic.',
            is_essential: true,
        },
        items: [
            { id: '25-a', name: 'Wide-Brim Sun Hat & Water', cost: 140, type: 'NEED', hint: 'Prevents sunburn during the 2-hour clean-up' },
            { id: '25-b', name: 'Biodegradable Trash Sacks', cost: 70, type: 'NEED', hint: 'Needed to collect and sort beach litter' },
            { id: '25-c', name: 'Beachside Sunglasses Stand Impulse Buy', cost: 150, type: 'WANT', hint: 'Cheap plastic shades you don’t need' },
            { id: '25-d', name: 'Bubble Tea & Waffle Cone', cost: 130, type: 'WANT', hint: 'Expensive boardwalk dessert' },
        ],
        ideal_tip: 'Protect your hands (₹110), stay cool (₹140 hat/water), and grab ₹70 sacks (₹320 total), saving ₹80!',
    },
    {
        id: 26,
        title: 'Chess Tournament & Forgotten Clock Battery',
        category: 'School & Studies',
        emoji: '♟️',
        starting_budget: 450,
        purpose: 'You have ₹450 for Sunday’s district under-14 chess championship.',
        sudden_expense: {
            title: 'Player ID Badge Lanyard & Scorebook',
            cost: 100,
            description: 'The organizer says every player must have a printed tournament scorebook & badge holder (₹100).',
            is_essential: true,
        },
        items: [
            { id: '26-a', name: 'Healthy Trail Nuts & Fruit Box', cost: 120, type: 'NEED', hint: 'Brain fuel between long 1-hour matches' },
            { id: '26-b', name: '2 Reliable Ballpoint Pens', cost: 40, type: 'NEED', hint: 'Mandatory for writing down your chess moves' },
            { id: '26-c', name: 'Flashy Wooden Pocket Chess Keyring', cost: 160, type: 'WANT', hint: 'Cool souvenir, won’t help you win games' },
            { id: '26-d', name: 'Double-Chocolate Donut Pack', cost: 140, type: 'WANT', hint: 'Heavy sugar crash mid-tournament!' },
        ],
        ideal_tip: 'Get the ₹100 scorebook/badge, ₹120 brain-fuel snacks, and ₹40 pens (₹260 total)—leaving ₹190 saved!',
    },
    {
        id: 27,
        title: 'Comic Club Swap & Torn Backpack Zip',
        category: 'Weekend Fun',
        emoji: '🦸',
        starting_budget: 500,
        purpose: 'You saved ₹500 for your neighborhood comic-book swap and snack meetup.',
        sudden_expense: {
            title: 'Tailor Backpack Zipper Fix',
            cost: 120,
            description: 'Your backpack zipper bursts open on the walk over! A quick tailor zip fix costs ₹120 so your books don’t fall out.',
            is_essential: true,
        },
        items: [
            { id: '27-a', name: 'Clear Protective Comic Sleeves', cost: 110, type: 'NEED', hint: 'Keeps swapped comics crisp and clean' },
            { id: '27-b', name: '2 Classic Science-Adventure Comics', cost: 180, type: 'NEED', hint: 'The two comics you came to collect!' },
            { id: '27-c', name: 'Surprise Mystery Sticker Pack', cost: 130, type: 'WANT', hint: 'Random stickers you already have plenty of' },
            { id: '27-d', name: 'Mega Slushie & Nachos Combo', cost: 150, type: 'WANT', hint: 'Overpriced snack combo' },
        ],
        ideal_tip: 'Fix the zipper (₹120) and pick up the ₹110 sleeves + ₹180 classic comics (₹410 total), saving ₹90!',
    },
    {
        id: 28,
        title: 'Family Road Trip & Sudden Toll Snack Trap',
        category: 'Family & Celebrations',
        emoji: '🚗',
        starting_budget: 600,
        purpose: 'Your parents gave you ₹600 as your personal travel allowance for a weekend hill-station trip.',
        sudden_expense: {
            title: 'Motion-Sickness Bands & First-Aid Cream',
            cost: 150,
            description: 'Curvy mountain roads make you feel dizzy—your parent stops at a pharmacy for ₹150 motion bands.',
            is_essential: true,
        },
        items: [
            { id: '28-a', name: 'Warm Fleece Socks for Cool Evening', cost: 160, type: 'NEED', hint: 'Hill evenings get chilly fast!' },
            { id: '28-b', name: 'Travel Sketchbook & Pencils', cost: 110, type: 'NEED', hint: 'Keeps you creatively entertained on the long drive' },
            { id: '28-c', name: 'Highway Souvenir Snowglobe', cost: 210, type: 'WANT', hint: 'Fragile highway trinket costing 3x normal price' },
            { id: '28-d', name: '3 Packs of Gummy Candy at Fuel Stop', cost: 150, type: 'WANT', hint: 'Sugary gas-station snacks' },
        ],
        ideal_tip: 'Cover the ₹150 motion bands, ₹160 warm socks, and ₹110 travel sketchbook (₹420 total), skipping highway impulse toys and saving ₹180!',
    },
];

export function validateBudgetScenarios(): void {
    for (const s of BUDGET_SCENARIOS) {
        const allCost =
            s.items.reduce((sum, i) => sum + i.cost, 0) +
            (s.sudden_expense.is_essential ? s.sudden_expense.cost : 0);
        const essentialCost =
            s.items.filter(i => i.type === 'NEED').reduce((sum, i) => sum + i.cost, 0) +
            (s.sudden_expense.is_essential ? s.sudden_expense.cost : 0);
        if (allCost <= s.starting_budget) {
            throw new Error(`Scenario ${s.id} allows buying everything without trade-offs`);
        }
        if (essentialCost > s.starting_budget) {
            throw new Error(`Scenario ${s.id} essential needs (${essentialCost}) exceed budget (${s.starting_budget})`);
        }
    }
}
