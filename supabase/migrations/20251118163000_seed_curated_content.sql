-- Seed sample courses, lessons, and exercises so new projects have immediate content

INSERT INTO public.courses (id, title, description, language_from, language_to, flag_emoji)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Spanish Foundations', 'Build everyday confidence in Latin American Spanish.', 'English', 'Spanish', '🇪🇸'),
  ('22222222-2222-2222-2222-222222222222', 'French for Travel', 'Master friendly cafe chats and metro phrases.', 'English', 'French', '🇫🇷'),
  ('33333333-3333-3333-3333-333333333333', 'Hindi Conversations', 'Level up friendly Hindi speaking skills.', 'English', 'Hindi', '🇮🇳')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, course_id, title, order_index)
VALUES
  ('11111111-aaaa-1111-aaaa-000000000001', '11111111-1111-1111-1111-111111111111', 'Greetings & Introductions', 1),
  ('11111111-aaaa-1111-aaaa-000000000002', '11111111-1111-1111-1111-111111111111', 'Ordering Food', 2),
  ('11111111-aaaa-1111-aaaa-000000000003', '11111111-1111-1111-1111-111111111111', 'Getting Around Town', 3),
  ('22222222-bbbb-2222-bbbb-000000000001', '22222222-2222-2222-2222-222222222222', 'At the Café', 1),
  ('22222222-bbbb-2222-bbbb-000000000002', '22222222-2222-2222-2222-222222222222', 'Metro Navigation', 2),
  ('22222222-bbbb-2222-bbbb-000000000003', '22222222-2222-2222-2222-222222222222', 'Meeting New Friends', 3),
  ('33333333-cccc-3333-cccc-000000000001', '33333333-3333-3333-3333-333333333333', 'Introductions', 1),
  ('33333333-cccc-3333-cccc-000000000002', '33333333-3333-3333-3333-333333333333', 'Shopping Basics', 2),
  ('33333333-cccc-3333-cccc-000000000003', '33333333-3333-3333-3333-333333333333', 'Travel Plans', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.items (id, lesson_id, type, question, correct_answer, options, order_index, explanation, hint)
VALUES
  -- Spanish lesson 1
  ('aaaaaaa1-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000001', 'multiple_choice', 'How do you say "Good morning" in Spanish?', 'Buenos días', '["Buenas noches","Buenos días","Buenas tardes","Hasta luego"]'::jsonb, 1, 'Buenos días is used before noon.', NULL),
  ('aaaaaaa2-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000001', 'translate', 'Translate: My name is Ana.', 'Me llamo Ana.', NULL, 2, NULL, 'Use the reflexive verb "llamarse".'),
  ('aaaaaaa3-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000001', 'fill_blank', 'Mucho ___.', 'gusto', '["gracias","gusto","favor","calor"]'::jsonb, 3, 'Mucho gusto is the standard reply after introductions.', NULL),
  -- Spanish lesson 2
  ('aaaaaaa4-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000002', 'translate', 'Translate: I would like a coffee, please.', 'Me gustaría un café, por favor.', NULL, 1, NULL, 'Use the conditional of "gustar".'),
  ('aaaaaaa5-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000002', 'multiple_choice', 'Polite way to call a waiter?', 'Disculpe', '["Oye","Eh tú","Disculpe","Ven aquí"]'::jsonb, 2, 'Disculpe works in any restaurant.', NULL),
  ('aaaaaaa6-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000002', 'fill_blank', 'La cuenta, ___.', 'por favor', '["gracias","por favor","de nada","mañana"]'::jsonb, 3, NULL, NULL),
  -- Spanish lesson 3
  ('aaaaaaa7-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000003', 'translate', 'Translate: Where is the bus station?', '¿Dónde está la estación de autobuses?', NULL, 1, NULL, NULL),
  ('aaaaaaa8-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000003', 'multiple_choice', 'Best way to say "turn left"?', 'Gira a la izquierda', '["Sigue derecho","Gira a la izquierda","Cruza la calle","Sube las escaleras"]'::jsonb, 2, NULL, NULL),
  ('aaaaaaa9-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-000000000003', 'fill_blank', 'Está ___ del parque.', 'cerca', '["dentro","cerca","atrás","siempre"]'::jsonb, 3, NULL, NULL),
  -- French lesson 1
  ('bbbbbbb1-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000001', 'multiple_choice', 'Ask for the menu in French.', 'La carte, s''il vous plaît.', '["L''addition, s''il vous plaît.","La carte, s''il vous plaît.","Je suis prêt.","C''est combien?"]'::jsonb, 1, NULL, NULL),
  ('bbbbbbb2-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000001', 'translate', 'Translate: I will take a croissant.', 'Je vais prendre un croissant.', NULL, 2, NULL, NULL),
  ('bbbbbbb3-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000001', 'fill_blank', 'C''était ___ !', 'délicieux', '["délicieux","fatigué","minute","presque"]'::jsonb, 3, NULL, NULL),
  -- French lesson 2
  ('bbbbbbb4-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000002', 'translate', 'Translate: Where can I buy tickets?', 'Où puis-je acheter des billets ?', NULL, 1, NULL, NULL),
  ('bbbbbbb5-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000002', 'multiple_choice', 'Translation for "next stop"?', 'prochaine station', '["prochaine station","gare centrale","la sortie","un plan"]'::jsonb, 2, NULL, NULL),
  ('bbbbbbb6-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000002', 'fill_blank', 'Descendez à la ___ station.', 'prochaine', '["prochaine","lentement","bonjour","jeune"]'::jsonb, 3, NULL, NULL),
  -- French lesson 3
  ('bbbbbbb7-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000003', 'translate', 'Translate: It’s nice to meet you.', 'Enchanté de faire votre connaissance.', NULL, 1, NULL, NULL),
  ('bbbbbbb8-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000003', 'multiple_choice', '"Where are you from?"', 'Tu viens d''où ?', '["Tu viens d''où ?","Tu coûtes combien ?","Tu dors ici ?","Tu es métro ?"]'::jsonb, 2, NULL, NULL),
  ('bbbbbbb9-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-000000000003', 'fill_blank', 'On se voit ___ ?', 'demain', '["demain","jamais","froid","lentement"]'::jsonb, 3, NULL, NULL),
  -- Hindi lesson 1
  ('ccccccc1-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000001', 'translate', 'Translate: What is your name?', 'Aapka naam kya hai?', NULL, 1, NULL, NULL),
  ('ccccccc2-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000001', 'multiple_choice', 'Polite response to thank someone.', 'Dhanyavaad', '["Namaste","Dhanyavaad","Theek hai","Aapka"]'::jsonb, 2, NULL, NULL),
  ('ccccccc3-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000001', 'fill_blank', 'Main ___ se hoon.', 'India', '["India","Aap","Khana","Bhai"]'::jsonb, 3, NULL, NULL),
  -- Hindi lesson 2
  ('ccccccc4-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000002', 'translate', 'Translate: How much is this?', 'Yeh kitne ka hai?', NULL, 1, NULL, NULL),
  ('ccccccc5-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000002', 'multiple_choice', '"little bit cheaper"?', 'Thoda sasta karo', '["Bahut tez","Thoda sasta karo","Mujhe der hai","Tum theek ho"]'::jsonb, 2, NULL, NULL),
  ('ccccccc6-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000002', 'fill_blank', 'Mujhe ___ pasand hai.', 'yeh', '["vahaan","kabhi","yeh","parson"]'::jsonb, 3, NULL, NULL),
  -- Hindi lesson 3
  ('ccccccc7-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000003', 'translate', 'Translate: I need a taxi to the airport.', 'Mujhe airport tak taxi chahiye.', NULL, 1, NULL, NULL),
  ('ccccccc8-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000003', 'multiple_choice', '"When does the train leave?"', 'Train kab nikalti hai?', '["Train kab nikalti hai?","Train kaha hai?","Train kitni mehengi hai?","Train tumhari hai?"]'::jsonb, 2, NULL, NULL),
  ('ccccccc9-3333-3333-3333-333333333333', '33333333-cccc-3333-cccc-000000000003', 'fill_blank', 'Mujhe ___ jaana hai.', 'station', '["jaldi","station","aaj","paani"]'::jsonb, 3, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

